// Status do calendário de conteúdos (cores definidas pela Letícia).
export const STATUS = [
  { valor: "nao_roteirizado", rotulo: "Não roteirizado", fundo: "#EFEBE0", texto: "#7A6670" },
  { valor: "roteirizado", rotulo: "Roteirizado", fundo: "#FFF4DC", texto: "#9A6200" },
  { valor: "gravado", rotulo: "Gravado", fundo: "#E8EEFB", texto: "#3558A8" },
  { valor: "editado", rotulo: "Editado", fundo: "#EFE6FA", texto: "#6B3FA0" },
  { valor: "programado", rotulo: "Programado", fundo: "#FBE3EF", texto: "#AD156A" },
  { valor: "publicado", rotulo: "Publicado", fundo: "#E3F4EC", texto: "#2E9E6B" },
] as const;

export const statusInfo = (v: string | null | undefined) => STATUS.find((s) => s.valor === v) ?? STATUS[0];

export const FORMATOS = [
  { valor: "video", rotulo: "Vídeo" },
  { valor: "carrossel", rotulo: "Carrossel" },
] as const;
export const nomeFormato = (v: string | null | undefined) => FORMATOS.find((f) => f.valor === v)?.rotulo ?? null;

export const LIMITE_LEGENDA = 2200;

export function normalizarLink(l: string) {
  const t = l.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}
