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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const state = useGameStore.getState();
    const view = new CubeView(el, themeById(state.themeId), state.size, viewCallbacks);
    view.setIdle(state.status === "menu");
    useGameStore.getState().setView(view);
    // depuração nos testes (não afeta a jogabilidade)
    (window as unknown as { __ccube?: CubeView }).__ccube = view;
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
    useGameStore.getState().view?.setIdle(status === "menu");
  }, [status]);

  return <div ref={ref} className="absolute inset-0" aria-hidden="true" />;
}
