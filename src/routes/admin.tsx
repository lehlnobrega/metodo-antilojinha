import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AbaAcervo } from "@/components/admin/acervo";
import { CadastroAluna, FichaAluna, type ResumoAluna, semAcessar, situacao, vencendo } from "@/components/admin/alunas";
import { AbaBonus, AbaFormatos, Cabecalho } from "@/components/admin/extras";
import { AbaMateriais } from "@/components/admin/materiais";
import { AbaAulas, AbaIndicacoes } from "@/components/admin/gerenciar";
import { AppLayout } from "@/components/layout/AppLayout";
import { EstadoVazio } from "@/components/PaginaTopo";
import { Barra } from "@/components/metodo/visual";
import { CardOverlay } from "@/components/metodo/overlay";
import { HistoricoDiagnosticos } from "@/components/metodo/diagnostico";
import { useModulos } from "@/lib/dados";
import { useDiagnosticos } from "@/lib/dados-loja";
import { supabase } from "@/integrations/metodo/client";
import { useAluna } from "@/lib/aluna";
import { formatarData, formatarMoeda } from "@/lib/formato";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel admin | Método" },
      { name: "description", content: "Acompanhamento das alunas, pesquisas e conteúdos da turma." },
      { property: "og:title", content: "Painel admin | Método" },
      { property: "og:description", content: "Acompanhamento das alunas, pesquisas e conteúdos da turma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});


type ResumoPesquisa = { ordem: number; chave: string; texto: string; opcao: string; total: number; percentual: number };
type PesquisaAluna = { aluna_id: string; nome: string | null; email: string; respondida_em: string | null; respostas: Record<string, unknown> | null };

const ABAS = ["Visão geral", "Alunas", "Pesquisas", "Materiais de apoio", "Bônus", "Ideias de conteúdo", "Formatos virais", "Aulas ao vivo", "Indicações"] as const;
const FILTROS = ["Todas", "Ativas", "Paradas", "Acesso vencendo", "Pausadas"] as const;
const dataOuTraco = (v: string | null) => (v ? formatarData(v) : "-");

function useView<T>(nome: string, ativo: boolean) {
  return useQuery({
    queryKey: ["admin", nome],
    enabled: ativo,
    queryFn: async () => {
      const { data, error } = await supabase.from(nome).select("*");
      if (error) throw new Error(error.message);
      return (data ?? []) as T[];
    },
  });
}

function Admin() {
  const { aluna } = useAluna();
  const isAdmin = Boolean(aluna?.is_admin);
  const [aba, setAbaEstado] = useState<(typeof ABAS)[number]>("Visão geral");
  const setAba = (a: (typeof ABAS)[number]) => {
    setAbaEstado(a);
    sessionStorage.setItem("admin-aba", a);
  };
  useEffect(() => {
    const salva = sessionStorage.getItem("admin-aba");
    if (salva && (ABAS as readonly string[]).includes(salva)) setAbaEstado(salva as (typeof ABAS)[number]);
  }, []);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("Todas");
  const [ficha, setFicha] = useState<ResumoAluna | null>(null);
  const [aberta, setAberta] = useState<ResumoAluna | null>(null);
  const [cadastro, setCadastro] = useState(false);
  const alunas = useView<ResumoAluna>("admin_resumo_alunas", isAdmin);
  const resumo = useView<ResumoPesquisa>("admin_pesquisa_resumo", isAdmin);
  const pesquisas = useView<PesquisaAluna>("admin_pesquisas", isAdmin);

  const lista = alunas.data ?? [];
  const filtradas = useMemo(() => {
    const b = busca.toLowerCase().trim();
    return lista
      .filter((a) => !b || `${a.nome ?? ""} ${a.email}`.toLowerCase().includes(b))
      .filter((a) => {
        const st = situacao(a).texto;
        if (filtro === "Ativas") return st === "Ativa";
        if (filtro === "Paradas") return a.status !== "pausada" && semAcessar(a);
        if (filtro === "Acesso vencendo") return vencendo(a);
        if (filtro === "Pausadas") return a.status === "pausada";
        return true;
      })
      .sort((x, y) => (y.progresso_pct ?? 0) - (x.progresso_pct ?? 0));
  }, [lista, busca, filtro]);

  const perguntas = useMemo(() => {
    const m = new Map<string, { texto: string; ordem: number; opcoes: ResumoPesquisa[] }>();
    for (const r of resumo.data ?? []) {
      const g = m.get(r.chave) ?? { texto: r.texto, ordem: r.ordem, opcoes: [] };
      g.opcoes.push(r);
      m.set(r.chave, g);
    }
    return [...m.values()].sort((a, b) => a.ordem - b.ordem);
  }, [resumo.data]);

  if (aluna && !isAdmin) {
    return (
      <AppLayout>
        <EstadoVazio titulo="Área restrita" texto="Essa página é só para a equipe do Método." acao={<Link to="/" className="text-sm font-medium text-primary hover:underline">Voltar ao início</Link>} />
      </AppLayout>
    );
  }

  const ativas = lista.filter((a) => a.acesso_ate && new Date(a.acesso_ate) >= new Date()).length;
  const postaram = lista.filter((a) => (a.posts_7_dias ?? 0) > 0).length;
  const media = lista.length ? Math.round(lista.reduce((s, a) => s + (a.progresso_pct ?? 0), 0) / lista.length) : 0;
  const pesquisaFeita = lista.filter((a) => a.pesquisa_concluida).length;
  const semAcesso7 = lista.filter((a) => !a.ultimo_acesso || Date.now() - new Date(a.ultimo_acesso).getTime() > 7 * 864e5);

  return (
    <AppLayout>
      <FichaDiagnosticos aluna={ficha} onFechar={() => setFicha(null)} />
      <FichaAluna
        aluna={aberta}
        respostas={(pesquisas.data ?? []).find((x) => x.aluna_id === aberta?.id)?.respostas ?? null}
        onFechar={() => setAberta(null)}
        onDiagnosticos={() => { setFicha(aberta); setAberta(null); }}
      />
      <CadastroAluna aberto={cadastro} onFechar={() => setCadastro(false)} />
      <p className="-mt-3 mb-6 text-[15px] text-muted-foreground">Só você vê esta tela. A turma inteira em um lugar só.</p>
      <div className="grid items-start gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
      <nav aria-label="Seções do admin" className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-surface p-2 sm:grid-cols-3 lg:sticky lg:top-[72px] lg:grid-cols-1">
        {ABAS.map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            aria-current={aba === a ? "page" : undefined}
            className={cn("rounded-xl px-3 py-2 text-left text-[13.5px] font-medium transition-colors", aba === a ? "bg-accent-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
          >
            {a}
          </button>
        ))}
      </nav>
      <div className="min-w-0">

      {alunas.isError ? <p className="mb-4 text-sm text-destructive">Não foi possível carregar: {alunas.error.message}</p> : null}
      {alunas.isLoading && (aba === "Visão geral" || aba === "Alunas") ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}

      {aba === "Visão geral" && !alunas.isLoading ? (
        <>
          <Cabecalho titulo="Visão geral" texto="Como a turma está andando agora." />
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {[
              ["Alunas", lista.length],
              ["Com acesso ativo", ativas],
              ["Postaram nos últimos 7 dias", postaram],
              ["Progresso médio", `${media}%`],
              ["Pesquisa respondida", pesquisaFeita],
            ].map(([r, v]) => (
              <div key={r} className="card-metodo p-4">
                <p className="text-xs text-muted-foreground">{r}</p>
                <p className="mt-1 text-2xl font-semibold">{v}</p>
              </div>
            ))}
          </div>
          <div className="card-metodo p-5">
            <h2 className="font-semibold">Sem entrar há mais de 7 dias ({semAcesso7.length})</h2>
            {semAcesso7.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Todas entraram nessa semana.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border text-sm">
                {semAcesso7.slice(0, 20).map((a) => (
                  <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <button onClick={() => setAberta(a)} className="font-medium hover:text-primary">{a.nome ?? a.email}</button>
                    <span className="text-muted-foreground">Último acesso: {dataOuTraco(a.ultimo_acesso)}{a.telefone ? ` · ${a.telefone}` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}

      {aba === "Alunas" && !alunas.isLoading ? (
        <>
          <Cabecalho
            titulo="Alunas"
            texto="Clica numa aluna pra ver a ficha, renovar, pausar ou reenviar o acesso."
            acao={<button onClick={() => setCadastro(true)} className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">+ Cadastrar aluna</button>}
          />
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {FILTROS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={cn("rounded-full border px-3 py-1.5 text-[12.5px] font-medium", filtro === f ? "border-primary bg-accent-soft text-primary" : "border-border bg-surface text-muted-foreground hover:text-foreground")}
                >
                  {f}
                </button>
              ))}
            </div>
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail" className="h-10 w-full max-w-xs rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary" />
          </div>
          <div className="card-metodo overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Aluna</th><th className="p-3">Situação</th><th className="p-3">Progresso</th><th className="p-3">Módulo</th>
                  <th className="p-3">Posts 7 dias</th><th className="p-3">Acesso até</th><th className="p-3">Último acesso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtradas.map((a) => {
                  const st = situacao(a);
                  return (
                    <tr key={a.id} onClick={() => setAberta(a)} className="cursor-pointer hover:bg-muted/60">
                      <td className="p-3"><p className="font-medium">{a.nome ?? "-"}</p><p className="text-xs text-muted-foreground">{a.email}</p></td>
                      <td className="p-3"><span className={cn("whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", st.cls)}>{st.texto}</span></td>
                      <td className="w-36 p-3"><Barra valor={a.progresso_pct ?? 0} /><span className="text-xs tabular-nums">{Math.round(a.progresso_pct ?? 0)}%</span></td>
                      <td className="p-3">{a.modulo_atual ?? "-"}</td>
                      <td className="p-3 tabular-nums">{a.posts_7_dias ?? 0}</td>
                      <td className="p-3">{dataOuTraco(a.acesso_ate)}</td>
                      <td className="p-3">{dataOuTraco(a.ultimo_acesso)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtradas.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nenhuma aluna com esse filtro.</p> : null}
          </div>
        </>
      ) : null}

      {aba === "Aulas ao vivo" ? <><Cabecalho titulo="Aulas ao vivo" texto="Aparecem no Início das alunas, com os botões de adicionar ao calendário." /><AbaAulas /></> : null}
      {aba === "Indicações" ? <><Cabecalho titulo="Indicações" texto="Produtos e apps da aba Indicações. Os cliques ficam contados." /><AbaIndicacoes /></> : null}
      {aba === "Ideias de conteúdo" ? <><Cabecalho titulo="Ideias de conteúdo" texto="Cada ideia tem nicho, tipo do CQC, formato, o seu por que funciona e o link de referência." /><AbaAcervo /></> : null}
      {aba === "Formatos virais" ? <AbaFormatos /> : null}
      {aba === "Bônus" ? <AbaBonus /> : null}
      {aba === "Materiais de apoio" ? <><Cabecalho titulo="Materiais de apoio" texto="Os materiais de cada módulo. Material em rascunho não aparece pras alunas." /><AbaMateriais /></> : null}

      {aba === "Pesquisas" ? (
        <div className="space-y-4">
          <Cabecalho titulo="Pesquisas" texto="Respostas da pesquisa do primeiro login, somando a turma toda." />
          {perguntas.map((p) => (
            <div key={p.texto} className="card-metodo p-5">
              <h3 className="font-semibold first-letter:uppercase">{p.texto}</h3>
              <div className="mt-3 space-y-2">
                {p.opcoes.sort((a, b) => b.total - a.total).map((o) => (
                  <div key={o.opcao}>
                    <div className="flex justify-between text-sm"><span className="first-letter:uppercase">{o.opcao}</span><span className="text-muted-foreground">{o.total} ({Math.round(o.percentual)}%)</span></div>
                    <Barra valor={o.percentual} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="card-metodo p-5">
            <h3 className="font-semibold">Respostas individuais</h3>
            {(pesquisas.data ?? []).filter((x) => x.respostas).length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nenhuma resposta ainda.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {(pesquisas.data ?? []).filter((x) => x.respostas).map((x) => (
                  <details key={x.aluna_id} className="rounded-xl border border-border p-3">
                    <summary className="cursor-pointer text-sm font-medium">{x.nome ?? x.email} <span className="font-normal text-muted-foreground">· {dataOuTraco(x.respondida_em)}</span></summary>
                    <dl className="mt-2 space-y-1 text-sm">
                      {Object.entries(x.respostas ?? {}).map(([k, v]) => (
                        <div key={k}><dt className="text-xs text-muted-foreground">{k.replace(/_/g, " ")}</dt><dd>{Array.isArray(v) ? v.join(", ") : String(v)}</dd></div>
                      ))}
                    </dl>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
      </div>
      </div>
    </AppLayout>
  );
}

function FichaDiagnosticos({ aluna, onFechar }: { aluna: ResumoAluna | null; onFechar: () => void }) {
  const diags = useDiagnosticos(aluna?.id ?? "");
  const modulos = useModulos();
  return (
    <CardOverlay aberto={Boolean(aluna)} onFechar={onFechar} largo titulo="Diagnósticos" subtitulo={aluna?.nome ?? aluna?.email ?? ""}>
      {diags.isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : <HistoricoDiagnosticos diagnosticos={diags.data ?? []} modulos={modulos.data ?? []} />}
    </CardOverlay>
  );
}
