// Calendário de conteúdos (mês no desktop, agenda da semana no celular), com arrastar e soltar.
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight, FileText, Images, Plus, Video } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { toast } from "sonner";

import { ChipFormato, ChipStatus, ChipTipo, IconesPlataforma } from "@/components/metodo/chips";
import { nomeMesLongo } from "@/components/metodo/overlay";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { type Post, useMoverConteudo } from "@/lib/dados-loja";
import { ddmm, hojeSaoPaulo, segundaDe, somarDias } from "@/lib/formato";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DIAS_LONGOS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const VISIVEIS = 3;
const FIM_DE_SEMANA = "var(--color-muted)";

function mesSeguinte(m: string, n: number) {
  const [a, mm] = m.split("-").map(Number);
  const d = new Date(Date.UTC(a!, mm! - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

function CardCal({ p, onAbrir, fantasma }: { p: Post; onAbrir?: (p: Post) => void; fantasma?: boolean }) {
  return (
    <div
      className={cn(
        "w-full rounded-[10px] border border-border bg-surface p-2 text-left",
        fantasma && "rotate-2 shadow-xl",
      )}
      onClick={() => onAbrir?.(p)}
    >
      <p className="flex items-center gap-1 text-xs font-medium">
        {p.formato === "carrossel" ? <Images className="size-3 shrink-0 text-muted-foreground" /> : <Video className="size-3 shrink-0 text-muted-foreground" />}
        <span className="truncate">{p.titulo || "Sem título"}</span>
        {p.roteiro ? <FileText className="ml-auto size-3 shrink-0 text-primary" aria-label="Tem roteiro" /> : null}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <IconesPlataforma valor={p.plataforma} />
        <ChipFormato valor={p.formato} pequeno />
        <ChipTipo valor={p.tipo_cqc} pequeno />
        <ChipStatus valor={p.status} pequeno />
      </div>
    </div>
  );
}

function Arrastavel({ p, onAbrir }: { p: Post; onAbrir: (p: Post) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `p-${p.id}`, data: { post: p } });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} role="button" tabIndex={0} className={cn("cursor-grab touch-manipulation", isDragging && "opacity-30")}>
      <CardCal p={p} onAbrir={onAbrir} />
    </div>
  );
}

function Dia({ dia, className, style, children }: { dia: string; className?: string; style?: React.CSSProperties | undefined; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: dia });
  return (
    <div
      ref={setNodeRef}
      style={isOver ? undefined : style}
      className={cn("group relative border border-transparent transition-colors", className, isOver && "border-dashed border-primary bg-accent-soft")}
    >
      {children}
    </div>
  );
}

