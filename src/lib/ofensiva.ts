import { FUSO } from "@/config";

/** Converte uma data para AAAA-MM-DD no fuso America/Sao_Paulo. */
export function diaSP(valor: string | Date): string {
  const data = typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? null : new Date(valor);
  if (!data) return valor as string;
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(data);
}

function paraNumero(dia: string) {
  const partes = dia.split("-").map(Number);
  return Date.UTC(partes[0] ?? 1970, (partes[1] ?? 1) - 1, partes[2] ?? 1);
}

function paraDia(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

const UM_DIA = 86400000;

/** Segunda-feira da semana do dia informado (chave da semana). */
function chaveSemana(dia: string) {
  const ms = paraNumero(dia);
  const diaSemana = new Date(ms).getUTCDay(); // 0 = domingo
  const deslocamento = (diaSemana + 6) % 7; // segunda = 0
  return paraDia(ms - deslocamento * UM_DIA);
}

export type ResultadoOfensiva = {
  dias: number;
  /** Dias (AAAA-MM-DD) usados como descanso dentro da contagem. */
  descansos: string[];
  postouHoje: boolean;
};

/**
 * Conta dias seguidos com pelo menos 1 post, voltando a partir de hoje.
 * Cada semana (segunda a domingo) permite 1 dia sem post sem quebrar a ofensiva.
 * Esse dia de descanso não soma na contagem. Um segundo dia sem post na mesma semana quebra.
 */
export function calcularOfensiva(datasPost: string[], hoje = diaSP(new Date())): ResultadoOfensiva {
  const comPost = new Set(datasPost.map((d) => diaSP(d)));
  const postouHoje = comPost.has(hoje);

  let cursor = paraNumero(hoje);
  if (!postouHoje) cursor -= UM_DIA; // hoje ainda não quebrou

  let dias = 0;
  const descansos: string[] = [];
  const descansoUsado = new Set<string>();

  // limite de segurança: 2 anos
  for (let i = 0; i < 730; i += 1) {
    const dia = paraDia(cursor);
    if (comPost.has(dia)) {
      dias += 1;
    } else {
      const semana = chaveSemana(dia);
      if (descansoUsado.has(semana)) break;
      descansoUsado.add(semana);
      descansos.push(dia);
    }
    cursor -= UM_DIA;
  }

  return { dias, descansos, postouHoje };
}

export const MARCOS_OFENSIVA = [7, 15, 30, 60, 100];

export function mensagemDaSemana(posts: number) {
  if (posts === 0) return "Bora começar a semana postando?";
  if (posts <= 2) return "Bom começo! Bora manter o ritmo.";
  if (posts <= 5) return `Tá no caminho! Você postou ${posts} conteúdos essa semana.`;
  return `Você tá arrasando! Postou ${posts} conteúdos essa semana 🔥`;
}
