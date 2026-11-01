"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, ExternalLink, RefreshCw } from "lucide-react";
import { APP_VERSION, openUpdateUrl } from "@/lib/update";
import { playClick } from "@/lib/sound";
import { useGameStore, useT } from "@/store/game";

/** Diálogo "nova versão disponível" — aberto pela verificação em 2º plano
 *  ou pelo botão nas Definições. A descarga abre num browser tab in-app
 *  (Android/Capacitor) ou no navegador externo (Electron/web). */
export function UpdateDialog() {
  const t = useT();
  const open = useGameStore((s) => s.updateDialogOpen);
  const info = useGameStore((s) => s.updateInfo);
  const dismiss = useGameStore((s) => s.dismissUpdateDialog);

  if (!info) return null;

  const notes = (info.body ?? "").trim();

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) dismiss();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-[#14171f]/95 text-zinc-100 backdrop-blur-xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg font-bold">
            <img
              src="/logo.svg"
              alt=""
              draggable={false}
              className="h-10 w-10 rounded-xl shadow-md shadow-orange-500/25"
            />
            {t("upd.title")}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-zinc-300">{t("upd.subtitle", { v: info.version, cur: APP_VERSION })}</p>

        {notes.length > 0 && (
          <div className="rounded-2xl bg-white/5 px-3.5 py-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("upd.notes")}
            </div>
            <div className="max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">
              {notes}
            </div>
          </div>
        )}

        <div className="mt-1 space-y-2">
          <button
            onClick={() => {
              playClick();
              void openUpdateUrl(info.apkUrl ?? info.htmlUrl);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-orange-500/30 transition-shadow hover:shadow-orange-500/45"
          >
            <Download className="h-4.5 w-4.5" />
            {t("upd.download")}
          </button>
          <button
            onClick={() => {
              playClick();
              void openUpdateUrl(info.htmlUrl);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4" />
            {t("upd.page")}
          </button>
          <button
            onClick={() => {
              playClick();
              dismiss();
            }}
            className="w-full rounded-2xl py-2 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {t("upd.later")}
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
          <RefreshCw className="h-3 w-3" />
          {t("updates.current", { v: APP_VERSION })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
