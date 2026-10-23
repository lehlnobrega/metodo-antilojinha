// Filtro em formato de pílula com lista suspensa (usado nas ideias de conteúdo).
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type Opcao = { valor: string; rotulo: string };

export function Dropdown({ rotulo, valor, opcoes, onChange }: { rotulo: string; valor?: string | undefined; opcoes: Opcao[]; onChange: (v?: string) => void }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [aberto]);
  const atual = opcoes.find((o) => o.valor === valor);
  const todas: Opcao[] = [{ valor: "", rotulo: "Todos" }, ...opcoes];
  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto(!aberto)}
        className={cn(
          "inline-flex h-11 w-full items-center justify-between gap-3 rounded-full border bg-surface px-5 text-sm transition-colors sm:w-auto",
          atual ? "border-primary text-primary" : "border-border text-foreground hover:border-primary",
        )}
      >
        <span className="truncate"><span className={atual ? "" : "text-muted-foreground"}>{rotulo}:</span> <span className="font-medium">{atual?.rotulo ?? "Todos"}</span></span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", aberto && "rotate-180")} />
      </button>
      {aberto ? (
        <ul role="listbox" className="absolute left-0 z-20 mt-2 min-w-full overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
          {todas.map((o) => {
            const sel = (valor ?? "") === o.valor;
            return (
              <li key={o.valor || "todos"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={sel}
                  onClick={() => { onChange(o.valor || undefined); setAberto(false); }}
                  className={cn("flex w-full items-center justify-between gap-4 whitespace-nowrap px-4 py-2.5 text-left text-sm hover:bg-muted", sel && "font-medium text-primary")}
                >
                  {o.rotulo}
                  {sel ? <Check className="size-4" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

