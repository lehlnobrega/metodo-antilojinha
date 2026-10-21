// Aba do admin: acervo de ideias de conteúdo e nichos (o RLS libera escrita só para admin).
import { semVazios } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { BotaoPrimario, BotaoSecundario, CardOverlay, Interruptor, Pilulas, Rotulo, SelectMetodo, inputCls, textareaCls } from "@/components/metodo/overlay";
import { supabase } from "@/integrations/metodo/client";
import { type ConteudoAcervo, type Nicho, FORMATOS_ACERVO, TIPOS_ACERVO, tipoAcervo, useConteudosAcervo, useNichos } from "@/lib/acervo";
import { formatarData } from "@/lib/formato";

function falha(e: unknown): never {
  throw new Error((e as { message?: string })?.message ?? "Erro");
}
const CRIAR = "__criar__";

export function AbaAcervo() {
  const qc = useQueryClient();
  const nichos = useNichos();
  const conteudos = useConteudosAcervo(false);
  const [edit, setEdit] = useState<Partial<ConteudoAcervo> | null>(null);
  const [fN, setFN] = useState("");
  const [fT, setFT] = useState("");
  const [fF, setFF] = useState("");
  const [busca, setBusca] = useState("");
  const invalidar = () => qc.invalidateQueries({ queryKey: ["acervo"] });

  const salvar = useMutation({
    mutationFn: async ({ id, ...c }: Partial<ConteudoAcervo>) => {
      const { error } = id ? await supabase.from("conteudos_acervo").update(c).eq("id", id) : await supabase.from("conteudos_acervo").insert(semVazios(c));
      if (error) falha(error);
    },
    onSettled: invalidar,
  });
  const excluir = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("conteudos_acervo").delete().eq("id", id);
      if (error) falha(error);
    },
    onSettled: invalidar,
  });

  const lista = nichos.data ?? [];
  const nome = new Map(lista.map((n) => [n.id, n.nome]));
  const filtrados = useMemo(() => {
    const b = busca.toLowerCase().trim();
    return (conteudos.data ?? []).filter(
      (c) => (!fN || String(c.nicho_id) === fN) && (!fT || c.tipo_cqc === fT) && (!fF || c.formato === fF) && (!b || `${c.titulo} ${c.feedback ?? ""}`.toLowerCase().includes(b)),
    );
  }, [conteudos.data, fN, fT, fF, busca]);

  return (
    <>
      <CardConteudo item={edit} nichos={lista} onFechar={() => setEdit(null)} salvar={salvar.mutateAsync} onNovoNicho={invalidar} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <BotaoPrimario onClick={() => setEdit({})} className="inline-flex items-center gap-2"><Plus className="size-4" /> Novo conteúdo</BotaoPrimario>
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar" className="h-11 w-full max-w-xs rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary" />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SelectMetodo valor={fN} onChange={(v) => setFN(v.trim())} placeholder="Nicho: todos" opcoes={[{ valor: " ", rotulo: "Todos" }, ...lista.map((n) => ({ valor: String(n.id), rotulo: n.nome }))]} />
        <SelectMetodo valor={fT} onChange={(v) => setFT(v.trim())} placeholder="Tipo: todos" opcoes={[{ valor: " ", rotulo: "Todos" }, ...TIPOS_ACERVO.map((t) => ({ valor: t.valor, rotulo: `${t.emoji} ${t.rotulo}` }))]} />
        <SelectMetodo valor={fF} onChange={(v) => setFF(v.trim())} placeholder="Formato: todos" opcoes={[{ valor: " ", rotulo: "Todos" }, ...FORMATOS_ACERVO.map((f) => ({ ...f }))]} />
      </div>
      <div className="card-metodo mb-8 overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr><th className="p-3">Título</th><th className="p-3">Nicho</th><th className="p-3">Tipo</th><th className="p-3">Formato</th><th className="p-3">Link</th><th className="p-3">Data</th><th className="p-3">Ativo</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtrados.map((c) => {
              const t = tipoAcervo(c.tipo_cqc);
              return (
                <tr key={c.id}>
                  <td className="max-w-[240px] p-3 font-medium">{c.titulo}</td>
                  <td className="p-3">{nome.get(c.nicho_id) ?? "-"}</td>
                  <td className="whitespace-nowrap p-3">{t ? `${t.emoji} ${t.rotulo}` : c.tipo_cqc}</td>
                  <td className="p-3">{c.formato === "video" ? "Vídeo" : "Carrossel"}</td>
                  <td className="max-w-[180px] truncate p-3"><a href={c.link} target="_blank" rel="noreferrer" className="text-primary hover:underline">{c.link}</a></td>
                  <td className="p-3">{formatarData(c.created_at)}</td>
                  <td className="p-3"><Interruptor ligado={c.ativo} rotulo="Ativo" onChange={(v) => salvar.mutate({ id: c.id, ativo: v }, { onError: (e) => toast.error(e.message) })} /></td>
                  <td className="whitespace-nowrap p-3 text-right">
                    <button onClick={() => setEdit(c)} aria-label="Editar" className="rounded-lg p-2 text-muted-foreground hover:text-primary"><Pencil className="size-4" /></button>
                    <button onClick={() => { if (confirm(`Excluir "${c.titulo}"?`)) excluir.mutate(c.id, { onError: (e) => toast.error(e.message) }); }} aria-label="Excluir" className="rounded-lg p-2 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {conteudos.isLoading ? <p className="p-4 text-sm text-muted-foreground">Carregando...</p> : filtrados.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nenhum conteúdo encontrado.</p> : null}
        {conteudos.isError ? <p className="p-4 text-sm text-destructive">{conteudos.error.message}</p> : null}
      </div>
      <Nichos nichos={lista} conteudos={conteudos.data ?? []} onMudou={invalidar} />
    </>
  );
}

