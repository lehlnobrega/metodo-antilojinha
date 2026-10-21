// Abas novas do admin: formatos virais e bônus (com os itens de cada bônus).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BotaoPrimario, BotaoSecundario, CardOverlay, Interruptor, Rotulo, SelectMetodo, inputCls, textareaCls } from "@/components/metodo/overlay";
import { supabase } from "@/integrations/metodo/client";
import type { FormatoViral } from "@/lib/acervo";
import { type Bonus, type ItemBonus, ROTULO_STATUS_BONUS, type StatusBonus } from "@/lib/bonus";
import { cn, semVazios } from "@/lib/utils";

function falha(e: unknown): never {
  throw new Error((e as { message?: string })?.message ?? "Erro");
}

/** Botão de excluir com confirmação dentro da própria linha (sem janela do navegador). */
function Excluir({ rotulo, onConfirmar }: { rotulo: string; onConfirmar: () => void }) {
  const [certeza, setCerteza] = useState(false);
  useEffect(() => {
    if (!certeza) return;
    const t = setTimeout(() => setCerteza(false), 4000);
    return () => clearTimeout(t);
  }, [certeza]);
  return certeza ? (
    <button onClick={onConfirmar} className="rounded-lg bg-destructive px-2.5 py-1.5 text-xs font-semibold text-destructive-foreground">
      Confirmar
    </button>
  ) : (
    <button onClick={() => setCerteza(true)} aria-label={`Excluir ${rotulo}`} className="rounded-lg p-2 text-muted-foreground hover:text-destructive">
      <Trash2 className="size-4" />
    </button>
  );
}

const Situacao = ({ ok, texto }: { ok: boolean; texto: string }) => (
  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", ok ? "bg-success-soft text-success" : "border border-border bg-muted text-muted-foreground")}>{texto}</span>
);

// ---------------- Formatos virais ----------------
export function AbaFormatos() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Partial<FormatoViral> | null>(null);
  const formatos = useQuery({
    queryKey: ["acervo", "formatos", false],
    queryFn: async () => {
      const { data, error } = await supabase.from("formatos_virais").select("id, ordem, nome, o_que_e, por_que, como_adaptar, link, publicado").order("ordem").order("id");
      if (error) falha(error);
      return (data ?? []) as FormatoViral[];
    },
  });
  const invalidar = () => qc.invalidateQueries({ queryKey: ["acervo", "formatos"] });
  const salvar = useMutation({
    mutationFn: async ({ id, ...c }: Partial<FormatoViral>) => {
      const { error } = id ? await supabase.from("formatos_virais").update(c).eq("id", id) : await supabase.from("formatos_virais").insert(semVazios(c));
      if (error) falha(error);
    },
    onSettled: invalidar,
  });
  const excluir = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("formatos_virais").delete().eq("id", id);
      if (error) falha(error);
    },
    onSettled: invalidar,
  });

  return (
    <>
      <CardFormato formato={edit} onFechar={() => setEdit(null)} salvar={salvar.mutateAsync} salvando={salvar.isPending} />
      <Cabecalho titulo="Formatos virais" texto="Aparecem na aba Formatos virais, dentro de Ideias de conteúdo." acao={<BotaoPrimario onClick={() => setEdit({})} className="inline-flex items-center gap-2"><Plus className="size-4" /> Novo formato</BotaoPrimario>} />
      <div className="card-metodo overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr><th className="p-3">Formato</th><th className="p-3">O que é</th><th className="p-3">Referência</th><th className="p-3">Situação</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(formatos.data ?? []).map((f) => (
              <tr key={f.id}>
                <td className="p-3 font-medium">{f.nome}</td>
                <td className="max-w-[320px] p-3 text-muted-foreground"><span className="line-clamp-2">{f.o_que_e ?? "-"}</span></td>
                <td className="p-3">{f.link ? <a href={f.link} target="_blank" rel="noreferrer" className="text-primary hover:underline">Abrir</a> : "-"}</td>
                <td className="p-3"><Situacao ok={f.publicado} texto={f.publicado ? "Publicado" : "Rascunho"} /></td>
                <td className="whitespace-nowrap p-3 text-right">
                  <button onClick={() => setEdit(f)} aria-label="Editar" className="rounded-lg p-2 text-muted-foreground hover:text-primary"><Pencil className="size-4" /></button>
                  <Excluir rotulo={f.nome} onConfirmar={() => excluir.mutate(f.id, { onError: (e) => toast.error(e.message), onSuccess: () => toast.success("Formato excluído") })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {formatos.isLoading ? <p className="p-4 text-sm text-muted-foreground">Carregando...</p> : (formatos.data ?? []).length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nenhum formato cadastrado ainda.</p> : null}
        {formatos.isError ? <p className="p-4 text-sm text-destructive">{formatos.error.message}</p> : null}
      </div>
    </>
  );
}

