// Sessão da aluna no banco Método: login, dados da tabela alunas e guarda de acesso.
import { useNavigate } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/metodo/client";

export type Aluna = {
  id: string;
  email: string;
  nome: string | null;
  acesso_ate: string | null;
  status: string | null;
  pesquisa_concluida: boolean | null;
  is_admin: boolean | null;
};

type Estado = {
  carregando: boolean;
  sessao: Session | null;
  aluna: Aluna | null;
  acessoAtivo: boolean;
  sair: () => Promise<void>;
  recarregar: () => Promise<void>;
};

const Contexto = createContext<Estado | null>(null);

export function AlunaProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [sessao, setSessao] = useState<Session | null>(null);
  const [aluna, setAluna] = useState<Aluna | null>(null);
  const [acessoAtivo, setAcessoAtivo] = useState(false);

  const carregarAluna = useCallback(async (s: Session | null) => {
    setSessao(s);
    if (!s) {
      setAluna(null);
      setAcessoAtivo(false);
      setCarregando(false);
      return;
    }
    const [{ data }, { data: ativo }] = await Promise.all([
      supabase
        .from("alunas")
        .select("id, email, nome, acesso_ate, status, pesquisa_concluida, is_admin")
        .eq("id", s.user.id)
        .maybeSingle(),
      supabase.rpc("acesso_ativo"),
    ]);
    setAluna((data as Aluna | null) ?? null);
    setAcessoAtivo(Boolean(ativo) || Boolean((data as Aluna | null)?.is_admin));
    setCarregando(false);
    void supabase.rpc("registrar_acesso");
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => carregarAluna(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      if (evento === "SIGNED_IN" || evento === "SIGNED_OUT" || evento === "USER_UPDATED") {
        setTimeout(() => carregarAluna(s), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [carregarAluna]);

  const sair = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const recarregar = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await carregarAluna(data.session);
  }, [carregarAluna]);

  return (
    <Contexto.Provider value={{ carregando, sessao, aluna, acessoAtivo, sair, recarregar }}>
      {children}
    </Contexto.Provider>
  );
}

export function useAluna() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useAluna precisa do AlunaProvider");
  return ctx;
}

/** Redireciona para o login quando não há sessão. Retorna true quando pode mostrar a página. */
export function useGuardaAcesso() {
  const { carregando, sessao } = useAluna();
  const navigate = useNavigate();
  useEffect(() => {
    if (!carregando && !sessao) navigate({ to: "/login", replace: true });
  }, [carregando, sessao, navigate]);
  return !carregando && Boolean(sessao);
}
