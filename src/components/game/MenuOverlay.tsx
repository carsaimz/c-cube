"use client";
import { motion } from "framer-motion";
import { Box, CircleHelp, Play, Volume2, VolumeX } from "lucide-react";
import { SCRAMBLE_LENGTH, formatTime } from "@/lib/cube/engine";
import { THEMES } from "@/lib/cube/themes";
import { playClick } from "@/lib/sound";
import { useGameStore } from "@/store/game";

/** Menu principal — mostrado sobre a cena 3D (o cubo flutua atrás). */
export function MenuOverlay({ onHelp }: { onHelp: () => void }) {
  const size = useGameStore((s) => s.size);
  const setSize = useGameStore((s) => s.setSize);
  const bests = useGameStore((s) => s.bests);
  const themeId = useGameStore((s) => s.themeId);
  const setTheme = useGameStore((s) => s.setTheme);
  const soundOn = useGameStore((s) => s.soundOn);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const startGame = useGameStore((s) => s.startGame);

  const best = bests[String(size)];

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="glass w-[min(92vw,400px)] rounded-3xl p-6 shadow-2xl"
        initial={{ y: 24, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 16, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-lg shadow-orange-500/25">
            <Box className="h-7 w-7 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
            C-Cube
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Cubo Mágico 3D — arrasta, gira, resolve
          </p>
        </div>

        <div className="mt-6">
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Tamanho do cubo">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setSize(n)}
                className={`h-11 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  size === n
                    ? "bg-white text-zinc-900 shadow-md"
                    : "bg-white/5 text-zinc-300 hover:bg-white/10"
                }`}
              >
                {n}×{n}
              </button>
            ))}
          </div>
          <div className="mt-2 text-center text-xs text-zinc-500">
            {best
              ? `Melhor ${size}×${size}: ${formatTime(best.timeMs)} · ${best.moves} movimentos`
              : `${SCRAMBLE_LENGTH[size] ?? 24} movimentos de embaralhamento · sem recorde ainda`}
          </div>
        </div>

        <motion.button
          onClick={startGame}
          whileTap={{ scale: 0.97 }}
          className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-orange-500/30 transition-shadow hover:shadow-orange-500/45"
        >
          <Play className="h-5 w-5 fill-current" />
          Jogar
        </motion.button>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2" role="group" aria-label="Tema">
            {THEMES.map((t) => (
              <button
                key={t.id}
                aria-label={`Tema ${t.name}`}
                title={t.name}
                onClick={() => {
                  playClick();
                  setTheme(t.id);
                }}
                className={`h-7 w-7 rounded-full border transition-all duration-200 ${
                  themeId === t.id
                    ? "scale-110 border-white ring-2 ring-white/40"
                    : "border-white/20 hover:scale-105"
                }`}
                style={{
                  background: `conic-gradient(${t.faces[0]} 0 60deg, ${t.faces[4]} 60deg 140deg, ${t.faces[2]} 140deg 200deg, ${t.faces[1]} 200deg 280deg, ${t.faces[3]} 280deg 360deg)`,
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSound}
              aria-label={soundOn ? "Desativar som" : "Ativar som"}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              {soundOn ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={onHelp}
              aria-label="Ajuda"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <CircleHelp className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-600">
          Os recordes ficam guardados neste dispositivo.
        </p>
      </motion.div>
    </motion.div>
  );
}
