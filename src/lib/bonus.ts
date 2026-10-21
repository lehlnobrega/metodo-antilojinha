// Bônus (cards depois dos módulos) e os itens de cada bônus, como as skills.
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/metodo/client";

export type StatusBonus = "liberado" | "em_breve" | "escondido";
export type Bonus = { id: number; ordem: number; titulo: string; descricao: string | null; status: StatusBonus };
export type ItemBonus = {
  id: number;
  bonus_id: number;
  ordem: number;
  titulo: string;
  descricao: string | null;
  link: string | null;
  publicado: boolean;
};

export const ROTULO_STATUS_BONUS: Record<StatusBonus, string> = {
  liberado: "Liberado",
  em_breve: "Em breve",
  escondido: "Escondido",
};

function falha(e: unknown): never {
  throw new Error((e as { message?: string })?.message ?? "Erro ao carregar");
}

export function useBonus() {
  return useQuery({
    queryKey: ["bonus"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bonus").select("id, ordem, titulo, descricao, status").order("ordem").order("id");
      if (error) falha(error);
      return (data ?? []) as Bonus[];
    },
  });
}

/** bonusId undefined traz os itens de todos os bônus (uso do admin). */
export function useItensBonus(bonusId?: number) {
  return useQuery({
    queryKey: ["bonus-itens", bonusId ?? "todos"],
    queryFn: async () => {
      let q = supabase.from("bonus_itens").select("id, bonus_id, ordem, titulo, descricao, link, publicado").order("ordem").order("id");
      if (bonusId !== undefined) q = q.eq("bonus_id", bonusId);
      const { data, error } = await q;
      if (error) falha(error);
      return (data ?? []) as ItemBonus[];
    },
  });
}
