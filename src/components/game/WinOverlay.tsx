"use client";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { Home, PartyPopper, Play, Trophy } from "lucide-react";
import { formatTime } from "@/lib/cube/engine";
import { themeById } from "@/lib/cube/themes";
import { playClick } from "@/lib/sound";
import { useGameStore } from "@/store/game";

/** Ecrã de vitória com confetti e estatísticas. */
export function WinOverlay() {
  const status = useGameStore((s) => s.status);
  const lastWin = useGameStore((s) => s.lastWin);
  const size = useGameStore((s) => s.size);
  const themeId = useGameStore((s) => s.themeId);
  const bests = useGameStore((s) => s.bests);
  const startGame = useGameStore((s) => s.startGame);
  const goMenu = useGameStore((s) => s.goMenu);
  const dismissWin = useGameStore((s) => s.dismissWin);

  const theme = themeById(themeId);
  const visible = status === "won" && lastWin !== null;
  const best = bests[String(size)];

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
    burst(0.25);
    const t1 = setTimeout(() => burst(0.2, { spread: 120, startVelocity: 45 }), 250);
    const t2 = setTimeout(() => burst(0.15, { spread: 160, decay: 0.92 }), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible]);

  return (
    <AnimatePresence onExitComplete={() => dismissWin()}>
      {visible && (
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
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-lg shadow-orange-500/30"
              initial={{ rotate: -12, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.05 }}
            >
              <PartyPopper className="h-8 w-8 text-white" strokeWidth={2} />
            </motion.div>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">Resolvido!</h2>

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
              <Stat label="Tempo" value={formatTime(lastWin.timeMs)} />
              <Stat label="Movimentos" value={String(lastWin.moves)} />
              <Stat label="Melhor" value={best ? formatTime(best.timeMs) : "—"} />
            </div>

            <motion.button
              onClick={startGame}
              whileTap={{ scale: 0.97 }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-orange-500/30"
            >
              <Play className="h-5 w-5 fill-current" />
              Jogar de novo
            </motion.button>
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
