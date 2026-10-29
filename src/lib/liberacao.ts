// O banco de ideias e os formatos virais liberam 7 dias depois da compra
// (passou o prazo de reembolso). O banco também bloqueia pelo RLS.
import { useAluna } from "@/lib/aluna";

export const DIAS_PARA_IDEIAS = 7;
const DIA = 864e5;

export function useLiberacaoIdeias() {
  const { aluna } = useAluna();
  if (!aluna) return { carregando: true, liberado: false, liberaEm: null as Date | null, faltam: 0 };
  if (aluna.is_admin) return { carregando: false, liberado: true, liberaEm: null, faltam: 0 };
  const compra = aluna.data_compra ? new Date(aluna.data_compra) : new Date();
  const liberaEm = new Date(compra.getTime() + DIAS_PARA_IDEIAS * DIA);
  const faltamMs = liberaEm.getTime() - Date.now();
  return {
    carregando: false,
    liberado: faltamMs <= 0,
    liberaEm,
    faltam: Math.max(1, Math.ceil(faltamMs / DIA)),
  };
}

export function textoLiberacao(liberaEm: Date | null, faltam: number) {
  const data = liberaEm
    ? liberaEm.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" })
    : "";
  return `Libera em ${data} (${faltam === 1 ? "falta 1 dia" : `faltam ${faltam} dias`})`;
}
