import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator, ExternalLink, NotebookPen } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { PaginaTopo } from "@/components/PaginaTopo";
import { MARGEM_CERTA_URL } from "@/config";
import { usePlanoNegocios } from "@/lib/dados";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ferramentas/")({
  head: () => ({
    meta: [
      { title: "Ferramentas | Método" },
      { name: "description", content: "Plano de negócios e Margem Certa." },
      { property: "og:title", content: "Ferramentas | Método" },
      {
        property: "og:description",
        content: "Plano de negócios e Margem Certa.",
      },
    ],
  }),
  component: Ferramentas,
});

const CARTAO = "card-metodo flex flex-col p-6";
const BOTAO_PRIMARIO =
  "transicao-suave inline-flex h-10 w-fit items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover";

function Ferramentas() {
  const plano = usePlanoNegocios();
  const conc = Array.isArray(plano.data?.etapas_concluidas) ? plano.data!.etapas_concluidas!.length : 0;
  const pronto = Boolean(plano.data?.concluido_em);
  const situacao = pronto ? "Plano pronto" : conc > 0 ? `Você parou na etapa ${Math.min(conc + 1, 9)} de 9` : "Ainda não começou";
  return (
    <AppLayout>
      <PaginaTopo titulo="Ferramentas" subtitulo="O que faz a sua loja andar mais rápido." />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={CARTAO}>
          <div className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-primary">
            <NotebookPen className="size-5" strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Plano de negócios</h2>
          <p className="mt-1 text-sm text-muted-foreground">A base de tudo que vem depois.</p>
          {!plano.isLoading ? (
            <span
              className={cn(
                "mt-3 w-fit rounded-full px-2.5 py-0.5 text-xs font-medium",
                pronto ? "bg-success-soft text-success" : conc > 0 ? "bg-accent-soft text-primary" : "border border-border bg-muted text-muted-foreground",
              )}
            >
              {situacao}
            </span>
          ) : null}
          <Link to="/plano-de-negocios" className={cn(BOTAO_PRIMARIO, "mt-5")}>
            {pronto ? "Ver meu plano" : conc > 0 ? "Continuar de onde parei" : "Começar"}
          </Link>
        </div>

        <div className={CARTAO}>
          <div className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-primary">
            <Calculator className="size-5" strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Margem Certa</h2>
          <p className="mt-1 text-sm text-muted-foreground">Precifique seus produtos sem prejuízo.</p>
          <a href={MARGEM_CERTA_URL} target="_blank" rel="noreferrer" className={cn(BOTAO_PRIMARIO, "mt-auto")}>
            Abrir o Margem Certa <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
