"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Hand, Orbit, RotateCw, Sparkles } from "lucide-react";
import { playClick } from "@/lib/sound";
import { useGameStore, useT } from "@/store/game";

/**
 * Tutorial interativo — mostrado sobre o menu (o cubo flutua atrás).
 * O contentor raiz é pointer-events-none: os gestos continuam a chegar
 * ao cubo; só o cartão de instruções captura toques.
 *
 * Passos: 0 boas-vindas · 1 orbitar a câmara · 2 rodar uma camada · 3 pronto.
 * A deteção dos gestos chega pela store (viewCallbacks.onOrbit e userMove).
 */
export function TutorialOverlay() {
  const t = useT();
  const step = useGameStore((s) => s.tutorialStep) ?? 0;

  const skip = () => {
    playClick();
    useGameStore.getState().endTutorial(false);
  };
  const next = () => {
    playClick();
    useGameStore.setState({ tutorialStep: 1 });
  };
  const play = () => useGameStore.getState().endTutorial(true);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col justify-end">
      <motion.div
        className="flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),4.5rem)]"
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <div className="panel pointer-events-auto w-[min(92vw,400px)] rounded-3xl p-4 shadow-2xl sm:p-5">
          {/* progresso: 2 gestos práticos + ecrã final */}
          <div className="mb-3 flex items-center justify-center gap-1.5" aria-hidden="true">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= i ? "w-7 bg-amber-400" : "w-3 bg-white/20"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
                      <Hand className="h-5 w-5" />
                    </span>
                    <h2 className="text-lg font-bold leading-tight text-white">{t("tut.welcome.t")}</h2>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">{t("tut.welcome.d")}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={next}
                      className="h-11 flex-1 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-sm font-bold text-zinc-950 shadow-md shadow-orange-500/25 transition-all hover:shadow-orange-500/40 active:scale-[0.98]"
                    >
                      {t("tut.next")}
                    </button>
                    <button
                      onClick={skip}
                      className="h-11 rounded-2xl px-4 text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {t("tut.skip")}
                    </button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <StepEyebrow label={t("tut.step", { a: 1, b: 2 })} />
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-300">
                      <Orbit className="h-5 w-5" />
                    </span>
                    <h2 className="text-lg font-bold leading-tight text-white">{t("tut.orbit.t")}</h2>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">{t("tut.orbit.d")}</p>
                  <GestureHint icon={<Orbit className="h-5 w-5" />} label={t("tut.try")} spin />
                </div>
              )}

              {step === 2 && (
                <div>
                  <StepEyebrow label={`✓ ${t("tut.orbit.ok")}`} success />
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                      <RotateCw className="h-5 w-5" />
                    </span>
                    <h2 className="text-lg font-bold leading-tight text-white">{t("tut.turn.t")}</h2>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">{t("tut.turn.d")}</p>
                  <GestureHint icon={<Hand className="h-5 w-5" />} label={t("tut.try")} swipe />
                </div>
              )}

              {step === 3 && (
                <div>
                  <StepEyebrow label={`✓ ${t("tut.turn.ok")}`} success />
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <h2 className="text-lg font-bold leading-tight text-white">{t("tut.done.t")}</h2>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">{t("tut.done.d")}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={play}
                      className="h-11 flex-1 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-sm font-bold text-zinc-950 shadow-md shadow-orange-500/25 transition-all hover:shadow-orange-500/40 active:scale-[0.98]"
                    >
                      {t("tut.play")}
                    </button>
                    <button
                      onClick={skip}
                      className="h-11 rounded-2xl px-4 text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {t("action.menu")}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function StepEyebrow({ label, success }: { label: string; success?: boolean }) {
  return (
    <div
      className={`mb-2 text-[10px] font-semibold uppercase tracking-widest ${
        success ? "text-emerald-400" : "text-zinc-500"
      }`}
    >
      {label}
    </div>
  );
}

/** Dica animada "experimenta no cubo" — mão a orbitar ou a deslizar. */
function GestureHint({
  icon,
  label,
  spin,
  swipe,
}: {
  icon: React.ReactNode;
  label: string;
  spin?: boolean;
  swipe?: boolean;
}) {
  return (
    <div className="mt-3 flex items-center justify-center gap-2.5 rounded-2xl bg-white/[0.06] px-3 py-2.5">
      <motion.span
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-amber-300"
        animate={
          spin
            ? { rotate: 360 }
            : swipe
              ? { x: [-7, 7, -7], rotate: [-8, 8, -8] }
              : {}
        }
        transition={
          spin
            ? { duration: 2.4, repeat: Infinity, ease: "linear" }
            : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {icon}
      </motion.span>
      <span className="text-xs font-semibold text-zinc-300">{label}</span>
    </div>
  );
}
