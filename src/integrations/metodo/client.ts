// Cliente do banco Supabase "Método" (projeto externo da Letícia).
// A chave anon é pública por natureza; a segurança vem do RLS no banco.
import { createClient } from "@supabase/supabase-js";

export const METODO_SUPABASE_URL = "https://ivfgpircfwwgpumrrcwp.supabase.co";
export const METODO_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZmdwaXJjZnd3Z3B1bXJyY3dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MTY1OTYsImV4cCI6MjEwNjE5MjU5Nn0.nyV1jW47a9sTH-Cu3NLP5tDb37iuhA2EFWxMT3lx4x8";

const noNavegador = typeof window !== "undefined";

export const supabase = createClient(METODO_SUPABASE_URL, METODO_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: noNavegador,
    autoRefreshToken: noNavegador,
    storage: noNavegador ? window.localStorage : undefined,
  },
});
