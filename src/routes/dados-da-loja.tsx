import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Pencil, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppLayout } from "@/components/layout/AppLayout";
import { CardConteudo } from "@/components/metodo/card-conteudo";
import { CardDadosSemana } from "@/components/metodo/card-semana";
import { PainelDiagnostico } from "@/components/metodo/diagnostico";
import { nomeMesLongo } from "@/components/metodo/overlay";
import { Anel } from "@/components/metodo/visual";
import { EstadoVazio, PaginaTopo } from "@/components/PaginaTopo";
import { META_FATURAMENTO } from "@/config";
import { useModulos } from "@/lib/dados";
import { type CamposConteudo, type MetricaSemana, useDiagnosticos, useMetricasSemana, usePosts } from "@/lib/dados-loja";
import { ddmm, formatarMoeda, formatarNumero, hojeSaoPaulo, rotuloSemana, segundaDe, somarDias } from "@/lib/formato";
import { useGerarDiagnostico } from "@/lib/use-diagnostico";
import { cn } from "@/lib/utils";

type Busca = { semana?: string; gerar?: string };

export const Route = createFileRoute("/dados-da-loja")({
  validateSearch: (s: Record<string, unknown>): Busca => {
    const r: Busca = {};
    if (typeof s["semana"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s["semana"])) r.semana = s["semana"];
    if (s["gerar"] != null && s["gerar"] !== "") r.gerar = String(s["gerar"]);
    return r;
  },
  head: () => ({
    meta: [
      { title: "Dados da loja | Método" },
      { name: "description", content: "Os números da sua loja semana a semana, com o diagnóstico do que ajustar." },
      { property: "og:title", content: "Dados da loja | Método" },
      { property: "og:description", content: "Os números da sua loja semana a semana, com o diagnóstico do que ajustar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DadosLoja,
});

const ticket = (m?: MetricaSemana) => (m?.faturamento != null && m.pedidos ? m.faturamento / m.pedidos : null);
const conversao = (m?: MetricaSemana) => (m?.pedidos != null && m.sessoes ? (m.pedidos / m.sessoes) * 100 : null);
const seguidores = (m?: MetricaSemana) => (m && (m.seguidores_instagram != null || m.seguidores_tiktok != null) ? (m.seguidores_instagram ?? 0) + (m.seguidores_tiktok ?? 0) : null);
const pct = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

const INDICADORES = [
  { chave: "faturamento", rotulo: "Faturamento", valor: (m?: MetricaSemana) => m?.faturamento ?? null, fmt: formatarMoeda },
  { chave: "pedidos", rotulo: "Pedidos", valor: (m?: MetricaSemana) => m?.pedidos ?? null, fmt: formatarNumero },
  { chave: "ticket", rotulo: "Ticket médio", valor: ticket, fmt: formatarMoeda },
  { chave: "sessoes", rotulo: "Sessões", valor: (m?: MetricaSemana) => m?.sessoes ?? null, fmt: formatarNumero },
  { chave: "conversao", rotulo: "Conversão", valor: conversao, fmt: pct },
  { chave: "seguidores", rotulo: "Seguidores", valor: seguidores, fmt: formatarNumero },
] as const;

function CardNumero({ rotulo, atual, anterior, fmt, extra }: { rotulo: string; atual: number | null; anterior: number | null | undefined; fmt: (n: number) => string; extra?: string }) {
  const temAnterior = anterior !== undefined;
  const variacao = atual != null && anterior != null && anterior !== 0 ? ((atual - anterior) / anterior) * 100 : null;
  return (
    <div className="card-metodo p-5">
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className="mt-1 text-2xl font-semibold">{atual != null ? fmt(atual) : "-"}</p>
      {extra ? <p className="text-xs text-muted-foreground">{extra}</p> : null}
      {!temAnterior ? (
        <p className="mt-2 text-xs text-muted-foreground">Primeira semana registrada</p>
      ) : (
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {variacao != null ? (
            <span className={cn("inline-flex items-center gap-0.5 font-semibold", variacao >= 0 ? "text-success" : "text-destructive")}>
              {variacao >= 0 ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
              {Math.abs(variacao).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
            </span>
          ) : null}
          <span className="text-muted-foreground">semana anterior: {anterior != null ? fmt(anterior) : "-"}</span>
        </p>
      )}
    </div>
  );
}

function DadosLoja() {
  const busca = Route.useSearch();
  const navigate = Route.useNavigate();
  const metricas = useMetricasSemana();
  const diagnosticos = useDiagnosticos();
  const modulos = useModulos();
  const posts = usePosts();
  const { gerar, gerando } = useGerarDiagnostico();
  const lista = metricas.data ?? [];
  const [card, setCard] = useState<{ semana?: string } | null>(null);
  const [replicar, setReplicar] = useState<CamposConteudo | null>(null);
  const [grafico, setGrafico] = useState<(typeof INDICADORES)[number]["chave"]>("faturamento");

  const hoje = hojeSaoPaulo();
  const semana = busca.semana ?? lista[0]?.semana ?? somarDias(segundaDe(hoje), -7);
  const porSemana = useMemo(() => new Map(lista.map((m) => [m.semana, m])), [lista]);
  const atual = porSemana.get(semana);
  const anteriorKey = somarDias(semana, -7);
  const temAnterior = lista.some((m) => m.semana < semana);
  const anterior = porSemana.get(anteriorKey);

  const irPara = (s: string) => navigate({ search: (p) => ({ ...p, semana: s }), replace: true });

  // Gera o diagnóstico logo depois de salvar a semana (vindo do card).
  const disparado = useRef<string | null>(null);
  useEffect(() => {
    if (busca.gerar && busca.semana && disparado.current !== busca.semana) {
      disparado.current = busca.semana;
      void gerar(busca.semana);
      navigate({ search: { semana: busca.semana }, replace: true });
    }
  }, [busca.gerar, busca.semana]); // eslint-disable-line react-hooks/exhaustive-deps

  const mesAtual = hoje.slice(0, 7);
  const somaMes = lista.filter((m) => m.semana.slice(0, 7) === mesAtual).reduce((s, m) => s + (m.faturamento ?? 0), 0);
  const pctMeta = Math.min(100, (somaMes / META_FATURAMENTO) * 100);

  const ind = INDICADORES.find((i) => i.chave === grafico)!;
  const dadosGrafico = useMemo(() => {
    const fim = lista[0]?.semana ?? semana;
    const ultimo = semana > fim ? semana : fim;
    return Array.from({ length: 12 }, (_, i) => {
      const s = somarDias(ultimo, -7 * (11 - i));
      return { semana: s, rotulo: ddmm(s), valor: ind.valor(porSemana.get(s)) ?? 0 };
    });
  }, [lista, semana, ind, porSemana]);

  const aoSalvar = (s: string) => navigate({ search: { semana: s, gerar: "1" }, replace: true });

  return (
    <AppLayout>
      <CardDadosSemana aberto={card !== null} semanaInicial={card?.semana} onFechar={() => setCard(null)} onSalvo={aoSalvar} />
      <CardConteudo aberto={replicar !== null} inicial={replicar} onFechar={() => setReplicar(null)} />
      <PaginaTopo
        titulo="Dados da loja"
        subtitulo="Toda semana, os números da loja e o que ajustar."
        acao={
          <button onClick={() => setCard({})} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
            <Plus className="size-4" /> Adicionar dados da semana
          </button>
        }
      />

      {metricas.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : metricas.isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar: {metricas.error.message}</p>
      ) : lista.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma semana registrada"
          texto="Toda semana, no dia da sua reunião com a empresa, você registra aqui os números da semana. É assim que você enxerga o que ajustar."
          acao={<button onClick={() => setCard({})} className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Adicionar dados da semana</button>}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <button onClick={() => irPara(somarDias(semana, -7))} aria-label="Semana anterior" className="rounded-xl border border-border bg-surface p-2.5 hover:border-primary"><ChevronLeft className="size-4" /></button>
            <span className="min-w-[140px] text-center text-base font-semibold">{rotuloSemana(semana)}</span>
            <button onClick={() => irPara(somarDias(semana, 7))} disabled={semana >= segundaDe(hoje)} aria-label="Próxima semana" className="rounded-xl border border-border bg-surface p-2.5 hover:border-primary disabled:opacity-30"><ChevronRight className="size-4" /></button>
            {atual ? (
              <button onClick={() => setCard({ semana })} className="ml-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><Pencil className="size-3.5" /> Editar semana</button>
            ) : null}
          </div>

          {atual ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {INDICADORES.map((i) => {
                const extra =
                  i.chave === "seguidores" && atual
                    ? `${formatarNumero(atual.seguidores_instagram ?? 0)} Instagram · ${formatarNumero(atual.seguidores_tiktok ?? 0)} TikTok${anterior && seguidores(atual) != null && seguidores(anterior) != null ? ` · ${(seguidores(atual)! - seguidores(anterior)!) >= 0 ? "+" : ""}${formatarNumero(seguidores(atual)! - seguidores(anterior)!)} na semana` : ""}`
                    : undefined;
                return (
                  <CardNumero
                    key={i.chave}
                    rotulo={i.rotulo}
                    atual={i.valor(atual)}
                    anterior={temAnterior ? i.valor(anterior) : undefined}
                    fmt={i.fmt}
                    {...(extra ? { extra } : {})}
                  />
                );
              })}
            </div>
          ) : (
            <div className="card-metodo flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
              <span>Sem dados nessa semana.</span>
              <button onClick={() => setCard({ semana })} className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Adicionar dados da semana</button>
            </div>
          )}

          <PainelDiagnostico
            semana={semana}
            diagnosticos={diagnosticos.data ?? []}
            modulos={modulos.data ?? []}
            posts={posts.data ?? []}
            gerando={gerando}
            temDados={Boolean(atual)}
            onGerar={atual ? () => void gerar(semana) : undefined}
            onReplicar={(p) =>
              setReplicar({ titulo: `Replicar: ${p.titulo ?? "post"}`, tipo_cqc: p.tipo_cqc, formato: p.formato, plataforma: p.plataforma, status: "nao_roteirizado", data_post: hoje, sobre_video: p.link ? `Referência: ${p.link}` : null })
            }
          />

          <div className="grid gap-6 lg:grid-cols-12">
            <section className="card-metodo p-5 lg:col-span-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="titulo-card">Últimas 12 semanas</h2>
                <div className="flex flex-wrap gap-1">
                  {INDICADORES.map((i) => (
                    <button key={i.chave} onClick={() => setGrafico(i.chave)} className={cn("h-8 rounded-full px-3 text-xs font-medium", grafico === i.chave ? "bg-primary text-primary-foreground" : "bg-muted hover:text-primary")}>
                      {i.rotulo}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-60 text-primary">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGrafico} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => (grafico === "conversao" ? `${v}%` : formatarNumero(Math.round(v)))} />
                    <Tooltip cursor={{ fill: "var(--accent-soft)" }} formatter={(v: number) => [ind.fmt(v), ind.rotulo]} labelFormatter={(l: string) => `Semana de ${l}`} />
                    <Bar dataKey="valor" radius={[6, 6, 0, 0]} onClick={(d: { semana?: string }) => d.semana && irPara(d.semana)}>
                      {dadosGrafico.map((d) => <Cell key={d.semana} fill="var(--primary)" fillOpacity={d.semana === semana ? 1 : 0.35} cursor="pointer" />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="card-metodo flex flex-col items-center p-5 text-center lg:col-span-4">
              <p className="titulo-card self-start">Meta R$ 10 mil no mês</p>
              <div className="my-4">
                <Anel valor={pctMeta} tamanho={132}><span className="numero-destaque text-2xl">{Math.round(pctMeta)}%</span></Anel>
              </div>
              <p className="text-sm">{formatarMoeda(somaMes)} de {formatarMoeda(META_FATURAMENTO)} em {nomeMesLongo(mesAtual).split(" de ")[0]}</p>
            </section>
          </div>

          <div className="card-metodo overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-4">Semana</th><th className="p-4">Faturamento</th><th className="p-4">Pedidos</th><th className="p-4">Ticket</th>
                  <th className="p-4">Sessões</th><th className="p-4">Conversão</th><th className="p-4">Instagram</th><th className="p-4">TikTok</th><th className="p-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lista.map((m) => (
                  <tr key={m.id} className={cn("hover:bg-muted", m.semana === semana && "bg-accent-soft/60")}>
                    <td className="p-4 font-medium"><button onClick={() => irPara(m.semana)} className="hover:text-primary">{rotuloSemana(m.semana)}</button></td>
                    <td className="p-4">{m.faturamento != null ? formatarMoeda(m.faturamento) : "-"}</td>
                    <td className="p-4">{m.pedidos != null ? formatarNumero(m.pedidos) : "-"}</td>
                    <td className="p-4">{ticket(m) != null ? formatarMoeda(ticket(m)!) : "-"}</td>
                    <td className="p-4">{m.sessoes != null ? formatarNumero(m.sessoes) : "-"}</td>
                    <td className="p-4">{conversao(m) != null ? pct(conversao(m)!) : "-"}</td>
                    <td className="p-4">{m.seguidores_instagram != null ? formatarNumero(m.seguidores_instagram) : "-"}</td>
                    <td className="p-4">{m.seguidores_tiktok != null ? formatarNumero(m.seguidores_tiktok) : "-"}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setCard({ semana: m.semana })} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-accent-soft">
                        <Pencil className="size-3.5" /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
