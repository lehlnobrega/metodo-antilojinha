// Dropdown customizado de filtro (única ou múltipla escolha), com rótulo dentro do botão.
import { Check, ChevronDown } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type OpcaoFiltro = { valor: string; rotulo: ReactNode };

export function DropdownFiltro({
  rotulo,
  valor,
  opcoes,
  onChange,
  multiplo,
  todosRotulo = "Todos",
  semTodos,
}: {
  rotulo: string;
  valor: string[];
  opcoes: OpcaoFiltro[];
  onChange: (v: string[]) => void;
  multiplo?: boolean;
  todosRotulo?: string;
  semTodos?: boolean;
}) {
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

  const ativo = valor.length > 0 && !semTodos;
  const resumo =
    valor.length === 0 ? todosRotulo : valor.length === 1 ? opcoes.find((o) => o.valor === valor[0])?.rotulo ?? todosRotulo : `${valor.length} selecionados`;

  const escolher = (v: string) => {
    if (!multiplo) { onChange(v ? [v] : []); setAberto(false); return; }
    if (!v) { onChange([]); return; }
    onChange(valor.includes(v) ? valor.filter((x) => x !== v) : [...valor, v]);
  };
  const lista: OpcaoFiltro[] = semTodos ? opcoes : [{ valor: "", rotulo: todosRotulo }, ...opcoes];

  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto(!aberto)}
        className={cn(
          "inline-flex h-11 w-full items-center justify-between gap-3 rounded-xl border bg-surface px-4 text-sm transition-colors sm:w-auto",
          ativo ? "border-primary text-primary" : "border-border text-foreground hover:border-primary",
        )}
      >
        <span className="flex min-w-0 items-center gap-1 truncate">
          <span className={ativo ? "" : "text-muted-foreground"}>{rotulo}:</span> <span className="font-medium">{resumo}</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", aberto && "rotate-180")} />
      </button>
      {aberto ? (
        <ul role="listbox" aria-multiselectable={multiplo} className="absolute left-0 z-30 mt-2 min-w-full overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
          {lista.map((o) => {
            const sel = o.valor ? valor.includes(o.valor) : valor.length === 0;
            return (
              <li key={o.valor || "todos"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={sel}
                  onClick={() => escolher(o.valor)}
                  className={cn("flex w-full items-center justify-between gap-4 whitespace-nowrap px-4 py-2.5 text-left text-sm hover:bg-muted", sel && "font-medium text-primary")}
                >
                  <span className="flex items-center gap-2">{o.rotulo}</span>
                  {sel ? <Check className="size-4" /> : multiplo && o.valor ? <span className="size-4" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
