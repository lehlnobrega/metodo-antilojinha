import type { ReactNode } from "react";

/** O título da página fica na topbar; aqui entram o subtítulo e a ação. */
export function PaginaTopo({
  titulo,
  subtitulo,
  acao,
}: {
  titulo: string;
  subtitulo?: string;
  acao?: ReactNode;
}) {
  if (!subtitulo && !acao) return <span className="sr-only">{titulo}</span>;
  return (
    <div className="-mt-3 mb-8 flex flex-wrap items-end justify-between gap-4">
      <span className="sr-only">{titulo}</span>
      {subtitulo ? <p className="max-w-2xl text-[15px] text-muted-foreground">{subtitulo}</p> : <span />}
      {acao}
    </div>
  );
}

export function EstadoVazio({ titulo, texto, acao }: { titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <div className="card-metodo flex flex-col items-center justify-center px-6 py-14 text-center">
      <svg width="72" height="56" viewBox="0 0 72 56" fill="none" className="mb-5 text-primary" aria-hidden="true">
        <rect x="8" y="10" width="56" height="38" rx="8" stroke="currentColor" strokeWidth="2" />
        <path d="M8 20h56" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="15" r="1.5" fill="currentColor" />
        <circle cx="22" cy="15" r="1.5" fill="currentColor" />
        <path d="M24 34l6 6 14-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h3 className="titulo-card text-foreground">{titulo}</h3>
      {texto ? <p className="mt-2 max-w-md text-[13px] text-muted-foreground">{texto}</p> : null}
      {acao ? <div className="mt-5">{acao}</div> : null}
    </div>
  );
}
