import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Video } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/AppLayout";
import { EstadoVazio } from "@/components/PaginaTopo";
import { useAluna } from "@/lib/aluna";
import { DECISOES, type Decisao, salvarDecisao, useConteudosAcervo, useDecisoesFormatos, useFormatosVirais, useNichos } from "@/lib/acervo";
import { cn } from "@/lib/utils";

type Busca = { aba?: "nichos" | "formatos" };

export const Route = createFileRoute("/conteudos/ideias/")({
  validateSearch: (s: Record<string, unknown>): Busca => (s["aba"] === "formatos" ? { aba: "formatos" } : {}),
  head: () => ({
    meta: [
      { title: "Ideias de conteúdo | Método" },
      { name: "description", content: "Ideias por nicho e os formatos que estão viralizando, com referência." },
      { property: "og:title", content: "Ideias de conteúdo | Método" },
      { property: "og:description", content: "Ideias por nicho e os formatos que estão viralizando, com referência." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Ideias,
});

function Ideias() {
  const { aba } = Route.useSearch();
  const navigate = Route.useNavigate();
  const atual = aba ?? "nichos";
  return (
    <AppLayout titulo="Ideias de conteúdo">
      <Link to="/conteudos" className="-mt-2 mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> Voltar aos conteúdos
      </Link>
      <div className="mb-6 inline-flex rounded-xl border border-border bg-surface p-1" role="tablist">
        {(
          [
            ["nichos", "Por nicho"],
            ["formatos", "Formatos virais"],
          ] as const
        ).map(([v, r]) => (
          <button
            key={v}
            role="tab"
            aria-selected={atual === v}
            onClick={() => navigate({ search: v === "nichos" ? {} : { aba: v }, replace: true })}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              atual === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {r}
          </button>
        ))}
      </div>
      {atual === "nichos" ? <Nichos /> : <Formatos />}
    </AppLayout>
  );
}

function Nichos() {
  const nichos = useNichos();
  const conteudos = useConteudosAcervo(true);
  const qtd = useMemo(() => {
    const m = new Map<number, { total: number; video: number }>();
    (conteudos.data ?? []).forEach((c) => {
      const a = m.get(c.nicho_id) ?? { total: 0, video: 0 };
      a.total += 1;
      if (c.formato === "video") a.video += 1;
      m.set(c.nicho_id, a);
    });
    return m;
  }, [conteudos.data]);

  return (
    <>
      <p className="mb-6 max-w-2xl text-[15px] text-muted-foreground">
        Escolhe o nicho. Vale olhar os outros também: ideia boa de um nicho pode virar a melhor ideia do seu.
      </p>
      {nichos.isLoading || conteudos.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : nichos.isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar: {nichos.error.message}</p>
      ) : (nichos.data ?? []).length === 0 ? (
        <EstadoVazio titulo="As ideias estão chegando" texto="Logo aparecem aqui os conteúdos separados pra te inspirar." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(nichos.data ?? []).map((n) => {
            const q = qtd.get(n.id) ?? { total: 0, video: 0 };
            const miolo = (
              <>
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-[24px] leading-none">{n.emoji ?? "💡"}</span>
                <span className="mt-5 block text-base font-semibold tracking-[-0.01em] text-foreground">{n.nome}</span>
                <span className="mt-0.5 block text-[13px] text-muted-foreground">
                  {q.total > 0 ? `${q.total} ${q.total === 1 ? "ideia" : "ideias"}` : "Em breve"}
                </span>
                {q.total > 0 ? (
                  <span className="mt-auto flex flex-wrap gap-1.5 pt-4">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11.5px] text-muted-foreground">{q.video} vídeos</span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11.5px] text-muted-foreground">{q.total - q.video} carrosséis</span>
                  </span>
                ) : null}
              </>
            );
            const cls = "group flex min-h-[176px] flex-col items-start rounded-2xl border border-border bg-surface p-6 transition-colors";
            return q.total > 0 ? (
              <Link key={n.id} to="/conteudos/ideias/$nichoId" params={{ nichoId: String(n.id) }} className={`${cls} hover:border-primary/50`}>
                {miolo}
              </Link>
            ) : (
              <div key={n.id} className={`${cls} cursor-default bg-muted opacity-70`} aria-disabled="true">
                {miolo}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Formatos() {
  const { aluna } = useAluna();
  const formatos = useFormatosVirais(true);
  const decisoes = useDecisoesFormatos();
  const qc = useQueryClient();

  const decidir = async (id: number, valor: Decisao) => {
    if (!aluna) return;
    const atual = decisoes.data?.get(id);
    const novo = atual === valor ? null : valor;
    qc.setQueryData<Map<number, Decisao>>(["acervo", "decisoes"], (m) => {
      const n = new Map(m ?? []);
      if (novo) n.set(id, novo);
      else n.delete(id);
      return n;
    });
    try {
      await salvarDecisao(aluna.id, id, novo);
    } catch {
      toast.error("Não consegui salvar agora. Tenta de novo.");
      void qc.invalidateQueries({ queryKey: ["acervo", "decisoes"] });
    }
  };

  return (
    <>
      <p className="mb-6 max-w-2xl text-[15px] text-muted-foreground">
        Formatos que estão viralizando. Assiste a referência e decide se combina com a sua loja.
      </p>
      {formatos.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : formatos.isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar: {formatos.error.message}</p>
      ) : (formatos.data ?? []).length === 0 ? (
        <EstadoVazio titulo="Os formatos estão chegando" texto="Logo aparecem aqui os formatos que estão viralizando, com vídeo de referência." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {(formatos.data ?? []).map((f) => {
            const d = decisoes.data?.get(f.id);
            return (
              <article key={f.id} className="card-metodo flex flex-col p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-[17px] font-semibold tracking-[-0.015em]">{f.nome}</h3>
                  {f.link ? (
                    <a
                      href={f.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-[12.5px] font-medium hover:border-primary hover:text-primary"
                    >
                      <Video className="size-3.5" /> Ver vídeo de referência <ExternalLink className="size-3" />
                    </a>
                  ) : null}
                </div>
                <dl className="mt-4 grid gap-3">
                  {(
                    [
                      ["O que é", f.o_que_e],
                      ["Por que viraliza", f.por_que],
                      ["Como adaptar", f.como_adaptar],
                    ] as const
                  ).map(([r, v]) =>
                    v ? (
                      <div key={r}>
                        <dt className="text-xs font-semibold text-muted-foreground">{r}</dt>
                        <dd className="mt-0.5 whitespace-pre-line text-sm leading-relaxed">{v}</dd>
                      </div>
                    ) : null,
                  )}
                </dl>
                <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-border pt-4">
                  <span className="mr-1 text-[12.5px] text-muted-foreground">Pra minha loja:</span>
                  {DECISOES.map((o) => (
                    <button
                      key={o.valor}
                      onClick={() => decidir(f.id, o.valor)}
                      aria-pressed={d === o.valor}
                      className={cn(
                        "rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors",
                        d === o.valor ? "border-foreground bg-foreground text-surface" : "border-border bg-surface hover:border-foreground",
                      )}
                    >
                      {o.rotulo}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
