import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CartaoAuth } from "@/components/auth/CartaoAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/metodo/client";
import { useAluna } from "@/lib/aluna";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar | Método" },
      { name: "description", content: "Acesse o app do Método com o seu e-mail e a sua senha." },
      { property: "og:title", content: "Entrar | Método" },
      { property: "og:description", content: "Acesse o app do Método com o seu e-mail e a sua senha." },
    ],
  }),
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { sessao, carregando } = useAluna();
  const navigate = useNavigate();

  useEffect(() => {
    if (!carregando && sessao) navigate({ to: "/", replace: true });
  }, [carregando, sessao, navigate]);

  return (
    <CartaoAuth
      titulo="Que bom te ver de novo"
      texto="Entra com o e-mail que você usou na compra."
      rodape={
        <Link to="/esqueci-senha" className="transicao-suave font-medium text-primary hover:underline">
          Esqueci minha senha
        </Link>
      }
    >
      <form
        className="space-y-4"
        onSubmit={async (evento) => {
          evento.preventDefault();
          setEnviando(true);
          const { error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: senha,
          });
          setEnviando(false);
          if (error) {
            toast.error(
              error.message.includes("Invalid login")
                ? "E-mail ou senha incorretos."
                : "Não foi possível entrar agora. Tente de novo.",
            );
            return;
          }
          navigate({ to: "/", replace: true });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </CartaoAuth>
  );
}
