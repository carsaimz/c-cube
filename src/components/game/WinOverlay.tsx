"use client";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Home, PartyPopper, Play, Share2, Trophy } from "lucide-react";
import { MARATHON_STAGES, formatTime } from "@/lib/cube/engine";
import { themeById } from "@/lib/cube/themes";
import { playClick } from "@/lib/sound";
import { recordKey, useGameStore, useT } from "@/store/game";

/** Ecrã de vitória — também usado como interstício de etapa da Maratona. */
export function WinOverlay() {
  const t = useT();
  const status = useGameStore((s) => s.status);
  const lastWin = useGameStore((s) => s.lastWin);
  const size = useGameStore((s) => s.size);
  const mode = useGameStore((s) => s.mode);
  const difficulty = useGameStore((s) => s.difficulty);
  const themeId = useGameStore((s) => s.themeId);
  const bests = useGameStore((s) => s.bests);
  const startGame = useGameStore((s) => s.startGame);
  const goMenu = useGameStore((s) => s.goMenu);
  const dismissWin = useGameStore((s) => s.dismissWin);
  const continueMarathon = useGameStore((s) => s.continueMarathon);

  const theme = themeById(themeId);
  const visible = status === "won" && lastWin !== null;
  const isStage = Boolean(lastWin && lastWin.stageDone && !lastWin.final);
  const best = bests[recordKey(mode, size, difficulty)];

  useEffect(() => {
    if (!visible) return;
    const colors = [...theme.faces, theme.accent];
    const defaults = { colors, zIndex: 90, disableForReducedMotion: true };
    const burst = (ratio: number, opts: confetti.Options = {}) =>
      confetti({
        ...defaults,
        particleCount: Math.floor(220 * ratio),
        origin: { x: 0.5, y: 0.55 },
        spread: 100,
        startVelocity: 42,
        scalar: 0.9,
        ticks: 220,
        ...opts,
      });
    burst(isStage ? 0.12 : 0.25);
    if (!isStage) {
      const t1 = setTimeout(() => burst(0.2, { spread: 120, startVelocity: 45 }), 250);
      const t2 = setTimeout(() => burst(0.15, { spread: 160, decay: 0.92 }), 500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [visible, isStage, theme]);

  const modeName = t(`mode.${lastWin?.mode ?? "classic"}.name`);
  const diffName = t(`diff.${difficulty}`);
  const bestValue = best
    ? lastWin?.mode === "efficiency"
      ? `${best.moves} mov.`
      : formatTime(best.timeMs)
    : "—";
  const nextStageSize =
    isStage && lastWin?.stageDone && lastWin.stageDone < MARATHON_STAGES.length
      ? MARATHON_STAGES[lastWin.stageDone]
      : null;

  // ------------------------------------------------------------- partilhar
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");
  const shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (shareTimer.current) clearTimeout(shareTimer.current);
  }, []);

  const shareResult = async () => {
    if (!lastWin) return;
    const text = t("win.shareText", {
      n: size,
      mode: t(`mode.${lastWin.mode}.name`),
      diff: t(`diff.${difficulty}`),
      t: formatTime(lastWin.timeMs),
      m: lastWin.moves,
    });

    // 1) partilha nativa (Android via Capacitor)
    try {
      const { Share } = await import("@capacitor/share");
      if (await Share.canShare()) {
        await Share.share({ title: "C-Cube", text });
        return;
      }
    } catch (e) {
      const msg = String((e as { message?: string })?.message ?? e).toLowerCase();
      if (msg.includes("cancel")) return; // utilizador fechou a folha
    }

    // 2) Web Share API (PWA / browser móvel)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "C-Cube", text });
        return;
      } catch (e) {
        if ((e as DOMException)?.name === "AbortError") return; // cancelado
      }
    }

    // 3) fallback: copiar para a área de transferência
    try {
      await navigator.clipboard.writeText(text);
      setShareState("copied");
    } catch {
      // última alternativa: textarea + execCommand (webviews antigos / Electron)
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        setShareState(ok ? "copied" : "error");
      } catch {
        setShareState("error");
      }
    }
    if (shareTimer.current) clearTimeout(shareTimer.current);
    shareTimer.current = setTimeout(() => setShareState("idle"), 2400);
  };

  const shareLabel =
    shareState === "copied" ? t("win.copied") : shareState === "error" ? t("win.shareFail") : t("win.share");

  return (
    <AnimatePresence onExitComplete={() => dismissWin()}>
      {visible && lastWin && (
        <motion.div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="panel w-[min(92vw,380px)] rounded-3xl p-6 text-center shadow-2xl"
            initial={{ y: 28, scale: 0.94 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 18, scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <motion.div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ${
                isStage
                  ? "bg-gradient-to-br from-sky-400 to-blue-600 shadow-blue-500/30"
                  : "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-orange-500/30"
              }`}
              initial={{ rotate: -12, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.05 }}
            >
              {isStage ? (
                <ArrowRight className="h-8 w-8 text-white" strokeWidth={2.2} />
              ) : (
                <PartyPopper className="h-8 w-8 text-white" strokeWidth={2} />
              )}
            </motion.div>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">
              {isStage
                ? t("win.stage", { a: lastWin.stageDone ?? 1, b: lastWin.stagesTotal ?? MARATHON_STAGES.length })
                : lastWin.final
                  ? t("win.final")
                  : t("win.solved")}
            </h2>

            {isStage && nextStageSize && (
              <p className="mt-1.5 text-sm text-zinc-400">
                {t("win.next", { n: nextStageSize })}
              </p>
            )}

            {!isStage && (
              <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
                <span>{lastWin.final ? t("mode.marathon.name") : modeName}</span>
                <span className="h-1 w-1 rounded-full bg-zinc-600" />
                <span>{diffName}</span>
              </div>
            )}

            {lastWin.newRecord && (
              <motion.div
                className="mx-auto mt-2 flex w-fit items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-300"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
              >
                <Trophy className="h-3.5 w-3.5" />
                {t("win.record")}
              </motion.div>
            )}

            <div className="mt-5 grid grid-cols-3 gap-2">
              <Stat
                label={lastWin.mode === "efficiency" ? t("stat.budget") : t("stat.time")}
                value={lastWin.mode === "efficiency" ? `${lastWin.moves} mov.` : formatTime(lastWin.timeMs)}
              />
              <Stat label={t("stat.moves")} value={String(lastWin.moves)} />
              <Stat label={t("stat.best")} value={bestValue} />
            </div>

            {isStage ? (
              <motion.button
                onClick={continueMarathon}
                whileTap={{ scale: 0.97 }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-orange-500/30"
              >
                {t("action.continue")}
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            ) : (
              <motion.button
                onClick={startGame}
                whileTap={{ scale: 0.97 }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-orange-500/30"
              >
                <Play className="h-5 w-5 fill-current" />
                {t("action.playAgain")}
              </motion.button>
            )}
            {!isStage && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <motion.button
                  onClick={() => void shareResult()}
                  whileTap={{ scale: 0.96 }}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-colors ${
                    shareState === "copied"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : shareState === "error"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-white/10 text-zinc-200 hover:bg-white/15"
                  }`}
                >
                  {shareState === "copied" ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {shareLabel}
                </motion.button>
                <button
                  onClick={() => {
                    playClick();
                    goMenu();
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/10"
                >
                  <Home className="h-4 w-4" />
                  {t("action.menu")}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 px-2 py-3">
      <div className="font-mono text-lg font-bold tabular-nums text-white">{value}</div>
      <div className="mt-0.5 text-[11px] text-zinc-500">{label}</div>
    </div>
  );
}
