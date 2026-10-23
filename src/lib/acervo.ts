// Acervo de ideias de conteúdo (a aluna só lê; o admin gerencia pelo RLS).
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/metodo/client";

export type Nicho = { id: number; nome: string; ordem: number; emoji: string | null };
export type ConteudoAcervo = {
  id: number;
  nicho_id: number;
  titulo: string;
  feedback: string | null;
  formato: "carrossel" | "video";
  tipo_cqc: "desejo" | "objecao" | "conexao" | "oferta";
  link: string;
  ativo: boolean;
  created_at: string;
};

export const TIPOS_ACERVO = [
  { valor: "desejo", emoji: "✨", rotulo: "Despertar desejo", chip: "bg-accent-soft text-primary" },
  { valor: "conexao", emoji: "🤍", rotulo: "Gerar conexão", chip: "bg-success-soft text-success" },
  { valor: "objecao", emoji: "💬", rotulo: "Quebrar objeção", chip: "bg-warning-soft text-warning" },
  { valor: "oferta", emoji: "🛍️", rotulo: "Fazer oferta", chip: "bg-primary text-primary-foreground" },
] as const;

export const FORMATOS_ACERVO = [
  { valor: "video", rotulo: "Vídeo" },
  { valor: "carrossel", rotulo: "Carrossel" },
] as const;

export const tipoAcervo = (v: string) => TIPOS_ACERVO.find((t) => t.valor === v);

export function redeDoLink(link: string): "instagram" | "tiktok" | "outro" {
  const l = link.toLowerCase();
  if (l.includes("instagram.com")) return "instagram";
  if (l.includes("tiktok.com")) return "tiktok";
  return "outro";
}

function falha(e: unknown): never {
  throw new Error((e as { message?: string })?.message ?? "Erro ao carregar");
}

export function useNichos() {
  return useQuery({
    queryKey: ["acervo", "nichos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("nichos_acervo").select("id, nome, ordem, emoji").order("ordem");
      if (error) falha(error);
      return (data ?? []) as Nicho[];
    },
  });
}

/** apenasAtivos=false traz tudo (uso do admin). */
export function useConteudosAcervo(apenasAtivos = true) {
  return useQuery({
    queryKey: ["acervo", "conteudos", apenasAtivos],
    queryFn: async () => {
      let q = supabase
        .from("conteudos_acervo")
        .select("id, nicho_id, titulo, feedback, formato, tipo_cqc, link, ativo, created_at")
        .order("created_at", { ascending: false });
      if (apenasAtivos) q = q.eq("ativo", true);
      const { data, error } = await q;
      if (error) falha(error);
      return (data ?? []) as ConteudoAcervo[];
    },
  });
}

// ===== Formatos virais (aba dentro de Ideias de conteúdo) =====
export type FormatoViral = {
  id: number;
  ordem: number;
  nome: string;
  o_que_e: string | null;
  por_que: string | null;
  como_adaptar: string | null;
  link: string | null;
  /** @ do perfil dono do vídeo de referência */
  credito: string | null;
  publicado: boolean;
};

/** Link de vídeo do Panda vira o player embutido; aceita o link de embed ou só o id do vídeo. */
export const PANDA_PLAYER = "https://player-vz-30e1d25c-f58.tv.pandavideo.com.br/embed/?v=";
export function embedPanda(link: string | null): string | null {
  if (!link) return null;
  const l = link.trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(l)) return PANDA_PLAYER + l;
  if (/pandavideo\.com/i.test(l)) return l;
  return null;
}
export type Decisao = "sim" | "adaptar" | "nao";

export const DECISOES: { valor: Decisao; rotulo: string }[] = [
  { valor: "sim", rotulo: "Combina" },
  { valor: "adaptar", rotulo: "Vou adaptar" },
  { valor: "nao", rotulo: "Não é pra mim" },
];

/** apenasPublicados=false traz tudo (uso do admin). */
export function useFormatosVirais(apenasPublicados = true) {
  return useQuery({
    queryKey: ["acervo", "formatos", apenasPublicados],
    queryFn: async () => {
      let q = supabase.from("formatos_virais").select("id, ordem, nome, o_que_e, por_que, como_adaptar, link, credito, publicado").order("ordem").order("id");
      if (apenasPublicados) q = q.eq("publicado", true);
      const { data, error } = await q;
      if (error) falha(error);
      return (data ?? []) as FormatoViral[];
    },
  });
}

export function useDecisoesFormatos() {
  return useQuery({
    queryKey: ["acervo", "decisoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("decisoes_formatos").select("formato_id, decisao");
      if (error) falha(error);
      return new Map(((data ?? []) as { formato_id: number; decisao: Decisao }[]).map((d) => [d.formato_id, d.decisao]));
    },
  });
}

export async function salvarDecisao(alunaId: string, formatoId: number, decisao: Decisao | null) {
  if (decisao === null) {
    const { error } = await supabase.from("decisoes_formatos").delete().eq("aluna_id", alunaId).eq("formato_id", formatoId);
    if (error) falha(error);
    return;
  }
  const { error } = await supabase
    .from("decisoes_formatos")
    .upsert({ aluna_id: alunaId, formato_id: formatoId, decisao, updated_at: new Date().toISOString() }, { onConflict: "aluna_id,formato_id" });
  if (error) falha(error);
}

// ===== Ideias salvas (coraçãozinho) =====
export function useIdeiasSalvas() {
  return useQuery({
    queryKey: ["acervo", "salvas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ideias_salvas").select("conteudo_id");
      if (error) falha(error);
      return new Set(((data ?? []) as { conteudo_id: number }[]).map((r) => r.conteudo_id));
    },
  });
}

export async function salvarIdeia(alunaId: string, conteudoId: number, salvar: boolean) {
  const { error } = salvar
    ? await supabase.from("ideias_salvas").upsert({ aluna_id: alunaId, conteudo_id: conteudoId }, { onConflict: "aluna_id,conteudo_id" })
    : await supabase.from("ideias_salvas").delete().eq("aluna_id", alunaId).eq("conteudo_id", conteudoId);
  if (error) throw new Error(error.message);
}
