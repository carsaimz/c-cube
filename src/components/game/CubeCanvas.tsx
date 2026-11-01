"use client";
import { useEffect, useRef } from "react";
import { CubeView } from "@/lib/cube/cube-view";
import { themeById } from "@/lib/cube/themes";
import { useGameStore, viewCallbacks } from "@/store/game";

/** Monta a vista 3D e sincroniza-a com a store do jogo. */
export default function CubeCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const size = useGameStore((s) => s.size);
  const themeId = useGameStore((s) => s.themeId);
  const status = useGameStore((s) => s.status);
  const tutorialStep = useGameStore((s) => s.tutorialStep);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const state = useGameStore.getState();
    const view = new CubeView(el, themeById(state.themeId), state.size, viewCallbacks);
    view.setIdle(state.status === "menu");
    useGameStore.getState().setView(view);
    // depuração nos testes (não afeta a jogabilidade)
    (window as unknown as { __ccube?: CubeView }).__ccube = view;
    (window as unknown as { __ccubeStore?: typeof useGameStore }).__ccubeStore = useGameStore;
    return () => {
      useGameStore.getState().setView(null);
      view.dispose();
    };
  }, []);

  useEffect(() => {
    useGameStore.getState().view?.setSize(size);
  }, [size]);

  useEffect(() => {
    useGameStore.getState().view?.setTheme(themeById(themeId));
  }, [themeId]);

  useEffect(() => {
    // durante o tutorial (sobre o menu) a rotação automática pausa — o cubo
    // fica parado para o utilizador praticar os gestos
    useGameStore.getState().view?.setIdle(status === "menu" && tutorialStep === null);
    // em jogo, centrar o cubo na zona livre entre o HUD e a barra de controlos
    useGameStore.getState().view?.setFramed(status !== "menu");
  }, [status, tutorialStep]);

  return <div ref={ref} className="absolute inset-0 overflow-hidden" aria-hidden="true" />;
}
