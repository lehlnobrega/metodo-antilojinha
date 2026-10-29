// Posts, métricas, respostas de tarefas, lives e indicações (o RLS filtra os dados da aluna).
import { semVazios } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/metodo/client";
import { useAluna } from "@/lib/aluna";
import { hojeSaoPaulo } from "@/lib/formato";

export type Post = {
  id: number;
  data_post: string;
  link: string | null;
  plataforma: string | null;
  tipo_cqc: string | null;
  views: number | null;
  curtidas: number | null;
  comentarios: number | null;
  compartilhamentos: number | null;
  salvamentos: number | null;
  visitas_perfil: number | null;
  seguidores_ganhos: number | null;
  metricas_atualizadas_em: string | null;
  titulo: string | null;
  formato: string | null;
  sobre_video: string | null;
  roteiro: string | null;
  legenda: string | null;
  status: string;
  publicado_em: string | null;
};

export type Metrica = {
  id: number;
  mes: string;
  faturamento: number | null;
  pedidos: number | null;
  sessoes: number | null;
  seguidores_instagram: number | null;
  seguidores_tiktok: number | null;
};

export const PLATAFORMAS = [
  { valor: "instagram", rotulo: "Instagram" },
  { valor: "tiktok", rotulo: "TikTok" },
  { valor: "ambos", rotulo: "Ambos" },
] as const;

export const TIPOS_CQC = [
  { valor: "desejo", emoji: "✨", titulo: "Despertar desejo", texto: "Atrai quem nunca te viu" },
  { valor: "objecao", emoji: "💬", titulo: "Quebrar objeção", texto: "Responde a dúvida que trava a compra" },
  { valor: "conexao", emoji: "🤍", titulo: "Gerar conexão", texto: "Bastidor e história" },
  { valor: "oferta", emoji: "🛍️", titulo: "Fazer oferta", texto: "Venda direta" },
] as const;

export const nomePlataforma = (v: string | null) => PLATAFORMAS.find((p) => p.valor === v?.toLowerCase())?.rotulo ?? v ?? "Post";
export const nomeTipo = (v: string | null) => TIPOS_CQC.find((t) => t.valor === v)?.titulo ?? null;

/** Dias que faltam para liberar os resultados (0 = liberado). */
export function diasParaResultado(dataPost: string) {
  const hoje = Date.parse(`${hojeSaoPaulo()}T12:00:00Z`);
  const post = Date.parse(`${dataPost.slice(0, 10)}T12:00:00Z`);
  return Math.max(0, 7 - Math.round((hoje - post) / 864e5));
}
export const resultadoPendente = (p: Post) => p.status === "publicado" && !p.metricas_atualizadas_em && diasParaResultado(p.data_post) === 0;

const CAMPOS_POST =
  "id, data_post, link, plataforma, tipo_cqc, views, curtidas, comentarios, compartilhamentos, salvamentos, visitas_perfil, seguidores_ganhos, metricas_atualizadas_em, titulo, formato, sobre_video, roteiro, legenda, status, publicado_em";

function erro(e: unknown): never {
  throw new Error((e as { message?: string })?.message ?? "Erro ao salvar");
}

function invalidarTudo(qc: ReturnType<typeof useQueryClient>) {
  for (const k of ["posts", "posts-datas", "posts-semana", "metricas", "metrica-ultima", "tarefas", "modulos", "respostas", "metricas-semana", "diagnosticos"]) {
    qc.invalidateQueries({ queryKey: [k] });
  }
}

export function usePosts() {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["posts", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(CAMPOS_POST)
        .eq("aluna_id", sessao!.user.id)
        .order("data_post", { ascending: false })
        .limit(1000);
      if (error) erro(error);
      return (data ?? []) as Post[];
    },
  });
}

export function useRegistrarPost() {
  const qc = useQueryClient();
  const { sessao } = useAluna();
  return useMutation({
    mutationFn: async (p: { link: string; data_post: string; plataforma: string; tipo_cqc: string | null }) => {
      const { error } = await supabase.from("posts").insert(semVazios({ ...p, aluna_id: sessao!.user.id }));
      if (error) erro(error);
    },
    onSettled: () => invalidarTudo(qc),
  });
}

export type Resultados = Pick<Post, "views" | "curtidas" | "comentarios" | "compartilhamentos" | "salvamentos" | "visitas_perfil" | "seguidores_ganhos">;

