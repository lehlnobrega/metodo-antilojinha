// Formulários das tarefas do tipo 'formulario' (salvos em respostas_tarefas).
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  BotaoPrimario,
  BotaoSecundario,
  CardOverlay,
  CardsOpcao,
  Pilulas,
  Rotulo,
  SeletorData,
  SeletorHora,
  inputCls,
  textareaCls,
} from "@/components/metodo/overlay";
import type { Tarefa } from "@/lib/dados";
import { useSalvarResposta } from "@/lib/dados-loja";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dados = any;

export const DIAS_SEMANA = [
  { valor: 1, rotulo: "Seg" },
  { valor: 2, rotulo: "Ter" },
  { valor: 3, rotulo: "Qua" },
  { valor: 4, rotulo: "Qui" },
  { valor: 5, rotulo: "Sex" },
  { valor: 6, rotulo: "Sáb" },
  { valor: 0, rotulo: "Dom" },
];

const MOMENTOS = [
  { valor: "nova", titulo: "Loja nova", texto: "Antecipação de 2 a 3 semanas", emoji: "🌱", sugestao: "2 a 3 semanas de antecipação antes de abrir." },
  { valor: "lancamento", titulo: "Lançamento de produto ou coleção", texto: "5 a 7 dias", emoji: "🚀", sugestao: "5 a 7 dias de antecipação antes do lançamento." },
  { valor: "reabertura", titulo: "Reabertura de loja parada", texto: "Conta o recomeço", emoji: "🔁", sugestao: "Conte o recomeço: cerca de 1 semana mostrando o que mudou." },
  { valor: "reposicao", titulo: "Reposição frequente", texto: "1 a 2 dias", emoji: "📦", sugestao: "1 a 2 dias avisando que a reposição está chegando." },
];

const CONFIG: Record<string, { titulo: string; subtitulo?: string }> = {
  form_reuniao: { titulo: "Sua reunião semanal com a empresa", subtitulo: "Um horário fixo por semana pra olhar seus números, organizar as tarefas e deixar conteúdo adiantado." },
  form_lojas_referencia: { titulo: "3 lojas de referência", subtitulo: "Pelo menos uma de outro nicho. Enxerga, entende por que funciona e traz pra sua realidade." },
  form_objecoes_preco: { titulo: "As 3 objeções de preço da sua cliente", subtitulo: "Elas viram conteúdo de quebrar objeção no módulo de conteúdo." },
  form_fixados: { titulo: "Seus 3 fixados", subtitulo: "Os posts fixados são a vitrine do seu perfil." },
  form_momento_loja: { titulo: "O momento da sua loja", subtitulo: "Isso define o tamanho da sua antecipação." },
  form_duvidas_clientes: { titulo: "10 dúvidas das suas clientes", subtitulo: "Olha comentários, direct e WhatsApp. Essa lista vira conteúdo pra semanas." },
};

function inicial(chave: string, d: Dados | undefined): Dados {
  switch (chave) {
    case "form_reuniao":
      return { dia_semana: d?.dia_semana ?? null, hora: d?.hora ?? "" };
    case "form_lojas_referencia": {
      const l = (d?.lojas as Dados[] | undefined) ?? [];
      return { lojas: [0, 1, 2].map((i) => ({ loja: "", nicho: "", adaptar: "", ...(l[i] ?? {}) })) };
    }
    case "form_objecoes_preco": {
      const o = (d?.objecoes as string[] | undefined) ?? [];
      return { objecoes: [0, 1, 2].map((i) => o[i] ?? "") };
    }
    case "form_fixados":
      return { fixados: { duvida: "", como_usar: "", feedbacks: "", ...((d?.fixados as Dados) ?? {}) } };
    case "form_momento_loja":
      return { momento: d?.momento ?? null, data_lancamento: d?.data_lancamento ?? "" };
    case "form_duvidas_clientes": {
      const du = (d?.duvidas as string[] | undefined) ?? [];
      return { duvidas: Array.from({ length: Math.max(10, du.length) }, (_, i) => du[i] ?? "") };
    }
    default:
      return { ...(d ?? {}) };
  }
}

