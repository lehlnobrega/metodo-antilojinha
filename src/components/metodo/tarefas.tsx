// Lista de tarefas e mini-cards das etapas do plano de negócios.
import { Link } from "@tanstack/react-router";
import { Check, ClipboardList } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CardFormTarefa } from "@/components/metodo/form-tarefas";
import { Chip } from "@/components/metodo/visual";
import { useRespostas } from "@/lib/dados-loja";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { DadosTarefas, Modulo, PlanoNegocios, Tarefa } from "@/lib/dados";
import { useMarcarTarefa } from "@/lib/dados";
import { formatarData } from "@/lib/formato";
import { statusEtapa } from "@/lib/plano";
import { cn } from "@/lib/utils";

const DICA_AUTO = "Essa tarefa se completa sozinha quando você usa a ferramenta.";

function Bolinha({
  feita,
  noHero,
  desabilitada,
  onClick,
  rotulo,
}: {
  feita: boolean;
  noHero?: boolean | undefined;
  desabilitada?: boolean | undefined;
  onClick?: (() => void) | undefined;
  rotulo: string;
}) {
  const [pop, setPop] = useState(0);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={feita}
      aria-label={rotulo}
      disabled={desabilitada}
      onClick={() => {
        setPop((p) => p + 1);
        onClick?.();
      }}
      key={pop}
      className={cn(
        "mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        pop > 0 && "animar-pop",
        noHero
          ? feita
            ? "border-primary-foreground bg-primary-foreground text-primary"
            : "border-primary-foreground/80"
          : feita
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-surface",
        desabilitada && "cursor-not-allowed",
        desabilitada && !feita && "opacity-60",
      )}
    >
      {feita ? <Check className="size-3.5" strokeWidth={3} /> : null}
    </button>
  );
}

export function ListaTarefas({
  tarefas,
  dados,
  modulo,
  noHero,
  bloqueado,
  onModuloConcluido,
}: {
  tarefas: Tarefa[];
  dados: DadosTarefas;
  modulo: Modulo;
  noHero?: boolean | undefined;
  bloqueado?: boolean | undefined;
  onModuloConcluido?: (m: Modulo) => void | undefined;
}) {
  const marcar = useMarcarTarefa();
  const respostas = useRespostas();
  const [formAberto, setFormAberto] = useState<Tarefa | null>(null);
  return (
    <TooltipProvider delayDuration={150}>
      <CardFormTarefa tarefa={formAberto} dados={formAberto ? respostas.data?.get(formAberto.id)?.dados : undefined} onFechar={() => setFormAberto(null)} />
      <ul className="space-y-2">
        {tarefas.map((t) => {
          const feita = dados.feitas.has(t.id);
          const ehForm = t.tipo === "formulario";
          const auto = t.tipo === "auto" || ehForm;
          const data = dados.datas.get(t.id);
          const alternar = () => {
            const nova = !feita;
            marcar.mutate(
              { id: t.id, feita: nova },
              {
                onSuccess: () => {
                  if (nova && modulo.tarefas_feitas + 1 >= modulo.total_tarefas) onModuloConcluido?.(modulo);
                },
                onError: () => toast.error("Não consegui salvar. Tente de novo."),
              },
            );
          };
          const bolinha = (
            <Bolinha
              feita={feita}
              noHero={noHero}
              desabilitada={auto || bloqueado}
              onClick={auto || bloqueado ? undefined : alternar}
              rotulo={t.titulo}
            />
          );
          return (
            <li
              key={t.id}
              className={cn(
                "flex items-start gap-3 rounded-xl px-3 py-3",
                noHero ? "bg-primary-foreground/10" : "item-metodo",
              )}
            >
              {ehForm ? (
                <span className={cn("mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full", feita ? (noHero ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground") : noHero ? "bg-primary-foreground/20" : "bg-accent-soft text-primary")} aria-label={feita ? "Concluída" : "Formulário"}>
                  {feita ? <Check className="size-3.5" strokeWidth={3} /> : <ClipboardList className="size-3.5" />}
                </span>
              ) : auto && !bloqueado ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{bolinha}</span>
                  </TooltipTrigger>
                  <TooltipContent>{DICA_AUTO}</TooltipContent>
                </Tooltip>
              ) : (
                bolinha
              )}
              <div className={cn("min-w-0 flex-1", feita && "opacity-60")}>
                <p className="text-sm font-medium">{t.titulo}</p>
                {t.descricao ? (
                  <p className={cn("mt-0.5 text-[13px]", noHero ? "text-primary-foreground/75" : "text-muted-foreground")}>
                    {t.descricao}
                  </p>
                ) : null}
                {feita && data ? (
                  <p className={cn("mt-1 text-xs", noHero ? "text-primary-foreground/75" : "text-muted-foreground")}>
                    Concluída em {formatarData(data)}
                  </p>
                ) : ehForm ? null : auto && !feita ? (
                  <p className={cn("mt-1 text-xs", noHero ? "text-primary-foreground/75" : "text-muted-foreground")}>
                    Marca sozinha quando você usar a ferramenta
                  </p>
                ) : null}
              </div>
              {ehForm && !bloqueado ? (
                <button
                  type="button"
                  onClick={() => setFormAberto(t)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    noHero
                      ? "bg-primary-foreground text-primary hover:bg-accent-soft"
                      : feita
                        ? "border border-border bg-surface hover:bg-muted"
                        : "bg-primary text-primary-foreground hover:bg-primary-hover",
                  )}
                >
                  {feita ? "Ver e editar" : "Preencher"}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </TooltipProvider>
  );
}

const rotuloStatus = { nao: "Não começou", andamento: "Em andamento", concluida: "Concluída" } as const;
const botaoStatus = { nao: "Começar", andamento: "Continuar", concluida: "Revisar" } as const;

export function EtapasPlano({
  tarefas,
  dados,
  plano,
  bloqueado,
  colunas = 3,
}: {
  tarefas: Tarefa[];
  dados: DadosTarefas;
  plano: PlanoNegocios | null | undefined;
  bloqueado?: boolean | undefined;
  colunas?: 1 | 3 | undefined;
}) {
  return (
    <div className={cn("grid gap-3", colunas === 3 ? "md:grid-cols-2 xl:grid-cols-3" : "")}>
      {tarefas.map((t, i) => {
        const status = statusEtapa(t, dados, plano);
        const ehPdf = t.chave_auto === "plano_pdf";
        const titulo = t.titulo.replace(/^Etapa \d+:\s*/, "");
        return (
          <div key={t.id} className="flex flex-col rounded-2xl border border-border bg-surface p-4 text-foreground">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground">{ehPdf ? "PDF" : `Etapa ${i + 1}`}</span>
              <Chip status={status === "concluida" ? "concluido" : status === "andamento" ? "andamento" : "bloqueado"}>
                {rotuloStatus[status]}
              </Chip>
            </div>
            <p className="mt-2 text-[15px] font-semibold leading-snug">{titulo}</p>
            {t.descricao ? <p className="mt-1 flex-1 text-[13px] text-muted-foreground">{t.descricao}</p> : <div className="flex-1" />}
            {bloqueado ? null : (
              <Link
                to="/plano-de-negocios"
                search={{ etapa: ehPdf ? 9 : i + 1 }}
                className={cn(
                  "transicao-suave mt-4 inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold",
                  status === "concluida"
                    ? "border border-border bg-surface text-foreground hover:bg-muted"
                    : "bg-primary text-primary-foreground hover:bg-primary-hover",
                )}
              >
                {ehPdf ? (status === "concluida" ? "Baixar de novo" : "Exportar PDF") : botaoStatus[status]}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
