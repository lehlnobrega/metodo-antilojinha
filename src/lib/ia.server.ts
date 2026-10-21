// Helpers de servidor: valida a aluna pelo token e chama a IA.
import { createClient } from "@supabase/supabase-js";

import { METODO_SUPABASE_ANON_KEY, METODO_SUPABASE_URL } from "@/integrations/metodo/client";

export async function validarAluna(token: string) {
  const { criarSupabaseAdmin } = await import("@/integrations/metodo/admin.server");
  const admin = criarSupabaseAdmin();
  const { data: u, error } = await admin.auth.getUser(token);
  if (error || !u.user) return { erro: "Entre de novo para usar esta ferramenta." } as const;
  const comoAluna = createClient(METODO_SUPABASE_URL, METODO_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [{ data: ativo }, { data: adm }] = await Promise.all([comoAluna.rpc("acesso_ativo"), comoAluna.rpc("is_admin")]);
  if (!ativo && !adm) return { erro: "Seu acesso não está ativo." } as const;
  return { userId: u.user.id, admin, comoAluna } as const;
}

type Msg = { role: "system" | "user" | "assistant"; content: string };

// Provedor de IA configurável por variável de ambiente.
// Padrão fora do Lovable: Claude Haiku 5.5 (ANTHROPIC_API_KEY, opcional IA_MODELO e IA_MODELO_FORTE).
// Alternativa: qualquer API compatível com OpenAI (IA_API_KEY + IA_API_URL + IA_MODELO).
// Dentro do Lovable continua funcionando com LOVABLE_API_KEY.
type ConfigIA = { tipo: "anthropic" | "openai"; url: string; chave: string; modelo: string };

export function configIA(): ConfigIA | null {
  const anthropic = process.env["ANTHROPIC_API_KEY"];
  if (anthropic) {
    return { tipo: "anthropic", url: "https://api.anthropic.com/v1/messages", chave: anthropic, modelo: process.env["IA_MODELO"] || "claude-haiku-5-5" };
  }
  const propria = process.env["IA_API_KEY"];
  if (propria) {
    return {
      tipo: "openai",
      url: process.env["IA_API_URL"] || "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      chave: propria,
      modelo: process.env["IA_MODELO"] || "gemini-3.8-flash",
    };
  }
  const lovable = process.env["LOVABLE_API_KEY"];
  if (lovable) {
    return { tipo: "openai", url: "https://ai.gateway.lovable.dev/v1/chat/completions", chave: lovable, modelo: "google/gemini-3-flash-preview" };
  }
  return null;
}

// `modeloForte` é usado em análises mais pesadas (ex.: diagnóstico semanal).
export async function chamarIA(messages: Msg[], maxTokens = 1200, modeloForte?: string) {
  const cfg = configIA();
  if (!cfg) throw new Error("IA indisponível");
  if (modeloForte) {
    cfg.modelo = process.env["LOVABLE_API_KEY"] && !process.env["ANTHROPIC_API_KEY"] && !process.env["IA_API_KEY"]
      ? modeloForte
      : process.env["IA_MODELO_FORTE"] || cfg.modelo;
  }

  let r: Response;
  if (cfg.tipo === "anthropic") {
    const sistema = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const conversa = messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    r = await fetch(cfg.url, {
      method: "POST",
      headers: { "x-api-key": cfg.chave, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: cfg.modelo, max_tokens: maxTokens, ...(sistema ? { system: sistema } : {}), messages: conversa }),
    });
  } else {
    r = await fetch(cfg.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: cfg.modelo, max_tokens: maxTokens, messages }),
    });
  }
  if (r.status === 429) throw new Error("Muitas perguntas ao mesmo tempo. Espere um pouquinho e tente de novo.");
  if (r.status === 402) throw new Error("A IA está temporariamente indisponível.");
  if (!r.ok) throw new Error("Não conseguimos responder agora. Tente novamente.");
  const j = (await r.json()) as { choices?: { message?: { content?: string } }[]; content?: { type: string; text?: string }[] };
  const texto = cfg.tipo === "anthropic"
    ? (j.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("")
    : (j.choices?.[0]?.message?.content ?? "");
  return texto.replace(/\s*[—–]\s*/g, ", ");
}
