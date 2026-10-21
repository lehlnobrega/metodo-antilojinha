// Materiais de apoio: módulo > material > páginas (editor estilo Notion).
import { semVazios } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { JSONContent } from "@tiptap/react";

import { supabase } from "@/integrations/metodo/client";
import { useAluna } from "@/lib/aluna";

export type TipoMaterial = "paginas" | "link" | "pdf" | "video" | "ferramenta" | "script";

export type MaterialApoio = {
  id: number;
  modulo_id: number;
  ordem: number;
  titulo: string;
  descricao: string | null;
  emoji: string | null;
  publicado: boolean | null;
  tipo: TipoMaterial | null;
  url: string | null;
  conteudo: string | null;
};

export type PaginaMaterial = {
  id: number;
  material_id: number;
  ordem: number;
  titulo: string;
  emoji: string | null;
  conteudo: JSONContent | null;
  publicado: boolean | null;
  updated_at: string | null;
};

export const TIPOS_MATERIAL: Record<TipoMaterial, string> = {
  paginas: "Páginas",
  link: "Link",
  pdf: "PDF",
  video: "Vídeo",
  ferramenta: "Ferramenta",
  script: "Script",
};

function falhou(error: unknown): never {
  throw new Error((error as { message?: string })?.message ?? "Erro ao carregar");
}

/** Todos os materiais que a pessoa logada pode ver (o RLS filtra para alunas). */
export function useMateriaisApoio() {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["materiais-apoio", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const { data, error } = await supabase.from("materiais").select("*").order("ordem");
      if (error) falhou(error);
      return (data ?? []) as MaterialApoio[];
    },
  });
}

/** Contagem de páginas por material (só as visíveis para quem está logada). */
export function useContagemPaginas() {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["paginas-contagem", sessao?.user.id],
    enabled: Boolean(sessao),
    queryFn: async () => {
      const { data, error } = await supabase.from("paginas_material").select("material_id, publicado");
      if (error) falhou(error);
      const mapa = new Map<number, number>();
      for (const p of (data ?? []) as { material_id: number; publicado: boolean | null }[]) {
        if (p.publicado === false) continue;
        mapa.set(p.material_id, (mapa.get(p.material_id) ?? 0) + 1);
      }
      return mapa;
    },
  });
}

export function usePaginasMaterial(materialId: number | null) {
  const { sessao } = useAluna();
  return useQuery({
    queryKey: ["paginas", materialId, sessao?.user.id],
    enabled: Boolean(sessao) && materialId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paginas_material")
        .select("*")
        .eq("material_id", materialId!)
        .order("ordem");
      if (error) falhou(error);
      return (data ?? []) as PaginaMaterial[];
    },
  });
}

function useInvalidar() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["materiais-apoio"] });
    qc.invalidateQueries({ queryKey: ["materiais"] });
    qc.invalidateQueries({ queryKey: ["paginas-contagem"] });
  };
}

export function useSalvarMaterial() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (m: Partial<MaterialApoio> & { id?: number }) => {
      const { id, ...resto } = m;
      if (id) {
        const { error } = await supabase.from("materiais").update(resto).eq("id", id);
        if (error) falhou(error);
        return id;
      }
      const { data, error } = await supabase.from("materiais").insert(semVazios(resto)).select("id").single();
      if (error) falhou(error);
      return (data as { id: number }).id;
    },
    onSettled: invalidar,
  });
}

export function useExcluirMaterial() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("materiais").delete().eq("id", id);
      if (error) falhou(error);
    },
    onSettled: invalidar,
  });
}

export async function reordenar(tabela: "materiais" | "paginas_material", ids: number[]) {
  const res = await Promise.all(ids.map((id, i) => supabase.from(tabela).update({ ordem: i + 1 }).eq("id", id)));
  const erro = res.find((r) => r.error)?.error;
  if (erro) falhou(erro);
}

export function useMutacaoPaginas(materialId: number) {
  const qc = useQueryClient();
  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["paginas", materialId] });
    qc.invalidateQueries({ queryKey: ["paginas-contagem"] });
  };
  const criar = useMutation({
    mutationFn: async (p: Partial<PaginaMaterial>) => {
      const { data, error } = await supabase
        .from("paginas_material")
        .insert(semVazios({ material_id: materialId, ...p }))
        .select("*")
        .single();
      if (error) falhou(error);
      return data as PaginaMaterial;
    },
    onSettled: invalidar,
  });
  const alterar = useMutation({
    mutationFn: async ({ id, ...p }: Partial<PaginaMaterial> & { id: number }) => {
      const { error } = await supabase
        .from("paginas_material")
        .update({ ...p, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) falhou(error);
    },
  });
  const excluir = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("paginas_material").delete().eq("id", id);
      if (error) falhou(error);
    },
    onSettled: invalidar,
  });
  return { criar, alterar, excluir, invalidar };
}

export const AVISO_PROPRIEDADE =
  "⚠️ Atenção! Esse material é de propriedade de Letícia Nóbrega, CNPJ 42.311.629/0001-00. O compartilhamento, cópia ou venda desse material está sujeito a multa diária, retratação e indenização.";
