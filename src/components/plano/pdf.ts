// PDF do plano de negócios, gerado no navegador (jsPDF + html2canvas).
import { formatarData } from "@/lib/formato";
import { type DadosPlano, faixaNota, financas, notaPublico, numero, reais } from "@/lib/plano-negocios";

export const RODAPE_PDF =
  "© Método Loja Online Lucrativa | CNPJ 42.311.629/0001-00 | Leticia Nóbrega MKT LTDA | Material de uso exclusivo da aluna identificada neste documento.";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

/** Textos abertos que a IA pode aprimorar (chave plana -> texto). */
export function textosAbertos(d: DadosPlano): Record<string, string> {
  const t: Record<string, string> = {};
  const add = (k: string, v?: string) => {
    if (v && v.trim().length > 20) t[k] = v;
  };
  (
    [
      "nicheWhy",
      "mainProduct",
      "competitiveDifferential",
      "nicheStatusWhy",
      "beforeTransformation",
      "afterTransformation",
      "whyBuyFromYou",
      "marketPositioning",
      "strengths",
      "weaknesses",
      "opportunities",
      "threats",
      "contentType",
      "salesProcess",
      "entryOffer",
      "retentionStrategy",
      "loyaltyProgram",
    ] as const
  ).forEach((k) => add(k, d[k]));
  (d.audiences ?? []).forEach((a) => add(`aud.${a.id}.onlineConsumption`, a.onlineConsumption));
  (d.personas ?? []).forEach((p) => {
    add(`per.${p.id}.painOrDesire`, p.painOrDesire);
    add(`per.${p.id}.researchBefore`, p.researchBefore);
  });
  (d.competitors ?? []).forEach((c) => {
    add(`con.${c.id}.strengths`, c.strengths);
    add(`con.${c.id}.weaknesses`, c.weaknesses);
    add(`con.${c.id}.whatBetter`, c.whatBetter);
  });
  Object.entries(d.channelStrategies ?? {}).forEach(([k, v]) => add(`can.${k}`, v));
  return t;
}

function secao(titulo: string, corpo: string) {
  return `<section data-secao style="padding:28px 0;"><h2 style="font-size:20px;color:#AD156A;margin:0 0 14px;font-weight:600">${titulo}</h2>${corpo}</section>`;
}
function item(rotulo: string, valor: unknown) {
  if (valor == null || String(valor).trim() === "") return "";
  return `<div style="margin-bottom:12px"><div style="font-size:11px;color:#7a6571;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px">${esc(rotulo)}</div><div style="font-size:13px;line-height:1.55">${esc(valor)}</div></div>`;
}
function tabela(linhas: [string, string][]) {
  return `<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px">${linhas
    .map(
      ([a, b]) =>
        `<tr><td style="padding:7px 10px;border:1px solid #eadfe4">${esc(a)}</td><td style="padding:7px 10px;border:1px solid #eadfe4;text-align:right;font-weight:600">${esc(b)}</td></tr>`,
    )
    .join("")}</table>`;
}

