// Peças visuais do design system do Método.
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatusChip = "concluido" | "andamento" | "bloqueado" | "alerta" | "neutro";

const estilosChip: Record<StatusChip, string> = {
  concluido: "bg-success-soft text-success",
  andamento: "bg-accent-soft text-primary",
  bloqueado: "bg-locked text-muted-foreground",
  alerta: "bg-warning-soft text-warning",
  neutro: "bg-muted text-muted-foreground border border-border",
};

export function Chip({ status, children, className }: { status: StatusChip; children: ReactNode; className?: string | undefined }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        estilosChip[status],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Barra({ valor, noHero, className }: { valor: number; noHero?: boolean | undefined; className?: string | undefined }) {
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full", noHero ? "bg-primary-foreground/25" : "bg-track", className)}
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", noHero ? "bg-primary-foreground" : "bg-primary")}
        style={{ width: `${Math.max(0, Math.min(100, valor))}%` }}
      />
    </div>
  );
}

export function Anel({ valor, tamanho = 120, children }: { valor: number; tamanho?: number; children?: ReactNode }) {
  const r = (tamanho - 12) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, valor));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} className="-rotate-90">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" strokeWidth={10} className="stroke-track" />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          fill="none"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          className="stroke-primary transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function iniciais(nome?: string | null) {
  if (!nome) return "M";
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "")).toUpperCase();
}

export function Avatar({ nome, className }: { nome?: string | null | undefined; className?: string | undefined }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold tracking-wide text-primary-foreground",
        className,
      )}
    >
      {iniciais(nome)}
    </span>
  );
}

export function Confete() {
  const pecas = Array.from({ length: 40 });
  const cores = ["bg-primary", "bg-accent", "bg-accent-soft", "bg-success"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pecas.map((_, i) => (
        <span
          key={i}
          className={cn("confete absolute top-0 block h-2.5 w-1.5 rounded-sm", cores[i % cores.length])}
          style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 10) * 70}ms` }}
        />
      ))}
    </div>
  );
}
