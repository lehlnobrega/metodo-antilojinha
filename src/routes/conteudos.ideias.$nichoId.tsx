// Endereço antigo (um nicho por página): agora abre o banco de ideias já filtrado pelo nicho.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/conteudos/ideias/$nichoId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/conteudos/ideias", search: { nicho: params.nichoId }, replace: true });
  },
});
