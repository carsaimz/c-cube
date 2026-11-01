"use client";
import dynamic from "next/dynamic";

/** Carrega o jogo apenas no cliente (WebGL não renderiza no servidor). */
const GameShell = dynamic(() => import("@/components/game/GameShell"), {
  ssr: false,
  loading: () => (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "radial-gradient(130% 100% at 50% 0%, #101319 0%, #04050a 100%)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <img
          src="/logo.svg"
          alt="C-Cube"
          draggable={false}
          className="h-16 w-16 rounded-2xl shadow-lg shadow-orange-500/25"
        />
        <div className="h-8 w-8 animate-spin rounded-xl border-2 border-white/15 border-t-amber-400" />
        <span className="font-mono text-xs tracking-widest text-zinc-500">C-CUBE</span>
      </div>
    </div>
  ),
});

export { GameShell };
