import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Check, Lock } from "lucide-react";
import { useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { EstadoVazio } from "@/components/PaginaTopo";
import { EtapasPlano, ListaTarefas } from "@/components/metodo/tarefas";
import { Barra, Chip, Confete } from "@/components/metodo/visual";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { GRUPO_VIP_URL } from "@/config";
import { type Modulo, useModulos, usePlanoNegocios, useTarefas } from "@/lib/dados";
import { formatarData } from "@/lib/formato";
import {
  SLUG_PLANO,
  moduloAtual,
  moduloConcluido,
  pendenciaAnterior,
  porcentagemGeral,
  proximoBloqueado,
  tarefasDoModulo,
} from "@/lib/plano";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plano-pratico/")({
  head: () => ({
    meta: [
      { title: "Plano prático | Método" },
      { name: "description", content: "As tarefas de cada módulo do Método, na ordem certa." },
      { property: "og:title", content: "Plano prático | Método" },
      { property: "og:description", content: "As tarefas de cada módulo do Método, na ordem certa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanoPratico,
});

function pct(m: Modulo) {
  return m.total_tarefas ? Math.round((m.tarefas_feitas / m.total_tarefas) * 100) : 0;
}

function PlanoPratico() {
  const modulos = useModulos();
  const tarefas = useTarefas();
  const plano = usePlanoNegocios();
  const [aberto, setAberto] = useState<number | null>(null);
  const [concluido, setConcluido] = useState<Modulo | null>(null);

  const lista = modulos.data ?? [];
  const geral = porcentagemGeral(lista);
  const atual = moduloAtual(lista);
  const pendencia = pendenciaAnterior(lista);
  const proximo = proximoBloqueado(lista);
  const moduloAberto = lista.find((m) => m.id === aberto) ?? null;

  const acaoTopo = (
    <span className="text-sm text-muted-foreground">
      <span className="numero-destaque">{geral.pct}%</span> do método concluído
    </span>
  );

  return (
    <AppLayout acaoTopo={acaoTopo}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-muted-foreground">Assistiu? Aplica. Aplicou? Adapta. Travou? Fala no grupo.</p>
        <span className="text-[13px] text-muted-foreground sm:hidden">{geral.pct}% do método concluído</span>
      </div>

      {modulos.isLoading || tarefas.isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-72 w-full rounded-[24px]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-[20px]" />
            ))}
          </div>
        </div>
      ) : modulos.error || tarefas.error ? (
        <EstadoVazio titulo="Não consegui carregar seus módulos" texto="Atualize a página em instantes." />
      ) : lista.length === 0 ? (
        <EstadoVazio titulo="Nenhum módulo por aqui ainda" />
      ) : (
        <>
          {pendencia ? (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-warning-soft px-5 py-4 text-warning">
              <AlertTriangle className="size-5 shrink-0" strokeWidth={1.75} />
              <p className="flex-1 text-sm font-medium">
                Você tem {pendencia.faltam} {pendencia.faltam === 1 ? "tarefa pendente" : "tarefas pendentes"} em{" "}
                {pendencia.modulo.titulo}. Loja que pula etapa trava lá na frente.
              </p>
              <button
                type="button"
                onClick={() => setAberto(pendencia.modulo.id)}
                className="h-9 rounded-xl bg-surface px-4 text-sm font-semibold text-warning"
              >
                Resolver agora
              </button>
            </div>
          ) : null}

          {/* HERO: você está aqui */}
          {atual ? (
            <section className="card-metodo overflow-hidden">
              <div className="hero-metodo rounded-none">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-10 right-4 -z-10 select-none text-[200px] font-semibold leading-none tracking-[-0.08em] text-primary-foreground/12"
                >
                  {String(atual.ordem).padStart(2, "0")}
                </span>
                <p className="text-[13px] font-medium text-primary-foreground/80">Você está aqui: módulo {atual.ordem}</p>
                <h2 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.03em]">{atual.titulo}</h2>
                <div className="mt-6 flex max-w-lg items-center gap-4">
                  <Barra valor={pct(atual)} noHero className="h-1.5" />
                  <span className="whitespace-nowrap text-[13px] font-medium tabular-nums">
                    {atual.tarefas_feitas} de {atual.total_tarefas} tarefas
                  </span>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                {atual.slug === SLUG_PLANO ? (
                  <div className="p-2 sm:p-3">
                    <EtapasPlano
                      tarefas={tarefasDoModulo(tarefas.data, atual.id)}
                      dados={tarefas.data!}
                      plano={plano.data}
                    />
                  </div>
                ) : (
                  <ListaTarefas
                    tarefas={tarefasDoModulo(tarefas.data, atual.id)}
                    dados={tarefas.data!}
                    modulo={atual}
                    onModuloConcluido={setConcluido}
                  />
                )}
              </div>
            </section>
          ) : (
            <section className="hero-metodo">
              <h2 className="text-[26px] font-semibold leading-tight">Você concluiu tudo que está liberado 🎉</h2>
              <p className="mt-2 text-sm text-primary-foreground/80">
                {proximo
                  ? proximo.libera_em
                    ? `O módulo ${proximo.ordem}, ${proximo.titulo}, libera em ${formatarData(proximo.libera_em)}.`
                    : `O módulo ${proximo.ordem}, ${proximo.titulo}, libera em breve.`
                  : "Você terminou o método inteiro. Que orgulho!"}
              </p>
            </section>
          )}

          {/* Todos os módulos */}
          <h2 className="titulo-card mb-4 mt-10">Todos os módulos</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lista.map((m) => {
              const feito = moduloConcluido(m);
              const ehAtual = atual?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAberto(m.id)}
                  className={cn(
                    "card-metodo transicao-suave relative flex flex-col p-5 text-left hover:border-primary/40",
                    ehAtual && "border-2 border-primary",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[40px] font-bold leading-none text-numero-leve tabular-nums">
                      {String(m.ordem).padStart(2, "0")}
                    </span>
                    {feito ? (
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-4" strokeWidth={3} />
                      </span>
                    ) : !m.liberado ? (
                      <Lock className="size-5 text-muted-foreground" strokeWidth={1.75} />
                    ) : null}
                  </div>
                  <p className={cn("mt-3 text-[15px] font-semibold", !m.liberado && "text-muted-foreground")}>{m.titulo}</p>
                  <div className="mt-2">
                    {feito ? (
                      <Chip status="concluido">Concluído</Chip>
                    ) : ehAtual ? (
                      <Chip status="andamento">Você está aqui</Chip>
                    ) : !m.liberado ? (
                      <Chip status="bloqueado">
                        {m.libera_em ? `Libera em ${formatarData(m.libera_em).slice(0, 5)}` : "Em breve"}
                      </Chip>
                    ) : (
                      <Chip status="neutro">Pendente</Chip>
                    )}
                  </div>
                  <div className="mt-5 flex items-center gap-3">
                    <Barra valor={pct(m)} className="h-1.5" />
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {m.tarefas_feitas} de {m.total_tarefas} tarefas
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Painel lateral do módulo */}
      <Sheet open={moduloAberto !== null} onOpenChange={(v) => !v && setAberto(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto bg-background p-0 sm:max-w-[480px]">
          {moduloAberto && tarefas.data ? (
            <>
              <SheetHeader className="border-b border-border bg-surface p-6 text-left">
                <p className="text-xs font-medium text-muted-foreground">Módulo {moduloAberto.ordem}</p>
                <SheetTitle className="text-xl">{moduloAberto.titulo}</SheetTitle>
                <SheetDescription className="text-[13px]">
                  {moduloAberto.liberado
                    ? `${moduloAberto.tarefas_feitas} de ${moduloAberto.total_tarefas} tarefas`
                    : moduloAberto.libera_em
                      ? `Esse módulo libera em ${formatarData(moduloAberto.libera_em).slice(0, 5)}`
                      : "Esse módulo libera em breve"}
                </SheetDescription>
                <Barra valor={pct(moduloAberto)} className="mt-3" />
              </SheetHeader>
              <div className="p-5">
                {moduloAberto.slug === SLUG_PLANO ? (
                  <EtapasPlano
                    tarefas={tarefasDoModulo(tarefas.data, moduloAberto.id)}
                    dados={tarefas.data}
                    plano={plano.data}
                    bloqueado={!moduloAberto.liberado}
                    colunas={1}
                  />
                ) : (
                  <div className="card-metodo p-2">
                    <ListaTarefas
                      tarefas={tarefasDoModulo(tarefas.data, moduloAberto.id)}
                      dados={tarefas.data}
                      modulo={moduloAberto}
                      bloqueado={!moduloAberto.liberado}
                      onModuloConcluido={(m) => {
                        setAberto(null);
                        setConcluido(m);
                      }}
                    />
                  </div>
                )}
                <Link
                  to="/materiais/$slug"
                  params={{ slug: moduloAberto.slug }}
                  className="transicao-suave mt-5 flex h-11 items-center justify-center rounded-xl border border-border bg-surface text-sm font-semibold hover:bg-muted"
                >
                  Ver materiais do módulo
                </Link>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Módulo concluído */}
      <Dialog open={concluido !== null} onOpenChange={(v) => !v && setConcluido(null)}>
        <DialogContent className="overflow-hidden rounded-[24px] text-center sm:max-w-md">
          <Confete />
          <p className="text-5xl">💖</p>
          <DialogTitle className="text-2xl">Módulo concluído!</DialogTitle>
          <DialogDescription className="text-sm">
            Posta no grupo que você concluiu {concluido?.titulo}, eu quero ver!
          </DialogDescription>
          <a
            href={GRUPO_VIP_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Postar no Grupo VIP
          </a>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
