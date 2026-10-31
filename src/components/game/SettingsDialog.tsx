"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { formatTime } from "@/lib/cube/engine";
import { THEMES } from "@/lib/cube/themes";
import { playClick } from "@/lib/sound";
import { useGameStore } from "@/store/game";

/** Definições — tamanho, tema, som e vibração. */
export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const size = useGameStore((s) => s.size);
  const setSize = useGameStore((s) => s.setSize);
  const themeId = useGameStore((s) => s.themeId);
  const setTheme = useGameStore((s) => s.setTheme);
  const soundOn = useGameStore((s) => s.soundOn);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const hapticsOn = useGameStore((s) => s.hapticsOn);
  const toggleHaptics = useGameStore((s) => s.toggleHaptics);
  const bests = useGameStore((s) => s.bests);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-[#14171f]/95 text-zinc-100 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Definições</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <section>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Tamanho</div>
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
          </section>

          <section>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Tema</div>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    playClick();
                    setTheme(t.id);
                  }}
                  className={`flex items-center gap-2.5 rounded-xl p-2.5 text-left transition-all duration-200 ${
                    themeId === t.id ? "bg-white/15 ring-1 ring-white/40" : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span
                    className="h-6 w-6 shrink-0 rounded-full border border-white/20"
                    style={{
                      background: `conic-gradient(${t.faces[0]} 0 60deg, ${t.faces[4]} 60deg 140deg, ${t.faces[2]} 140deg 200deg, ${t.faces[1]} 200deg 280deg, ${t.faces[3]} 280deg 360deg)`,
                    }}
                  />
                  <span>
                    <span className="block text-sm font-semibold">{t.name}</span>
                    <span className="block text-[11px] text-zinc-500">
                      {bests[String(size)] && themeId === t.id
                        ? `Melhor: ${formatTime(bests[String(size)]!.timeMs)}`
                        : t.glow > 0
                          ? "Adesivos brilhantes"
                          : "Visual suave"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
            <div>
              <div className="text-sm font-semibold">Som</div>
              <div className="text-xs text-zinc-500">Efeitos sonoros discretos</div>
            </div>
            <Switch checked={soundOn} onCheckedChange={toggleSound} aria-label="Som" />
          </section>

          <section className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
            <div>
              <div className="text-sm font-semibold">Vibração</div>
              <div className="text-xs text-zinc-500">Resposta tátil ao rodar (Android)</div>
            </div>
            <Switch checked={hapticsOn} onCheckedChange={toggleHaptics} aria-label="Vibração" />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
