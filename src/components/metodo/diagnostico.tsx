// Card "Diagnóstico da semana" e resumo "Sua ação da semana" do Início.
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronDown, Loader2, RefreshCw, Target } from "lucide-react";
import { useEffect, useState } from "react";

import { ChipFormato, ChipTipo } from "@/components/metodo/chips";
import type { Modulo } from "@/lib/dados";
import type { ConteudoDiagnostico, Diagnostico, Post } from "@/lib/dados-loja";
import { rotuloSemana } from "@/lib/formato";
import { cn } from "@/lib/utils";

function LinkModulo({ slug, modulos, className }: { slug?: string | undefined; modulos: Modulo[]; className?: string }) {
  const m = slug ? modulos.find((x) => x.slug === slug) : undefined;
  if (!m) return <Link to="/plano-pratico" className={className}>Ver no plano prático <ArrowRight className="size-3.5" /></Link>;
  return <Link to="/materiais/$slug" params={{ slug: m.slug }} className={className}>Ver no módulo <ArrowRight className="size-3.5" /></Link>;
}

function usePassos(semana: string, total: number) {
  const chave = `metodo-acao-${semana}`;
  const [feitos, setFeitos] = useState<boolean[]>(Array(total).fill(false));
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(chave) ?? "[]") as boolean[];
      setFeitos(Array.from({ length: total }, (_, i) => Boolean(v[i])));
    } catch { setFeitos(Array(total).fill(false)); }
  }, [chave, total]);
  const alternar = (i: number) => setFeitos((f) => { const n = f.map((x, j) => (j === i ? !x : x)); localStorage.setItem(chave, JSON.stringify(n)); return n; });
  return [feitos, alternar] as const;
}

