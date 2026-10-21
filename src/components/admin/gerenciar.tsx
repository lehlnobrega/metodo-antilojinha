// Abas do admin: aulas ao vivo e indicações (o RLS libera escrita só para admin).
import { semVazios } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  BotaoPrimario,
  BotaoSecundario,
  CardOverlay,
  Interruptor,
  Pilulas,
  Rotulo,
  SelectMetodo,
  SeletorData,
  SeletorHora,
  SeletorMes,
  inputCls,
  textareaCls,
} from "@/components/metodo/overlay";
import { supabase } from "@/integrations/metodo/client";
import { FUSO } from "@/config";
import { hojeSaoPaulo } from "@/lib/formato";
import type { Categoria } from "@/lib/dados-loja";

function falha(e: unknown): never {
  throw new Error((e as { message?: string })?.message ?? "Erro");
}

// ---------------- Aulas ao vivo ----------------
type AulaAdmin = { id: number; titulo: string; descricao: string | null; data_hora: string; link: string; ativo: boolean };

function spPartes(iso: string) {
  const p: { [k: string]: string } = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  const h = p["hour"] === "24" ? "00" : p["hour"];
  return { data: `${p["year"]}-${p["month"]}-${p["day"]}`, hora: `${h}:${p["minute"]}` };
}
/** Data e hora de São Paulo (UTC-3) para ISO. */
const paraIso = (data: string, hora: string) => new Date(`${data}T${hora}:00-03:00`).toISOString();

export function AbaAulas() {
  const qc = useQueryClient();
  const [mes, setMes] = useState(hojeSaoPaulo().slice(0, 7));
  const [filtrar, setFiltrar] = useState(false);
  const [edit, setEdit] = useState<Partial<AulaAdmin> | null>(null);
  const aulas = useQuery({
    queryKey: ["admin", "aulas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("aulas_ao_vivo").select("id, titulo, descricao, data_hora, link, ativo").order("data_hora", { ascending: false });
      if (error) falha(error);
      return (data ?? []) as AulaAdmin[];
    },
  });
  const alterar = useMutation({
    mutationFn: async ({ id, ...c }: Partial<AulaAdmin> & { id?: number }) => {
      const { error } = id ? await supabase.from("aulas_ao_vivo").update(c).eq("id", id) : await supabase.from("aulas_ao_vivo").insert(semVazios(c));
      if (error) falha(error);
    },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["admin", "aulas"] }); qc.invalidateQueries({ queryKey: ["aulas"] }); },
  });
  const excluir = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("aulas_ao_vivo").delete().eq("id", id);
      if (error) falha(error);
    },
    onSettled: () => { qc.invalidateQueries({ queryKey: ["admin", "aulas"] }); qc.invalidateQueries({ queryKey: ["aulas"] }); },
  });

  const lista = (aulas.data ?? []).filter((a) => !filtrar || spPartes(a.data_hora).data.startsWith(mes));
  return (
    <>
      <CardAula aula={edit} onFechar={() => setEdit(null)} salvar={alterar.mutateAsync} salvando={alterar.isPending} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <BotaoPrimario onClick={() => setEdit({})} className="inline-flex items-center gap-2"><Plus className="size-4" /> Nova aula ao vivo</BotaoPrimario>
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm"><Interruptor ligado={filtrar} onChange={setFiltrar} rotulo="Filtrar por mês" /> Filtrar por mês</label>
          {filtrar ? <div className="w-52"><SeletorMes valor={mes} onChange={setMes} /></div> : null}
        </div>
      </div>
      <div className="card-metodo overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr><th className="p-3">Data e hora</th><th className="p-3">Título</th><th className="p-3">Link</th><th className="p-3">Ativo</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lista.map((a) => {
              const p = spPartes(a.data_hora);
              return (
                <tr key={a.id}>
                  <td className="p-3 font-medium">{p.data.split("-").reverse().join("/")}, {p.hora}</td>
                  <td className="p-3">{a.titulo}</td>
                  <td className="max-w-[220px] truncate p-3"><a href={a.link} target="_blank" rel="noreferrer" className="text-primary hover:underline">{a.link}</a></td>
                  <td className="p-3"><Interruptor ligado={a.ativo} rotulo="Ativo" onChange={(v) => alterar.mutate({ id: a.id, ativo: v }, { onError: (e) => toast.error(e.message) })} /></td>
                  <td className="whitespace-nowrap p-3 text-right">
                    <button onClick={() => setEdit(a)} aria-label="Editar" className="rounded-lg p-2 text-muted-foreground hover:text-primary"><Pencil className="size-4" /></button>
                    <button onClick={() => { if (confirm(`Excluir a aula "${a.titulo}"?`)) excluir.mutate(a.id, { onError: (e) => toast.error(e.message) }); }} aria-label="Excluir" className="rounded-lg p-2 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {aulas.isLoading ? <p className="p-4 text-sm text-muted-foreground">Carregando...</p> : lista.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nenhuma aula ao vivo cadastrada.</p> : null}
        {aulas.isError ? <p className="p-4 text-sm text-destructive">{aulas.error.message}</p> : null}
      </div>
    </>
  );
}