export function Calendario({
  posts,
  onAbrir,
  onNovo,
  filtros,
}: {
  posts: Post[];
  onAbrir: (p: Post) => void;
  onNovo: (dia: string) => void;
  filtros?: ReactNode;
}) {
  const hoje = hojeSaoPaulo();
  const mobile = useIsMobile();
  const [mes, setMes] = useState(hoje.slice(0, 7));
  const [semana, setSemana] = useState(segundaDe(hoje));
  const [arrastando, setArrastando] = useState<Post | null>(null);
  const [mais, setMais] = useState<string | null>(null);
  const mover = useMoverConteudo();
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );

  const porDia = useMemo(() => {
    const m = new Map<string, Post[]>();
    for (const p of posts) {
      const d = p.data_post.slice(0, 10);
      m.set(d, [...(m.get(d) ?? []), p]);
    }
    return m;
  }, [posts]);

  const dias = useMemo(() => {
    const ini = segundaDe(`${mes}-01`);
    const ultimo = somarDias(`${mesSeguinte(mes, 1)}-01`, -1);
    const fim = somarDias(segundaDe(ultimo), 6);
    const l: string[] = [];
    for (let d = ini; d <= fim; d = somarDias(d, 1)) l.push(d);
    return l;
  }, [mes]);

  const inicio = (e: DragStartEvent) => {
    setMais(null);
    setArrastando((e.active.data.current as { post: Post }).post);
  };
  const fim = (e: DragEndEvent) => {
    setArrastando(null);
    const p = (e.active.data.current as { post: Post } | undefined)?.post;
    const destino = e.over?.id as string | undefined;
    if (!p || !destino) return;
    const origem = p.data_post.slice(0, 10);
    if (destino === origem) return;
    mover.mutate({ id: p.id, data_post: destino }, { onError: (err) => toast.error(err.message) });
    toast(`Movido para ${ddmm(destino)}`, {
      duration: 5000,
      action: { label: "Desfazer", onClick: () => mover.mutate({ id: p.id, data_post: origem }) },
    });
  };

  const cabecalho = mobile ? (
    <div className="flex items-center gap-2">
      <button onClick={() => setSemana(somarDias(semana, -7))} aria-label="Semana anterior" className="rounded-lg border border-border bg-surface p-2 hover:border-primary"><ChevronLeft className="size-4" /></button>
      <span className="min-w-[130px] text-center text-sm font-semibold">{ddmm(semana)} a {ddmm(somarDias(semana, 6))}</span>
      <button onClick={() => setSemana(somarDias(semana, 7))} aria-label="Próxima semana" className="rounded-lg border border-border bg-surface p-2 hover:border-primary"><ChevronRight className="size-4" /></button>
      <button onClick={() => setSemana(segundaDe(hoje))} className="h-9 rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:border-primary">Hoje</button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <h2 className="min-w-[170px] text-lg font-semibold first-letter:uppercase">{nomeMesLongo(mes)}</h2>
      <button onClick={() => setMes(mesSeguinte(mes, -1))} aria-label="Mês anterior" className="rounded-lg border border-border bg-surface p-2 hover:border-primary"><ChevronLeft className="size-4" /></button>
      <button onClick={() => setMes(mesSeguinte(mes, 1))} aria-label="Próximo mês" className="rounded-lg border border-border bg-surface p-2 hover:border-primary"><ChevronRight className="size-4" /></button>
      <button onClick={() => setMes(hoje.slice(0, 7))} className="h-9 rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:border-primary">Hoje</button>
    </div>
  );

  return (
    <DndContext sensors={sensores} onDragStart={inicio} onDragEnd={fim} onDragCancel={() => setArrastando(null)}>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        {cabecalho}
        {filtros ? <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">{filtros}</div> : null}
      </div>

      {mobile ? (
        <div className="space-y-2">
          {Array.from({ length: 7 }, (_, i) => somarDias(semana, i)).map((d, i) => {
            const lista = porDia.get(d) ?? [];
            return (
              <Dia key={d} dia={d} className="card-metodo rounded-2xl p-3" style={i >= 5 ? { background: FIM_DE_SEMANA } : undefined}>
                <div className="mb-2 flex items-center justify-between">
                  <span className={cn("flex items-center gap-2 text-sm font-semibold", d === hoje && "text-primary")}>
                    {DIAS_LONGOS[i]}
                    <span className={cn("inline-flex size-7 items-center justify-center rounded-full text-xs", d === hoje ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{d.slice(8, 10)}</span>
                  </span>
                  <button onClick={() => onNovo(d)} aria-label={`Criar conteúdo em ${ddmm(d)}`} className="rounded-lg p-1.5 text-muted-foreground hover:text-primary"><Plus className="size-4" /></button>
                </div>
                <div className="space-y-2">
                  {lista.map((p) => <Arrastavel key={p.id} p={p} onAbrir={onAbrir} />)}
                  {lista.length === 0 ? <p className="text-xs text-muted-foreground">Nada planejado.</p> : null}
                </div>
              </Dia>
            );
          })}
        </div>
      ) : (
        <div className="card-metodo overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border text-xs font-medium text-muted-foreground">
            {DIAS_SEMANA.map((d) => <div key={d} className="px-2 py-2 text-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {dias.map((d, i) => {
              const lista = porDia.get(d) ?? [];
              const foraDoMes = d.slice(0, 7) !== mes;
              const fimSemana = i % 7 >= 5;
              return (
                <Dia
                  key={d}
                  dia={d}
                  className={cn("min-h-[132px] border-b border-r border-b-border border-r-border p-1.5", i % 7 === 6 && "border-r-transparent")}
                  style={fimSemana ? { background: FIM_DE_SEMANA } : undefined}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-full text-xs",
                        d === hoje ? "bg-primary font-semibold text-primary-foreground" : foraDoMes ? "text-muted-foreground/50" : "text-foreground",
                      )}
                    >
                      {Number(d.slice(8, 10))}
                    </span>
                    {lista.length === 0 ? (
                      <button
                        onClick={() => onNovo(d)}
                        aria-label={`Criar conteúdo em ${ddmm(d)}`}
                        className="rounded-md p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-primary focus:opacity-100 group-hover:opacity-100"
                      >
                        <Plus className="size-4" />
                      </button>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    {lista.slice(0, VISIVEIS).map((p) => <Arrastavel key={p.id} p={p} onAbrir={onAbrir} />)}
                    {lista.length > VISIVEIS ? (
                      <Popover open={mais === d} onOpenChange={(v) => setMais(v ? d : null)}>
                        <PopoverTrigger asChild>
                          <button className="w-full rounded-md px-1 py-0.5 text-left text-xs font-medium text-primary hover:bg-accent-soft">+{lista.length - VISIVEIS} mais</button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 space-y-1.5 rounded-2xl p-3" align="start">
                          <p className="mb-1 text-xs font-semibold text-muted-foreground">{ddmm(d)}</p>
                          {lista.map((p) => <Arrastavel key={p.id} p={p} onAbrir={(x) => { setMais(null); onAbrir(x); }} />)}
                        </PopoverContent>
                      </Popover>
                    ) : null}
                  </div>
                </Dia>
              );
            })}
          </div>
        </div>
      )}

      <DragOverlay dropAnimation={null}>{arrastando ? <div className="w-44"><CardCal p={arrastando} fantasma /></div> : null}</DragOverlay>
    </DndContext>
  );
}
