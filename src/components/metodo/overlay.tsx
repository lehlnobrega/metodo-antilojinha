// Card flutuante padrão (overlay ameixa + desfoque) e campos estilizados do Método.
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function CardOverlay({
  aberto,
  onFechar,
  titulo,
  subtitulo,
  sujo,
  topo,
  rodape,
  children,
  largo,
  cabecalho,
}: {
  largo?: boolean | undefined;
  /** Substitui o título visível (o título continua para leitores de tela). */
  cabecalho?: ReactNode;
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  subtitulo?: string | undefined;
  sujo?: boolean | undefined;
  topo?: ReactNode;
  rodape?: ReactNode;
  children: ReactNode;
}) {
  const tentarFechar = () => {
    if (sujo && !window.confirm("Descartar o que você preencheu?")) return;
    onFechar();
  };
  return (
    <DialogPrimitive.Root open={aberto} onOpenChange={(v) => (!v ? tentarFechar() : undefined)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgba(42,22,33,0.45)] backdrop-blur-[4px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            largo ? "sm:max-h-[90dvh]" : "",
            "fixed z-50 flex max-h-[92dvh] w-full flex-col bg-surface text-foreground outline-none",
            "inset-x-0 bottom-0 rounded-t-[24px] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[24px] sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95",
            largo ? "sm:max-w-[760px]" : "sm:max-w-[560px]",
          )}
        >
          {topo}
          <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
            {cabecalho ? (
              <div className="min-w-0 flex-1">
                <DialogPrimitive.Title className="sr-only">{titulo}</DialogPrimitive.Title>
                {cabecalho}
              </div>
            ) : (
              <div>
                <DialogPrimitive.Title className="text-[20px] font-semibold leading-tight">{titulo}</DialogPrimitive.Title>
                {subtitulo ? <p className="mt-1 text-[13px] text-muted-foreground">{subtitulo}</p> : null}
              </div>
            )}
            <button type="button" onClick={tentarFechar} aria-label="Fechar" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-primary">
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8">{children}</div>
          {rodape ? <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4 sm:px-8">{rodape}</div> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const inputCls =
  "h-12 w-full rounded-xl border border-border bg-muted px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:bg-surface";
export const textareaCls =
  "min-h-[88px] w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:bg-surface";

export function Rotulo({ texto, obrigatorio, children, className }: { texto: string; obrigatorio?: boolean; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-[13px] font-medium">
        {texto}
        {obrigatorio ? <span className="text-primary"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

export function BotaoPrimario({ children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p} className={cn("h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50", className)}>
      {children}
    </button>
  );
}
export function BotaoSecundario({ children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...p} className={cn("h-11 rounded-xl border border-border bg-surface px-5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50", className)}>
      {children}
    </button>
  );
}

export function Pilulas<T extends string | number>({
  opcoes,
  valor,
  onChange,
  className,
}: {
  opcoes: { valor: T; rotulo: ReactNode }[];
  valor: T | null | undefined;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="radiogroup">
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <button
            key={String(o.valor)}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(o.valor)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
              ativo ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary hover:text-primary",
            )}
          >
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}

export function CardsOpcao<T extends string>({
  opcoes,
  valor,
  onChange,
  colunas = 2,
}: {
  opcoes: { valor: T; titulo: string; texto: string; emoji?: string }[];
  valor: T | null | undefined;
  onChange: (v: T) => void;
  colunas?: 1 | 2;
}) {
  return (
    <div className={cn("grid gap-2", colunas === 2 && "sm:grid-cols-2")} role="radiogroup">
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(o.valor)}
            className={cn(
              "relative flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors",
              ativo ? "border-primary bg-accent-soft" : "border-border bg-surface hover:border-primary",
            )}
          >
            {o.emoji ? <span className="text-xl leading-none">{o.emoji}</span> : null}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{o.titulo}</span>
              <span className="block text-xs text-muted-foreground">{o.texto}</span>
            </span>
            {ativo ? <Check className="size-4 text-primary" strokeWidth={3} /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function SelectMetodo({
  valor,
  onChange,
  opcoes,
  placeholder = "Escolha",
}: {
  valor: string;
  onChange: (v: string) => void;
  opcoes: { valor: string; rotulo: string }[];
  placeholder?: string;
}) {
  return (
    <Select {...(valor ? { value: valor } : {})} onValueChange={onChange}>
      <SelectTrigger className="h-12 rounded-xl border-border bg-muted px-4 text-sm focus:ring-0 data-[state=open]:border-primary">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="z-[60] rounded-xl">
        {opcoes.map((o) => (
          <SelectItem key={o.valor} value={o.valor} className="rounded-lg py-2">
            {o.rotulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function isoParaData(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a ?? 2026, (m ?? 1) - 1, d ?? 1);
}
function dataParaIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function SeletorData({ valor, onChange, max, placeholder = "Escolha a data" }: { valor: string; onChange: (v: string) => void; max?: string; placeholder?: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(inputCls, "flex items-center gap-2 text-left")}>
          <CalendarDays className="size-4 text-primary" />
          <span className={valor ? "" : "text-muted-foreground"}>{valor ? valor.split("-").reverse().join("/") : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-[60] w-auto rounded-2xl p-0" align="start">
        <Calendar
          mode="single"
          locale={ptBR}
          {...(valor ? { selected: isoParaData(valor), defaultMonth: isoParaData(valor) } : {})}
          {...(max ? { disabled: { after: isoParaData(max) } } : {})}
          onSelect={(d) => {
            if (d) onChange(dataParaIso(d));
            setAberto(false);
          }}
          className="rounded-2xl bg-surface"
        />
      </PopoverContent>
    </Popover>
  );
}

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_LONGOS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const nomeMesLongo = (aaaamm: string) => `${MESES_LONGOS[Number(aaaamm.slice(5, 7)) - 1]} de ${aaaamm.slice(0, 4)}`;

/** Valor AAAA-MM. */
export function SeletorMes({ valor, onChange, max }: { valor: string; onChange: (v: string) => void; max?: string }) {
  const [aberto, setAberto] = useState(false);
  const [ano, setAno] = useState(Number(valor.slice(0, 4)));
  return (
    <Popover open={aberto} onOpenChange={(v) => { setAberto(v); if (v) setAno(Number(valor.slice(0, 4))); }}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(inputCls, "flex items-center gap-2 text-left capitalize")}>
          <CalendarDays className="size-4 text-primary" />
          {nomeMesLongo(valor)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-[60] w-72 rounded-2xl p-4" align="start">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => setAno((a) => a - 1)} aria-label="Ano anterior" className="rounded-lg p-1.5 hover:bg-muted"><ChevronLeft className="size-4" /></button>
          <span className="text-sm font-semibold">{ano}</span>
          <button type="button" onClick={() => setAno((a) => a + 1)} disabled={max ? ano >= Number(max.slice(0, 4)) : false} aria-label="Próximo ano" className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-30"><ChevronRight className="size-4" /></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MESES_CURTOS.map((m, i) => {
            const v = `${ano}-${String(i + 1).padStart(2, "0")}`;
            const bloq = max ? v > max : false;
            return (
              <button
                key={m}
                type="button"
                disabled={bloq}
                onClick={() => { onChange(v); setAberto(false); }}
                className={cn("h-10 rounded-xl text-sm capitalize transition-colors disabled:opacity-30", v === valor ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-accent-soft")}
              >
                {m}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const HORAS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTOS = ["00", "15", "30", "45"];

/** Valor HH:MM. */
export function SeletorHora({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const [h, m] = valor ? valor.split(":") : ["", ""];
  return (
    <div className="grid grid-cols-2 gap-2">
      <SelectMetodo valor={h ?? ""} onChange={(v) => onChange(`${v}:${m || "00"}`)} placeholder="Hora" opcoes={HORAS.map((x) => ({ valor: x, rotulo: `${x}h` }))} />
      <SelectMetodo valor={m ?? ""} onChange={(v) => onChange(`${h || "19"}:${v}`)} placeholder="Minutos" opcoes={MINUTOS.map((x) => ({ valor: x, rotulo: `${x} min` }))} />
    </div>
  );
}

export function Interruptor({ ligado, onChange, rotulo }: { ligado: boolean; onChange: (v: boolean) => void; rotulo: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      onClick={() => onChange(!ligado)}
      className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors", ligado ? "bg-primary" : "bg-border")}
    >
      <span className={cn("inline-block size-5 rounded-full bg-surface shadow transition-transform", ligado ? "translate-x-[22px]" : "translate-x-0.5")} />
    </button>
  );
}
