import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExternalLink, ShoppingBag, Smartphone } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { AppLayout } from "@/components/layout/AppLayout";
import { EstadoVazio, PaginaTopo } from "@/components/PaginaTopo";
import { Pilulas } from "@/components/metodo/overlay";
import { useAluna } from "@/lib/aluna";
import { registrarClique, useIndicacoes } from "@/lib/dados";
import { useCategorias } from "@/lib/dados-loja";
import { cn } from "@/lib/utils";

const busca = z.object({ aba: z.enum(["produto", "app"]).optional().catch(undefined) });

export const Route = createFileRoute("/indicacoes")({
  validateSearch: (s) => busca.parse(s),
  head: () => ({
    meta: [
      { title: "Indicações | Método" },
      { name: "description", content: "Os produtos e apps que a Letícia usa e indica de verdade." },
      { property: "og:title", content: "Indicações | Método" },
      { property: "og:description", content: "Os produtos e apps que a Letícia usa e indica de verdade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Indicacoes,
});

function Indicacoes() {
  const { aba = "produto" } = Route.useSearch();
  const navigate = useNavigate({ from: "/indicacoes" });
  const { data, isLoading } = useIndicacoes();
  const categorias = useCategorias();
  const { sessao } = useAluna();
  const [sub, setSub] = useState<number | "todas">("todas");

  const subs = (categorias.data ?? []).filter((c) => c.tipo === aba);
  const nomeSub = new Map((categorias.data ?? []).map((c) => [c.id, c.nome]));
  const itens = (data ?? []).filter((i) => i.categoria === aba && (sub === "todas" || i.subcategoria_id === sub));

  const trocarAba = (a: "produto" | "app") => {
    setSub("todas");
    void navigate({ search: { aba: a } });
  };

  return (
    <AppLayout>
      <PaginaTopo titulo="Indicações" subtitulo="O que eu uso e recomendo de verdade." />

      <div className="mb-4 inline-flex rounded-full border border-border bg-surface p-1">
        {([
          ["produto", "Produtos", ShoppingBag],
          ["app", "Apps", Smartphone],
        ] as const).map(([v, r, Icone]) => (
          <button
            key={v}
            onClick={() => trocarAba(v)}
            className={cn("inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors", aba === v ? "bg-primary text-primary-foreground" : "text-foreground hover:text-primary")}
          >
            <Icone className="size-4" /> {r}
          </button>
        ))}
      </div>

      {subs.length ? (
        <Pilulas
          className="mb-6"
          valor={sub}
          onChange={setSub}
          opcoes={[{ valor: "todas" as const, rotulo: "Todas" }, ...subs.map((c) => ({ valor: c.id, rotulo: c.nome }))]}
        />
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : itens.length === 0 ? (
        <EstadoVazio titulo={aba === "produto" ? "Os produtos que eu indico aparecem aqui." : "Os apps que eu uso aparecem aqui."} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {itens.map((i) => (
            <div key={i.id} className="card-metodo flex flex-col overflow-hidden">
              {i.imagem_url ? (
                <img src={i.imagem_url} alt={i.titulo} loading="lazy" className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-accent-soft text-primary">
                  {aba === "produto" ? <ShoppingBag className="size-10" strokeWidth={1.25} /> : <Smartphone className="size-10" strokeWidth={1.25} />}
                </div>
              )}
              <div className="flex flex-1 flex-col p-4">
                {i.subcategoria_id && nomeSub.get(i.subcategoria_id) ? (
                  <span className="mb-2 self-start rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary">{nomeSub.get(i.subcategoria_id)}</span>
                ) : null}
                <h3 className="font-semibold leading-snug">{i.titulo}</h3>
                {i.descricao ? <p className="mt-1 line-clamp-3 text-[13px] text-muted-foreground">{i.descricao}</p> : null}
                <a
                  href={i.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => sessao && void registrarClique(i.id, sessao.user.id)}
                  className="mt-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 pt-0 text-sm font-semibold text-primary-foreground hover:bg-primary-hover [margin-top:max(1rem,auto)]"
                >
                  {aba === "produto" ? "Ver produto" : "Acessar app"} <ExternalLink className="size-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
