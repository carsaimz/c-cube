"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Hand, Keyboard, LocateFixed, MousePointer2, Sparkles, ZoomIn } from "lucide-react";
import { useT } from "@/store/game";

/** Ajuda — como jogar (i18n pt/en/fr/es). */
export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-[#14171f]/95 text-zinc-100 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{t("help.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <HelpRow icon={<Hand className="h-4.5 w-4.5 text-amber-400" />} title={t("help.layer.t")}>
            {t("help.layer.d")}
          </HelpRow>
          <HelpRow icon={<MousePointer2 className="h-4.5 w-4.5 text-amber-400" />} title={t("help.orbit.t")}>
            {t("help.orbit.d")}
          </HelpRow>
          <HelpRow icon={<LocateFixed className="h-4.5 w-4.5 text-amber-400" />} title={t("help.recenter.t")}>
            {t("help.recenter.d1")} <span className="text-amber-300">⌖</span> {t("help.recenter.d2")}{" "}
            <span className="font-semibold">{t("help.recenter.dbl")}</span> {t("help.recenter.d3")}
          </HelpRow>
          <HelpRow icon={<Keyboard className="h-4.5 w-4.5 text-amber-400" />} title={t("help.keyboard.t")}>
            {t("help.keyboard.d1")} <Kbd>U</Kbd> <Kbd>D</Kbd> <Kbd>L</Kbd> <Kbd>R</Kbd> <Kbd>F</Kbd> <Kbd>B</Kbd>{" "}
            {t("help.keyboard.d2")} <Kbd>Shift</Kbd>
            {t("help.keyboard.d3")}
          </HelpRow>
          <HelpRow icon={<ZoomIn className="h-4.5 w-4.5 text-amber-400" />} title={t("help.goal.t")}>
            {t("help.goal.d")}
          </HelpRow>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("help.modes")}</div>
            <div className="space-y-2">
              {(["classic", "sprint", "efficiency", "marathon", "memory"] as const).map((id) => (
                <div key={id} className="rounded-2xl bg-white/5 px-3 py-2">
                  <span className="text-sm font-semibold text-zinc-100">{t(`mode.${id}.name`)}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-zinc-400">{t(`mode.${id}.desc`)}</span>
                </div>
              ))}
            </div>
          </div>

          <HelpRow icon={<Eye className="h-4.5 w-4.5 text-sky-400" />} title={t("help.memory.t")}>
            {t("help.memory.d1")} <span className="text-sky-300 font-semibold">{t("help.memory.peek")}</span>{" "}
            {t("help.memory.d2")}
          </HelpRow>

          <div className="rounded-2xl bg-white/5 p-3 text-xs leading-relaxed text-zinc-400">
            <span className="font-semibold text-zinc-300">{t("help.tip.label")}</span> {t("help.tip.d1")}{" "}
            <span className="text-amber-300 font-semibold">{t("help.tip.solve")}</span> {t("help.tip.d2")}{" "}
            <span className="text-amber-300 font-semibold">{t("help.tip.undo")}</span> {t("help.tip.d3")}
          </div>
          <div className="flex items-start gap-2 rounded-2xl bg-amber-400/5 p-3 text-xs leading-relaxed text-zinc-400">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
            <span>
              <span className="font-semibold text-zinc-200">{t("help.difficulty.label")}</span>{" "}
              {t("help.difficulty.d")}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HelpRow({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5">{icon}</div>
      <div>
        <div className="font-semibold text-zinc-100">{title}</div>
        <div className="mt-0.5 leading-relaxed text-zinc-400">{children}</div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-0.5 rounded-md border border-white/15 bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-zinc-200">
      {children}
    </kbd>
  );
}
