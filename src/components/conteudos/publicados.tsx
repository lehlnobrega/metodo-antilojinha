// Aba Publicados: campeão, top 3, o que mais funciona e tabela de performance.
import { ArrowDown, ArrowUp, Check, ExternalLink, Info, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

import { ChipFormato, ChipTipo } from "@/components/metodo/chips";
import { DropdownFiltro } from "@/components/metodo/dropdown";
import { EstadoVazio } from "@/components/PaginaTopo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TIPOS_ACERVO, tipoAcervo } from "@/lib/acervo";
import { FORMATOS, nomeFormato } from "@/lib/calendario";
import { type CamposConteudo, type Post, diasParaResultado, nomePlataforma, pontuacao } from "@/lib/dados-loja";
import { dataBR, formatarNumero, hojeSaoPaulo, segundaDe, somarDias } from "@/lib/formato";
import { cn } from "@/lib/utils";

const PERIODOS = [
  { valor: "semana", rotulo: "Esta semana" },
  { valor: "passada", rotulo: "Semana passada" },
  { valor: "4semanas", rotulo: "Últimas 4 semanas" },
  { valor: "mes", rotulo: "Este mês" },
  { valor: "tudo", rotulo: "Tudo" },
];

function intervalo(p: string): [string, string] | null {
  const hoje = hojeSaoPaulo();
  const seg = segundaDe(hoje);
  if (p === "semana") return [seg, somarDias(seg, 6)];
  if (p === "passada") return [somarDias(seg, -7), somarDias(seg, -1)];
  if (p === "4semanas") return [somarDias(hoje, -27), hoje];
  if (p === "mes") return [`${hoje.slice(0, 7)}-01`, hoje];
  return null;
}

type Coluna = { chave: string; rotulo: string; valor: (p: Post) => number | string | null; num?: boolean };
const COLUNAS: Coluna[] = [
  { chave: "data", rotulo: "Data", valor: (p) => p.data_post },
  { chave: "titulo", rotulo: "Título", valor: (p) => p.titulo ?? "" },
  { chave: "tipo", rotulo: "Tipo", valor: (p) => p.tipo_cqc ?? "" },
  { chave: "formato", rotulo: "Formato", valor: (p) => p.formato ?? "" },
  { chave: "plataforma", rotulo: "Plataforma", valor: (p) => p.plataforma ?? "" },
  { chave: "views", rotulo: "Views", valor: (p) => p.views, num: true },
  { chave: "curtidas", rotulo: "Curtidas", valor: (p) => p.curtidas, num: true },
  { chave: "comentarios", rotulo: "Comentários", valor: (p) => p.comentarios, num: true },
  { chave: "compartilhamentos", rotulo: "Compart.", valor: (p) => p.compartilhamentos, num: true },
  { chave: "salvamentos", rotulo: "Salvos", valor: (p) => p.salvamentos, num: true },
  { chave: "visitas_perfil", rotulo: "Visitas ao perfil", valor: (p) => p.visitas_perfil, num: true },
  { chave: "seguidores_ganhos", rotulo: "Seguidores", valor: (p) => p.seguidores_ganhos, num: true },
  { chave: "pontuacao", rotulo: "Pontuação", valor: (p) => pontuacao(p), num: true },
];

const num = (v: number | null) => (v != null ? formatarNumero(v) : "-");

export function Publicados({
  posts,
  onAbrir,
  onNovo,
  onResultado,
}: {
  posts: Post[];
  onAbrir: (p: Post) => void;
  onNovo: (c: CamposConteudo) => void;
  onResultado: (p: Post) => void;
}) {
  const [periodo, setPeriodo] = useState("4semanas");
  const [tipo, setTipo] = useState<string[]>([]);
  const [formato, setFormato] = useState<string[]>([]);
  const [ordem, setOrdem] = useState<{ chave: string; desc: boolean }>({ chave: "pontuacao", desc: true });

  const filtrados = useMemo(() => {
    const r = intervalo(periodo);
    return posts.filter((p) => {
      if (p.status !== "publicado") return false;
      const d = p.data_post.slice(0, 10);
      if (r && (d < r[0] || d > r[1])) return false;
      if (tipo[0] && p.tipo_cqc !== tipo[0]) return false;
      if (formato[0] && p.formato !== formato[0]) return false;
      return true;
    });
  }, [posts, periodo, tipo, formato]);

  const ranking = useMemo(
    () => filtrados.filter((p) => pontuacao(p) != null).sort((a, b) => (pontuacao(b) ?? 0) - (pontuacao(a) ?? 0)),
    [filtrados],
  );
  const campeao = ranking[0];

  const ordenados = useMemo(() => {
    const col = COLUNAS.find((c) => c.chave === ordem.chave) ?? COLUNAS[0]!;
    return [...filtrados].sort((a, b) => {
      const x = col.valor(a), y = col.valor(b);
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "pt-BR");
      return ordem.desc ? -c : c;
    });
  }, [filtrados, ordem]);

  const medias = (chave: "tipo_cqc" | "formato", opcoes: { valor: string; rotulo: string }[]) => {
    const l = opcoes.map((o) => {
      const ps = ranking.filter((p) => p[chave] === o.valor);
      return { ...o, qtd: ps.length, media: ps.length ? Math.round(ps.reduce((s, p) => s + (pontuacao(p) ?? 0), 0) / ps.length) : null };
    });
    const melhor = Math.max(...l.map((x) => x.media ?? -1));
    return l.map((x) => ({ ...x, melhor: x.media != null && x.media === melhor && melhor > 0 }));
  };
  const porTipo = medias("tipo_cqc", TIPOS_ACERVO.map((t) => ({ valor: t.valor, rotulo: `${t.emoji} ${t.rotulo}` })));
  const porFormato = medias("formato", FORMATOS.map((f) => ({ ...f })));

  const replicar = (p: Post) =>
    onNovo({
      titulo: `Replicar: ${p.titulo ?? "post"}`,
      tipo_cqc: p.tipo_cqc,
      formato: p.formato,
      plataforma: p.plataforma,
      status: "nao_roteirizado",
      data_post: hojeSaoPaulo(),
      sobre_video: p.link ? `Referência: ${p.link}` : null,
    });

  const tipoNome = (v: string | null) => tipoAcervo(v ?? "")?.rotulo.toLowerCase() ?? "esse tipo";
  const formatoNome = (v: string | null) => nomeFormato(v)?.toLowerCase() ?? "esse formato";

  return (
    <div>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <DropdownFiltro rotulo="Período" valor={[periodo]} semTodos opcoes={PERIODOS} onChange={(v) => setPeriodo(v[0] ?? "4semanas")} />
        <DropdownFiltro rotulo="Tipo de conteúdo" valor={tipo} onChange={setTipo} opcoes={TIPOS_ACERVO.map((t) => ({ valor: t.valor, rotulo: `${t.emoji} ${t.rotulo}` }))} />
        <DropdownFiltro rotulo="Formato" valor={formato} onChange={setFormato} opcoes={FORMATOS.map((f) => ({ ...f }))} />
      </div>

      {campeao ? (
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <section className="hero-metodo lg:col-span-2">
            <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
              <Trophy className="size-4" /> Seu conteúdo campeão
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild><button aria-label="Como a pontuação é calculada"><Info className="size-4" /></button></TooltipTrigger>
                  <TooltipContent className="max-w-xs">Pontuação: views + curtidas + 3 × comentários + 5 × (compartilhamentos + salvamentos) + 10 × visitas ao perfil + 20 × seguidores ganhos. Seguidor ganho e visita ao perfil pesam mais porque aproximam da venda.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <h2 className="mt-2 text-[24px] font-semibold leading-tight">{campeao.titulo || "Post sem título"}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <ChipTipo valor={campeao.tipo_cqc} />
              <ChipFormato valor={campeao.formato} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["Views", campeao.views], ["Seguidores", campeao.seguidores_ganhos], ["Visitas ao perfil", campeao.visitas_perfil], ["Pontuação", pontuacao(campeao)]].map(([r, v]) => (
                <div key={r as string}>
                  <p className="text-xs text-primary-foreground/70">{r}</p>
                  <p className="text-xl font-semibold">{num(v as number | null)}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-primary-foreground/90">
              Seu conteúdo que mais performou foi "{campeao.titulo || "sem título"}": {tipoNome(campeao.tipo_cqc)} em {formatoNome(campeao.formato)}, com {num(campeao.views ?? 0)} views e {num(campeao.seguidores_ganhos ?? 0)} seguidores ganhos. Replica: faz mais {tipoNome(campeao.tipo_cqc)} em {formatoNome(campeao.formato)} essa semana.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {campeao.link ? (
                <a href={campeao.link} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-primary-foreground/40 px-4 text-sm font-semibold hover:bg-primary-foreground/10">
                  Ver post <ExternalLink className="size-3.5" />
                </a>
              ) : null}
              <button onClick={() => replicar(campeao)} className="h-10 rounded-xl bg-surface px-4 text-sm font-semibold text-primary hover:bg-accent-soft">Replicar no calendário</button>
            </div>
          </section>
          <div className="grid gap-3">
            {ranking.slice(1, 3).map((p, i) => (
              <button key={p.id} onClick={() => onAbrir(p)} className="card-metodo p-4 text-left hover:border-primary">
                <p className="text-xs font-semibold text-muted-foreground">{i + 2}º lugar</p>
                <p className="mt-1 line-clamp-1 font-semibold">{p.titulo || "Sem título"}</p>
                <div className="mt-2 flex flex-wrap gap-1.5"><ChipTipo valor={p.tipo_cqc} pequeno /><ChipFormato valor={p.formato} pequeno /></div>
                <p className="mt-2 text-xs text-muted-foreground">{num(p.views)} views · {num(pontuacao(p))} pontos</p>
              </button>
            ))}
            {ranking.length < 2 ? <div className="card-metodo p-4 text-sm text-muted-foreground">O top 3 aparece quando você tiver mais posts com resultados.</div> : null}
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl bg-accent-soft px-5 py-4 text-sm">
          Assim que você preencher os resultados dos seus posts, eu te mostro qual performou melhor pra você replicar.
        </div>
      )}

      {ranking.length ? (
        <section className="card-metodo mb-6 p-5">
          <h2 className="font-semibold">O que mais funciona pra você</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {[["Por tipo de conteúdo", porTipo], ["Por formato", porFormato]].map(([t, l]) => (
              <div key={t as string}>
                <p className="mb-2 text-xs font-medium text-muted-foreground">{t as string}</p>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    {(l as typeof porTipo).map((x) => (
                      <tr key={x.valor} className={cn(x.melhor && "font-semibold text-primary")}>
                        <td className="py-2">{x.rotulo}{x.melhor ? " 🏆" : ""}</td>
                        <td className="py-2 text-right text-xs text-muted-foreground">{x.qtd} {x.qtd === 1 ? "post" : "posts"}</td>
                        <td className="py-2 text-right">{x.media != null ? `${formatarNumero(x.media)} pts` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {filtrados.length === 0 ? (
        <EstadoVazio titulo="Nenhum post publicado nesse período" texto="Quando você marcar um conteúdo como Publicado, ele aparece aqui." />
      ) : (
        <div className="card-metodo overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                {COLUNAS.map((c) => (
                  <th key={c.chave} className={cn("whitespace-nowrap p-3", c.num && "text-right")}>
                    <button
                      onClick={() => setOrdem((o) => ({ chave: c.chave, desc: o.chave === c.chave ? !o.desc : true }))}
                      className={cn("inline-flex items-center gap-1 hover:text-primary", ordem.chave === c.chave && "font-semibold text-foreground")}
                    >
                      {c.rotulo}
                      {ordem.chave === c.chave ? (ordem.desc ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />) : null}
                    </button>
                  </th>
                ))}
                <th className="p-3">Resultados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ordenados.map((p) => {
                const faltam = diasParaResultado(p.data_post);
                return (
                  <tr key={p.id} className="hover:bg-muted">
                    <td className="whitespace-nowrap p-3">{dataBR(p.data_post)}</td>
                    <td className="max-w-[220px] p-3">
                      <button onClick={() => onAbrir(p)} className="line-clamp-1 text-left font-medium hover:text-primary hover:underline">
                        {campeao?.id === p.id ? "🏆 " : ""}{p.titulo || "Sem título"}
                      </button>
                    </td>
                    <td className="p-3"><ChipTipo valor={p.tipo_cqc} pequeno /></td>
                    <td className="p-3"><ChipFormato valor={p.formato} pequeno /></td>
                    <td className="whitespace-nowrap p-3">{p.plataforma ? nomePlataforma(p.plataforma) : "-"}</td>
                    {COLUNAS.filter((c) => c.num).map((c) => (
                      <td key={c.chave} className={cn("p-3 text-right tabular-nums", c.chave === "pontuacao" && "font-semibold")}>{num(c.valor(p) as number | null)}</td>
                    ))}
                    <td className="whitespace-nowrap p-3">
                      {p.metricas_atualizadas_em ? (
                        <button onClick={() => onResultado(p)} aria-label="Editar resultados" className="inline-flex size-7 items-center justify-center rounded-full bg-success-soft text-success hover:opacity-80"><Check className="size-4" strokeWidth={3} /></button>
                      ) : faltam > 0 ? (
                        <span className="text-xs text-muted-foreground">Em {faltam} {faltam === 1 ? "dia" : "dias"}</span>
                      ) : (
                        <button onClick={() => onResultado(p)} className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary-hover">Preencher</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
