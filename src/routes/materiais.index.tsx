import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Lock, Sparkles } from "lucide-react";

import { ROTULO_STATUS_BONUS, useBonus } from "@/lib/bonus";
import { cn } from "@/lib/utils";

import { AppLayout } from "@/components/layout/AppLayout";
import { EstadoVazio, PaginaTopo } from "@/components/PaginaTopo";
import { useMateriais, useModulos } from "@/lib/dados";

export const Route = createFileRoute("/materiais/")({
  head: () => ({
    meta: [
      { title: "Materiais de apoio | Método" },
      { name: "description", content: "Scripts, PDFs, vídeos e ferramentas de cada módulo do Método." },
      { property: "og:title", content: "Materiais de apoio | Método" },
      {
        property: "og:description",
        content: "Scripts, PDFs, vídeos e ferramentas de cada módulo do Método.",
      },
    ],
  }),
  component: Materiais,
});

function Materiais() {
  const modulos = useModulos();
  const materiais = useMateriais();
  const bonus = useBonus();
  return (
    <AppLayout>
      <PaginaTopo titulo="Materiais de apoio" subtitulo="Tudo que você precisa para aplicar cada módulo." />
      {modulos.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(modulos.data ?? []).map((m) => {
            const qtd = (materiais.data ?? []).filter((x) => x.modulo_id === m.id).length;
            const conteudo = (
              <>
                <div className="flex items-start justify-between">
                  <span className="text-[34px] font-semibold leading-none tracking-[-0.06em] text-numero-leve">
                    {String(m.ordem).padStart(2, "0")}
                  </span>
                  {m.liberado ? (
                    <ArrowUpRight className="size-5 text-muted-foreground transition-colors group-hover:text-primary" strokeWidth={1.75} />
                  ) : null}
                </div>
                <h2 className="mt-5 text-[15px] font-semibold tracking-[-0.01em]">{m.titulo}</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {!m.liberado ? (
                    <span className="inline-flex items-center gap-1">
                      <Lock className="size-4" strokeWidth={1.5} />{" "}
                      {m.libera_em ? `Libera em ${m.libera_em.slice(0, 10).split("-").reverse().join("/")}` : "Ainda não liberado"}
                    </span>
                  ) : qtd === 0 ? (
                    "Nenhum material ainda"
                  ) : (
                    `${qtd} ${qtd === 1 ? "material" : "materiais"}`
                  )}
                </p>
              </>
            );
            return m.liberado ? (
              <Link
                key={m.id}
                to="/materiais/$slug"
                params={{ slug: m.slug }}
                className="card-metodo transicao-suave group p-5 hover:border-primary/40"
              >
                {conteudo}
              </Link>
            ) : (
              <div key={m.id} className="card-metodo bg-muted p-5 opacity-70">
                {conteudo}
              </div>
            );
          })}
          {(modulos.data ?? []).length === 0 ? <EstadoVazio titulo="Nenhum módulo por aqui ainda" /> : null}
        </div>
      )}

      {(bonus.data ?? []).length > 0 ? (
        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">Bônus</h2>
            <span className="text-[13px] text-muted-foreground">Extras pra você ir além do método</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(bonus.data ?? []).map((b) => {
              const miolo = (
                <>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-foreground text-surface">
                    <Sparkles className="size-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold">{b.titulo}</h3>
                  {b.descricao ? <p className="mt-1 text-[13px] text-muted-foreground">{b.descricao}</p> : null}
                  <span
                    className={cn(
                      "mt-4 w-fit rounded-full px-2.5 py-0.5 text-xs font-medium",
                      b.status === "liberado" ? "bg-accent-soft text-primary" : "border border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {b.status === "liberado" ? "Abrir" : ROTULO_STATUS_BONUS[b.status]}
                  </span>
                </>
              );
              return b.status === "liberado" ? (
                <Link key={b.id} to="/bonus/$bonusId" params={{ bonusId: String(b.id) }} className="card-metodo transicao-suave flex flex-col p-5 hover:border-primary/40">
                  {miolo}
                </Link>
              ) : (
                <div key={b.id} className="card-metodo flex flex-col bg-muted p-5 opacity-75">
                  {miolo}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </AppLayout>
  );
}
