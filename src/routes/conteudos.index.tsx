import { createFileRoute, Link } from "@tanstack/react-router";
import { Lightbulb, Lock, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Calendario } from "@/components/conteudos/calendario";
import { Publicados } from "@/components/conteudos/publicados";
import { CardConteudo } from "@/components/metodo/card-conteudo";
import { CardResultados } from "@/components/metodo/cards-registro";
import { ChipStatus } from "@/components/metodo/chips";
import { DropdownFiltro } from "@/components/metodo/dropdown";
import { PaginaTopo } from "@/components/PaginaTopo";
import { TIPOS_ACERVO } from "@/lib/acervo";
import { STATUS } from "@/lib/calendario";
import { type CamposConteudo, type Post, resultadoPendente, usePosts } from "@/lib/dados-loja";
import { cn } from "@/lib/utils";
import { textoLiberacao, useLiberacaoIdeias } from "@/lib/liberacao";
import { AppLayout } from "@/components/layout/AppLayout";

type Busca = { aba?: string; tipo?: string; status?: string };

export const Route = createFileRoute("/conteudos/")({
  validateSearch: (s: Record<string, unknown>): Busca => {
    const r: Busca = {};
    for (const k of ["aba", "tipo", "status"] as const) if (typeof s[k] === "string" && s[k]) r[k] = s[k] as string;
    return r;
  },
  head: () => ({
    meta: [
      { title: "Meus conteúdos | Método" },
      { name: "description", content: "Seu calendário de conteúdos, do roteiro à publicação, e o que mais performa na sua loja." },
      { property: "og:title", content: "Meus conteúdos | Método" },
      { property: "og:description", content: "Seu calendário de conteúdos, do roteiro à publicação, e o que mais performa na sua loja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Conteudos,
});

function Conteudos() {
  const busca = Route.useSearch();
  const navigate = Route.useNavigate();
  const posts = usePosts();
  const lista = posts.data ?? [];
  const aba = busca.aba === "publicados" ? "publicados" : "calendario";
  const tipo = busca.tipo ? [busca.tipo] : [];
  const status = busca.status ? busca.status.split(",").filter(Boolean) : [];

  const [card, setCard] = useState<{ conteudo?: Post; inicial?: CamposConteudo } | null>(null);
  const [resultado, setResultado] = useState<Post | null>(null);
  const pendentes = lista.filter(resultadoPendente).sort((a, b) => a.data_post.localeCompare(b.data_post));
  // Mantém o card em sincronia com a versão mais nova do post.
  const conteudoAberto = card?.conteudo ? lista.find((p) => p.id === card.conteudo!.id) ?? card.conteudo : null;

  const mudar = (p: { [K in keyof Busca]?: string | undefined }) =>
    navigate({ search: (prev) => { const n: { [K in keyof Busca]?: string | undefined } = { ...prev, ...p }; (Object.keys(n) as (keyof Busca)[]).forEach((k) => { if (!n[k]) delete n[k]; }); return n as Busca; }, replace: true });

  const doCalendario = useMemo(
    () => lista.filter((p) => (!tipo[0] || p.tipo_cqc === tipo[0]) && (status.length === 0 || status.includes(p.status))),
    [lista, tipo, status],
  );

  const liberacao = useLiberacaoIdeias();

  return (
    <AppLayout>
      <CardConteudo aberto={card !== null} conteudo={conteudoAberto} inicial={card?.inicial} onFechar={() => setCard(null)} />
      <CardResultados post={resultado} onFechar={() => setResultado(null)} proximo={resultado ? pendentes.find((p) => p.id !== resultado.id) : undefined} onProximo={setResultado} />
      <PaginaTopo titulo="Meus conteúdos" subtitulo="Do roteiro à publicação, tudo num calendário só." />

      {liberacao.liberado || liberacao.carregando ? (
        <Link to="/conteudos/ideias" className="mb-6 flex flex-col gap-4 rounded-2xl bg-accent-soft p-6 transition-colors hover:bg-[#fbe0ec] sm:flex-row sm:items-center">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-primary"><Lightbulb className="size-6" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[22px] font-semibold text-foreground">Sem ideias de conteúdo?</span>
            <span className="mt-1 block text-sm text-muted-foreground">Ideias por nicho e os formatos que estão viralizando, com referência.</span>
          </span>
          <span className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Ver ideias</span>
        </Link>
      ) : (
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Lock className="size-6" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[22px] font-semibold text-foreground">Banco de ideias de conteúdo</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              As ideias e os formatos virais liberam na sua segunda semana de Método. Até lá, foca nas tarefas do plano prático.
            </span>
          </span>
          <span className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-muted px-5 text-sm font-semibold text-muted-foreground">
            {textoLiberacao(liberacao.liberaEm, liberacao.faltam)}
          </span>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-surface p-1" role="tablist">
          {[["calendario", "Calendário"], ["publicados", "Publicados"]].map(([v, r]) => (
            <button
              key={v}
              role="tab"
              aria-selected={aba === v}
              onClick={() => mudar({ aba: v === "calendario" ? undefined : v })}
              className={cn("h-9 rounded-lg px-4 text-sm font-medium transition-colors", aba === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary")}
            >
              {r}
            </button>
          ))}
        </div>
        <button onClick={() => setCard({})} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
          <Plus className="size-4" /> Adicionar conteúdo
        </button>
      </div>

      {posts.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : posts.isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar: {posts.error.message}</p>
      ) : aba === "calendario" ? (
        <Calendario
          posts={doCalendario}
          onAbrir={(p) => setCard({ conteudo: p })}
          onNovo={(dia) => setCard({ inicial: { data_post: dia } })}
          filtros={
            <>
              <DropdownFiltro
                rotulo="Tipo de conteúdo"
                valor={tipo}
                onChange={(v) => mudar({ tipo: v[0] })}
                opcoes={TIPOS_ACERVO.map((t) => ({ valor: t.valor, rotulo: `${t.emoji} ${t.rotulo}` }))}
              />
              <DropdownFiltro
                rotulo="Status"
                multiplo
                valor={status}
                onChange={(v) => mudar({ status: v.join(",") || undefined })}
                opcoes={STATUS.map((s) => ({ valor: s.valor, rotulo: <ChipStatus valor={s.valor} /> }))}
              />
              {tipo.length || status.length ? (
                <button onClick={() => mudar({ tipo: undefined, status: undefined })} className="text-sm font-medium text-primary hover:underline">Limpar filtros</button>
              ) : null}
            </>
          }
        />
      ) : (
        <Publicados posts={lista} onAbrir={(p) => setCard({ conteudo: p })} onNovo={(c) => setCard({ inicial: c })} onResultado={setResultado} />
      )}
    </AppLayout>
  );
}
