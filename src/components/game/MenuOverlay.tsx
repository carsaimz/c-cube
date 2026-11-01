"use client";
import { motion } from "framer-motion";
import { Box, Brain, CircleHelp, Flag, Globe, Play, Target, Timer, Volume2, VolumeX } from "lucide-react";
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
import { type Locale, LOCALES } from "@/lib/i18n";
import { MODES, useGameStore, useT } from "@/store/game";

const MODE_ICONS: Record<string, React.ReactNode> = {
  classic: <Box className="h-4 w-4" />,
  sprint: <Timer className="h-4 w-4" />,
  efficiency: <Target className="h-4 w-4" />,
  marathon: <Flag className="h-4 w-4" />,
  memory: <Brain className="h-4 w-4" />,
};

/** Resumo das regras concretas da seleção atual (modo × tamanho × dificuldade). */
function modeRules(t: ReturnType<typeof useT>, mode: string, size: number, diff: Difficulty): string {
  switch (mode) {
    case "sprint": {
      const s = Math.round(sprintTimeLimit(size, diff) / 1000);
      return t("rules.sprint", { t: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` });
    }
    case "efficiency":
      return t("rules.efficiency", { n: moveBudget(size, diff) });
    case "memory": {
      const s = Math.round({ easy: 12, normal: 8, hard: 5, extreme: 3 }[diff]);
      return t("rules.memory", { s });
    }
    case "marathon":
      return t("rules.marathon", { n: MARATHON_STAGES.length });
    default:
      return t("rules.classic", { n: scrambleLength(size, diff) });
  }
}

/** Menu principal — mostrado sobre a cena 3D (o cubo flutua atrás). */
export function MenuOverlay({ onHelp }: { onHelp: () => void }) {
  const t = useT();
  const locale = useGameStore((s) => s.locale);
  const setLocale = useGameStore((s) => s.setLocale);
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

  const best = bests[`${mode}:${mode === "marathon" ? 0 : size}:${difficulty}`];
  const isMarathon = mode === "marathon";
  const bestLabel = best
    ? mode === "efficiency"
      ? t("best.moves", { n: best.moves })
      : t("best.time", { t: formatTime(best.timeMs), n: best.moves })
    : t("best.none");

  const cycleLocale = () => {
    playClick();
    const idx = LOCALES.findIndex((l) => l.id === locale);
    setLocale(LOCALES[(idx + 1) % LOCALES.length].id);
  };

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="panel max-h-[calc(100dvh-2rem)] w-[min(92vw,410px)] overflow-y-auto rounded-3xl p-5 shadow-2xl sm:p-6"
        initial={{ y: 24, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 16, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <div className="flex flex-col items-center text-center">
          <img
            src="/logo.svg"
            alt="C-Cube"
            draggable={false}
            className="h-16 w-16 rounded-2xl shadow-lg shadow-orange-500/30"
          />
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">C-Cube</h1>
          <p className="mt-1 text-sm text-zinc-400">{t("app.tagline")}</p>
        </div>

        {/* tamanho */}
        {!isMarathon && (
          <div className="mt-5">
            <SectionLabel>{t("section.size")}</SectionLabel>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("group.size")}>
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    playClick();
                    setSize(n);
                  }}
                  className={`h-10 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    size === n ? "bg-white text-zinc-900 shadow-md" : "bg-white/10 text-zinc-200 hover:bg-white/15"
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
          <SectionLabel>{t("section.difficulty")}</SectionLabel>
          <div className="grid grid-cols-4 gap-1.5" role="group" aria-label={t("group.difficulty")}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  playClick();
                  setDifficulty(d.id);
                }}
                className={`h-9 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  difficulty === d.id ? "bg-white text-zinc-900 shadow-md" : "bg-white/10 text-zinc-200 hover:bg-white/15"
                }`}
                style={difficulty === d.id ? { boxShadow: `inset 0 -2px 0 ${d.color}` } : undefined}
              >
                {t(`diff.${d.id}`)}
              </button>
            ))}
          </div>
        </div>

        {/* modo */}
        <div className="mt-4">
          <SectionLabel>{t("section.mode")}</SectionLabel>
          <div className="grid grid-cols-2 gap-1.5" role="group" aria-label={t("group.mode")}>
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 ${
                  mode === m.id
                    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-zinc-950 shadow-md shadow-orange-500/25"
                    : "bg-white/10 text-zinc-200 hover:bg-white/15"
                } ${m.id === "memory" ? "col-span-2" : ""}`}
              >
                {MODE_ICONS[m.id]}
                {t(`mode.${m.id}.name`)}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-xs text-zinc-400">{t(`mode.${mode}.desc`)}</span>
          </div>
        </div>

        {/* regras + recorde */}
        <div className="mt-3 rounded-2xl bg-white/[0.06] px-3.5 py-2.5">
          <div className="text-xs font-medium text-zinc-200">{modeRules(t, mode, size, difficulty)}</div>
          <div className="mt-0.5 text-[11px] text-zinc-400">{bestLabel}</div>
        </div>

        <motion.button
          onClick={startGame}
          whileTap={{ scale: 0.97 }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-orange-500/30 transition-shadow hover:shadow-orange-500/45"
        >
          <Play className="h-5 w-5 fill-current" />
          {t("action.play")}
        </motion.button>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2" role="group" aria-label={t("group.theme")}>
            {THEMES.map((th) => (
              <button
                key={th.id}
                aria-label={t("aria.theme", { name: t(`theme.${th.id}`) })}
                title={t(`theme.${th.id}`)}
                onClick={() => {
                  playClick();
                  setTheme(th.id);
                }}
                className={`h-7 w-7 rounded-full border transition-all duration-200 ${
                  themeId === th.id ? "scale-110 border-white ring-2 ring-white/40" : "border-white/25 hover:scale-105"
                }`}
                style={{
                  background: `conic-gradient(${th.faces[0]} 0 60deg, ${th.faces[4]} 60deg 140deg, ${th.faces[2]} 140deg 200deg, ${th.faces[1]} 200deg 280deg, ${th.faces[3]} 280deg 360deg)`,
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={cycleLocale}
              aria-label={`${t("settings.language")}: ${LOCALES.find((l) => l.id === locale)?.label}`}
              title={`${t("settings.language")}: ${LOCALES.find((l) => l.id === locale)?.label}`}
              className="flex h-9 items-center justify-center gap-1.5 rounded-xl px-2.5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Globe className="h-4.5 w-4.5" />
              <span className="text-[11px] font-bold uppercase tracking-wide">{locale}</span>
            </button>
            <button
              onClick={toggleSound}
              aria-label={soundOn ? t("aria.soundOff") : t("aria.soundOn")}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              {soundOn ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={onHelp}
              aria-label={t("aria.help")}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <CircleHelp className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-zinc-500">
          {t("footer.records")}
        </p>
      </motion.div>
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{children}</div>;
}
