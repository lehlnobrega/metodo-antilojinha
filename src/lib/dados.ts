// Leituras do banco Método (como a aluna logada; o RLS filtra os dados dela).
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

import { supabase } from "@/integrations/metodo/client";
import { useAluna } from "@/lib/aluna";

export type Modulo = {
  id: number;
  ordem: number;
  slug: string;
  titulo: string;
  descricao: string | null;
  libera_em: string | null;
  liberado: boolean;
  total_tarefas: number;
  tarefas_feitas: number;
};
export type Tarefa = {
  id: number;
  modulo_id: number;
  ordem: number;
  titulo: string;
  descricao: string | null;
  tipo: string;
  chave_auto: string | null;
};
export type DadosTarefas = { tarefas: Tarefa[]; feitas: Set<number>; datas: Map<number, string> };
export type Material = {
  id: number;
  modulo_id: number;
  ordem: number;
  titulo: string;
  descricao: string | null;
  tipo: string | null;
  url: string | null;
  conteudo: string | null;
};
export type Indicacao = {
  id: number;
  categoria: string;
  titulo: string;
  descricao: string | null;
  url: string;
  imagem_url: string | null;
  ordem: number;
  subcategoria_id: number | null;
};

function falhou(error: unknown): never {
  throw new Error((error as { message?: string })?.message ?? "Erro ao carregar");
}

export function useModulos() {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["modulos", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const { data, error } = await supabase.from("meus_modulos").select("*").order("ordem");
      if (error) falhou(error);
      return (data ?? []) as Modulo[];
    },
  });
}

export function useTarefas() {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["tarefas", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const [t, c] = await Promise.all([
        supabase.from("tarefas").select("id, modulo_id, ordem, titulo, descricao, tipo, chave_auto").order("ordem"),
        supabase.from("tarefas_concluidas").select("tarefa_id, concluida_em"),
      ]);
      if (t.error) falhou(t.error);
      if (c.error) falhou(c.error);
      const linhas = (c.data ?? []) as { tarefa_id: number; concluida_em: string | null }[];
      return {
        tarefas: (t.data ?? []) as Tarefa[],
        feitas: new Set(linhas.map((r) => r.tarefa_id)),
        datas: new Map(linhas.filter((r) => r.concluida_em).map((r) => [r.tarefa_id, r.concluida_em!])),
      } as DadosTarefas;
    },
  });
}

export function useMarcarTarefa() {
  const qc = useQueryClient();
  const { sessao } = useAluna();
  return useMutation({
    mutationFn: async ({ id, feita }: { id: number; feita: boolean }) => {
      const alunaId = sessao!.user.id;
      const { error } = feita
        ? await supabase.from("tarefas_concluidas").insert({ aluna_id: alunaId, tarefa_id: id })
        : await supabase.from("tarefas_concluidas").delete().eq("aluna_id", alunaId).eq("tarefa_id", id);
      if (error) falhou(error);
    },
    onMutate: async ({ id, feita }) => {
      const chaveT = ["tarefas", sessao?.user.id];
      const chaveM = ["modulos", sessao?.user.id];
      await qc.cancelQueries({ queryKey: chaveT });
      const antesT = qc.getQueryData<DadosTarefas>(chaveT);
      const antesM = qc.getQueryData<Modulo[]>(chaveM);
      if (antesT) {
        const feitas = new Set(antesT.feitas);
        const datas = new Map(antesT.datas);
        if (feita) {
          feitas.add(id);
          datas.set(id, new Date().toISOString());
        } else {
          feitas.delete(id);
          datas.delete(id);
        }
        qc.setQueryData(chaveT, { ...antesT, feitas, datas });
        const moduloId = antesT.tarefas.find((t) => t.id === id)?.modulo_id;
        if (antesM && moduloId) {
          qc.setQueryData(
            chaveM,
            antesM.map((m) => (m.id === moduloId ? { ...m, tarefas_feitas: m.tarefas_feitas + (feita ? 1 : -1) } : m)),
          );
        }
      }
      return { antesT, antesM, chaveT, chaveM };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.antesT) qc.setQueryData(ctx.chaveT, ctx.antesT);
      if (ctx?.antesM) qc.setQueryData(ctx.chaveM, ctx.antesM);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tarefas"] });
      qc.invalidateQueries({ queryKey: ["modulos"] });
    },
  });
}

export function useMateriais() {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["materiais", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const { data, error } = await supabase.from("materiais").select("*").order("ordem");
      if (error) falhou(error);
      return (data ?? []) as Material[];
    },
  });
}

export function useIndicacoes() {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["indicacoes", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indicacoes")
        .select("id, categoria, titulo, descricao, url, imagem_url, ordem, subcategoria_id")
        .eq("ativo", true)
        .order("ordem");
      if (error) falhou(error);
      return (data ?? []) as Indicacao[];
    },
  });
}

export async function registrarClique(indicacaoId: number, alunaId: string) {
  await supabase.from("cliques_indicacoes").insert({ indicacao_id: indicacaoId, aluna_id: alunaId });
}

export function useUltimaMetrica() {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["metrica-ultima", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metricas_loja")
        .select("mes, faturamento, pedidos")
        .order("mes", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) falhou(error);
      return data as { mes: string; faturamento: number | null; pedidos: number | null } | null;
    },
  });
}

export function usePostsSemana() {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["posts-semana", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meus_posts_semana")
        .select("*")
        .order("semana", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) falhou(error);
      return data as { semana: string; posts: number; dias_com_post: number } | null;
    },
  });
}

/** Datas (AAAA-MM-DD) dos posts da aluna, para a ofensiva e a semana. */
export function usePostsDatas() {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["posts-datas", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("data_post")
        .eq("status", "publicado")
        .order("data_post", { ascending: false })
        .limit(800);
      if (error) falhou(error);
      return ((data ?? []) as { data_post: string }[]).map((p) => p.data_post);
    },
  });
}

export function useRegistrarPostHoje() {
  const qc = useQueryClient();
  const { sessao } = useAluna();
  return useMutation({
    mutationFn: async (dataPost: string) => {
      const { error } = await supabase.from("posts").insert({ aluna_id: sessao!.user.id, data_post: dataPost });
      if (error) falhou(error);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["posts-datas"] });
      qc.invalidateQueries({ queryKey: ["posts-semana"] });
      qc.invalidateQueries({ queryKey: ["tarefas"] });
      qc.invalidateQueries({ queryKey: ["modulos"] });
    },
  });
}

export type PlanoNegocios = {
  dados: Record<string, unknown> | null;
  etapas_concluidas: string[] | null;
  pdf_exportado_em: string | null;
  concluido_em: string | null;
  textos_aprimorados: Record<string, string> | null;
};

export function usePlanoNegocios() {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["plano-negocios", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plano_negocios")
        .select("dados, etapas_concluidas, pdf_exportado_em, concluido_em, textos_aprimorados")
        .eq("aluna_id", sessao!.user.id)
        .maybeSingle();
      if (error) falhou(error);
      return (data as PlanoNegocios | null) ?? null;
    },
  });
}

export type Pergunta = {
  id: number;
  ordem: number;
  chave: string;
  texto: string;
  tipo: string;
  opcoes: string[] | null;
  obrigatoria: boolean;
  dica: string | null;
};

export function usePerguntas() {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["perguntas", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perguntas_pesquisa")
        .select("id, ordem, chave, texto, tipo, opcoes, obrigatoria, dica")
        .eq("ativa", true)
        .order("ordem");
      if (error) falhou(error);
      return (data ?? []) as Pergunta[];
    },
  });
}