function montarHtml(d: DadosPlano, e: Record<string, string>, logoTexto: string) {
  const x = (k: string, v?: string) => e[k] ?? v;
  const f = financas(d);
  const nicho = { growing: "Crescendo", stable: "Estável", declining: "Em declínio" }[d.nicheStatus || "stable"] ?? "";
  const frase = `Minha loja existe para ajudar ${d.valueField1 ?? "___"} a ${d.valueField2 ?? "___"} sem ${d.valueField3 ?? "___"}.`;

  const capa = `<section data-secao data-capa style="height:1040px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:0 20px">
    <div style="font-size:22px;font-weight:700;color:#AD156A;letter-spacing:.02em">${esc(logoTexto)}</div>
    <div style="margin-top:120px;font-size:44px;font-weight:700;line-height:1.1">Plano de Negócios</div>
    <div style="margin-top:14px;font-size:24px;color:#AD156A;font-weight:600">${esc(d.storeName)}</div>
    <div style="margin-top:60px;font-size:14px;line-height:1.8">${esc(d.fullName)}<br/>${esc(d.email)}<br/>${formatarData(new Date().toISOString())}</div>
  </section>`;

  const partes = [
    capa,
    secao(
      "Nicho e Posicionamento",
      item("Nicho", d.niche) +
        item("Por que esse nicho", x("nicheWhy", d.nicheWhy)) +
        item("Produto principal", x("mainProduct", d.mainProduct)) +
        item("Percepção desejada", d.marketPerception) +
        item("Diferencial competitivo", x("competitiveDifferential", d.competitiveDifferential)) +
        item("Momento do nicho", nicho) +
        item("Por quê", x("nicheStatusWhy", d.nicheStatusWhy)),
    ),
    secao(
      "Público-Alvo",
      (d.audiences ?? [])
        .filter((a) => a.name)
        .map((a) => {
          const n = notaPublico(a);
          return `<div style="border:1px solid #eadfe4;border-radius:12px;padding:14px;margin-bottom:12px"><div style="font-weight:600;margin-bottom:8px">${esc(a.name)} · nota ${n.toFixed(1).replace(".", ",")} (${faixaNota(n).texto})</div>${
            item("Faixa etária", a.ageRange) + item("Gênero", a.gender) + item("Localização", a.location) + item("Poder aquisitivo", a.purchasingPower) + item("Consumo online", x(`aud.${a.id}.onlineConsumption`, a.onlineConsumption))
          }</div>`;
        })
        .join(""),
    ),
    secao(
      "Personas",
      (d.personas ?? [])
        .filter((p) => p.name)
        .map(
          (p) =>
            `<div style="border:1px solid #eadfe4;border-radius:12px;padding:14px;margin-bottom:12px"><div style="font-weight:600;margin-bottom:8px">${esc(p.name)}${p.age ? `, ${esc(p.age)}` : ""}${p.profession ? ` · ${esc(p.profession)}` : ""}</div>${
              item("Dor ou desejo", x(`per.${p.id}.painOrDesire`, p.painOrDesire)) +
              item("O que pesquisa antes de comprar", x(`per.${p.id}.researchBefore`, p.researchBefore)) +
              item("Onde está online", p.onlinePresence) +
              item("O que impede a compra", p.buyingBarriers) +
              (p.quote ? `<div style="font-style:italic;font-size:13px">"${esc(p.quote)}"</div>` : "")
            }</div>`,
        )
        .join(""),
    ),
    secao(
      "Proposta de Valor",
      `<div style="background:#FBE3EF;color:#AD156A;border-radius:14px;padding:18px 20px;font-size:17px;font-weight:600;line-height:1.5;margin-bottom:16px">${esc(frase)}</div>` +
        item("Benefícios", [d.benefit1, d.benefit2, d.benefit3].filter(Boolean).map((b) => `• ${b}`).join("\n")) +
        item("Antes de me encontrar", x("beforeTransformation", d.beforeTransformation)) +
        item("Depois de comprar comigo", x("afterTransformation", d.afterTransformation)) +
        item("Por que comprar de mim", x("whyBuyFromYou", d.whyBuyFromYou)),
    ),
    secao(
      "Análise de Concorrência",
      (d.competitors ?? [])
        .filter((c) => c.name)
        .map(
          (c) =>
            `<div style="border:1px solid #eadfe4;border-radius:12px;padding:14px;margin-bottom:12px"><div style="font-weight:600;margin-bottom:8px">${esc(c.name)}</div>${
              item("Faz bem", x(`con.${c.id}.strengths`, c.strengths)) +
              item("Fraqueza", x(`con.${c.id}.weaknesses`, c.weaknesses)) +
              item("Preço médio", c.averagePrice ? `R$ ${c.averagePrice}` : "") +
              item("Onde é forte", (c.channels ?? []).join(", ")) +
              item("O que posso fazer melhor", x(`con.${c.id}.whatBetter`, c.whatBetter))
            }</div>`,
        )
        .join("") + item("Meu posicionamento", x("marketPositioning", d.marketPositioning)),
    ),
    secao(
      "Finanças",
      `<h3 style="font-size:14px;margin:0 0 8px">Produto</h3>` +
        tabela([
          ["Custo do produto", reais(f.custo)],
          ["Preço de venda", reais(f.preco)],
          ["Margem bruta", `${f.margem.toFixed(1).replace(".", ",")}%`],
        ]) +
        `<h3 style="font-size:14px;margin:0 0 8px">Custos fixos mensais</h3>` +
        tabela([
          ["Plataforma", reais(numero(d.platformCost))],
          ["Ferramentas", reais(numero(d.toolsCost))],
          ["Embalagens", reais(numero(d.packagingCost))],
          ["Outros", reais(numero(d.otherFixedCosts))],
          ["Total", reais(f.fixos)],
        ]) +
        `<p style="font-size:13px;margin:0 0 14px"><b>Ponto de equilíbrio:</b> ${f.equilibrio !== null ? `${f.equilibrio} unidades por mês` : "não calculado"}</p>` +
        `<h3 style="font-size:14px;margin:0 0 8px">Investimento inicial</h3>` +
        tabela([
          ["Estoque inicial", reais(numero(d.initialStock))],
          ["Identidade visual e site", reais(numero(d.brandingCost))],
          ["Verba de marketing", reais(numero(d.marketingBudget))],
          ["Outros", reais(numero(d.otherInvestments))],
          ["Total", reais(f.invest)],
        ]) +
        `<h3 style="font-size:14px;margin:0 0 8px">Projeção de receita mensal</h3>` +
        tabela([
          [`Pessimista (${d.pessimisticSales || 0} vendas)`, reais(f.receita.pessimista)],
          [`Realista (${d.realisticSales || 0} vendas)`, reais(f.receita.realista)],
          [`Otimista (${d.optimisticSales || 0} vendas)`, reais(f.receita.otimista)],
        ]),
    ),
    secao(
      "Análise SWOT",
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${(
        [
          ["💪 Forças", "strengths"],
          ["⚠️ Fraquezas", "weaknesses"],
          ["🚀 Oportunidades", "opportunities"],
          ["🛡️ Ameaças", "threats"],
        ] as const
      )
        .map(
          ([t, k]) =>
            `<div style="border:1px solid #eadfe4;border-radius:12px;padding:14px;min-height:140px"><div style="font-weight:600;margin-bottom:6px">${t}</div><div style="font-size:13px;line-height:1.55">${esc(x(k, d[k]))}</div></div>`,
        )
        .join("")}</div>`,
    ),
    secao(
      "Plano de Marketing",
      item("Canais de aquisição", (d.marketingChannels ?? []).join(", ")) +
        (d.marketingChannels ?? []).map((c) => item(`Como vou usar o ${c}`, x(`can.${c}`, d.channelStrategies?.[c]))).join("") +
        item("Tipo de conteúdo", x("contentType", d.contentType)) +
        item("Frequência", d.contentFrequency) +
        item("Quem produz", d.contentProducer) +
        item("Processo de venda", x("salesProcess", d.salesProcess)) +
        item("Oferta de entrada", x("entryOffer", d.entryOffer)) +
        item("Recompra", x("retentionStrategy", d.retentionStrategy)) +
        item("Indicação e pós-venda", x("loyaltyProgram", d.loyaltyProgram)) +
        tabela([
          ["Meta de seguidores", d.followerGoal || "-"],
          ["Vendas mês 1", d.salesMonth1 || "-"],
          ["Vendas mês 2", d.salesMonth2 || "-"],
          ["Vendas mês 3", d.salesMonth3 || "-"],
        ]),
    ),
  ];
  return partes.join("");
}

export async function gerarPdf(d: DadosPlano, aprimorados: Record<string, string> | null) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import("jspdf"), import("html2canvas")]);
  const raiz = document.createElement("div");
  raiz.style.cssText =
    "position:fixed;left:-10000px;top:0;width:760px;background:#fff;color:#2A1621;font-family:Poppins,system-ui,sans-serif;padding:0 40px;box-sizing:border-box";
  raiz.innerHTML = montarHtml(d, aprimorados ?? {}, "MÉTODO · Loja Online Lucrativa");
  document.body.appendChild(raiz);
  try {
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210;
    const H = 297;
    const margem = 14;
    const areaH = H - margem - 18;
    let y = margem;
    let primeira = true;
    const rodape = () => {
      pdf.setFontSize(7);
      pdf.setTextColor(120, 100, 110);
      pdf.text(pdf.splitTextToSize(RODAPE_PDF, W - 2 * margem), margem, H - 10);
    };
    for (const el of Array.from(raiz.querySelectorAll<HTMLElement>("[data-secao]"))) {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
      const larg = W - 2 * margem;
      const alt = (canvas.height * larg) / canvas.width;
      // Uma seção por página quando couber; seções longas são fatiadas.
      if (!primeira) {
        rodape();
        pdf.addPage();
      }
      primeira = false;
      y = margem;
      if (alt <= areaH) {
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", margem, y, larg, alt);
      } else {
        const pxPorMm = canvas.width / larg;
        const fatiaPx = Math.floor(areaH * pxPorMm);
        for (let top = 0; top < canvas.height; top += fatiaPx) {
          const h = Math.min(fatiaPx, canvas.height - top);
          const c = document.createElement("canvas");
          c.width = canvas.width;
          c.height = h;
          c.getContext("2d")!.drawImage(canvas, 0, top, canvas.width, h, 0, 0, canvas.width, h);
          if (top > 0) {
            rodape();
            pdf.addPage();
          }
          pdf.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", margem, margem, larg, h / pxPorMm);
        }
      }
    }
    rodape();
    const nome = (d.storeName || "plano").normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase();
    pdf.save(`plano-de-negocios-${nome}.pdf`);
  } finally {
    raiz.remove();
  }
}
