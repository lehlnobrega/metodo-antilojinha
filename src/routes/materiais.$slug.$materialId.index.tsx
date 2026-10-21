import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { EstadoVazio } from "@/components/PaginaTopo";
import { usePaginasMaterial } from "@/lib/materiais";

export const Route = createFileRoute("/materiais/$slug/$materialId/")({
  head: () => ({
    meta: [
      { title: "Material de apoio | Método" },
      { name: "description", content: "Páginas do material de apoio do Método." },
      { property: "og:title", content: "Material de apoio | Método" },
      { property: "og:description", content: "Páginas do material de apoio do Método." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrimeiraPagina,
});

function PrimeiraPagina() {
  const { slug, materialId } = Route.useParams();
  const paginas = usePaginasMaterial(Number(materialId));
  const navigate = useNavigate();
  const primeira = (paginas.data ?? []).find((p) => p.publicado !== false);
  useEffect(() => {
    if (primeira) navigate({ to: "/materiais/$slug/$materialId/$paginaId", params: { slug, materialId, paginaId: String(primeira.id) }, replace: true });
  }, [primeira, slug, materialId, navigate]);
  return (
    <AppLayout>
      {paginas.isLoading || primeira ? <p className="text-sm text-muted-foreground">Carregando...</p> : <EstadoVazio titulo="Este material ainda não tem páginas" />}
    </AppLayout>
  );
}
