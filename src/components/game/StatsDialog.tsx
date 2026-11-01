"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart3, Brain, Box, Flag, Target, Timer, Trash2 } from "lucide-react";
import { formatTime } from "@/lib/cube/engine";
import { useGameStore, useT, type GameResult, type ModeStats } from "@/store/game";

const MODE_ICONS: Record<string, React.ReactNode> = {
  classic: <Box className="h-4 w-4" />,
  sprint: <Timer className="h-4 w-4" />,
  efficiency: <Target className="h-4 w-4" />,
  marathon: <Flag className="h-4 w-4" />,
  memory: <Brain className="h-4 w-4" />,
};

/** Duração legível: "12:34" ou "1h 23m" para totais grandes. */
function fmtTotal(ms: number): string {
  if (ms >= 3_600_000) {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return `${h}h ${String(m).padStart(2, "0")}m`;
  }
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Estatísticas de progresso — resolvidos, taxa de sucesso, sequências, por modo e histórico. */
export function StatsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  const stats = useGameStore((s) => s.stats);
  const clearStats = useGameStore((s) => s.clearStats);

  const finished = stats.solved + stats.failed;
  const winrate = finished > 0 ? Math.round((stats.solved / finished) * 100) : null;
  const avg = stats.solved > 0 ? Math.round(stats.timeMs / stats.solved) : null;
  const bars = stats.recent.slice(-20);
  const maxMs = Math.max(1, ...bars.filter((b) => b.w).map((b) => b.ms));
  const modes = ["classic", "sprint", "efficiency", "marathon", "memory"] as const;

  const bestLabel = (b: ModeStats): string | null => {
    if (b.bestMs === null && b.bestMoves === null) return null;
    const v =
      b.bestMoves !== null
        ? `${b.bestMoves} ${t("stat.moves").toLowerCase()}`
        : formatTime(b.bestMs ?? 0);
    return t("stats.best", { v });
  };

  const recentLine = (r: GameResult): string =>
    r.w
      ? t("stats.recent.win", { t: formatTime(r.ms), n: r.mv })
      : t("stats.recent.fail", { r: t(r.r === "moves" ? "stats.fail.moves" : "stats.fail.time") });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-[#14171f]/95 text-zinc-100 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <BarChart3 className="h-5 w-5 text-amber-400" />
            {t("stats.title")}
          </DialogTitle>
        </DialogHeader>

        {stats.played === 0 ? (
          <div className="rounded-2xl bg-white/5 p-6 text-center text-sm text-zinc-400">
            {t("stats.empty")}
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            {/* cartões principais */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard label={t("stats.solved")} value={String(stats.solved)} accent="text-amber-300" />
              <StatCard
                label={t("stats.winrate")}
                value={winrate === null ? "—" : `${winrate}%`}
                accent="text-emerald-300"
                sub={t("stats.played") + ": " + String(stats.played)}
              />
              <StatCard
                label={t("stats.streak")}
                value={String(stats.bestStreak)}
                accent="text-orange-300"
              />
              <StatCard
                label={t("stats.time")}
                value={fmtTotal(stats.timeMs)}
                accent="text-sky-300"
                sub={stats.moves + " " + t("stat.moves").toLowerCase()}
              />
            </div>

            {/* média por resolução */}
            <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3.5 py-2.5">
              <span className="text-xs text-zinc-400">{t("stats.avg")}</span>
              <span className="font-mono text-sm font-bold tabular-nums text-zinc-100">
                {avg === null ? "—" : formatTime(avg)}
              </span>
            </div>

            {/* por modo */}
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {t("stats.byMode")}
              </div>
              <div className="space-y-1.5">
                {modes.map((id) => {
                  const b = stats.perMode[id];
                  if (!b || b.played === 0) return null;
                  const best = bestLabel(b);
                  return (
                    <div key={id} className="flex items-center gap-2.5 rounded-2xl bg-white/5 px-3 py-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-amber-300">
                        {MODE_ICONS[id]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-zinc-100">
                          {t(`mode.${id}.name`)}
                        </div>
                        <div className="truncate text-[11px] text-zinc-400">
                          {t(b.played === 1 ? "stats.modeLine1" : "stats.modeLine", { p: b.played, s: b.solved })}
                        </div>
                      </div>
                      {best && (
                        <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-amber-200/90">
                          {best}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* histórico recente */}
            {bars.length > 0 && (
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {t("stats.recent")}
                </div>
                <div className="flex h-16 items-end gap-1 rounded-2xl bg-white/5 px-2.5 pb-2 pt-2">
                  {bars.map((b, i) => {
                    const h = b.w ? Math.max(30, Math.round((b.ms / maxMs) * 100)) : 26;
                    return (
                      <div
                        key={`${b.t}-${i}`}
                        title={`${t(`mode.${b.m}.name`)} · ${recentLine(b)}`}
                        className={`min-w-1.5 flex-1 rounded-t-md ${
                          b.w ? "bg-gradient-to-t from-amber-500 to-amber-300" : "bg-red-400/50"
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    );
                  })}
                </div>
                <div className="mt-2 space-y-1">
                  {stats.recent
                    .slice(-4)
                    .reverse()
                    .map((r) => (
                      <div key={r.t} className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold ${
                            r.w ? "bg-emerald-400/20 text-emerald-300" : "bg-red-400/20 text-red-300"
                          }`}
                        >
                          {r.w ? "✓" : "✗"}
                        </span>
                        <span className="w-14 shrink-0 font-semibold text-zinc-300">
                          {t(`mode.${r.m}.name`)}
                        </span>
                        <span className="truncate">{recentLine(r)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (window.confirm(t("stats.clear.confirm"))) clearStats();
              }}
              className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-red-400/10 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("stats.clear")}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: string;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 px-3.5 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</div>
      <div className={`mt-0.5 font-mono text-2xl font-bold tabular-nums ${accent}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-zinc-500">{sub}</div>}
    </div>
  );
}
