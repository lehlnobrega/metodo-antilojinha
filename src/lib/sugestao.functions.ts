// Sugestões de IA para o plano de negócios (substitui a antiga sugestao-plano).
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { METODO_SUPABASE_ANON_KEY, METODO_SUPABASE_URL } from "@/integrations/metodo/client";

const entrada = z.object({
  token: z.string().min(10),
  acao: z.enum(["sugerir", "aprimorar"]).default("sugerir"),
  pergunta: z.string().max(1000).optional(),
  textoDaAluna: z.string().max(4000).optional(),
  textos: z.record(z.string(), z.string().max(6000)).optional(),
});

const SISTEMA_SUGERIR =
  "Você ajuda uma dona de loja online a responder o plano de negócios dela, no curso da Letícia Nóbrega. A aluna explicou com as palavras dela a resposta de uma pergunta. Escreva 3 versões diferentes de resposta, bem escritas, específicas da loja dela (use o contexto do plano), em primeira pessoa, em português do Brasil, com 2 a 4 frases cada, sem travessão. Responda exatamente no formato: SUGESTÃO 1: ... SUGESTÃO 2: ... SUGESTÃO 3: ...";

const SISTEMA_APRIMORAR =
  "Você recebe um JSON com respostas do plano de negócios de uma dona de loja online. Reescreva cada texto de forma mais profissional e clara, mantendo o sentido e os fatos, em português do Brasil, sem travessão. Devolva SOMENTE um JSON válido com exatamente as mesmas chaves, sem comentários e sem blocos de código.";

async function chamarIA(sistema: string, usuario: string, maxTokens: number) {
  const { chamarIA: chamar } = await import("./ia.server");
  return chamar(
    [
      { role: "system", content: sistema },
      { role: "user", content: usuario },
    ],
    maxTokens,
  );
}

export const sugestaoPlano = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => entrada.parse(d))
  .handler(async ({ data }) => {
    const { criarSupabaseAdmin } = await import("@/integrations/metodo/admin.server");
    const admin = criarSupabaseAdmin();
    const { data: u, error: eu } = await admin.auth.getUser(data.token);
    if (eu || !u.user) return { erro: "Entre de novo para usar a IA." };

    const comoAluna = createClient(METODO_SUPABASE_URL, METODO_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${data.token}` } },
    });
    const [{ data: ativo }, { data: adm }] = await Promise.all([
      comoAluna.rpc("acesso_ativo"),
      comoAluna.rpc("is_admin"),
    ]);
    if (!ativo && !adm) return { erro: "Seu acesso não está ativo." };

    if (data.acao === "aprimorar") {
      try {
        const bruto = await chamarIA(SISTEMA_APRIMORAR, JSON.stringify(data.textos ?? {}), 4000);
        const limpo = bruto.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
        const obj = JSON.parse(limpo) as Record<string, unknown>;
        const enhanced: Record<string, string> = {};
        for (const [k, v] of Object.entries(obj)) if (typeof v === "string") enhanced[k] = v.replace(/\s*[—–]\s*/g, ", ");
        return { enhanced };
      } catch {
        return { enhanced: null };
      }
    }

    const { data: pode } = await admin.rpc("usar_sugestao_plano", { p_aluna: u.user.id, p_limite: 40 });
    if (pode === false) {
      return {
        erro: "Você usou as 40 gerações de hoje. Amanhã tem mais! Enquanto isso, confia no que você já sabe da sua loja 💖",
      };
    }
    const { data: plano } = await comoAluna
      .from("plano_negocios")
      .select("dados")
      .eq("aluna_id", u.user.id)
      .maybeSingle();
    const usuario = `Contexto do plano da aluna (JSON): ${JSON.stringify(plano?.dados ?? {}).slice(0, 6000)}\n\nPergunta: ${data.pergunta ?? ""}\n\nO que a aluna explicou: ${data.textoDaAluna ?? ""}`;
    try {
      const texto = await chamarIA(SISTEMA_SUGERIR, usuario, 900);
      return { texto };
    } catch {
      return { erro: "Não conseguimos gerar as respostas agora. Tente novamente." };
    }
  });
