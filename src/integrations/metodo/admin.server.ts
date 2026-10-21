// Cliente administrativo do banco "Método". Somente no servidor; ignora RLS.
import { createClient } from "@supabase/supabase-js";
import { METODO_SUPABASE_URL } from "./client";

export function criarSupabaseAdmin() {
  const chave = process.env["METODO_SUPABASE_SERVICE_ROLE_KEY"];
  if (!chave) throw new Error("METODO_SUPABASE_SERVICE_ROLE_KEY não configurada");
  return createClient(METODO_SUPABASE_URL, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
