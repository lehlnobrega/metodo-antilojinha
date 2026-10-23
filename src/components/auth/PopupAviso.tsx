// Pop up simples das telas de entrada (primeiro acesso, avisos).
import { CheckCircle2, KeyRound, Lock } from "lucide-react";
import type { ReactNode } from "react";

const ICONES = {
  sucesso: { Icone: CheckCircle2, cls: "bg-success-soft text-success" },
  senha: { Icone: KeyRound, cls: "bg-accent-soft text-primary" },
  bloqueio: { Icone: Lock, cls: "bg-destaque-soft text-destaque" },
} as const;

export function PopupAviso({
  aberto,
  tipo,
  titulo,
  texto,
  acao,
  onFechar,
}: {
  aberto: boolean;
  tipo: keyof typeof ICONES;
  titulo: string;
  texto?: string;
  acao: ReactNode;
  onFechar?: () => void;
}) {
  if (!aberto) return null;
  const { Icone, cls } = ICONES[tipo];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-aviso-titulo"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar?.();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-7 text-center shadow-xl">
        <span className={`mx-auto inline-flex size-14 items-center justify-center rounded-full ${cls}`}>
          <Icone className="size-7" strokeWidth={1.75} />
        </span>
        <h2 id="popup-aviso-titulo" className="mt-4 text-lg font-semibold text-foreground">
          {titulo}
        </h2>
        {texto ? <p className="mt-1.5 text-sm text-muted-foreground">{texto}</p> : null}
        <div className="mt-6 flex flex-col gap-2">{acao}</div>
        {onFechar ? (
          <button type="button" onClick={onFechar} className="mt-3 text-sm text-muted-foreground hover:text-foreground">
            Fechar
          </button>
        ) : null}
      </div>
    </div>
  );
}
