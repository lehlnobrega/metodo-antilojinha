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
  .handler(async ({ data }): Promise<{ situacao: SituacaoPrimeiroAcesso; motivo?: string }> => {
    // Explica pra aluna o que deu errado e deixa o detalhe no log da Easypanel
    const falhou = (etapa: string, msg: string) => {
      console.error(`[primeiro-acesso] ${etapa} (${data.email}): ${msg}`);
      if (/password|senha|weak/i.test(msg)) {
        return { situacao: "erro" as const, motivo: "Essa senha não foi aceita. Tenta uma senha mais forte, com letras maiúsculas, minúsculas e números." };
      }
      return { situacao: "erro" as const, motivo: `Não consegui criar a sua senha agora (${etapa}). Me chama no Grupo VIP que eu resolvo.` };
    };
    try {
      const { criarSupabaseAdmin } = await import("@/integrations/metodo/admin.server");
      const admin = criarSupabaseAdmin();

      const { data: aluna, error: e0 } = await admin.from("alunas").select("id").eq("email", data.email).maybeSingle();
      if (e0) return falhou("busca do cadastro", e0.message);
      if (!aluna) return { situacao: "sem_acesso" };

      const { data: u } = await admin.auth.admin.getUserById(aluna.id);
      if (!u?.user) {
        // Cadastrada pelo n8n e ainda sem login: cria o login com a senha dela.
        // O banco liga esse login ao cadastro pelo e-mail (trigger ligar_login_a_aluna).
        const { error: e1 } = await admin.auth.admin.createUser({
          email: data.email,
          password: data.senha,
          email_confirm: true,
          user_metadata: { senha_criada: true },
        });
        if (e1) return /already|registered|exists/i.test(e1.message) ? { situacao: "ja_criou" } : falhou("criação do login", e1.message);
        return { situacao: "criada" };
      }

      // Já criou senha: marcou no primeiro acesso / criar senha, ou já entrou sem ter vindo de convite
      const meta = (u.user.user_metadata ?? {}) as Record<string, unknown>;
      const jaCriou = meta["senha_criada"] === true || (Boolean(u.user.last_sign_in_at) && !u.user.invited_at);
      if (jaCriou) return { situacao: "ja_criou" };

      const { error: e2 } = await admin.auth.admin.updateUserById(aluna.id, {
        password: data.senha,
        email_confirm: true,
        user_metadata: { ...meta, senha_criada: true },
      });
      if (e2) return falhou("troca da senha", e2.message);
      return { situacao: "criada" };
    } catch (e) {
      return falhou("servidor", (e as Error).message);
    }
  });
