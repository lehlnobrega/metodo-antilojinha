// Primeiro acesso: a aluna cria a senha só com o e-mail da compra.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type SituacaoPrimeiroAcesso = "criada" | "ja_criou" | "sem_acesso" | "erro";

export const criarSenhaPrimeiroAcesso = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email(),
        senha: z.string().min(8).max(72),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ situacao: SituacaoPrimeiroAcesso }> => {
    try {
      const { criarSupabaseAdmin } = await import("@/integrations/metodo/admin.server");
      const admin = criarSupabaseAdmin();

      const { data: aluna } = await admin.from("alunas").select("id").ilike("email", data.email).maybeSingle();
      if (!aluna) return { situacao: "sem_acesso" };

      const { data: u, error } = await admin.auth.admin.getUserById(aluna.id);
      if (error || !u.user) return { situacao: "erro" };

      // Já criou senha: marcou no primeiro acesso / criar senha, ou já entrou sem ter vindo de convite
      const meta = (u.user.user_metadata ?? {}) as Record<string, unknown>;
      const jaCriou = meta["senha_criada"] === true || (Boolean(u.user.last_sign_in_at) && !u.user.invited_at);
      if (jaCriou) return { situacao: "ja_criou" };

      const { error: e2 } = await admin.auth.admin.updateUserById(aluna.id, {
        password: data.senha,
        email_confirm: true,
        user_metadata: { ...meta, senha_criada: true },
      });
      if (e2) return { situacao: "erro" };
      return { situacao: "criada" };
    } catch {
      return { situacao: "erro" };
    }
  });
