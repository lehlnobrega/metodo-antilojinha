import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { EditorPaginas } from "@/components/editor/EditorPaginas";
import { useBonus } from "@/lib/bonus";
import { FONTE_BONUS } from "@/lib/materiais";

export const Route = createFileRoute("/admin_/bonus/$bonusId")({
  head: () => ({
    meta: [
      { title: "Editar bônus | Método" },
      { name: "description", content: "Editor das páginas do bônus." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditorBonus,
});

function EditorBonus() {
  const { bonusId } = Route.useParams();
  const id = Number(bonusId);
  const bonus = useBonus();
  const b = (bonus.data ?? []).find((x) => x.id === id);
  return (
    <EditorPaginas
      fonte={FONTE_BONUS}
      id={id}
      pai={b ? { titulo: b.titulo, emoji: "🎁" } : undefined}
      carregandoPai={bonus.isLoading}
      voltar={
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Bônus
        </Link>
      }
      linkAluna={(pid) => `/bonus/${id}/${pid}`}
    />
  );
}
