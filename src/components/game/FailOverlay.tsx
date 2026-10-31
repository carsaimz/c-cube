"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Hourglass, MousePointerClick, RotateCcw } from "lucide-react";
import { formatTime } from "@/lib/cube/engine";
import { playClick } from "@/lib/sound";
import { useGameStore } from "@/store/game";

/** Ecrã de falha — tempo esgotado (Sprint) ou orçamento excedido (Eficiência). */
export function FailOverlay() {
  const status = useGameStore((s) => s.status);
  const failReason = useGameStore((s) => s.failReason);
  const elapsedMs = useGameStore((s) => s.elapsedMs);
  const moveCount = useGameStore((s) => s.moveCount);
  const retry = useGameStore((s) => s.retry);
  const goMenu = useGameStore((s) => s.goMenu);

  const visible = status === "failed" && failReason !== null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 px-4 backdrop-blur-[2px]"
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
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-red-500/30"
              initial={{ rotate: 12, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.05 }}
            >
              {failReason === "time" ? (
                <Hourglass className="h-8 w-8 text-white" strokeWidth={2} />
              ) : (
                <MousePointerClick className="h-8 w-8 text-white" strokeWidth={2} />
              )}
            </motion.div>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">
              {failReason === "time" ? "Tempo esgotado!" : "Sem movimentos!"}
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400">
              {failReason === "time"
                ? "O cronómetro chegou a zero antes de terminares."
                : "Usaste todo o orçamento de movimentos."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Stat label="Tempo" value={formatTime(elapsedMs)} />
              <Stat label="Movimentos" value={String(moveCount)} />
            </div>

            <motion.button
              onClick={retry}
              whileTap={{ scale: 0.97 }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-orange-500/30"
            >
              <RotateCcw className="h-5 w-5" />
              Tentar de novo
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