export function useSalvarResultados() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...r }: Resultados & { id: number }) => {
      const { error } = await supabase.from("posts").update({ ...r, metricas_atualizadas_em: new Date().toISOString() }).eq("id", id);
      if (error) erro(error);
    },
    onSettled: () => invalidarTudo(qc),
  });
}

export function useApagarPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) erro(error);
    },
    onSettled: () => invalidarTudo(qc),
  });
}

export function useMetricas() {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["metricas", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metricas_loja")
        .select("id, mes, faturamento, pedidos, sessoes, seguidores_instagram, seguidores_tiktok")
        .eq("aluna_id", sessao!.user.id)
        .order("mes", { ascending: false });
      if (error) erro(error);
      return (data ?? []) as Metrica[];
    },
  });
}

/** Upsert do mês (nunca envia ticket_medio nem taxa_conversao; o banco calcula). */
export function useSalvarMetrica() {
  const qc = useQueryClient();
  const { sessao } = useAluna();
  return useMutation({
    mutationFn: async (m: Omit<Metrica, "id">) => {
      const { error } = await supabase
        .from("metricas_loja")
        .upsert({ ...m, aluna_id: sessao!.user.id }, { onConflict: "aluna_id,mes" });
      if (error) erro(error);
    },
    onSettled: () => invalidarTudo(qc),
  });
}

// Respostas das tarefas com formulário
export type Resposta = { tarefa_id: number; dados: Record<string, unknown>; updated_at: string };

export function useRespostas() {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["respostas", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const { data, error } = await supabase.from("respostas_tarefas").select("tarefa_id, dados, updated_at").eq("aluna_id", sessao!.user.id);
      if (error) erro(error);
      return new Map(((data ?? []) as Resposta[]).map((r) => [r.tarefa_id, r]));
    },
  });
}

export function useSalvarResposta() {
  const qc = useQueryClient();
  const { sessao } = useAluna();
  return useMutation({
    mutationFn: async ({ tarefaId, dados }: { tarefaId: number; dados: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("respostas_tarefas")
        .upsert({ aluna_id: sessao!.user.id, tarefa_id: tarefaId, dados, updated_at: new Date().toISOString() }, { onConflict: "aluna_id,tarefa_id" });
      if (error) erro(error);
    },
    onSettled: () => invalidarTudo(qc),
  });
}

// Aulas ao vivo
export type Aula = { id: number; titulo: string; descricao: string | null; data_hora: string; link: string; ativo: boolean };

export function useAulasDoMes() {
  const { sessao } = useAluna();
  const mes = hojeSaoPaulo().slice(0, 7);
  return useQuery({
    queryKey: ["aulas", mes, sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const [a, m] = mes.split("-").map(Number);
      const inicio = new Date(Date.UTC(a!, m! - 1, 1, 3)).toISOString();
      const fim = new Date(Date.UTC(a!, m!, 1, 3)).toISOString();
      const { data, error } = await supabase
        .from("aulas_ao_vivo")
        .select("id, titulo, descricao, data_hora, link, ativo")
        .eq("ativo", true)
        .gte("data_hora", inicio)
        .lt("data_hora", fim)
        .order("data_hora");
      if (error) erro(error);
      return (data ?? []) as Aula[];
    },
  });
}

// Indicações
export type Categoria = { id: number; tipo: "produto" | "app"; nome: string; ordem: number };

export function useCategorias() {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["categorias-indicacoes", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const { data, error } = await supabase.from("categorias_indicacoes").select("id, tipo, nome, ordem").order("ordem");
      if (error) erro(error);
      return (data ?? []) as Categoria[];
    },
  });
}

// ---------------- Calendário de conteúdos ----------------
export type CamposConteudo = Partial<Pick<Post, "titulo" | "data_post" | "plataforma" | "formato" | "tipo_cqc" | "status" | "sobre_video" | "roteiro" | "legenda" | "link">>;

export function useSalvarConteudo() {
  const qc = useQueryClient();
  const { sessao } = useAluna();
  return useMutation({
    mutationFn: async ({ id, ...c }: CamposConteudo & { id?: number | undefined }) => {
      if (id) {
        const { data, error } = await supabase.from("posts").update(c).eq("id", id).select(CAMPOS_POST).single();
        if (error) erro(error);
        return data as Post;
      }
      const { data, error } = await supabase.from("posts").insert(semVazios({ ...c, aluna_id: sessao!.user.id })).select(CAMPOS_POST).single();
      if (error) erro(error);
      return data as Post;
    },
    onSettled: () => invalidarTudo(qc),
  });
}

