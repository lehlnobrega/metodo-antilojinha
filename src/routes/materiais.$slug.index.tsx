import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { EstadoVazio, PaginaTopo } from "@/components/PaginaTopo";
import { useModulos } from "@/lib/dados";
import { TIPOS_MATERIAL, useContagemPaginas, useMateriaisApoio } from "@/lib/materiais";

export const Route = createFileRoute("/materiais/$slug/")({
  head: () => ({
    meta: [
      { title: "Materiais do módulo | Método" },
      { name: "description", content: "Os materiais de apoio deste módulo do Método." },
      { property: "og:title", content: "Materiais do módulo | Método" },
      { property: "og:description", content: "Os materiais de apoio deste módulo do Método." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MateriaisModulo,
});

function MateriaisModulo() {
  const { slug } = Route.useParams();
  const modulos = useModulos();
  const materiais = useMateriaisApoio();
  const contagem = useContagemPaginas();
  const modulo = (modulos.data ?? []).find((m) => m.slug === slug);
  const lista = (materiais.data ?? []).filter((x) => x.modulo_id === modulo?.id && x.publicado !== false);

  return (
    <AppLayout titulo={modulo?.titulo ?? "Materiais de apoio"}>
      <Link to="/materiais" className="transicao-suave -mt-3 mb-5 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary">
        <ArrowLeft className="size-4" strokeWidth={1.5} />
        Voltar para os materiais
      </Link>
      {modulos.isLoading || materiais.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !modulo || !modulo.liberado ? (
        <EstadoVazio titulo="Este módulo ainda não está liberado para você" />
      ) : (
        <>
          <PaginaTopo titulo={modulo.titulo} subtitulo={modulo.descricao ?? ""} />
          {lista.length === 0 ? (
            <EstadoVazio titulo="Nenhum material neste módulo ainda" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lista.map((x) => {
                const paginas = contagem.data?.get(x.id) ?? 0;
                const corpo = (
                  <>
                    <span className="text-4xl">{x.emoji || "📄"}</span>
                    <h3 className="mt-3 font-semibold">{x.titulo}</h3>
                    {x.descricao ? <p className="mt-1 text-sm text-muted-foreground">{x.descricao}</p> : null}
                    <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                      {x.tipo === "paginas" ? `${paginas} ${paginas === 1 ? "página" : "páginas"}` : TIPOS_MATERIAL[x.tipo ?? "link"]}
                      {x.tipo !== "paginas" && x.url ? <ExternalLink className="size-3.5" /> : null}
                    </p>
                    {x.tipo !== "paginas" && x.conteudo ? <p className="mt-3 whitespace-pre-line text-sm">{x.conteudo}</p> : null}
                  </>
                );
                const cls = "card-metodo transicao-suave block p-5 hover:border-primary/50";
                if (x.tipo === "paginas")
                  return (
                    <Link key={x.id} to="/materiais/$slug/$materialId" params={{ slug, materialId: String(x.id) }} className={cls}>
                      {corpo}
                    </Link>
                  );
                return x.url ? (
                  <a key={x.id} href={x.url} target="_blank" rel="noreferrer" className={cls}>{corpo}</a>
                ) : (
                  <div key={x.id} className="card-metodo p-5">{corpo}</div>
                );
              })}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
