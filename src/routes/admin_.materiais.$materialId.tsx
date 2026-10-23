import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { EditorPaginas } from "@/components/editor/EditorPaginas";
import { useModulos } from "@/lib/dados";
import { FONTE_MATERIAL, useMateriaisApoio } from "@/lib/materiais";

export const Route = createFileRoute("/admin_/materiais/$materialId")({
  head: () => ({
    meta: [
      { title: "Editar material | Método" },
      { name: "description", content: "Editor das páginas do material de apoio." },
      { property: "og:title", content: "Editar material | Método" },
      { property: "og:description", content: "Editor das páginas do material de apoio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditorMaterial,
});

function EditorMaterial() {
  const { materialId } = Route.useParams();
  const id = Number(materialId);
  const materiais = useMateriaisApoio();
  const modulos = useModulos();
  const material = (materiais.data ?? []).find((m) => m.id === id);
  const modulo = (modulos.data ?? []).find((m) => m.id === material?.modulo_id);
  return (
    <EditorPaginas
      fonte={FONTE_MATERIAL}
      id={id}
      pai={material}
      carregandoPai={materiais.isLoading}
      voltar={
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Materiais de apoio
        </Link>
      }
      linkAluna={(pid) => (modulo && material ? `/materiais/${modulo.slug}/${material.id}/${pid}` : null)}
    />
  );
}
