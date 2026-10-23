// Ficha da aluna e cadastro manual, usados na aba Alunas do admin.
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BotaoPrimario, BotaoSecundario, CardOverlay, Rotulo, SeletorData, inputCls } from "@/components/metodo/overlay";
import { Barra } from "@/components/metodo/visual";
import { supabase } from "@/integrations/metodo/client";
import { cadastrarAluna } from "@/lib/admin.functions";
import { formatarData, formatarMoeda } from "@/lib/formato";
import { cn } from "@/lib/utils";

export type ResumoAluna = {
  id: string; nome: string | null; email: string; telefone: string | null; status: string | null;
  data_compra: string | null; acesso_ate: string | null; ultimo_acesso: string | null;
  pesquisa_concluida: boolean | null; progresso_pct: number | null; modulo_atual: string | null;
  ultimo_post: string | null; posts_7_dias: number | null; ultimo_faturamento: number | null; ultima_nota_site: number | null;
};

const DIA = 864e5;
export const semAcessar = (a: ResumoAluna) => !a.ultimo_acesso || Date.now() - new Date(a.ultimo_acesso).getTime() > 7 * DIA;
export const vencendo = (a: ResumoAluna) => {
  if (!a.acesso_ate) return false;
  const falta = new Date(a.acesso_ate).getTime() - Date.now();
  return falta > 0 && falta < 30 * DIA;
};
export const vencido = (a: ResumoAluna) => Boolean(a.acesso_ate) && new Date(a.acesso_ate!).getTime() < Date.now();

/** Situação da aluna pra mostrar como etiqueta. */
export function situacao(a: ResumoAluna): { texto: string; cls: string } {
  if (a.status === "pausada") return { texto: "Pausada", cls: "bg-locked text-muted-foreground" };
  if (a.status === "expirada") return { texto: "Acesso vencido", cls: "bg-destructive/10 text-destructive" };
  if (a.status === "reembolsada" || a.status === "cancelada") return { texto: a.status === "reembolsada" ? "Reembolsada" : "Cancelada", cls: "bg-destructive/10 text-destructive" };
  if (vencido(a)) return { texto: "Acesso vencido", cls: "bg-destructive/10 text-destructive" };
  if (vencendo(a)) return { texto: "Acesso vencendo", cls: "bg-accent-soft text-primary" };
  if (semAcessar(a)) return { texto: "Parada", cls: "bg-warning-soft text-warning" };
  return { texto: "Ativa", cls: "bg-success-soft text-success" };
}

const dataOuTraco = (v: string | null) => (v ? formatarData(v) : "-");

