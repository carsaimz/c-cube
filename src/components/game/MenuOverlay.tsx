"use client";
import { motion } from "framer-motion";
import { Box, Brain, CircleHelp, Flag, Play, Target, Timer, Volume2, VolumeX } from "lucide-react";
import {
  type Difficulty,
  DIFFICULTIES,
  MARATHON_STAGES,
  formatTime,
  moveBudget,
  scrambleLength,
  sprintTimeLimit,
} from "@/lib/cube/engine";
import { THEMES } from "@/lib/cube/themes";
import { playClick } from "@/lib/sound";
import { MODES, recordKey, useGameStore } from "@/store/game";

const MODE_ICONS: Record<string, React.ReactNode> = {
  classic: <Box className="h-4 w-4" />,
  sprint: <Timer className="h-4 w-4" />,
  efficiency: <Target className="h-4 w-4" />,
  marathon: <Flag className="h-4 w-4" />,
  memory: <Brain className="h-4 w-4" />,
};

/** Resumo das regras concretas da seleção atual (modo × tamanho × dificuldade). */
function modeRules(mode: string, size: number, diff: Difficulty): string {
  switch (mode) {
    case "sprint": {
      const s = Math.round(sprintTimeLimit(size, diff) / 1000);
      return `Limite: ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    }
    case "efficiency":
      return `Orçamento: ${moveBudget(size, diff)} movimentos`;
    case "memory": {
      const s = Math.round({ easy: 12, normal: 8, hard: 5, extreme: 3 }[diff]);
      return `Memorização: ${s}s · espreitar +5s`;
    }
    case "marathon":
      return `Etapa 1/${MARATHON_STAGES.length} · tempo acumulado`;
    default:
      return `${scrambleLength(size, diff)} movimentos de embaralhamento`;
  }
}

/** Menu principal — mostrado sobre a cena 3D (o cubo flutua atrás). */
export function MenuOverlay({ onHelp }: { onHelp: () => void }) {
  const size = useGameStore((s) => s.size);
  const setSize = useGameStore((s) => s.setSize);
  const mode = useGameStore((s) => s.mode);
  const setMode = useGameStore((s) => s.setMode);
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const bests = useGameStore((s) => s.bests);
  const themeId = useGameStore((s) => s.themeId);
  const setTheme = useGameStore((s) => s.setTheme);
  const soundOn = useGameStore((s) => s.soundOn);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const startGame = useGameStore((s) => s.startGame);

  const best = bests[recordKey(mode, size, difficulty)];
  const isMarathon = mode === "marathon";
  const bestLabel = best
    ? mode === "efficiency"
      ? `Melhor: ${best.moves} movimentos`
      : `Melhor: ${formatTime(best.timeMs)} · ${best.moves} mov.`
    : "Sem recorde ainda";

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="glass max-h-[calc(100dvh-2rem)] w-[min(92vw,410px)] overflow-y-auto rounded-3xl p-5 shadow-2xl sm:p-6"
        initial={{ y: 24, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 16, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-lg shadow-orange-500/25">
            <Box className="h-7 w-7 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">C-Cube</h1>
          <p className="mt-1 text-sm text-zinc-400">Cubo Mágico 3D — arrasta, gira, resolve</p>
        </div>

        {/* tamanho */}
        {!isMarathon && (
          <div className="mt-5">
            <SectionLabel>Tamanho</SectionLabel>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Tamanho do cubo">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    playClick();
                    setSize(n);
                  }}
                  className={`h-10 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    size === n ? "bg-white text-zinc-900 shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  {n}×{n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* dificuldade */}
        <div className="mt-4">
          <SectionLabel>Dificuldade</SectionLabel>
          <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Dificuldade">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  playClick();
                  setDifficulty(d.id);
                }}
                className={`h-9 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  difficulty === d.id ? "bg-white text-zinc-900 shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                }`}
                style={difficulty === d.id ? { boxShadow: `inset 0 -2px 0 ${d.color}` } : undefined}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {/* modo */}
        <div className="mt-4">
          <SectionLabel>Modo</SectionLabel>
          <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Modo de jogo">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 ${
                  mode === m.id
                    ? "bg-gradient-to-r from-amber-400/90 to-orange-500/90 text-zinc-950 shadow-md shadow-orange-500/25"
                    : "bg-white/5 text-zinc-300 hover:bg-white/10"
                } ${m.id === "memory" ? "col-span-2" : ""}`}
              >
                {MODE_ICONS[m.id]}
                {m.name}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-xs text-zinc-500">{MODES.find((m) => m.id === mode)?.desc}</span>
          </div>
        </div>

        {/* regras + recorde */}
        <div className="mt-3 rounded-2xl bg-white/[0.04] px-3.5 py-2.5">
          <div className="text-xs font-medium text-zinc-300">{modeRules(mode, size, difficulty)}</div>
          <div className="mt-0.5 text-[11px] text-zinc-500">{bestLabel}</div>
        </div>

        <motion.button
          onClick={startGame}
          whileTap={{ scale: 0.97 }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-orange-500/30 transition-shadow hover:shadow-orange-500/45"
        >
          <Play className="h-5 w-5 fill-current" />
          Jogar
        </motion.button>

        <div className="mt-4 flex items-center justify-between">
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
                  themeId === t.id ? "scale-110 border-white ring-2 ring-white/40" : "border-white/20 hover:scale-105"
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

        <p className="mt-3 text-center text-[11px] leading-relaxed text-zinc-600">
          Os recordes ficam guardados neste dispositivo.
        </p>
      </motion.div>
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{children}</div>;
}
