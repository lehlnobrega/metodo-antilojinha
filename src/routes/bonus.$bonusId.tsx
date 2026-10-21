import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { useAluna } from "@/lib/aluna";
import { useBonus, useItensBonus } from "@/lib/bonus";

export const Route = createFileRoute("/bonus/$bonusId")({
  head: () => ({
    meta: [
      { title: "Bônus | Método" },
      { name: "description", content: "Os extras do Método Loja Online Lucrativa." },
      { property: "og:title", content: "Bônus | Método" },
      { property: "og:description", content: "Os extras do Método Loja Online Lucrativa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaginaBonus,
});

function PaginaBonus() {
  const { bonusId } = Route.useParams();
  const { aluna } = useAluna();
  const bonus = useBonus();
  const itens = useItensBonus(Number(bonusId));
  const b = (bonus.data ?? []).find((x) => x.id === Number(bonusId));
  const lista = (itens.data ?? []).filter((i) => i.publicado || aluna?.is_admin);

  return (
    <AppLayout titulo={b?.titulo ?? (bonus.isLoading ? "Carregando..." : "Bônus")}>
      <Link to="/materiais" className="-mt-3 mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> Voltar aos materiais
      </Link>
      {b?.descricao ? <p className="-mt-1 mb-8 max-w-2xl text-[15px] text-muted-foreground">{b.descricao}</p> : null}

      {bonus.isLoading || itens.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !b || b.status !== "liberado" ? (
        <div className="card-metodo px-6 py-14 text-center">
          <p className="font-semibold">Esse bônus chega em breve</p>
          <p className="mt-1 text-sm text-muted-foreground">Assim que ele for liberado, aparece aqui.</p>
        </div>
      ) : lista.length === 0 ? (
        <div className="card-metodo px-6 py-14 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-foreground text-surface">
            <Sparkles className="size-5" strokeWidth={1.75} />
          </span>
          <p className="mt-4 font-semibold">Os itens chegam em breve</p>
          <p className="mx-auto mt-1 max-w-[46ch] text-sm text-muted-foreground">
            Assim que um item for liberado, ele aparece aqui com o passo a passo de como usar.
          </p>
          {aluna?.is_admin ? <p className="mt-3 text-xs text-muted-foreground">Você adiciona os itens em Painel admin, Bônus.</p> : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((i) => (
            <article key={i.id} className="card-metodo flex flex-col p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-foreground text-surface">
                <Sparkles className="size-5" strokeWidth={1.75} />
              </span>
              <h2 className="mt-4 text-base font-semibold">{i.titulo}</h2>
              {i.descricao ? <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{i.descricao}</p> : null}
              {!i.publicado ? <span className="mt-3 w-fit rounded-full bg-muted px-2.5 py-0.5 text-xs">Rascunho, só você vê</span> : null}
              {i.link ? (
                <a
                  href={i.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex h-10 w-fit items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                >
                  Abrir <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