function Nichos({ nichos, conteudos, onMudou }: { nichos: Nicho[]; conteudos: ConteudoAcervo[]; onMudou: () => void }) {
  const [editando, setEditando] = useState<number | null>(null);
  const [texto, setTexto] = useState("");
  const [emoji, setEmoji] = useState("");
  const [novo, setNovo] = useState("");
  const [novoEmoji, setNovoEmoji] = useState("");
  const rodar = async (p: PromiseLike<{ error: unknown }>) => {
    const { error } = await p;
    if (error) toast.error((error as { message?: string }).message ?? "Erro");
    onMudou();
  };
  const mover = async (i: number, d: -1 | 1) => {
    const a = nichos[i], b = nichos[i + d];
    if (!a || !b) return;
    await rodar(supabase.from("nichos_acervo").update({ ordem: b.ordem }).eq("id", a.id));
    await rodar(supabase.from("nichos_acervo").update({ ordem: a.ordem }).eq("id", b.id));
  };
  return (
    <div className="card-metodo p-5">
      <h2 className="font-semibold">Nichos</h2>
      <ul className="mt-3 divide-y divide-border">
        {nichos.map((n, i) => {
          const qtd = conteudos.filter((c) => c.nicho_id === n.id).length;
          return (
            <li key={n.id} className="flex items-center gap-2 py-2 text-sm">
              {editando === n.id ? (
                <>
                  <input value={emoji} onChange={(e) => setEmoji(e.target.value)} aria-label="Emoji" className="h-9 w-14 rounded-lg border border-border bg-muted px-2 text-center outline-none focus:border-primary" />
                  <input value={texto} onChange={(e) => setTexto(e.target.value)} className="h-9 flex-1 rounded-lg border border-border bg-muted px-3 outline-none focus:border-primary" autoFocus />
                  <button aria-label="Salvar" onClick={async () => { if (texto.trim()) await rodar(supabase.from("nichos_acervo").update({ nome: texto.trim(), emoji: emoji.trim() || null }).eq("id", n.id)); setEditando(null); }} className="rounded-lg p-2 text-primary"><Check className="size-4" /></button>
                  <button aria-label="Cancelar" onClick={() => setEditando(null)} className="rounded-lg p-2 text-muted-foreground"><X className="size-4" /></button>
                </>
              ) : (
                <>
                  <span className="w-7 text-center text-lg">{n.emoji ?? ""}</span>
                  <span className="flex-1 font-medium">{n.nome} <span className="font-normal text-muted-foreground">({qtd})</span></span>
                  <button aria-label="Subir" disabled={i === 0} onClick={() => mover(i, -1)} className="rounded-lg p-2 text-muted-foreground hover:text-primary disabled:opacity-30"><ArrowUp className="size-4" /></button>
                  <button aria-label="Descer" disabled={i === nichos.length - 1} onClick={() => mover(i, 1)} className="rounded-lg p-2 text-muted-foreground hover:text-primary disabled:opacity-30"><ArrowDown className="size-4" /></button>
                  <button aria-label="Editar" onClick={() => { setEditando(n.id); setTexto(n.nome); setEmoji(n.emoji ?? ""); }} className="rounded-lg p-2 text-muted-foreground hover:text-primary"><Pencil className="size-4" /></button>
                  <button
                    aria-label="Excluir"
                    onClick={() => {
                      if (qtd > 0) { toast.error(`Esse nicho tem ${qtd} ${qtd === 1 ? "conteúdo" : "conteúdos"}. Mova ou exclua os conteúdos antes.`); return; }
                      if (confirm(`Excluir o nicho "${n.nome}"?`)) void rodar(supabase.from("nichos_acervo").delete().eq("id", n.id));
                    }}
                    className="rounded-lg p-2 text-muted-foreground hover:text-destructive"
                  ><Trash2 className="size-4" /></button>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <form
        className="mt-3 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!novo.trim()) return;
          await rodar(supabase.from("nichos_acervo").insert(semVazios({ nome: novo.trim(), emoji: novoEmoji.trim() || null, ordem: Math.max(0, ...nichos.map((n) => n.ordem)) + 1 })));
          setNovo(""); setNovoEmoji("");
        }}
      >
        <input value={novoEmoji} onChange={(e) => setNovoEmoji(e.target.value)} placeholder="🙂" aria-label="Emoji" className="h-11 w-16 rounded-xl border border-border bg-muted px-2 text-center text-sm outline-none focus:border-primary" />
        <input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Novo nicho" className="h-11 flex-1 rounded-xl border border-border bg-muted px-4 text-sm outline-none focus:border-primary" />
        <BotaoPrimario type="submit">Criar</BotaoPrimario>
      </form>
    </div>
  );
}

const vazio = { nicho: "", titulo: "", feedback: "", formato: "", tipo: "", link: "", ativo: true };

function CardConteudo({ item, nichos, onFechar, salvar, onNovoNicho }: { item: Partial<ConteudoAcervo> | null; nichos: Nicho[]; onFechar: () => void; salvar: (c: Partial<ConteudoAcervo>) => Promise<void>; onNovoNicho: () => void }) {
  const [f, setF] = useState(vazio);
  const [orig, setOrig] = useState("");
  const [salvando, setSalvando] = useState(false);
  useEffect(() => {
    if (!item) return;
    const v = { nicho: item.nicho_id ? String(item.nicho_id) : "", titulo: item.titulo ?? "", feedback: item.feedback ?? "", formato: item.formato ?? "", tipo: item.tipo_cqc ?? "", link: item.link ?? "", ativo: item.ativo ?? true };
    setF(v);
    setOrig(JSON.stringify(v));
  }, [item]);

  const escolherNicho = async (v: string) => {
    if (v !== CRIAR) { setF({ ...f, nicho: v }); return; }
    const nome = window.prompt("Nome do novo nicho")?.trim();
    if (!nome) return;
    const { data, error } = await supabase.from("nichos_acervo").insert({ nome, ordem: Math.max(0, ...nichos.map((n) => n.ordem)) + 1 }).select("id").single();
    if (error) { toast.error(error.message); return; }
    onNovoNicho();
    setF((x) => ({ ...x, nicho: String((data as { id: number }).id) }));
  };

  const enviar = async (outro: boolean) => {
    if (!f.nicho || !f.titulo.trim() || !f.formato || !f.tipo || !f.link.trim()) {
      toast.error("Preencha nicho, título, formato, tipo e link.");
      return;
    }
    setSalvando(true);
    try {
      await salvar({
        ...(item?.id ? { id: item.id } : {}),
        nicho_id: Number(f.nicho),
        titulo: f.titulo.trim(),
        feedback: f.feedback.trim() || null,
        formato: f.formato as ConteudoAcervo["formato"],
        tipo_cqc: f.tipo as ConteudoAcervo["tipo_cqc"],
        link: f.link.trim(),
        ativo: f.ativo,
      });
      toast.success("Conteúdo salvo");
      if (outro) {
        const v = { ...vazio, nicho: f.nicho };
        setF(v);
        setOrig(JSON.stringify(v));
      } else onFechar();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <CardOverlay
      aberto={Boolean(item)}
      onFechar={onFechar}
      titulo={item?.id ? "Editar conteúdo" : "Novo conteúdo"}
      sujo={JSON.stringify(f) !== orig}
      rodape={
        <div className="flex flex-wrap justify-end gap-2">
          <BotaoSecundario onClick={onFechar}>Cancelar</BotaoSecundario>
          {!item?.id ? <BotaoSecundario disabled={salvando} onClick={() => enviar(true)}>Salvar e adicionar outro</BotaoSecundario> : null}
          <BotaoPrimario disabled={salvando} onClick={() => enviar(false)}>{salvando ? "Salvando..." : "Salvar"}</BotaoPrimario>
        </div>
      }
    >
      <div className="space-y-4">
        <Rotulo texto="Nicho" obrigatorio>
          <SelectMetodo valor={f.nicho} onChange={escolherNicho} placeholder="Escolha o nicho" opcoes={[...nichos.map((n) => ({ valor: String(n.id), rotulo: n.nome })), { valor: CRIAR, rotulo: "+ Criar nicho" }]} />
        </Rotulo>
        <Rotulo texto="Título" obrigatorio>
          <input value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} className={inputCls} />
        </Rotulo>
        <Rotulo texto="Por que esse conteúdo é bom (aparece pra aluna)">
          <textarea value={f.feedback} onChange={(e) => setF({ ...f, feedback: e.target.value })} placeholder="Por que esse conteúdo funciona?" className={textareaCls} />
        </Rotulo>
        <div className="space-y-1.5">
          <span className="text-[13px] font-medium">Formato<span className="text-primary"> *</span></span>
          <Pilulas opcoes={FORMATOS_ACERVO.map((x) => ({ valor: x.valor as string, rotulo: x.rotulo }))} valor={f.formato} onChange={(v) => setF({ ...f, formato: v })} />
        </div>
        <div className="space-y-1.5">
          <span className="text-[13px] font-medium">Tipo de conteúdo<span className="text-primary"> *</span></span>
          <Pilulas opcoes={TIPOS_ACERVO.map((x) => ({ valor: x.valor as string, rotulo: `${x.emoji} ${x.rotulo}` }))} valor={f.tipo} onChange={(v) => setF({ ...f, tipo: v })} />
        </div>
        <Rotulo texto="Link do conteúdo" obrigatorio>
          <input value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="https://" className={inputCls} />
        </Rotulo>
        <label className="flex items-center gap-3 text-sm"><Interruptor ligado={f.ativo} onChange={(v) => setF({ ...f, ativo: v })} rotulo="Ativo" /> Ativo</label>
      </div>
    </CardOverlay>
  );
}
