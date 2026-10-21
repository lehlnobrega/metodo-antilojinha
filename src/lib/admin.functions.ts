// Ações do admin que precisam da chave de serviço (rodam só no servidor).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function validarAdmin(token: string) {
  const { criarSupabaseAdmin } = await import("@/integrations/metodo/admin.server");
  const admin = criarSupabaseAdmin();
  const { data: u, error } = await admin.auth.getUser(token);
  if (error || !u.user) return { erro: "Entre de novo para continuar." } as const;
  const { data: perfil } = await admin.from("alunas").select("is_admin").eq("id", u.user.id).maybeSingle();
  if (!perfil?.is_admin) return { erro: "Só a administradora pode fazer isso." } as const;
  return { admin } as const;
}

/** Cadastro manual de aluna (cortesia, compra fora da Lastlink, troca de e-mail). Envia o convite pra criar a senha. */
export const cadastrarAluna = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: z.string().min(10),
        nome: z.string().trim().min(2).max(120),
        email: z.string().trim().toLowerCase().email(),
        telefone: z.string().trim().max(30).optional(),
        acessoAte: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        origem: z.string().url(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const v = await validarAdmin(data.token);
    if ("erro" in v) return { erro: v.erro };

    const { data: existente } = await v.admin.from("alunas").select("id").eq("email", data.email).maybeSingle();
    if (existente) return { erro: "Esse e-mail já tem cadastro. Procura ela na lista de alunas." };

    const { data: convite, error } = await v.admin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: `${data.origem}/criar-senha`,
      data: { nome: data.nome },
    });
    if (error || !convite.user) {
      return { erro: error?.message?.includes("already") ? "Esse e-mail já tem login. Use o Reenviar acesso na ficha dela." : "Não consegui enviar o convite agora." };
    }

    const agora = new Date().toISOString();
    const { error: e2 } = await v.admin.from("alunas").upsert(
      {
        id: convite.user.id,
        email: data.email,
        nome: data.nome,
        telefone: data.telefone || null,
        status: "ativa",
        data_compra: agora,
        ...(data.acessoAte ? { acesso_ate: `${data.acessoAte}T23:59:59-03:00` } : {}),
      },
      { onConflict: "id" },
    );
    if (e2) return { erro: "O convite foi enviado, mas não consegui salvar o cadastro. Tenta de novo." };
    return { ok: true as const };
  });