function CardAula({ aula, onFechar, salvar, salvando }: { aula: Partial<AulaAdmin> | null; onFechar: () => void; salvar: (a: Partial<AulaAdmin>) => Promise<void>; salvando: boolean }) {
  const [f, setF] = useState({ titulo: "", descricao: "", data: "", hora: "", link: "", ativo: true });
  const [orig, setOrig] = useState("");
  useEffect(() => {
    if (!aula) return;
    const p = aula.data_hora ? spPartes(aula.data_hora) : { data: "", hora: "19:00" };
    const v = { titulo: aula.titulo ?? "", descricao: aula.descricao ?? "", data: p.data, hora: p.hora, link: aula.link ?? "", ativo: aula.ativo ?? true };
    setF(v);
    setOrig(JSON.stringify(v));
  }, [aula]);
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.titulo.trim() || !f.data || !f.hora || !f.link.trim()) {
      toast.error("Preencha título, data, hora e link.");
      return;
    }
    try {
      await salvar({ ...(aula?.id ? { id: aula.id } : {}), titulo: f.titulo.trim(), descricao: f.descricao.trim() || null, data_hora: paraIso(f.data, f.hora), link: f.link.trim(), ativo: f.ativo });
      toast.success("Aula salva");
      onFechar();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  return (
    <CardOverlay
      aberto={Boolean(aula)}
      onFechar={onFechar}
      sujo={JSON.stringify(f) !== orig}
      titulo={aula?.id ? "Editar aula ao vivo" : "Nova aula ao vivo"}
      subtitulo="Aparece no Início das alunas no mês da aula."
      rodape={<><BotaoSecundario onClick={onFechar}>Cancelar</BotaoSecundario><BotaoPrimario type="submit" form="form-aula" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</BotaoPrimario></>}
    >
      <form id="form-aula" onSubmit={enviar} className="space-y-4">
        <Rotulo texto="Título" obrigatorio><input value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} className={inputCls} /></Rotulo>
        <Rotulo texto="Descrição"><textarea value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} className={textareaCls} /></Rotulo>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><span className="text-[13px] font-medium">Data <span className="text-primary">*</span></span><SeletorData valor={f.data} onChange={(v) => setF({ ...f, data: v })} /></div>
          <div className="space-y-1.5"><span className="text-[13px] font-medium">Hora <span className="text-primary">*</span></span><SeletorHora valor={f.hora} onChange={(v) => setF({ ...f, hora: v })} /></div>
        </div>
        <Rotulo texto="Link da aula" obrigatorio><input value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="https://" className={inputCls} /></Rotulo>
        <label className="flex items-center gap-3 text-sm"><Interruptor ligado={f.ativo} onChange={(v) => setF({ ...f, ativo: v })} rotulo="Ativo" /> Ativa (visível para as alunas)</label>
      </form>
    </CardOverlay>
  );
}

// ---------------- Indicações ----------------
type IndAdmin = { id: number; categoria: "produto" | "app"; titulo: string; descricao: string | null; url: string; imagem_url: string | null; ordem: number; ativo: boolean; subcategoria_id: number | null };

