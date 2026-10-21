// Plano de negócios: formato dos dados, etapas, campos mínimos e cálculos.
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/metodo/client";
import { useAluna } from "@/lib/aluna";

export type Publico = {
  id: string;
  name: string;
  ageRange: string;
  gender: string;
  location: string;
  purchasingPower: string;
  onlineConsumption: string;
  sizeScore: number;
  trendScore: number;
  competitionScore: number;
  ticketScore: number;
  recurrenceScore: number;
};
export type Persona = {
  id: string;
  name: string;
  age: string;
  profession: string;
  painOrDesire: string;
  researchBefore: string;
  onlinePresence: string;
  buyingBarriers: string;
  quote: string;
};
export type Concorrente = {
  id: string;
  name: string;
  strengths: string;
  weaknesses: string;
  averagePrice: string;
  channels: string[];
  whatBetter: string;
};

export type DadosPlano = {
  fullName?: string;
  email?: string;
  storeName?: string;
  date?: string;
  termsAccepted?: boolean;
  niche?: string;
  nicheWhy?: string;
  mainProduct?: string;
  marketPerception?: string;
  competitiveDifferential?: string;
  nicheStatus?: "growing" | "stable" | "declining" | "";
  nicheStatusWhy?: string;
  audiences?: Publico[];
  personas?: Persona[];
  valueField1?: string;
  valueField2?: string;
  valueField3?: string;
  benefit1?: string;
  benefit2?: string;
  benefit3?: string;
  beforeTransformation?: string;
  afterTransformation?: string;
  whyBuyFromYou?: string;
  competitors?: Concorrente[];
  marketPositioning?: string;
  productCost?: string;
  sellingPrice?: string;
  platformCost?: string;
  toolsCost?: string;
  packagingCost?: string;
  otherFixedCosts?: string;
  initialStock?: string;
  brandingCost?: string;
  marketingBudget?: string;
  otherInvestments?: string;
  pessimisticSales?: string;
  realisticSales?: string;
  optimisticSales?: string;
  strengths?: string;
  weaknesses?: string;
  opportunities?: string;
  threats?: string;
  marketingChannels?: string[];
  channelStrategies?: Record<string, string>;
  contentType?: string;
  contentFrequency?: string;
  contentProducer?: string;
  salesProcess?: string;
  entryOffer?: string;
  retentionStrategy?: string;
  loyaltyProgram?: string;
  followerGoal?: string;
  salesMonth1?: string;
  salesMonth2?: string;
  salesMonth3?: string;
};

export const ETAPAS = [
  { chave: "dados", titulo: "Seus dados", curto: "Dados", subtitulo: "Essas informações vão aparecer no seu plano." },
  {
    chave: "nicho",
    titulo: "Nicho e Posicionamento",
    curto: "Nicho",
    subtitulo: "Vamos definir onde sua loja vai atuar e como ela vai se destacar no mercado.",
  },
  {
    chave: "publico",
    titulo: "Público-Alvo",
    curto: "Público",
    subtitulo: "Você pode ter mais de um público. Adicione todos os segmentos que pretende atender.",
  },
  {
    chave: "persona",
    titulo: "Personas",
    curto: "Personas",
    subtitulo:
      "A persona é o cliente ideal dentro do seu público. Crie uma para cada perfil de comprador que você quer atingir.",
  },
  {
    chave: "proposta",
    titulo: "Proposta de Valor",
    curto: "Proposta",
    subtitulo: "O que torna sua loja irresistível para o cliente certo?",
  },
  {
    chave: "concorrencia",
    titulo: "Análise de Concorrência",
    curto: "Concorrência",
    subtitulo: "Conhecer quem já está no mercado é essencial para se posicionar melhor.",
  },
  { chave: "financas", titulo: "Finanças", curto: "Finanças", subtitulo: "Vamos entender os números do seu negócio." },
  {
    chave: "swot",
    titulo: "Análise SWOT",
    curto: "SWOT",
    subtitulo: "Seja honesto. Essa análise é para você enxergar sua realidade e tomar decisões melhores.",
  },
  {
    chave: "marketing",
    titulo: "Plano de Marketing",
    curto: "Marketing",
    subtitulo: "Como você vai atrair, converter e fidelizar clientes?",
  },
] as const;

export type ChaveEtapa = (typeof ETAPAS)[number]["chave"];

const tem = (v: unknown) => typeof v === "string" && v.trim() !== "";

export function etapaCompleta(chave: ChaveEtapa, d: DadosPlano): boolean {
  switch (chave) {
    case "dados":
      return tem(d.fullName) && tem(d.email) && tem(d.storeName) && d.termsAccepted === true;
    case "nicho":
      return tem(d.niche) && tem(d.mainProduct) && tem(d.competitiveDifferential);
    case "publico":
      return (d.audiences ?? []).some((a) => tem(a.name));
    case "persona":
      return (d.personas ?? []).some((p) => tem(p.name) && tem(p.painOrDesire));
    case "proposta":
      return tem(d.valueField1) && tem(d.valueField2) && tem(d.valueField3);
    case "concorrencia":
      return (d.competitors ?? []).filter((c) => tem(c.name) && tem(c.whatBetter)).length >= 3;
    case "financas":
      return tem(d.productCost) && tem(d.sellingPrice) && tem(d.realisticSales);
    case "swot":
      return tem(d.strengths) && tem(d.weaknesses) && tem(d.opportunities) && tem(d.threats);
    case "marketing":
      return (d.marketingChannels ?? []).length > 0 && tem(d.salesProcess) && tem(d.salesMonth1);
  }
}

