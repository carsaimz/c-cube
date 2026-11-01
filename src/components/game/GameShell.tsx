"use client";
import dynamic from "next/dynamic";
import { useEffect, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Brain,
  CircleHelp,
  Eye,
  Flag,
  LocateFixed,
  MousePointerClick,
  RotateCcw,
  Settings,
  Shuffle,
  Sparkles,
  Timer,
  Undo2,
  Redo2,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  MARATHON_STAGES,
  formatCountdown,
  formatTime,
  sprintTimeLimit,
} from "@/lib/cube/engine";
import { themeById } from "@/lib/cube/themes";
import { playClick, unlockAudio } from "@/lib/sound";
import { useGameStore, useT } from "@/store/game";
import { MenuOverlay } from "./MenuOverlay";
import { WinOverlay } from "./WinOverlay";
import { FailOverlay } from "./FailOverlay";
import { HelpDialog } from "./HelpDialog";
import { SettingsDialog } from "./SettingsDialog";
import { UpdateDialog } from "./UpdateDialog";

const CubeCanvas = dynamic(() => import("./CubeCanvas"), { ssr: false });

/** Estrutura principal do jogo: cena 3D + HUD + barra de controlos + ecrãs. */
export default function GameShell() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const helpOpenRef = useRef(helpOpen);
  const settingsOpenRef = useRef(settingsOpen);
  helpOpenRef.current = helpOpen;
  settingsOpenRef.current = settingsOpen;

  const t = useT();
  const locale = useGameStore((s) => s.locale);
  const updateState = useGameStore((s) => s.updateState);

  const status = useGameStore((s) => s.status);
  const themeId = useGameStore((s) => s.themeId);
  const elapsedMs = useGameStore((s) => s.elapsedMs);
  const moveCount = useGameStore((s) => s.moveCount);
  const scrambleStr = useGameStore((s) => s.scrambleStr);
  const soundOn = useGameStore((s) => s.soundOn);
  const historyLen = useGameStore((s) => s.history.length);
  const redoLen = useGameStore((s) => s.redoStack.length);
  const size = useGameStore((s) => s.size);
  const mode = useGameStore((s) => s.mode);
  const difficulty = useGameStore((s) => s.difficulty);
  const budget = useGameStore((s) => s.budget);
  const memoryPhase = useGameStore((s) => s.memoryPhase);
  const studyEndsAt = useGameStore((s) => s.studyEndsAt);
  const studyTotalMs = useGameStore((s) => s.studyTotalMs);
  const marathonStage = useGameStore((s) => s.marathonStage);
  const { scramble, solve, undo, redo, reset, toggleSound, startGame } = useGameStore.getState();

  // cronómetro
  useEffect(() => {
    const id = setInterval(() => useGameStore.getState().tick(), 100);
    return () => clearInterval(id);
  }, []);

  // re-render local durante a contagem de memorização (timer da store não corre)
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    if (memoryPhase !== "study") return;
    const id = setInterval(force, 200);
    return () => clearInterval(id);
  }, [memoryPhase]);

  // desbloquear áudio no primeiro toque (política de autoplay)
  useEffect(() => {
    const un = () => unlockAudio();
    window.addEventListener("pointerdown", un, { once: true });
    return () => window.removeEventListener("pointerdown", un);
  }, []);

  // título e idioma do documento acompanham o locale escolhido
  useEffect(() => {
    document.title = t("app.title");
    document.documentElement.lang = locale;
  }, [t, locale]);

  // teclado (PC): letras rodam faces; Esc volta ao menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const st = useGameStore.getState();
      if (e.key === "Escape") {
        if (helpOpenRef.current || settingsOpenRef.current) return; // o diálogo trata do Esc
        if (st.updateDialogOpen) return;
        if (st.status !== "menu") {
          e.preventDefault();
          st.goMenu();
        }
        return;
      }
      if (st.status !== "idle" && st.status !== "playing") return;
      const k = e.key.toLowerCase();
      if (k.length === 1 && "udlrfb".includes(k)) {
        e.preventDefault();
        st.keyMove(e.shiftKey ? k.toUpperCase() + "'" : k.toUpperCase());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Android: botão físico "voltar" → fecha diálogo → volta ao menu → sai da app
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform() || cancelled) return;
        const { App } = await import("@capacitor/app");
        const sub = await App.addListener("backButton", () => {
          const st = useGameStore.getState();
          if (helpOpenRef.current) {
            setHelpOpen(false);
            return;
          }
          if (settingsOpenRef.current) {
            setSettingsOpen(false);
            return;
          }
          if (st.updateDialogOpen) {
            st.dismissUpdateDialog();
            return;
          }
          if (st.status !== "menu") {
            st.goMenu();
            return;
          }
          void App.exitApp();
        });
        cleanup = () => {
          void sub.remove();
        };
      } catch {
        /* web/electron: sem botão físico */
      }
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  // verificação de atualizações em segundo plano (1×/24 h, silenciosa)
  useEffect(() => {
    const id = setTimeout(() => useGameStore.getState().backgroundUpdateCheck(), 4000);
    return () => clearTimeout(id);
  }, []);

  const theme = themeById(themeId);
  const inGame = status !== "menu";
  const busy = status === "scrambling" || status === "solving";
  const playing = status === "playing";
  const updateBadge = updateState === "available";

  // ------- indicadores por modo
  const sprintLimit = sprintTimeLimit(size, difficulty);
  const sprintLeft = playing ? sprintLimit - elapsedMs : sprintLimit;
  const sprintLow = sprintLeft <= 10_000;
  const studyLeft = studyEndsAt ? Math.max(0, studyEndsAt - Date.now()) : studyTotalMs;

  return (
    <main
      className="fixed inset-0 select-none overflow-hidden text-white"
      style={{ background: `radial-gradient(130% 100% at 50% 0%, ${theme.bg} 0%, #04050a 100%)` }}
    >
      {/* vinheta suave */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: "radial-gradient(95% 75% at 50% 42%, transparent 52%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <CubeCanvas />

      {/* HUD superior */}
      <AnimatePresence>
        {inGame && (
          <motion.header
            key="hud"
            className="absolute inset-x-0 top-0 z-20 flex items-start justify-between px-3 pt-[max(env(safe-area-inset-top),0.75rem)] sm:px-5"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.28 }}
          >
            <button
              onClick={() => {
                playClick();
                useGameStore.getState().goMenu();
              }}
              className="glass flex items-center gap-1.5 rounded-2xl p-1 pr-2 transition-opacity hover:opacity-85"
              aria-label={t("aria.back")}
              title={t("aria.back")}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 text-zinc-200">
                <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
              </span>
              <img
                src="/logo.svg"
                alt=""
                draggable={false}
                className="h-8 w-8 rounded-lg shadow-sm shadow-orange-500/30"
              />
              <span className="hidden text-sm font-bold tracking-tight sm:block">C-Cube</span>
            </button>

            <div className="glass flex items-center gap-2.5 rounded-2xl px-3 py-2 sm:px-4">
              {mode === "memory" && memoryPhase === "study" ? (
                <span className="flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-sky-400" />
                  <span className="font-mono text-sm sm:text-base font-bold tabular-nums leading-none text-sky-300">
                    {t("hud.memorize", { s: Math.ceil(studyLeft / 1000) })}
                  </span>
                </span>
              ) : mode === "sprint" ? (
                <span className="flex items-center gap-1.5">
                  <Timer className={`h-3.5 w-3.5 ${sprintLow && playing ? "animate-pulse text-red-400" : "text-amber-400"}`} />
                  <span
                    className={`font-mono text-sm sm:text-base font-bold tabular-nums leading-none ${
                      sprintLow && playing ? "text-red-400" : ""
                    }`}
                  >
                    {formatCountdown(sprintLeft)}
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-mono text-sm sm:text-base font-bold tabular-nums leading-none">
                    {formatTime(elapsedMs)}
                  </span>
                </span>
              )}
              <span className="h-4 w-px bg-white/15" />
              {mode === "efficiency" && budget !== null ? (
                <span className="flex items-center gap-1.5">
                  <MousePointerClick className="h-3.5 w-3.5 text-zinc-500" />
                  <span
                    className={`font-mono text-sm font-semibold tabular-nums leading-none ${
                      moveCount >= budget ? "text-red-400" : moveCount >= budget * 0.85 ? "text-amber-300" : "text-zinc-300"
                    }`}
                  >
                    {moveCount}/{budget}
                  </span>
                </span>
              ) : mode === "marathon" ? (
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Flag className="h-3.5 w-3.5 text-sky-400" />
                  <span className="font-mono text-sm font-semibold tabular-nums leading-none">
                    {marathonStage + 1}/{MARATHON_STAGES.length}
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <MousePointerClick className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="font-mono text-sm font-semibold tabular-nums leading-none">{moveCount}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <IconButton label={soundOn ? t("aria.soundOff") : t("aria.soundOn")} onClick={toggleSound}>
                {soundOn ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
              </IconButton>
              <IconButton label={t("aria.help")} onClick={() => setHelpOpen(true)}>
                <CircleHelp className="h-4.5 w-4.5" />
              </IconButton>
              <IconButton label={t("aria.settings")} onClick={() => setSettingsOpen(true)} badge={updateBadge}>
                <Settings className="h-4.5 w-4.5" />
              </IconButton>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* scramble em texto pequeno */}
      <AnimatePresence>
        {inGame && scrambleStr && !busy && (
          <motion.div
            key="scr"
            className="pointer-events-none absolute inset-x-0 top-[4.9rem] z-10 flex justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="max-w-full truncate rounded-full bg-black/30 px-3 py-1 font-mono text-[11px] text-zinc-400 backdrop-blur-sm">
              {scrambleStr}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* estado temporário */}
      <AnimatePresence>
        {busy && (
          <motion.div
            key="busy"
            className="pointer-events-none absolute inset-x-0 bottom-32 z-20 flex justify-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <span className="glass rounded-full px-4 py-1.5 text-xs font-semibold text-zinc-200">
              {status === "scrambling" ? t("busy.scrambling") : t("busy.solving")}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* botões flutuantes (recentrar / espiar) */}
      <AnimatePresence>
        {inGame && (
          <motion.div
            key="float"
            className="absolute bottom-[6.6rem] right-3 z-20 flex flex-col items-center gap-2 sm:right-5"
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 14 }}
            transition={{ duration: 0.28, delay: 0.08 }}
          >
            {mode === "memory" && memoryPhase === "blind" && (playing || status === "idle") && (
              <motion.button
                onClick={() => {
                  playClick();
                  useGameStore.getState().peek();
                }}
                whileTap={{ scale: 0.92 }}
                aria-label={t("float.peek")}
                title={t("float.peekShort")}
                className="glass flex h-12 w-12 flex-col items-center justify-center rounded-2xl text-sky-300 transition-all duration-200 hover:bg-white/15 active:scale-95"
              >
                <Eye className="h-5 w-5" />
                <span className="mt-0.5 text-[9px] font-bold leading-none">+5s</span>
              </motion.button>
            )}
            <motion.button
              onClick={() => {
                playClick();
                useGameStore.getState().resetView();
              }}
              whileTap={{ scale: 0.92 }}
              aria-label={t("float.recenter")}
              title={t("float.recenterTitle")}
              className="glass flex h-12 w-12 items-center justify-center rounded-2xl text-zinc-300 transition-all duration-200 hover:bg-white/15 hover:text-white active:scale-95"
            >
              <LocateFixed className="h-5 w-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* barra de controlos */}
      <AnimatePresence>
        {inGame && (
          <motion.nav
            key="dock"
            className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),1rem)]"
            aria-label="Controlos do jogo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.28, delay: 0.05 }}
          >
            <div className="glass flex items-center gap-1 rounded-3xl p-1.5 shadow-2xl">
              <DockButton primary icon={<Shuffle className="h-5 w-5" />} label={t("dock.scramble")} onClick={scramble} disabled={busy} />
              <DockButton icon={<Sparkles className="h-5 w-5" />} label={t("dock.solve")} onClick={solve} disabled={busy || historyLen === 0} />
              <DockButton icon={<Undo2 className="h-5 w-5" />} label={t("dock.undo")} onClick={undo} disabled={busy || historyLen === 0} />
              <DockButton icon={<Redo2 className="h-5 w-5" />} label={t("dock.redo")} onClick={redo} disabled={busy || redoLen === 0} />
              <DockButton icon={<RotateCcw className="h-5 w-5" />} label={t("dock.reset")} onClick={reset} disabled={busy} />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ecrãs */}
      <AnimatePresence>{status === "menu" && <MenuOverlay key="menu" onHelp={() => setHelpOpen(true)} />}</AnimatePresence>
      <WinOverlay />
      <FailOverlay />

      <HelpDialog open={helpOpen} onOpenChange={(v) => { setHelpOpen(v); if (!v) playClick(); }} />
      <SettingsDialog open={settingsOpen} onOpenChange={(v) => { setSettingsOpen(v); if (!v) playClick(); }} />
      <UpdateDialog />

      {/* ecrã inicial discreto para começar (autoplay/áudio) */}
      {!inGame && (
        <button
          onClick={startGame}
          className="sr-only"
          aria-label={t("action.start")}
        />
      )}
    </main>
  );
}

function IconButton({
  label,
  onClick,
  children,
  badge,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  badge?: boolean;
}) {
  return (
    <button
      onClick={() => {
        playClick();
        onClick();
      }}
      aria-label={label}
      title={label}
      className="glass relative flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-300 transition-all duration-200 hover:bg-white/15 hover:text-white active:scale-95"
    >
      {children}
      {badge && (
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-[#0d0f16] bg-amber-400" />
        </span>
      )}
    </button>
  );
}

function DockButton({
  icon,
  label,
  onClick,
  disabled,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <motion.button
      onClick={() => {
        if (!disabled) {
          playClick();
          onClick();
        }
      }}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      disabled={disabled}
      aria-label={label}
      className={`flex min-h-14 w-[4.2rem] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold transition-all duration-200 sm:w-16 ${
        primary
          ? "bg-gradient-to-b from-amber-400 to-orange-500 text-zinc-950 shadow-md shadow-orange-500/25 hover:shadow-orange-500/40"
          : "text-zinc-300 hover:bg-white/10 hover:text-white"
      } ${disabled ? "pointer-events-none opacity-35" : ""}`}
    >
      {icon}
      <span className="leading-none">{label}</span>
    </motion.button>
  );
}
