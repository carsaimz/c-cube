"use client";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Home, PartyPopper, Play, Trophy } from "lucide-react";
import { DIFFICULTIES, MARATHON_STAGES, formatTime } from "@/lib/cube/engine";
import { themeById } from "@/lib/cube/themes";
import { playClick } from "@/lib/sound";
import { MODES, recordKey, useGameStore } from "@/store/game";

/** Ecrã de vitória — também usado como interstício de etapa da Maratona. */
export function WinOverlay() {
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

  const modeName = MODES.find((m) => m.id === lastWin?.mode)?.name ?? "Clássico";
  const diffName = DIFFICULTIES.find((d) => d.id === difficulty)?.name ?? "Normal";
  const bestValue = best
    ? lastWin?.mode === "efficiency"
      ? `${best.moves} mov.`
      : formatTime(best.timeMs)
    : "—";
  const nextStageSize =
    isStage && lastWin?.stageDone && lastWin.stageDone < MARATHON_STAGES.length
      ? MARATHON_STAGES[lastWin.stageDone]
      : null;

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
            className="glass w-[min(92vw,380px)] rounded-3xl p-6 text-center shadow-2xl"
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
                ? `Etapa ${lastWin.stageDone}/${lastWin.stagesTotal}!`
                : lastWin.final
                  ? "Maratona concluída!"
                  : "Resolvido!"}
            </h2>

            {isStage && nextStageSize && (
              <p className="mt-1.5 text-sm text-zinc-400">
                A seguir: <span className="font-semibold text-zinc-200">{nextStageSize}×{nextStageSize}</span> — o
                tempo continua a contar.
              </p>
            )}

            {!isStage && (
              <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
                <span>{lastWin.final ? "Maratona" : modeName}</span>
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
                Novo recorde
              </motion.div>
            )}

            <div className="mt-5 grid grid-cols-3 gap-2">
              <Stat
                label={lastWin.mode === "efficiency" ? "Orçamento" : "Tempo"}
                value={lastWin.mode === "efficiency" ? `${lastWin.moves} mov.` : formatTime(lastWin.timeMs)}
              />
              <Stat
                label="Movimentos"
                value={lastWin.mode === "efficiency" ? String(lastWin.moves) : String(lastWin.moves)}
              />
              <Stat label="Melhor" value={bestValue} />
            </div>

            {isStage ? (
              <motion.button
                onClick={continueMarathon}
                whileTap={{ scale: 0.97 }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-orange-500/30"
              >
                Continuar
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            ) : (
              <motion.button
                onClick={startGame}
                whileTap={{ scale: 0.97 }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-orange-500/30"
              >
                <Play className="h-5 w-5 fill-current" />
                Jogar de novo
              </motion.button>
            )}
            <button
              onClick={() => {
                playClick();
                goMenu();
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/10"
            >
              <Home className="h-4 w-4" />
              Menu
            </button>
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
