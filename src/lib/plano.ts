// Regras do plano prático: módulo atual, pendências e status das etapas do plano de negócios.
import { type DadosPlano, ETAPAS, etapaIniciada } from "@/lib/plano-negocios";
import type { DadosTarefas, Modulo, PlanoNegocios, Tarefa } from "@/lib/dados";

export const SLUG_PLANO = "plano";

export function moduloConcluido(m: Modulo) {
  return m.total_tarefas > 0 && m.tarefas_feitas >= m.total_tarefas;
}

/** Primeiro módulo liberado que ainda tem tarefa pendente. */
export function moduloAtual(modulos: Modulo[]) {
  return modulos.find((m) => m.liberado && !moduloConcluido(m)) ?? null;
}

export function proximoBloqueado(modulos: Modulo[]) {
  return modulos.find((m) => !m.liberado) ?? null;
}

/** Módulo anterior liberado com pendência, quando já há tarefas feitas em módulos depois dele. */
export function pendenciaAnterior(modulos: Modulo[]) {
  const liberados = modulos.filter((m) => m.liberado);
  for (let i = 0; i < liberados.length; i += 1) {
    const m = liberados[i]!;
    const faltam = m.total_tarefas - m.tarefas_feitas;
    if (faltam > 0 && liberados.slice(i + 1).some((d) => d.tarefas_feitas > 0)) {
      return { modulo: m, faltam };
    }
  }
  return null;
}

export function tarefasDoModulo(dados: DadosTarefas | undefined, moduloId: number) {
  return (dados?.tarefas ?? []).filter((t) => t.modulo_id === moduloId).sort((a, b) => a.ordem - b.ordem);
}

export type StatusEtapa = "nao" | "andamento" | "concluida";

export function statusEtapa(t: Tarefa, dados: DadosTarefas | undefined, plano: PlanoNegocios | null | undefined): StatusEtapa {
  if (dados?.feitas.has(t.id)) return "concluida";
  const chave = (t.chave_auto ?? "").replace(/^plano_/, "");
  const etapa = ETAPAS.find((e) => e.chave === chave);
  if (etapa && etapaIniciada(etapa.chave, (plano?.dados ?? {}) as DadosPlano)) return "andamento";
  return "nao";
}

export function porcentagemGeral(modulos: Modulo[]) {
  const total = modulos.reduce((s, m) => s + m.total_tarefas, 0);
  const feitas = modulos.reduce((s, m) => s + m.tarefas_feitas, 0);
  return { total, feitas, pct: total ? Math.round((feitas / total) * 100) : 0 };
}
