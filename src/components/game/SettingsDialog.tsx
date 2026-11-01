"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { formatTime } from "@/lib/cube/engine";
import { THEMES } from "@/lib/cube/themes";
import { playClick } from "@/lib/sound";
import { APP_VERSION } from "@/lib/update";
import { LOCALES, type Locale } from "@/lib/i18n";
import { useGameStore, useT } from "@/store/game";

/** Definições — idioma, tema, som, vibração, atualizações e sobre. */
export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  const size = useGameStore((s) => s.size);
  const setSize = useGameStore((s) => s.setSize);
  const themeId = useGameStore((s) => s.themeId);
  const setTheme = useGameStore((s) => s.setTheme);
  const soundOn = useGameStore((s) => s.soundOn);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const hapticsOn = useGameStore((s) => s.hapticsOn);
  const toggleHaptics = useGameStore((s) => s.toggleHaptics);
  const locale = useGameStore((s) => s.locale);
  const setLocale = useGameStore((s) => s.setLocale);
  const updateState = useGameStore((s) => s.updateState);
  const updateInfo = useGameStore((s) => s.updateInfo);
  const checkUpdate = useGameStore((s) => s.checkUpdate);
  const openUpdateDialog = useGameStore((s) => s.openUpdateDialog);
  const bests = useGameStore((s) => s.bests);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-[#14171f]/95 text-zinc-100 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{t("settings.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* idioma */}
          <section>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("settings.language")}</div>
            <div className="grid grid-cols-4 gap-2">
              {LOCALES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    playClick();
                    setLocale(l.id as Locale);
                  }}
                  className={`h-10 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    locale === l.id ? "bg-white text-zinc-900 shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </section>

          {/* tema */}
          <section>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("section.theme")}</div>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => {
                    playClick();
                    setTheme(th.id);
                  }}
                  className={`flex items-center gap-2.5 rounded-xl p-2.5 text-left transition-all duration-200 ${
                    themeId === th.id ? "bg-white/15 ring-1 ring-white/40" : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span
                    className="h-6 w-6 shrink-0 rounded-full border border-white/20"
                    style={{
                      background: `conic-gradient(${th.faces[0]} 0 60deg, ${th.faces[4]} 60deg 140deg, ${th.faces[2]} 140deg 200deg, ${th.faces[1]} 200deg 280deg, ${th.faces[3]} 280deg 360deg)`,
                    }}
                  />
                  <span>
                    <span className="block text-sm font-semibold">{t(`theme.${th.id}`)}</span>
                    <span className="block text-[11px] text-zinc-500">
                      {bests[String(size)] && themeId === th.id
                        ? `${t("stat.best")}: ${formatTime(bests[String(size)]!.timeMs)}`
                        : th.glow > 0
                          ? t("theme.tag.glow")
                          : t("theme.tag.soft")}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
            <div>
              <div className="text-sm font-semibold">{t("settings.sound")}</div>
              <div className="text-xs text-zinc-500">{t("settings.sound.desc")}</div>
            </div>
            <Switch checked={soundOn} onCheckedChange={toggleSound} aria-label={t("settings.sound")} />
          </section>

          <section className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
            <div>
              <div className="text-sm font-semibold">{t("settings.haptics")}</div>
              <div className="text-xs text-zinc-500">{t("settings.haptics.desc")}</div>
            </div>
            <Switch checked={hapticsOn} onCheckedChange={toggleHaptics} aria-label={t("settings.haptics")} />
          </section>

          {/* atualizações */}
          <section className="rounded-2xl bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{t("settings.updates")}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                  {updateState === "checking" ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      {t("updates.checking")}
                    </>
                  ) : updateState === "available" && updateInfo ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-amber-400" />
                      <button
                        className="truncate text-left font-semibold text-amber-300 underline-offset-2 hover:underline"
                        onClick={() => {
                          playClick();
                          openUpdateDialog();
                        }}
                      >
                        {t("updates.available", { v: updateInfo.version })}
                      </button>
                    </>
                  ) : updateState === "error" ? (
                    <>
                      <XCircle className="h-3 w-3 shrink-0 text-red-400" />
                      {t("updates.error")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                      {t("updates.upToDate")}
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  playClick();
                  void checkUpdate(true);
                }}
                disabled={updateState === "checking"}
                className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-100 transition-colors hover:bg-white/20 disabled:opacity-50"
              >
                {t("updates.check")}
              </button>
            </div>
          </section>

          {/* sobre */}
          <section className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
            <img
              src="/logo.svg"
              alt="C-Cube"
              draggable={false}
              className="h-11 w-11 rounded-xl shadow-md shadow-orange-500/25"
            />
            <div className="min-w-0">
              <div className="text-sm font-bold">C-Cube</div>
              <div className="truncate text-[11px] text-zinc-500">{t("app.tagline")}</div>
              <div className="mt-0.5 text-[11px] text-zinc-600">{t("about.version", { v: APP_VERSION })}</div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
