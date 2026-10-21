// IA do Método (chat) e analisador de site.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { chamarIA, validarAluna } from "./ia.server";

const SISTEMA_CHAT =
  "Você é a IA do Método, assistente das alunas do curso de loja online da Letícia Nóbrega. Responda em português do Brasil, com carinho, de forma prática e direta, pensando na loja específica da aluna (use o contexto). Use listas curtas quando ajudar. Nunca use travessão. Se não souber algo da loja dela, pergunte.";

export const conversarIA = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: z.string().min(10),
        mensagens: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).min(1).max(30),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const v = await validarAluna(data.token);
    if ("erro" in v) return { erro: v.erro };
    const { data: pode } = await v.admin.rpc("usar_ia", { p_aluna: v.userId, p_limite: 30 });
    if (pode === false) return { erro: "Você usou as 30 mensagens de hoje. Amanhã tem mais 💖" };
    const [plano, metricas, cqc, respostas, semanas, diag] = await Promise.all([
      v.comoAluna.from("plano_negocios").select("dados").eq("aluna_id", v.userId).maybeSingle(),
      v.comoAluna.from("metricas_loja").select("mes, faturamento, pedidos, sessoes").order("mes", { ascending: false }).limit(3),
      v.comoAluna.from("meu_desempenho_cqc").select("*"),
      v.comoAluna.from("respostas_tarefas").select("dados, tarefas(chave_auto, titulo)").eq("aluna_id", v.userId),
      v.comoAluna.from("metricas_semana").select("semana, faturamento, pedidos, sessoes, ticket_medio, taxa_conversao, seguidores_instagram, seguidores_tiktok").eq("aluna_id", v.userId).order("semana", { ascending: false }).limit(4),
      v.comoAluna.from("diagnosticos").select("semana, conteudo").eq("aluna_id", v.userId).order("semana", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const contexto = `Contexto da aluna. Plano de negócios: ${JSON.stringify(plano.data?.dados ?? {}).slice(0, 5000)}. Últimos meses da loja: ${JSON.stringify(metricas.data ?? [])}. Desempenho por tipo de post: ${JSON.stringify(cqc.data ?? [])}. Respostas das tarefas do plano prático (reunião semanal, lojas de referência, objeções de preço, fixados, momento da loja, dúvidas das clientes): ${JSON.stringify(respostas.data ?? []).slice(0, 4000)}. Últimas 4 semanas da loja (segunda-feira de cada semana): ${JSON.stringify(semanas.data ?? [])}. Último diagnóstico semanal: ${JSON.stringify(diag.data ?? null).slice(0, 3000)}.`;
    try {
      const texto = await chamarIA([{ role: "system", content: `${SISTEMA_CHAT}\n\n${contexto}` }, ...data.mensagens.slice(-12)]);
      return { texto };
    } catch (e) {
      return { erro: (e as Error).message };
    }
  });

function extrairSinais(html: string) {
  const pega = (re: RegExp) => html.match(re)?.[1]?.trim() ?? null;
  const texto = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  return {
    titulo: pega(/<title[^>]*>([^<]*)<\/title>/i),
    descricao: pega(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i),
    viewport: /name=["']viewport["']/i.test(html),
    imagens: (html.match(/<img\b/gi) ?? []).length,
    imagensSemAlt: (html.match(/<img\b(?![^>]*\balt=)[^>]*>/gi) ?? []).length,
    whatsapp: /wa\.me|whatsapp/i.test(html),
    instagram: /instagram\.com/i.test(html),
    pix: /\bpix\b/i.test(texto),
    frete: /frete/i.test(texto),
    trocas: /troca|devolu/i.test(texto),
    tamanhoKb: Math.round(html.length / 1024),
    trechoTexto: texto.slice(0, 3000),
  };
}

export const analisarSite = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(10), url: z.string().url().max(500) }).parse(d))
  .handler(async ({ data }) => {
    const v = await validarAluna(data.token);
    if ("erro" in v) return { erro: v.erro };
    const url = new URL(data.url);
    if (!["http:", "https:"].includes(url.protocol)) return { erro: "Use um endereço que comece com https://" };
    let html = "";
    try {
      const r = await fetch(url.toString(), {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MetodoAnalisador/1.0)" },
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) return { erro: `O site respondeu com erro (${r.status}). Confira o endereço.` };
      html = (await r.text()).slice(0, 600_000);
    } catch {
      return { erro: "Não conseguimos abrir esse site. Confira se o endereço está certo." };
    }
    const sinais = { https: url.protocol === "https:", ...extrairSinais(html) };
    try {
      const bruto = await chamarIA(
        [
          {
            role: "system",
            content:
              'Você avalia lojas online brasileiras para alunas iniciantes. Com base nos sinais extraídos da página inicial, dê uma nota de 0 a 100 e devolva SOMENTE um JSON válido, sem blocos de código: {"nota": número, "resumo": "1 frase", "pontos_fortes": ["..."], "melhorias": ["..."]}. 3 a 5 itens em cada lista, em português do Brasil, simples e acionáveis, sem travessão.',
          },
          { role: "user", content: `URL: ${url}\nSinais: ${JSON.stringify(sinais)}` },
        ],
        1500,
      );
      const obj = JSON.parse(bruto.replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim()) as {
        nota: number;
        resumo?: string;
        pontos_fortes?: string[];
        melhorias?: string[];
      };
      const nota = Math.max(0, Math.min(100, Math.round(Number(obj.nota) || 0)));
      const detalhes = { resumo: obj.resumo ?? "", pontos_fortes: obj.pontos_fortes ?? [], melhorias: obj.melhorias ?? [] };
      const { error } = await v.comoAluna.from("analises_site").insert({ aluna_id: v.userId, url: url.toString(), nota, detalhes });
      if (error) console.error("analises_site", error.message);
      return { nota, detalhes };
    } catch {
      return { erro: "Não conseguimos analisar agora. Tente novamente." };
    }
  });