/** Campos que contam como "começou" a etapa (para o chip Em andamento). */
export function etapaIniciada(chave: ChaveEtapa, d: DadosPlano): boolean {
  const campos: Record<ChaveEtapa, (keyof DadosPlano)[]> = {
    dados: ["storeName"],
    nicho: ["niche", "nicheWhy", "mainProduct", "marketPerception", "competitiveDifferential"],
    publico: [],
    persona: [],
    proposta: ["valueField1", "valueField2", "valueField3", "benefit1", "whyBuyFromYou"],
    concorrencia: [],
    financas: ["productCost", "sellingPrice", "realisticSales", "platformCost"],
    swot: ["strengths", "weaknesses", "opportunities", "threats"],
    marketing: ["salesProcess", "contentType", "salesMonth1"],
  };
  if (chave === "publico") return (d.audiences ?? []).some((a) => tem(a.name));
  if (chave === "persona") return (d.personas ?? []).some((p) => tem(p.name));
  if (chave === "concorrencia") return (d.competitors ?? []).some((c) => tem(c.name));
  if (chave === "marketing" && (d.marketingChannels ?? []).length) return true;
  return campos[chave].some((k) => tem(d[k]));
}

export function novoId() {
  return Math.random().toString(36).slice(2, 10);
}
export function novoPublico(): Publico {
  return {
    id: novoId(),
    name: "",
    ageRange: "",
    gender: "",
    location: "",
    purchasingPower: "",
    onlineConsumption: "",
    sizeScore: 3,
    trendScore: 3,
    competitionScore: 3,
    ticketScore: 3,
    recurrenceScore: 3,
  };
}
export function novaPersona(): Persona {
  return {
    id: novoId(),
    name: "",
    age: "",
    profession: "",
    painOrDesire: "",
    researchBefore: "",
    onlinePresence: "",
    buyingBarriers: "",
    quote: "",
  };
}
export function novoConcorrente(): Concorrente {
  return { id: novoId(), name: "", strengths: "", weaknesses: "", averagePrice: "", channels: [], whatBetter: "" };
}

// ---------- Cálculos ----------

/** "1.234,56" -> 1234.56 */
export function numero(v: string | undefined | null): number {
  if (!v) return 0;
  const n = Number(String(v).replace(/[^\d,-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/** Máscara R$: só dígitos, tratados como centavos. */
export function mascaraMoeda(bruto: string): string {
  const dig = bruto.replace(/\D/g, "").replace(/^0+/, "");
  if (!dig) return "";
  const n = Number(dig) / 100;
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function reais(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function notaPublico(a: Publico) {
  const t = a.sizeScore * 2 + a.trendScore * 2 + a.ticketScore * 2 + a.recurrenceScore * 1.5;
  const r = a.competitionScore * 1.5;
  return Math.round(((t - r + 7.5) / (37.5 + 7.5)) * 100) / 10;
}
export function faixaNota(n: number): { texto: string; tom: "ruim" | "medio" | "bom" } {
  if (n <= 4) return { texto: "Público de alto risco", tom: "ruim" };
  if (n <= 6.5) return { texto: "Público com potencial moderado", tom: "medio" };
  return { texto: "Público promissor", tom: "bom" };
}

export function financas(d: DadosPlano) {
  const custo = numero(d.productCost);
  const preco = numero(d.sellingPrice);
  const margem = preco > 0 ? ((preco - custo) / preco) * 100 : 0;
  const fixos = numero(d.platformCost) + numero(d.toolsCost) + numero(d.packagingCost) + numero(d.otherFixedCosts);
  const invest =
    numero(d.initialStock) + numero(d.brandingCost) + numero(d.marketingBudget) + numero(d.otherInvestments);
  const lucroUn = preco - custo;
  const equilibrio = lucroUn > 0 ? Math.ceil(fixos / lucroUn) : null;
  return {
    custo,
    preco,
    margem,
    fixos,
    invest,
    equilibrio,
    receita: {
      pessimista: numero(d.pessimisticSales) * preco,
      realista: numero(d.realisticSales) * preco,
      otimista: numero(d.optimisticSales) * preco,
    },
  };
}
export function faixaMargem(m: number): { texto: string; tom: "ruim" | "medio" | "bom" } {
  if (m < 30) return { texto: "Margem baixa, atenção!", tom: "ruim" };
  if (m <= 50) return { texto: "Margem razoável", tom: "medio" };
  return { texto: "Margem saudável", tom: "bom" };
}

export const TOM_CLASSE = {
  ruim: "bg-destructive/10 text-destructive",
  medio: "bg-warning-soft text-warning",
  bom: "bg-success-soft text-success",
} as const;

// ---------- Salvamento ----------

export function useSalvarPlano() {
  const qc = useQueryClient();
  const { sessao } = useAluna();
  return useMutation({
    mutationFn: async (payload: {
      dados?: DadosPlano;
      etapas_concluidas?: string[];
      pdf_exportado_em?: string;
      concluido_em?: string | null;
      textos_aprimorados?: Record<string, string> | null;
    }) => {
      const { error } = await supabase
        .from("plano_negocios")
        .upsert({ aluna_id: sessao!.user.id, ...payload }, { onConflict: "aluna_id" });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, v) => {
      if (v.etapas_concluidas || v.pdf_exportado_em || v.concluido_em !== undefined) {
        qc.invalidateQueries({ queryKey: ["tarefas"] });
        qc.invalidateQueries({ queryKey: ["modulos"] });
        qc.invalidateQueries({ queryKey: ["plano-negocios"] });
      }
    },
  });
}

/** Separa "SUGESTÃO 1: ... SUGESTÃO 2: ..." em uma lista. */
export function separarSugestoes(texto: string): string[] {
  return texto
    .split(/SUGEST[ÃA]O\s*\d+\s*:/i)
    .map((s) => s.trim().replace(/\s*[—–]\s*/g, ", "))
    .filter(Boolean)
    .slice(0, 3);
}