function CardFormato({ formato, onFechar, salvar, salvando }: { formato: Partial<FormatoViral> | null; onFechar: () => void; salvar: (f: Partial<FormatoViral>) => Promise<void>; salvando: boolean }) {
  const vazio = { nome: "", o_que_e: "", por_que: "", como_adaptar: "", link: "", ordem: "0", publicado: true };
  const [f, setF] = useState(vazio);
  const [orig, setOrig] = useState("");
  useEffect(() => {
    if (!formato) return;
    const v = {
      nome: formato.nome ?? "",
      o_que_e: formato.o_que_e ?? "",
      por_que: formato.por_que ?? "",
      como_adaptar: formato.como_adaptar ?? "",
      link: formato.link ?? "",
      ordem: String(formato.ordem ?? 0),
      publicado: formato.publicado ?? true,
    };
    setF(v);
    setOrig(JSON.stringify(v));
  }, [formato]);
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.nome.trim()) {
      toast.error("Dá um nome pro formato.");
      return;
    }
    try {
      await salvar({
        ...(formato?.id ? { id: formato.id } : {}),
        nome: f.nome.trim(),
        o_que_e: f.o_que_e.trim() || null,
        por_que: f.por_que.trim() || null,
        como_adaptar: f.como_adaptar.trim() || null,
        link: f.link.trim() || null,
        ordem: Number(f.ordem) || 0,
        publicado: f.publicado,
      });
      toast.success("Formato salvo");
      onFechar();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  return (
    <CardOverlay
      aberto={Boolean(formato)}
      onFechar={onFechar}
      sujo={JSON.stringify(f) !== orig}
      titulo={formato?.id ? "Editar formato" : "Novo formato viral"}
      subtitulo="A aluna lê, assiste a referência e marca se combina com a loja dela."
      rodape={<><BotaoSecundario onClick={onFechar}>Cancelar</BotaoSecundario><BotaoPrimario type="submit" form="form-formato" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</BotaoPrimario></>}
    >
      <form id="form-formato" onSubmit={enviar} className="space-y-4">
        <Rotulo texto="Nome do formato" obrigatorio><input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="ex: Respondendo comentário" className={inputCls} /></Rotulo>
        <Rotulo texto="O que é"><textarea value={f.o_que_e} onChange={(e) => setF({ ...f, o_que_e: e.target.value })} className={textareaCls} /></Rotulo>
        <Rotulo texto="Por que viraliza"><textarea value={f.por_que} onChange={(e) => setF({ ...f, por_que: e.target.value })} className={textareaCls} /></Rotulo>
        <Rotulo texto="Como adaptar"><textarea value={f.como_adaptar} onChange={(e) => setF({ ...f, como_adaptar: e.target.value })} className={textareaCls} /></Rotulo>
        <Rotulo texto="Link do vídeo de referência"><input value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="https://" className={inputCls} /></Rotulo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Rotulo texto="Ordem"><input value={f.ordem} onChange={(e) => setF({ ...f, ordem: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className={inputCls} /></Rotulo>
          <label className="flex items-center gap-3 self-end pb-2 text-sm"><Interruptor ligado={f.publicado} onChange={(v) => setF({ ...f, publicado: v })} rotulo="Publicado" /> Publicado</label>
        </div>
      </form>
    </CardOverlay>
  );
}

// ---------------- Bônus ----------------
export function AbaBonus() {
  const qc = useQueryClient();
  const [editBonus, setEditBonus] = useState<Partial<Bonus> | null>(null);
  const [editItem, setEditItem] = useState<Partial<ItemBonus> | null>(null);
  const [aberto, setAberto] = useState<number | null>(null);

  const bonus = useQuery({
    queryKey: ["bonus"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bonus").select("id, ordem, titulo, descricao, status").order("ordem").order("id");
      if (error) falha(error);
      return (data ?? []) as Bonus[];
    },
  });
  const itens = useQuery({
    queryKey: ["bonus-itens", "todos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bonus_itens").select("id, bonus_id, ordem, titulo, descricao, link, publicado").order("ordem").order("id");
      if (error) falha(error);
      return (data ?? []) as ItemBonus[];
    },
  });
  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["bonus"] });
    qc.invalidateQueries({ queryKey: ["bonus-itens"] });
  };
  const salvarBonus = useMutation({
    mutationFn: async ({ id, ...c }: Partial<Bonus>) => {
      const { error } = id ? await supabase.from("bonus").update(c).eq("id", id) : await supabase.from("bonus").insert(semVazios(c));
      if (error) falha(error);
    },
    onSettled: invalidar,
  });
  const excluirBonus = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("bonus").delete().eq("id", id);
      if (error) falha(error);
    },
    onSettled: invalidar,
  });
  const salvarItem = useMutation({
    mutationFn: async ({ id, ...c }: Partial<ItemBonus>) => {
      const { error } = id ? await supabase.from("bonus_itens").update(c).eq("id", id) : await supabase.from("bonus_itens").insert(semVazios(c));
      if (error) falha(error);
    },
    onSettled: invalidar,
  });
  const excluirItem = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("bonus_itens").delete().eq("id", id);
      if (error) falha(error);
    },
    onSettled: invalidar,
  });

  return (
    <>
      <CardBonus bonus={editBonus} onFechar={() => setEditBonus(null)} salvar={salvarBonus.mutateAsync} salvando={salvarBonus.isPending} />
      <CardItem item={editItem} onFechar={() => setEditItem(null)} salvar={salvarItem.mutateAsync} salvando={salvarItem.isPending} />
      <Cabecalho
        titulo="Bônus"
        texto="Cada bônus vira um card depois dos módulos, em Materiais de apoio. Dentro dele você adiciona os itens (as skills, por exemplo)."
        acao={<BotaoPrimario onClick={() => setEditBonus({})} className="inline-flex items-center gap-2"><Plus className="size-4" /> Novo bônus</BotaoPrimario>}
      />
      {bonus.isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}
      {bonus.isError ? <p className="text-sm text-destructive">{bonus.error.message}</p> : null}
      <div className="space-y-3">
        {(bonus.data ?? []).map((b) => {
          const doBonus = (itens.data ?? []).filter((i) => i.bonus_id === b.id);
          const exp = aberto === b.id;
          return (
            <div key={b.id} className="card-metodo">
              <div className="flex flex-wrap items-center gap-3 p-4">
                <button onClick={() => setAberto(exp ? null : b.id)} className="min-w-0 flex-1 text-left">
                  <p className="font-semibold">{b.titulo}</p>
                  <p className="text-xs text-muted-foreground">{doBonus.length} {doBonus.length === 1 ? "item" : "itens"}{b.descricao ? `, ${b.descricao}` : ""}</p>
                </button>
                <Situacao ok={b.status === "liberado"} texto={ROTULO_STATUS_BONUS[b.status]} />
                <button onClick={() => setAberto(exp ? null : b.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary">
                  {exp ? "Fechar itens" : "Ver itens"}
                </button>
                <button onClick={() => setEditBonus(b)} aria-label="Editar bônus" className="rounded-lg p-2 text-muted-foreground hover:text-primary"><Pencil className="size-4" /></button>
                <Excluir rotulo={b.titulo} onConfirmar={() => excluirBonus.mutate(b.id, { onError: (e) => toast.error(e.message), onSuccess: () => toast.success("Bônus excluído") })} />
              </div>
              {exp ? (
                <div className="border-t border-border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Itens de {b.titulo}</p>
                    <BotaoSecundario onClick={() => setEditItem({ bonus_id: b.id })} className="inline-flex items-center gap-1.5"><Plus className="size-4" /> Novo item</BotaoSecundario>
                  </div>
                  {doBonus.length === 0 ? (
                    <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">Nenhum item ainda. As alunas veem um aviso de que chega em breve.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {doBonus.map((i) => (
                        <li key={i.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">{i.titulo}</span>
                            {i.descricao ? <span className="block truncate text-xs text-muted-foreground">{i.descricao}</span> : null}
                          </span>
                          <Situacao ok={i.publicado} texto={i.publicado ? "Publicado" : "Rascunho"} />
                          <button onClick={() => setEditItem(i)} aria-label="Editar item" className="rounded-lg p-2 text-muted-foreground hover:text-primary"><Pencil className="size-4" /></button>
                          <Excluir rotulo={i.titulo} onConfirmar={() => excluirItem.mutate(i.id, { onError: (e) => toast.error(e.message), onSuccess: () => toast.success("Item excluído") })} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {!bonus.isLoading && (bonus.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhum bônus ainda. Rode o SQL de atualização pra criar o bônus Skills.</p> : null}
    </>
  );
}

function CardBonus({ bonus, onFechar, salvar, salvando }: { bonus: Partial<Bonus> | null; onFechar: () => void; salvar: (b: Partial<Bonus>) => Promise<void>; salvando: boolean }) {
  const [f, setF] = useState({ titulo: "", descricao: "", status: "em_breve" as StatusBonus, ordem: "0" });
  const [orig, setOrig] = useState("");
  useEffect(() => {
    if (!bonus) return;
    const v = { titulo: bonus.titulo ?? "", descricao: bonus.descricao ?? "", status: bonus.status ?? ("em_breve" as StatusBonus), ordem: String(bonus.ordem ?? 0) };
    setF(v);
    setOrig(JSON.stringify(v));
  }, [bonus]);
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.titulo.trim()) {
      toast.error("Dá um nome pro bônus.");
      return;
    }
    try {
      await salvar({ ...(bonus?.id ? { id: bonus.id } : {}), titulo: f.titulo.trim(), descricao: f.descricao.trim() || null, status: f.status, ordem: Number(f.ordem) || 0 });
      toast.success("Bônus salvo");
      onFechar();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  return (
    <CardOverlay
      aberto={Boolean(bonus)}
      onFechar={onFechar}
      sujo={JSON.stringify(f) !== orig}
      titulo={bonus?.id ? "Editar bônus" : "Novo bônus"}
      subtitulo="Escondido não aparece pras alunas. Em breve aparece, mas sem abrir."
      rodape={<><BotaoSecundario onClick={onFechar}>Cancelar</BotaoSecundario><BotaoPrimario type="submit" form="form-bonus" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</BotaoPrimario></>}
    >
      <form id="form-bonus" onSubmit={enviar} className="space-y-4">
        <Rotulo texto="Nome do bônus" obrigatorio><input value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="ex: Skills" className={inputCls} /></Rotulo>
        <Rotulo texto="Descrição curta"><textarea value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} className={textareaCls} /></Rotulo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Rotulo texto="Situação">
            <SelectMetodo
              valor={f.status}
              onChange={(v) => setF({ ...f, status: v as StatusBonus })}
              opcoes={(Object.keys(ROTULO_STATUS_BONUS) as StatusBonus[]).map((k) => ({ valor: k, rotulo: ROTULO_STATUS_BONUS[k] }))}
            />
          </Rotulo>
          <Rotulo texto="Ordem"><input value={f.ordem} onChange={(e) => setF({ ...f, ordem: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className={inputCls} /></Rotulo>
        </div>
      </form>
    </CardOverlay>
  );
}

function CardItem({ item, onFechar, salvar, salvando }: { item: Partial<ItemBonus> | null; onFechar: () => void; salvar: (i: Partial<ItemBonus>) => Promise<void>; salvando: boolean }) {
  const [f, setF] = useState({ titulo: "", descricao: "", link: "", ordem: "0", publicado: true });
  const [orig, setOrig] = useState("");
  useEffect(() => {
    if (!item) return;
    const v = { titulo: item.titulo ?? "", descricao: item.descricao ?? "", link: item.link ?? "", ordem: String(item.ordem ?? 0), publicado: item.publicado ?? true };
    setF(v);
    setOrig(JSON.stringify(v));
  }, [item]);
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.titulo.trim() || !item?.bonus_id) {
      toast.error("Dá um nome pro item.");
      return;
    }
    try {
      await salvar({
        ...(item.id ? { id: item.id } : {}),
        bonus_id: item.bonus_id,
        titulo: f.titulo.trim(),
        descricao: f.descricao.trim() || null,
        link: f.link.trim() || null,
        ordem: Number(f.ordem) || 0,
        publicado: f.publicado,
      });
      toast.success("Item salvo");
      onFechar();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  return (
    <CardOverlay
      aberto={Boolean(item)}
      onFechar={onFechar}
      sujo={JSON.stringify(f) !== orig}
      titulo={item?.id ? "Editar item" : "Novo item"}
      subtitulo="Ex.: uma skill, com a explicação de como usar e o link."
      rodape={<><BotaoSecundario onClick={onFechar}>Cancelar</BotaoSecundario><BotaoPrimario type="submit" form="form-item-bonus" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</BotaoPrimario></>}
    >
      <form id="form-item-bonus" onSubmit={enviar} className="space-y-4">
        <Rotulo texto="Nome" obrigatorio><input value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="ex: Caçadora de padrão viral" className={inputCls} /></Rotulo>
        <Rotulo texto="Descrição e como usar"><textarea value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} className={textareaCls} rows={5} /></Rotulo>
        <Rotulo texto="Link (da skill, do arquivo ou da página)"><input value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="https://" className={inputCls} /></Rotulo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Rotulo texto="Ordem"><input value={f.ordem} onChange={(e) => setF({ ...f, ordem: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className={inputCls} /></Rotulo>
          <label className="flex items-center gap-3 self-end pb-2 text-sm"><Interruptor ligado={f.publicado} onChange={(v) => setF({ ...f, publicado: v })} rotulo="Publicado" /> Publicado</label>
        </div>
      </form>
    </CardOverlay>
  );
}

export function Cabecalho({ titulo, texto, acao }: { titulo: string; texto?: string; acao?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{titulo}</h2>
        {texto ? <p className="mt-0.5 max-w-2xl text-[13px] text-muted-foreground">{texto}</p> : null}
      </div>
      {acao}
    </div>
  );
}
