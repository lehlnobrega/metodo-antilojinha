// Confere se um e-mail tem cadastro no método, pra diferenciar "senha errada" de "ainda não é aluna".
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const verificarCadastro = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ email: z.string().trim().toLowerCase().email() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const { criarSupabaseAdmin } = await import("@/integrations/metodo/admin.server");
      const admin = criarSupabaseAdmin();
      const { data: aluna } = await admin.from("alunas").select("id").eq("email", data.email).maybeSingle();
      return { existe: Boolean(aluna) };
    } catch {
      // Se não der pra conferir, trata como senha errada (nunca bloqueia quem é aluna).
      return { existe: true };
    }
  });