export function FichaAluna({
  aluna,
  respostas,
  onFechar,
  onDiagnosticos,
}: {
  aluna: ResumoAluna | null;
  respostas: Record<string, unknown> | null;
  onFechar: () => void;
  onDiagnosticos: () => void;
}) {
  const qc = useQueryClient();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [atual, setAtual] = useState<ResumoAluna | null>(aluna);
  useEffect(() => setAtual(aluna), [aluna]);
  if (!atual) return <CardOverlay aberto={false} onFechar={onFechar} titulo="" subtitulo=""><span /></CardOverlay>;
  const s = situacao(atual);

  const atualizar = async (acao: string, campos: { status?: string; acesso_ate?: string }) => {
    setOcupado(acao);
    try {
      const { error } = await supabase.from("alunas").update(campos).eq("id", atual.id);
      if (error) throw new Error(error.message);
      setAtual({ ...atual, ...campos });
      void qc.invalidateQueries({ queryKey: ["admin", "admin_resumo_alunas"] });
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setOcupado(null);
    }
  };

  const renovar = async () => {
    const base = atual.acesso_ate && new Date(atual.acesso_ate).getTime() > Date.now() ? new Date(atual.acesso_ate) : new Date();
    base.setFullYear(base.getFullYear() + 1);
    if (await atualizar("renovar", { acesso_ate: base.toISOString(), ...(atual.status === "pausada" ? {} : { status: "ativa" }) })) {
      toast.success(`Acesso renovado até ${formatarData(base.toISOString())}`);
    }
  };
  const pausar = async () => {
    const novo = atual.status === "pausada" ? "ativa" : "pausada";
    if (await atualizar("pausar", { status: novo })) {
      toast.success(novo === "pausada" ? "Acesso pausado. Ela não entra até você reativar." : "Acesso reativado.");
    }
  };
  const reenviar = async () => {
    setOcupado("reenviar");
    const { error } = await supabase.auth.resetPasswordForEmail(atual.email, { redirectTo: `${window.location.origin}/criar-senha` });
    setOcupado(null);
    if (error) toast.error("Não consegui enviar agora. Tenta de novo em alguns minutos.");
    else toast.success("E-mail pra criar a senha enviado.");
  };

  const linhas: [string, string][] = [
    ["E-mail", atual.email],
    ["WhatsApp", atual.telefone ?? "-"],
    ["Compra", dataOuTraco(atual.data_compra)],
    ["Acesso até", dataOuTraco(atual.acesso_ate)],
    ["Último acesso", dataOuTraco(atual.ultimo_acesso)],
    ["Módulo atual", atual.modulo_atual ?? "-"],
    ["Posts em 7 dias", String(atual.posts_7_dias ?? 0)],
    ["Faturamento (4 semanas)", atual.ultimo_faturamento != null ? formatarMoeda(atual.ultimo_faturamento) : "-"],
    ["Nota do site", atual.ultima_nota_site != null ? String(atual.ultima_nota_site) : "-"],
  ];

  return (
    <CardOverlay
      aberto={Boolean(aluna)}
      onFechar={onFechar}
      largo
      titulo={atual.nome ?? atual.email}
      subtitulo={atual.modulo_atual ? `Está em ${atual.modulo_atual}` : "Ainda não começou o método"}
      rodape={
        <>
          <BotaoSecundario onClick={onDiagnosticos}>Ver diagnósticos</BotaoSecundario>
          <BotaoSecundario onClick={reenviar} disabled={ocupado !== null}>{ocupado === "reenviar" ? "Enviando..." : "Reenviar acesso"}</BotaoSecundario>
          <BotaoSecundario onClick={pausar} disabled={ocupado !== null}>{atual.status === "pausada" ? "Reativar acesso" : "Pausar acesso"}</BotaoSecundario>
          <BotaoPrimario onClick={renovar} disabled={ocupado !== null}>{ocupado === "renovar" ? "Renovando..." : "Renovar por 1 ano"}</BotaoPrimario>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div>
          <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", s.cls)}>{s.texto}</span>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-sm"><span>Progresso no método</span><span className="font-semibold tabular-nums">{Math.round(atual.progresso_pct ?? 0)}%</span></div>
            <Barra valor={atual.progresso_pct ?? 0} />
          </div>
          <dl className="mt-5 grid grid-cols-[130px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
            {linhas.map(([r, v]) => (
              <div key={r} className="contents">
                <dt className="text-muted-foreground">{r}</dt>
                <dd className="break-words">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <p className="text-sm font-semibold">Respostas da pesquisa</p>
          {respostas && Object.keys(respostas).length ? (
            <dl className="mt-3 space-y-2.5 text-sm">
              {Object.entries(respostas).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground first-letter:uppercase">{k.replace(/_/g, " ")}</dt>
                  <dd className="font-medium">{Array.isArray(v) ? v.join(", ") : String(v)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">Ainda não respondeu.</p>
          )}
        </div>
      </div>
    </CardOverlay>
  );
}

export function CadastroAluna({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const qc = useQueryClient();
  const cadastrar = useServerFn(cadastrarAluna);
  const vazio = { nome: "", email: "", telefone: "", acessoAte: "", motivo: "Cortesia" };
  const [f, setF] = useState(vazio);
  const [enviando, setEnviando] = useState(false);
  useEffect(() => {
    if (aberto) setF(vazio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.nome.trim() || !f.email.trim()) {
      toast.error("Preencha o nome e o e-mail.");
      return;
    }
    setEnviando(true);
    try {
      const { data } = await supabase.auth.getSession();
      const r = await cadastrar({
        data: {
          token: data.session?.access_token ?? "",
          nome: f.nome,
          email: f.email,
          ...(f.telefone.trim() ? { telefone: f.telefone } : {}),
          ...(f.acessoAte ? { acessoAte: f.acessoAte } : {}),
          origem: window.location.origin,
        },
      });
      if ("erro" in r && r.erro) {
        toast.error(r.erro);
        return;
      }
      toast.success("Aluna cadastrada. Ela recebeu o e-mail pra criar a senha.");
      void qc.invalidateQueries({ queryKey: ["admin", "admin_resumo_alunas"] });
      onFechar();
    } catch {
      toast.error("Não consegui cadastrar agora. Tenta de novo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <CardOverlay
      aberto={aberto}
      onFechar={onFechar}
      titulo="Cadastrar aluna"
      subtitulo="Pra cortesias, compras fora da Lastlink e trocas de e-mail. Quem compra pela Lastlink entra sozinha."
      rodape={<><BotaoSecundario onClick={onFechar}>Cancelar</BotaoSecundario><BotaoPrimario type="submit" form="form-cadastro-aluna" disabled={enviando}>{enviando ? "Cadastrando..." : "Cadastrar e enviar acesso"}</BotaoPrimario></>}
    >
      <form id="form-cadastro-aluna" onSubmit={enviar} className="space-y-4">
        <Rotulo texto="Nome" obrigatorio><input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={inputCls} /></Rotulo>
        <Rotulo texto="E-mail" obrigatorio><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inputCls} /></Rotulo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Rotulo texto="WhatsApp"><input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} placeholder="(11) 99999-9999" className={inputCls} /></Rotulo>
          <div className="space-y-1.5">
            <span className="text-[13px] font-medium">Acesso até</span>
            <SeletorData valor={f.acessoAte} onChange={(v) => setF({ ...f, acessoAte: v })} />
            <p className="text-xs text-muted-foreground">Em branco: 1 ano a partir de hoje.</p>
          </div>
        </div>
      </form>
    </CardOverlay>
  );
}