/** Muda só a data (arrastar e soltar), com atualização otimista. */
export function useMoverConteudo() {
  const qc = useQueryClient();
  const { sessao } = useAluna();
  const chave = ["posts", sessao?.user.id];
  return useMutation({
    mutationFn: async ({ id, data_post }: { id: number; data_post: string }) => {
      const { error } = await supabase.from("posts").update({ data_post }).eq("id", id);
      if (error) erro(error);
    },
    onMutate: async ({ id, data_post }) => {
      await qc.cancelQueries({ queryKey: chave });
      const antes = qc.getQueryData<Post[]>(chave);
      qc.setQueryData<Post[]>(chave, (l) => (l ?? []).map((p) => (p.id === id ? { ...p, data_post } : p)));
      return { antes };
    },
    onError: (_e, _v, ctx) => { if (ctx?.antes) qc.setQueryData(chave, ctx.antes); },
    onSettled: () => invalidarTudo(qc),
  });
}

/** Pontuação de desempenho (null se os resultados não foram preenchidos). */
export function pontuacao(p: Post) {
  if (!p.metricas_atualizadas_em) return null;
  const n = (v: number | null) => v ?? 0;
  return n(p.views) + n(p.curtidas) + 3 * n(p.comentarios) + 5 * (n(p.compartilhamentos) + n(p.salvamentos)) + 10 * n(p.visitas_perfil) + 20 * n(p.seguidores_ganhos);
}

// ---------------- Dados da loja por semana ----------------
export type MetricaSemana = {
  id: number;
  semana: string;
  faturamento: number | null;
  pedidos: number | null;
  sessoes: number | null;
  seguidores_instagram: number | null;
  seguidores_tiktok: number | null;
  ticket_medio: number | null;
  taxa_conversao: number | null;
};

export function useMetricasSemana() {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["metricas-semana", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metricas_semana")
        .select("id, semana, faturamento, pedidos, sessoes, seguidores_instagram, seguidores_tiktok, ticket_medio, taxa_conversao")
        .eq("aluna_id", sessao!.user.id)
        .order("semana", { ascending: false })
        .limit(156);
      if (error) erro(error);
      return ((data ?? []) as MetricaSemana[]).map((m) => ({ ...m, semana: m.semana.slice(0, 10) }));
    },
  });
}

/** Upsert da semana (nunca envia ticket_medio nem taxa_conversao; o banco calcula). */
export function useSalvarSemana() {
  const qc = useQueryClient();
  const { sessao } = useAluna();
  return useMutation({
    mutationFn: async (m: Omit<MetricaSemana, "id" | "ticket_medio" | "taxa_conversao">) => {
      const { error } = await supabase.from("metricas_semana").upsert({ ...m, aluna_id: sessao!.user.id }, { onConflict: "aluna_id,semana" });
      if (error) erro(error);
    },
    onSettled: () => invalidarTudo(qc),
  });
}

// ---------------- Diagnóstico semanal ----------------
export type ConteudoDiagnostico = {
  resumo?: string;
  semana_em_numeros?: string;
  confianca?: "baixa" | "media" | "alta";
  funcionando?: string[];
  ajustar?: { ponto: string; por_que: string; como_ajustar: string; modulo?: string }[];
  acao_da_semana?: { titulo: string; passos: string[]; modulo?: string };
  replicar?: { post_id: number | null; motivo: string };
};
export type Diagnostico = { id: number; semana: string; conteudo: ConteudoDiagnostico; gerado_vezes: number; created_at: string };

export function useDiagnosticos(alunaId?: string) {
  const { sessao } = useAluna();
  const id = alunaId ?? sessao?.user.id;
  return useQuery({
    queryKey: ["diagnosticos", id],
    enabled: Boolean(sessao && id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnosticos")
        .select("id, semana, conteudo, gerado_vezes, created_at")
        .eq("aluna_id", id!)
        .order("semana", { ascending: false });
      if (error) erro(error);
      return ((data ?? []) as Diagnostico[]).map((d) => ({ ...d, semana: d.semana.slice(0, 10) }));
    },
  });
}