export function AbaIndicacoes() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Partial<IndAdmin> | null>(null);
  const inds = useQuery({
    queryKey: ["admin", "indicacoes"],
    queryFn: async () => {
      const [i, c] = await Promise.all([
        supabase.from("indicacoes").select("id, categoria, titulo, descricao, url, imagem_url, ordem, ativo, subcategoria_id").order("categoria").order("ordem"),
        supabase.from("cliques_indicacoes").select("indicacao_id"),
      ]);
      if (i.error) falha(i.error);
      const cliques = new Map<number, number>();
      for (const r of (c.data ?? []) as { indicacao_id: number }[]) cliques.set(r.indicacao_id, (cliques.get(r.indicacao_id) ?? 0) + 1);
      return { lista: (i.data ?? []) as IndAdmin[], cliques };
    },
  });
  const cats = useQuery({
    queryKey: ["admin", "categorias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categorias_indicacoes").select("id, tipo, nome, ordem").order("ordem");
      if (error) falha(error);
      return (data ?? []) as Categoria[];
    },
  });
  const inval = () => {
    for (const k of ["indicacoes", "categorias-indicacoes", "admin"]) void qc.invalidateQueries({ queryKey: [k] });
  };

  const salvarInd = useMutation({
    mutationFn: async ({ id, ...c }: Partial<IndAdmin>) => {
      const { error } = id ? await supabase.from("indicacoes").update(c).eq("id", id) : await supabase.from("indicacoes").insert(semVazios(c));
      if (error) falha(error);
    },
    onSettled: inval,
  });
  const excluirInd = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("indicacoes").delete().eq("id", id);
      if (error) falha(error);
    },
    onSettled: inval,
  });

  const nomeCat = new Map((cats.data ?? []).map((c) => [c.id, c.nome]));
  return (
    <>
      <CardIndicacao ind={edit} cats={cats.data ?? []} onFechar={() => setEdit(null)} salvar={salvarInd.mutateAsync} salvando={salvarInd.isPending} onCategoriaCriada={inval} />
      <div className="mb-4"><BotaoPrimario onClick={() => setEdit({})} className="inline-flex items-center gap-2"><Plus className="size-4" /> Nova indicação</BotaoPrimario></div>
      <div className="card-metodo mb-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr><th className="p-3">Imagem</th><th className="p-3">Título</th><th className="p-3">Tipo</th><th className="p-3">Subcategoria</th><th className="p-3">Cliques</th><th className="p-3">Ativo</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(inds.data?.lista ?? []).map((i) => (
              <tr key={i.id}>
                <td className="p-3">{i.imagem_url ? <img src={i.imagem_url} alt="" className="size-10 rounded-lg object-cover" /> : <span className="block size-10 rounded-lg bg-accent-soft" />}</td>
                <td className="p-3 font-medium">{i.titulo}</td>
                <td className="p-3">{i.categoria === "app" ? "App" : "Produto"}</td>
                <td className="p-3">{i.subcategoria_id ? nomeCat.get(i.subcategoria_id) ?? "-" : "-"}</td>
                <td className="p-3">{inds.data?.cliques.get(i.id) ?? 0}</td>
                <td className="p-3"><Interruptor ligado={i.ativo} rotulo="Ativo" onChange={(v) => salvarInd.mutate({ id: i.id, ativo: v }, { onError: (e) => toast.error(e.message) })} /></td>
                <td className="whitespace-nowrap p-3 text-right">
                  <button onClick={() => setEdit(i)} aria-label="Editar" className="rounded-lg p-2 text-muted-foreground hover:text-primary"><Pencil className="size-4" /></button>
                  <button onClick={() => { if (confirm(`Excluir "${i.titulo}"?`)) excluirInd.mutate(i.id, { onError: (e) => toast.error(e.message) }); }} aria-label="Excluir" className="rounded-lg p-2 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {inds.isLoading ? <p className="p-4 text-sm text-muted-foreground">Carregando...</p> : (inds.data?.lista.length ?? 0) === 0 ? <p className="p-4 text-sm text-muted-foreground">Nenhuma indicação ainda.</p> : null}
        {inds.isError ? <p className="p-4 text-sm text-destructive">{inds.error.message}</p> : null}
      </div>
      <Subcategorias cats={cats.data ?? []} onMudou={inval} />
    </>
  );
}

