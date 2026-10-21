import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Lightbulb } from "lucide-react";
import { useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { PaginaTopo } from "@/components/PaginaTopo";
import { Anel } from "@/components/metodo/visual";
import { supabase } from "@/integrations/metodo/client";
import { useAluna } from "@/lib/aluna";
import { analisarSite } from "@/lib/ferramentas.functions";
import { formatarData } from "@/lib/formato";

export const Route = createFileRoute("/ferramentas/analisador")({
  head: () => ({
    meta: [
      { title: "Analisador de site | Método" },
      { name: "description", content: "Cole a URL da sua loja e receba uma nota de 0 a 100 com melhorias." },
      { property: "og:title", content: "Analisador de site | Método" },
      { property: "og:description", content: "Cole a URL da sua loja e receba uma nota de 0 a 100 com melhorias." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Analisador,
});

type Detalhes = { resumo?: string; pontos_fortes?: string[]; melhorias?: string[] };
type Analise = { id: number; url: string; nota: number; detalhes: Detalhes | null; created_at: string };

function Resultado({ nota, detalhes }: { nota: number; detalhes: Detalhes }) {
  return (
    <div className="card-metodo mb-6 p-5">
      <div className="flex flex-wrap items-center gap-5">
        <Anel valor={nota}><span className="text-2xl font-semibold">{nota}</span></Anel>
        <p className="min-w-0 flex-1 text-sm">{detalhes.resumo}</p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 font-semibold">Pontos fortes</h3>
          <ul className="space-y-2 text-sm">
            {(detalhes.pontos_fortes ?? []).map((p) => (
              <li key={p} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">O que melhorar</h3>
          <ul className="space-y-2 text-sm">
            {(detalhes.melhorias ?? []).map((p) => (
              <li key={p} className="flex gap-2"><Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />{p}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Analisador() {
  const { sessao } = useAluna();
  const qc = useQueryClient();
  const analisar = useServerFn(analisarSite);
  const [url, setUrl] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [atual, setAtual] = useState<{ nota: number; detalhes: Detalhes } | null>(null);

  const historico = useQuery({
    queryKey: ["analises", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const { data } = await supabase.from("analises_site").select("id, url, nota, detalhes, created_at").order("created_at", { ascending: false }).limit(20);
      return (data ?? []) as Analise[];
    },
  });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessao) return;
    let u = url.trim();
    if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
    setErro("");
    setAtual(null);
    setCarregando(true);
    try {
      const r = await analisar({ data: { token: sessao.access_token, url: u } });
      if ("erro" in r && r.erro) setErro(r.erro);
      else if ("nota" in r) setAtual({ nota: r.nota, detalhes: r.detalhes });
      qc.invalidateQueries({ queryKey: ["analises"] });
    } catch {
      setErro("Confira o endereço. Ele precisa ser algo como https://sualoja.com.br");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <AppLayout>
      <PaginaTopo titulo="Analisador de site" subtitulo="Cole o endereço da sua loja e receba uma nota de 0 a 100." />
      <form onSubmit={enviar} className="card-metodo mb-6 flex flex-col gap-3 p-5 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://sualoja.com.br"
          required
          className="h-11 flex-1 rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary"
        />
        <button disabled={carregando} className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">
          {carregando ? "Analisando..." : "Analisar"}
        </button>
      </form>
      {erro ? <p className="mb-6 text-sm text-destructive">{erro}</p> : null}
      {atual ? <Resultado nota={atual.nota} detalhes={atual.detalhes} /> : null}

      <h2 className="mb-3 font-semibold">Histórico</h2>
      {(historico.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma análise ainda.</p>
      ) : (
        <div className="card-metodo divide-y divide-border">
          {historico.data!.map((a) => (
            <button key={a.id} onClick={() => setAtual({ nota: a.nota, detalhes: a.detalhes ?? {} })} className="flex w-full items-center gap-4 p-4 text-left hover:bg-accent-soft">
              <span className="text-lg font-semibold text-primary">{a.nota}</span>
              <span className="min-w-0 flex-1 truncate text-sm">{a.url}</span>
              <span className="text-xs text-muted-foreground">{formatarData(a.created_at)}</span>
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
