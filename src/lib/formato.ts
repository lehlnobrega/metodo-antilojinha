import { FUSO } from "@/config";

export function formatarData(valor: string | Date) {
  const data = typeof valor === "string" ? new Date(valor) : valor;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, dateStyle: "short" }).format(data);
}

export function formatarDataExtenso(valor: string | Date = new Date()) {
  const data = typeof valor === "string" ? new Date(valor) : valor;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
    .format(data)
    .replace(/^./, (c) => c.toUpperCase());
}

export function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

export function formatarNumero(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(valor);
}

/** Data de hoje (AAAA-MM-DD) no fuso America/Sao_Paulo. */
export function hojeSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(new Date());
}

export function saudacao() {
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", hour12: false }).format(new Date()),
  );
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export function primeiroNome(nome?: string | null) {
  if (!nome) return "";
  return nome.trim().split(" ")[0] ?? "";
}

// ---------------- Semanas (segunda a domingo) ----------------
const DIA_MS = 864e5;
const msDia = (d: string) => Date.parse(`${d.slice(0, 10)}T12:00:00Z`);
const isoDia = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const somarDias = (dia: string, n: number) => isoDia(msDia(dia) + n * DIA_MS);
export function segundaDe(dia: string) {
  const ms = msDia(dia);
  return isoDia(ms - ((new Date(ms).getUTCDay() + 6) % 7) * DIA_MS);
}
/** Segunda-feira da última semana que já terminou. */
export const ultimaSemanaCompleta = () => somarDias(segundaDe(hojeSaoPaulo()), -7);
export const ddmm = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
export const rotuloSemana = (segunda: string) => `${ddmm(segunda)} a ${ddmm(somarDias(segunda, 6))}`;
export const dataBR = (dia: string) => dia.slice(0, 10).split("-").reverse().join("/");