function AcaoDaSemana({ c, semana, modulos }: { c: ConteudoDiagnostico; semana: string; modulos: Modulo[] }) {
  const passos = c.acao_da_semana?.passos ?? [];
  const [feitos, alternar] = usePassos(semana, passos.length);
  if (!c.acao_da_semana) return null;
  return (
    <section className="hero-metodo">
      <p className="flex items-center gap-2 text-sm text-primary-foreground/80"><Target className="size-4" /> 🎯 Ação da semana</p>
      <h4 className="mt-1 text-xl font-semibold">{c.acao_da_semana.titulo}</h4>
      <ul className="mt-3 space-y-2">
        {passos.map((p, i) => (
          <li key={i}>
            <button onClick={() => alternar(i)} className="flex w-full items-start gap-3 text-left text-sm">
              <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 border-primary-foreground/70", feitos[i] && "bg-primary-foreground text-primary")}>
                {feitos[i] ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </span>
              <span className={cn(feitos[i] && "line-through opacity-70")}>{p}</span>
            </button>
          </li>
        ))}
      </ul>
      <LinkModulo slug={c.acao_da_semana.modulo} modulos={modulos} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold underline-offset-2 hover:underline" />
    </section>
  );
}

function Conteudo({ d, modulos, posts, onReplicar }: { d: Diagnostico; modulos: Modulo[]; posts: Post[]; onReplicar?: ((p: Post) => void) | undefined }) {
  const c = d.conteudo ?? {};
  const post = c.replicar?.post_id ? posts.find((p) => p.id === c.replicar!.post_id) : undefined;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-lg font-semibold leading-snug">{c.resumo}</p>
        {c.semana_em_numeros ? <p className="mt-1 text-sm text-muted-foreground">{c.semana_em_numeros}</p> : null}
      </div>
      {c.funcionando?.length ? (
        <div>
          <h4 className="mb-2 text-sm font-semibold">✅ O que está funcionando</h4>
          <ul className="space-y-1.5 text-sm">
            {c.funcionando.map((x, i) => <li key={i} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" />{x}</li>)}
          </ul>
        </div>
      ) : null}
      {c.ajustar?.length ? (
        <div>
          <h4 className="mb-2 text-sm font-semibold">⚠️ O que ajustar</h4>
          <div className="grid gap-3 md:grid-cols-3">
            {c.ajustar.map((a, i) => (
              <div key={i} className="flex flex-col rounded-2xl border border-border p-4">
                <span className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-primary">{i + 1}</span>
                <p className="mt-2 font-semibold">{a.ponto}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">{a.por_que}</p>
                <p className="mt-2 text-[13px]"><span className="font-medium">Como ajustar: </span>{a.como_ajustar}</p>
                <LinkModulo slug={a.modulo} modulos={modulos} className="mt-auto inline-flex items-center gap-1 pt-3 text-[13px] font-semibold text-primary hover:underline" />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <AcaoDaSemana c={c} semana={d.semana} modulos={modulos} />
      {post && onReplicar ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-accent-soft p-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Vale replicar</p>
            <p className="line-clamp-1 font-semibold">{post.titulo || "Post sem título"}</p>
            <div className="mt-1 flex flex-wrap gap-1.5"><ChipTipo valor={post.tipo_cqc} pequeno /><ChipFormato valor={post.formato} pequeno /></div>
            {c.replicar?.motivo ? <p className="mt-1 text-xs text-muted-foreground">{c.replicar.motivo}</p> : null}
          </div>
          <button onClick={() => onReplicar(post)} className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Replicar no calendário</button>
        </div>
      ) : null}
    </div>
  );
}

function ChipConfianca({ v }: { v?: string | undefined }) {
  if (v === "baixa") return <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning">Poucos dados ainda</span>;
  if (v === "media") return <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Confiança média</span>;
  if (v === "alta") return <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">Confiança alta</span>;
  return null;
}

export function PainelDiagnostico({
  semana,
  diagnosticos,
  modulos,
  posts,
  gerando,
  onGerar,
  onReplicar,
  temDados,
}: {
  semana: string;
  diagnosticos: Diagnostico[];
  modulos: Modulo[];
  posts: Post[];
  gerando?: boolean;
  onGerar?: (() => void) | undefined;
  onReplicar?: ((p: Post) => void) | undefined;
  temDados?: boolean;
}) {
  const d = diagnosticos.find((x) => x.semana === semana);
  const anteriores = diagnosticos.filter((x) => x.semana < semana);
  return (
    <section className="card-metodo p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="titulo-card">Diagnóstico da semana</h2>
        <span className="text-[13px] text-muted-foreground">{rotuloSemana(semana)}</span>
        {d ? <ChipConfianca v={d.conteudo?.confianca} /> : null}
        {d && onGerar && d.gerado_vezes < 2 && !gerando ? (
          <button onClick={onGerar} className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"><RefreshCw className="size-3.5" /> Gerar de novo</button>
        ) : null}
      </div>
      {gerando ? (
        <div className="flex flex-col items-center py-10 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="mt-3 font-semibold">Analisando a sua semana...</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Olhando os números, os conteúdos e o seu plano. Leva uns segundinhos.</p>
        </div>
      ) : d ? (
        <Conteudo d={d} modulos={modulos} posts={posts} onReplicar={onReplicar} />
      ) : (
        <div className="rounded-2xl bg-muted p-5 text-sm">
          {temDados ? (
            <>
              <p>Essa semana ainda não tem diagnóstico.</p>
              {onGerar ? <button onClick={onGerar} className="mt-3 h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Gerar diagnóstico</button> : null}
            </>
          ) : (
            <p>Registra os dados dessa semana e eu te digo o que ajustar.</p>
          )}
        </div>
      )}
      {anteriores.length ? (
        <details className="group mt-6 border-t border-border pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
            Diagnósticos anteriores ({anteriores.length}) <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-4 space-y-4">
            {anteriores.map((x) => (
              <details key={x.id} className="rounded-2xl border border-border p-4">
                <summary className="cursor-pointer text-sm font-medium">{rotuloSemana(x.semana)} <span className="font-normal text-muted-foreground">· {x.conteudo?.acao_da_semana?.titulo ?? ""}</span></summary>
                <div className="mt-4"><Conteudo d={x} modulos={modulos} posts={posts} /></div>
              </details>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}

/** Lista simples para o admin (somente leitura). */
export function HistoricoDiagnosticos({ diagnosticos, modulos }: { diagnosticos: Diagnostico[]; modulos: Modulo[] }) {
  if (!diagnosticos.length) return <p className="text-sm text-muted-foreground">Nenhum diagnóstico ainda.</p>;
  return (
    <div className="space-y-3">
      {diagnosticos.map((x) => (
        <details key={x.id} className="rounded-2xl border border-border p-4">
          <summary className="cursor-pointer text-sm font-medium">{rotuloSemana(x.semana)} <ChipConfianca v={x.conteudo?.confianca} /></summary>
          <div className="mt-4"><Conteudo d={x} modulos={modulos} posts={[]} /></div>
        </details>
      ))}
    </div>
  );
}

export function ResumoAcaoSemana({ d }: { d: Diagnostico | undefined }) {
  const passos = d?.conteudo?.acao_da_semana?.passos ?? [];
  const [feitos, alternar] = usePassos(d?.semana ?? "nenhuma", passos.length);
  return (
    <section className="card-metodo p-6 lg:col-span-12">
      <div className="flex items-center gap-2">
        <Target className="size-[18px] text-primary" strokeWidth={1.75} />
        <p className="titulo-card">Sua ação da semana</p>
      </div>
      {d?.conteudo?.acao_da_semana ? (
        <>
          <h3 className="mt-2 text-lg font-semibold">{d.conteudo.acao_da_semana.titulo}</h3>
          <ul className="mt-3 grid gap-2 md:grid-cols-3">
            {passos.map((p, i) => (
              <li key={i}>
                <button onClick={() => alternar(i)} className="flex w-full items-start gap-2 rounded-xl bg-muted p-3 text-left text-sm">
                  <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 border-primary", feitos[i] && "bg-primary text-primary-foreground")}>
                    {feitos[i] ? <Check className="size-3.5" strokeWidth={3} /> : null}
                  </span>
                  <span className={cn(feitos[i] && "text-muted-foreground line-through")}>{p}</span>
                </button>
              </li>
            ))}
          </ul>
          <Link to="/dados-da-loja" search={{ semana: d.semana }} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            Ver diagnóstico completo <ArrowRight className="size-3.5" />
          </Link>
        </>
      ) : (
        <p className="mt-3 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">No dia da sua reunião, registra a semana e eu te digo o que ajustar.</p>
      )}
    </section>
  );
}