function validar(chave: string, f: Dados): string | null {
  if (chave === "form_reuniao" && (f.dia_semana == null || !f.hora)) return "Escolha o dia e o horário.";
  if (chave === "form_lojas_referencia" && (f.lojas as Dados[]).some((l) => !String(l.loja).trim())) return "Preencha as 3 lojas.";
  if (chave === "form_objecoes_preco" && (f.objecoes as string[]).some((o) => !o.trim())) return "Preencha as 3 objeções.";
  if (chave === "form_fixados" && Object.values(f.fixados as Dados).some((v) => !String(v).trim())) return "Preencha os 3 fixados.";
  if (chave === "form_momento_loja" && !f.momento) return "Escolha o momento da sua loja.";
  if (chave === "form_duvidas_clientes" && (f.duvidas as string[]).filter((x) => x.trim()).length < 10) return "Preencha pelo menos 10 dúvidas.";
  return null;
}

function limpar(chave: string, f: Dados): Dados {
  if (chave === "form_duvidas_clientes") return { duvidas: (f.duvidas as string[]).map((x) => x.trim()).filter(Boolean) };
  if (chave === "form_momento_loja") return { momento: f.momento, data_lancamento: f.data_lancamento || null };
  return f;
}

export function CardFormTarefa({ tarefa, dados, onFechar }: { tarefa: Tarefa | null; dados?: Dados | undefined; onFechar: () => void }) {
  const salvar = useSalvarResposta();
  const chave = tarefa?.chave_auto ?? "";
  const [f, setF] = useState<Dados>({});
  const [original, setOriginal] = useState("");
  useEffect(() => {
    if (!tarefa) return;
    const v = inicial(chave, dados);
    setF(v);
    setOriginal(JSON.stringify(v));
  }, [tarefa]); // eslint-disable-line react-hooks/exhaustive-deps

  const cfg = CONFIG[chave] ?? { titulo: tarefa?.titulo ?? "" };
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const problema = validar(chave, f);
    if (problema) {
      toast.error(problema);
      return;
    }
    try {
      await salvar.mutateAsync({ tarefaId: tarefa!.id, dados: limpar(chave, f) });
      toast.success("Salvo! Tarefa concluída ✓");
      onFechar();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const listaTxt = (campo: string, i: number, v: string) => setF((s: Dados) => ({ ...s, [campo]: (s[campo] as string[]).map((x, j) => (j === i ? v : x)) }));

  return (
    <CardOverlay
      aberto={Boolean(tarefa)}
      onFechar={onFechar}
      sujo={JSON.stringify(f) !== original}
      titulo={cfg.titulo}
      subtitulo={cfg.subtitulo}
      rodape={
        <>
          <BotaoSecundario onClick={onFechar}>Cancelar</BotaoSecundario>
          <BotaoPrimario type="submit" form="form-tarefa" disabled={salvar.isPending}>{salvar.isPending ? "Salvando..." : "Salvar"}</BotaoPrimario>
        </>
      }
    >
      <form id="form-tarefa" onSubmit={enviar} className="space-y-4">
        {chave === "form_reuniao" ? (
          <>
            <div className="space-y-1.5">
              <span className="text-[13px] font-medium">Dia da semana</span>
              <Pilulas valor={f.dia_semana as number | null} onChange={(v) => setF({ ...f, dia_semana: v })} opcoes={DIAS_SEMANA} />
            </div>
            <div className="space-y-1.5">
              <span className="text-[13px] font-medium">Horário</span>
              <SeletorHora valor={String(f.hora ?? "")} onChange={(v) => setF({ ...f, hora: v })} />
            </div>
          </>
        ) : null}

        {chave === "form_lojas_referencia"
          ? (f.lojas as Dados[] | undefined)?.map((l, i) => {
              const setL = (k: string, v: string) => setF((s: Dados) => ({ ...s, lojas: (s.lojas as Dados[]).map((x, j) => (j === i ? { ...x, [k]: v } : x)) }));
              return (
                <div key={i} className="space-y-3 rounded-2xl border border-border p-4">
                  <p className="text-sm font-semibold text-primary">Loja {i + 1}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Rotulo texto="Loja (@ ou link)"><input value={String(l.loja)} onChange={(e) => setL("loja", e.target.value)} className={inputCls} /></Rotulo>
                    <Rotulo texto="Nicho"><input value={String(l.nicho)} onChange={(e) => setL("nicho", e.target.value)} className={inputCls} /></Rotulo>
                  </div>
                  <Rotulo texto="O que funciona e dá pra adaptar pra minha loja">
                    <textarea value={String(l.adaptar)} onChange={(e) => setL("adaptar", e.target.value)} className={textareaCls} />
                  </Rotulo>
                </div>
              );
            })
          : null}

        {chave === "form_objecoes_preco"
          ? (f.objecoes as string[] | undefined)?.map((o, i) => (
              <Rotulo key={i} texto={`Objeção ${i + 1}`}>
                <input value={o} onChange={(e) => listaTxt("objecoes", i, e.target.value)} placeholder="ex: por que essa vela custa R$ 89 se no mercado tem de R$ 15?" className={inputCls} />
              </Rotulo>
            ))
          : null}

        {chave === "form_fixados" && f.fixados
          ? (
              [
                ["duvida", "Fixado 1", "Dúvida mais comum sobre o produto"],
                ["como_usar", "Fixado 2", "Como usar o produto"],
                ["feedbacks", "Fixado 3", "Feedbacks de clientes"],
              ] as const
            ).map(([k, t, s]) => (
              <div key={k} className="space-y-2 rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold"><span className="text-primary">{t}</span>, {s.toLowerCase()}</p>
                <Rotulo texto="Sobre o que vai ser?">
                  <textarea value={String((f.fixados as Dados)[k] ?? "")} onChange={(e) => setF((st: Dados) => ({ ...st, fixados: { ...(st.fixados as Dados), [k]: e.target.value } }))} className={textareaCls} />
                </Rotulo>
              </div>
            ))
          : null}

        {chave === "form_momento_loja" ? (
          <>
            <CardsOpcao colunas={1} valor={f.momento as string | null} onChange={(v) => setF({ ...f, momento: v })} opcoes={MOMENTOS} />
            {f.momento ? (
              <p className="rounded-2xl bg-accent-soft p-4 text-sm">
                <span className="font-semibold text-primary">Antecipação sugerida: </span>
                {MOMENTOS.find((m) => m.valor === f.momento)?.sugestao}
              </p>
            ) : null}
            <Rotulo texto="Data prevista do lançamento (opcional)">
              <SeletorData valor={String(f.data_lancamento ?? "")} onChange={(v) => setF({ ...f, data_lancamento: v })} />
            </Rotulo>
          </>
        ) : null}

        {chave === "form_duvidas_clientes" ? (
          <>
            {(f.duvidas as string[] | undefined)?.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-primary">{i + 1}</span>
                <input value={d} onChange={(e) => listaTxt("duvidas", i, e.target.value)} aria-label={`Dúvida ${i + 1}`} className={inputCls} />
              </div>
            ))}
            <button type="button" onClick={() => setF((s: Dados) => ({ ...s, duvidas: [...(s.duvidas as string[]), ""] }))} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <Plus className="size-4" /> Adicionar mais
            </button>
            <p className="text-xs text-muted-foreground">{(f.duvidas as string[] | undefined)?.filter((x) => x.trim()).length ?? 0} de 10 preenchidas</p>
          </>
        ) : null}
      </form>
    </CardOverlay>
  );
}
