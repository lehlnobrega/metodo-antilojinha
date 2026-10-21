import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { EditorNotion } from "@/components/editor/EditorNotion";
import { AppLayout } from "@/components/layout/AppLayout";
import { EstadoVazio } from "@/components/PaginaTopo";
import { GRUPO_VIP_URL } from "@/config";
import { useAluna } from "@/lib/aluna";
import { useModulos } from "@/lib/dados";
import { AVISO_PROPRIEDADE, useMateriaisApoio, usePaginasMaterial } from "@/lib/materiais";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/materiais/$slug/$materialId/$paginaId")({
  head: () => ({
    meta: [
      { title: "Leitura do material | Método" },
      { name: "description", content: "Página do material de apoio do Método." },
      { property: "og:title", content: "Leitura do material | Método" },
      { property: "og:description", content: "Página do material de apoio do Método." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Leitor,
});

function Leitor() {
  const { slug, materialId, paginaId } = Route.useParams();
  const navigate = useNavigate();
  const { aluna } = useAluna();
  const modulos = useModulos();
  const materiais = useMateriaisApoio();
  const paginasQ = usePaginasMaterial(Number(materialId));
  const modulo = (modulos.data ?? []).find((m) => m.slug === slug);
  const material = (materiais.data ?? []).find((m) => m.id === Number(materialId));
  const paginas = (paginasQ.data ?? []).filter((p) => p.publicado !== false || (aluna?.is_admin && p.id === Number(paginaId)));
  const i = paginas.findIndex((p) => p.id === Number(paginaId));
  const pagina = paginas[i];
  const anterior = i > 0 ? paginas[i - 1] : undefined;
  const proxima = i >= 0 && i < paginas.length - 1 ? paginas[i + 1] : undefined;
  const irPara = (id: number) => navigate({ to: "/materiais/$slug/$materialId/$paginaId", params: { slug, materialId, paginaId: String(id) } });

  if (modulos.isLoading || materiais.isLoading || paginasQ.isLoading)
    return <AppLayout><p className="text-sm text-muted-foreground">Carregando...</p></AppLayout>;
  if (!material || !pagina)
    return <AppLayout><EstadoVazio titulo="Página não encontrada" acao={<Link to="/materiais" className="text-sm font-medium text-primary hover:underline">Voltar aos materiais</Link>} /></AppLayout>;

  return (
    <AppLayout foco titulo={material.titulo}>
      <div className="mx-auto max-w-[760px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/materiais/$slug"
            params={{ slug }}
            className="inline-flex items-center gap-1.5 rounded-lg py-1.5 pr-2 text-sm font-medium text-foreground hover:text-primary"
          >
            <ArrowLeft className="size-4" /> Voltar aos materiais
          </Link>
          {paginas.length > 1 ? (
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Páginas deste material">
              {paginas.map((p, n) => (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={p.id === pagina.id}
                  onClick={() => irPara(p.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    p.id === pagina.id ? "border-primary bg-accent-soft text-primary" : "border-border bg-surface text-muted-foreground hover:text-foreground",
                  )}
                >
                  {n + 1}. {p.titulo || "Sem título"}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <article className="rounded-[20px] border border-border bg-surface px-5 py-8 sm:px-14 sm:py-12">
          <p className="text-xs italic leading-relaxed text-muted-foreground">{AVISO_PROPRIEDADE}</p>
          <p className="mt-5 text-[13px] text-muted-foreground">
            {modulo ? `${modulo.titulo}, ` : ""}
            {material.titulo}
          </p>
          {pagina.publicado === false ? <p className="mt-3 inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium">Rascunho, só a equipe vê</p> : null}
          <h1 className="mt-1.5 text-[28px] font-semibold leading-tight tracking-[-0.035em] text-foreground sm:text-[34px]">
            {pagina.emoji && pagina.emoji !== "📄" ? `${pagina.emoji} ` : ""}
            {pagina.titulo || "Sem título"}
          </h1>
          <div className="notion-leitura mt-6">
            <EditorNotion key={pagina.id} conteudo={pagina.conteudo} />
          </div>
        </article>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {anterior ? (
            <button onClick={() => irPara(anterior.id)} className="rounded-2xl border border-border bg-surface px-4 py-3.5 text-left hover:border-primary">
              <span className="block text-xs text-muted-foreground">Anterior</span>
              <span className="block text-sm font-medium">{anterior.titulo || "Página anterior"}</span>
            </button>
          ) : (
            <span className="hidden sm:block" />
          )}
          {proxima ? (
            <button onClick={() => irPara(proxima.id)} className="rounded-2xl border border-border bg-surface px-4 py-3.5 text-right hover:border-primary">
              <span className="block text-xs text-muted-foreground">Próxima</span>
              <span className="block text-sm font-medium">{proxima.titulo || "Próxima página"}</span>
            </button>
          ) : (
            <Link
              to="/materiais/$slug"
              params={{ slug }}
              className="rounded-2xl border border-border bg-surface px-4 py-3.5 text-right hover:border-primary"
            >
              <span className="block text-xs text-muted-foreground">Terminou</span>
              <span className="block text-sm font-medium">Voltar aos materiais</span>
            </Link>
          )}
        </div>
        <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl bg-accent-soft p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-foreground">Dúvidas? Pergunta lá no grupo, é lá que eu respondo todo mundo.</p>
          <a href={GRUPO_VIP_URL} target="_blank" rel="noreferrer" className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
            Ir para o Grupo VIP
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
