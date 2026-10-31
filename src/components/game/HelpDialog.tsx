"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Hand, Keyboard, LocateFixed, MousePointer2, Sparkles, ZoomIn } from "lucide-react";
import { MODES } from "@/store/game";

/** Ajuda — como jogar. */
export function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-[#14171f]/95 text-zinc-100 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Como jogar</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <HelpRow icon={<Hand className="h-4.5 w-4.5 text-amber-400" />} title="Rodar uma camada">
            Arrasta o dedo (ou o rato) sobre um adesivo na direção em que queres que essa camada gire.
          </HelpRow>
          <HelpRow icon={<MousePointer2 className="h-4.5 w-4.5 text-amber-400" />} title="Orbitar a câmara">
            Arrasta fora do cubo para olhar para qualquer ângulo. Usa a pinça (ou a roda do rato) para aproximar.
          </HelpRow>
          <HelpRow icon={<LocateFixed className="h-4.5 w-4.5 text-amber-400" />} title="Recentrar a câmara">
            O botão <span className="text-amber-300">⌖</span> (canto inferior direito) repõe o cubo ao centro com o
            zoom padrão. Também podes fazer <span className="font-semibold">duplo clique</span> fora do cubo.
          </HelpRow>
          <HelpRow icon={<Keyboard className="h-4.5 w-4.5 text-amber-400" />} title="Teclado (PC)">
            Teclas <Kbd>U</Kbd> <Kbd>D</Kbd> <Kbd>L</Kbd> <Kbd>R</Kbd> <Kbd>F</Kbd> <Kbd>B</Kbd> rodam as faces.
            Com <Kbd>Shift</Kbd>, faz o movimento inverso (ex.: R&apos;).
          </HelpRow>
          <HelpRow icon={<ZoomIn className="h-4.5 w-4.5 text-amber-400" />} title="Objetivo">
            Deixa cada face com uma única cor. O cronómetro começa no teu primeiro movimento após o embaralhamento.
          </HelpRow>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Modos de jogo</div>
            <div className="space-y-2">
              {MODES.map((m) => (
                <div key={m.id} className="rounded-2xl bg-white/5 px-3 py-2">
                  <span className="text-sm font-semibold text-zinc-100">{m.name}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-zinc-400">{m.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <HelpRow icon={<Eye className="h-4.5 w-4.5 text-sky-400" />} title="Modo Memória">
            Tens alguns segundos para memorizar o cubo; depois os adesivos ficam cinzentos. O botão{" "}
            <span className="text-sky-300">Espiar</span> mostra as cores por 2 s — cada espreitadela custa +5 s.
          </HelpRow>

          <div className="rounded-2xl bg-white/5 p-3 text-xs leading-relaxed text-zinc-400">
            <span className="font-semibold text-zinc-300">Dica:</span> o botão{" "}
            <span className="text-amber-300">Resolver</span> devolve o cubo ao estado resolvido passo a passo —
            útil para aprender. Usa <span className="text-amber-300">Desfazer</span> para corrigir um movimento.
          </div>
          <div className="flex items-start gap-2 rounded-2xl bg-amber-400/5 p-3 text-xs leading-relaxed text-zinc-400">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
            <span>
              A <span className="font-semibold text-zinc-200">dificuldade</span> muda o tamanho do embaralhamento e
              os limites de tempo/movimentos. Cada combinação de modo + tamanho + dificuldade tem recorde próprio.
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