function Subcategorias({ cats, onMudou }: { cats: Categoria[]; onMudou: () => void }) {
  const exec = async (fn: () => PromiseLike<{ error: unknown }>) => {
    const { error } = await fn();
    if (error) toast.error((error as { message: string }).message);
    onMudou();
  };
  return (
    <div className="card-metodo p-5">
      <h2 className="titulo-card">Subcategorias</h2>
      <div className="mt-3 grid gap-6 md:grid-cols-2">
        {(["produto", "app"] as const).map((tipo) => {
          const lista = cats.filter((c) => c.tipo === tipo);
          return (
            <div key={tipo}>
              <p className="mb-2 text-sm font-semibold text-primary">{tipo === "produto" ? "Produtos" : "Apps"}</p>
              {lista.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma ainda.</p> : null}
              <ul className="space-y-1">
                {lista.map((c, i) => (
                  <li key={c.id} className="flex items-center gap-1 rounded-xl bg-muted px-3 py-2 text-sm">
                    <span className="flex-1">{c.nome}</span>
                    <button disabled={i === 0} aria-label="Subir" onClick={() => { const o = lista[i - 1]!; void exec(async () => { await supabase.from("categorias_indicacoes").update({ ordem: o.ordem }).eq("id", c.id); return supabase.from("categorias_indicacoes").update({ ordem: c.ordem === o.ordem ? c.ordem + 1 : c.ordem }).eq("id", o.id); }); }} className="rounded p-1 hover:text-primary disabled:opacity-30"><ArrowUp className="size-4" /></button>
                    <button disabled={i === lista.length - 1} aria-label="Descer" onClick={() => { const o = lista[i + 1]!; void exec(async () => { await supabase.from("categorias_indicacoes").update({ ordem: o.ordem === c.ordem ? c.ordem + 1 : o.ordem }).eq("id", c.id); return supabase.from("categorias_indicacoes").update({ ordem: c.ordem }).eq("id", o.id); }); }} className="rounded p-1 hover:text-primary disabled:opacity-30"><ArrowDown className="size-4" /></button>
                    <button aria-label="Renomear" onClick={() => { const n = prompt("Novo nome", c.nome)?.trim(); if (n) void exec(() => supabase.from("categorias_indicacoes").update({ nome: n }).eq("id", c.id)); }} className="rounded p-1 hover:text-primary"><Pencil className="size-4" /></button>
                    <button aria-label="Excluir" onClick={() => { if (confirm(`Excluir "${c.nome}"? As indicações dela ficam sem subcategoria.`)) void exec(async () => { await supabase.from("indicacoes").update({ subcategoria_id: null }).eq("subcategoria_id", c.id); return supabase.from("categorias_indicacoes").delete().eq("id", c.id); }); }} className="rounded p-1 hover:text-destructive"><Trash2 className="size-4" /></button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const NOVA = "__nova__";

function CardIndicacao({ ind, cats, onFechar, salvar, salvando, onCategoriaCriada }: { ind: Partial<IndAdmin> | null; cats: Categoria[]; onFechar: () => void; salvar: (i: Partial<IndAdmin>) => Promise<void>; salvando: boolean; onCategoriaCriada: () => void }) {
  const vazio = { categoria: "produto" as "produto" | "app", sub: "", titulo: "", descricao: "", imagem: "", url: "", ordem: "0", ativo: true };
  const [f, setF] = useState(vazio);
  const [orig, setOrig] = useState("");
  const [novaSub, setNovaSub] = useState("");
  useEffect(() => {
    if (!ind) return;
    const v = { categoria: ind.categoria ?? "produto", sub: ind.subcategoria_id ? String(ind.subcategoria_id) : "", titulo: ind.titulo ?? "", descricao: ind.descricao ?? "", imagem: ind.imagem_url ?? "", url: ind.url ?? "", ordem: String(ind.ordem ?? 0), ativo: ind.ativo ?? true };
    setF(v);
    setOrig(JSON.stringify(v));
    setNovaSub("");
  }, [ind]);

  const subs = cats.filter((c) => c.tipo === f.categoria);
  const criarSub = async () => {
    const nome = novaSub.trim();
    if (!nome) return;
    const { data, error } = await supabase.from("categorias_indicacoes").insert({ tipo: f.categoria, nome, ordem: subs.length }).select("id").single();
    if (error) {
      toast.error(error.message);
      return;
    }
    onCategoriaCriada();
    setF((s) => ({ ...s, sub: String((data as { id: number }).id) }));
    setNovaSub("");
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.sub || f.sub === NOVA || !f.titulo.trim() || !f.imagem.trim() || !f.url.trim()) {
      toast.error("Preencha tipo, subcategoria, título, imagem e link.");
      return;
    }
    try {
      await salvar({ ...(ind?.id ? { id: ind.id } : {}), categoria: f.categoria, subcategoria_id: Number(f.sub), titulo: f.titulo.trim(), descricao: f.descricao.trim() || null, imagem_url: f.imagem.trim(), url: f.url.trim(), ordem: Number(f.ordem) || 0, ativo: f.ativo });
      toast.success("Indicação salva");
      onFechar();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <CardOverlay
      aberto={Boolean(ind)}
      onFechar={onFechar}
      sujo={JSON.stringify(f) !== orig}
      titulo={ind?.id ? "Editar indicação" : "Nova indicação"}
      subtitulo="Aparece na vitrine de Indicações das alunas."
      rodape={<><BotaoSecundario onClick={onFechar}>Cancelar</BotaoSecundario><BotaoPrimario type="submit" form="form-ind" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</BotaoPrimario></>}
    >
      <form id="form-ind" onSubmit={enviar} className="space-y-4">
        <div className="space-y-1.5">
          <span className="text-[13px] font-medium">Tipo <span className="text-primary">*</span></span>
          <Pilulas valor={f.categoria} onChange={(v) => setF({ ...f, categoria: v, sub: "" })} opcoes={[{ valor: "produto" as const, rotulo: "Produto" }, { valor: "app" as const, rotulo: "App" }]} />
        </div>
        <div className="space-y-1.5">
          <span className="text-[13px] font-medium">Subcategoria <span className="text-primary">*</span></span>
          <SelectMetodo valor={f.sub} onChange={(v) => setF({ ...f, sub: v })} placeholder="Escolha a subcategoria" opcoes={[...subs.map((c) => ({ valor: String(c.id), rotulo: c.nome })), { valor: NOVA, rotulo: "+ Criar subcategoria" }]} />
          {f.sub === NOVA ? (
            <div className="flex gap-2">
              <input autoFocus value={novaSub} onChange={(e) => setNovaSub(e.target.value)} placeholder="Nome da subcategoria" className={inputCls} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void criarSub(); } }} />
              <BotaoPrimario type="button" onClick={criarSub} className="h-12 shrink-0">Criar</BotaoPrimario>
            </div>
          ) : null}
        </div>
        <Rotulo texto="Título" obrigatorio><input value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} className={inputCls} /></Rotulo>
        <Rotulo texto="Descrição"><textarea value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} className={textareaCls} /></Rotulo>
        <div className="flex items-end gap-3">
          <Rotulo texto="Link da imagem (URL)" obrigatorio className="flex-1"><input value={f.imagem} onChange={(e) => setF({ ...f, imagem: e.target.value })} placeholder="https://" className={inputCls} /></Rotulo>
          {f.imagem.trim() ? <img src={f.imagem.trim()} alt="Prévia" className="size-12 shrink-0 rounded-xl border border-border object-cover" /> : <span className="size-12 shrink-0 rounded-xl bg-accent-soft" />}
        </div>
        <Rotulo texto="Link do produto ou app" obrigatorio><input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://" className={inputCls} /></Rotulo>
        <div className="flex items-end gap-4">
          <Rotulo texto="Ordem" className="w-28"><input type="number" value={f.ordem} onChange={(e) => setF({ ...f, ordem: e.target.value })} className={inputCls} /></Rotulo>
          <label className="flex h-12 items-center gap-3 text-sm"><Interruptor ligado={f.ativo} onChange={(v) => setF({ ...f, ativo: v })} rotulo="Ativo" /> Ativo</label>
        </div>
      </form>
    </CardOverlay>
  );
}
