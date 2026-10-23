import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CartaoAuth } from "@/components/auth/CartaoAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/metodo/client";
import { PAGINA_VENDAS_URL } from "@/config";
import { useAluna } from "@/lib/aluna";
import { verificarCadastro } from "@/lib/login.functions";

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
  const [semCadastro, setSemCadastro] = useState(false);
  const [senhaErrada, setSenhaErrada] = useState(false);
  const conferir = useServerFn(verificarCadastro);
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
        <div className="flex flex-col items-center gap-2.5">
          <Link to="/esqueci-senha" className="transicao-suave font-medium text-primary hover:underline">
            Esqueci minha senha
          </Link>
          <span>
            Primeira vez aqui?{" "}
            <Link to="/primeiro-acesso" className="transicao-suave font-medium text-primary hover:underline">
              Crie a sua senha
            </Link>
          </span>
        </div>
      }
    >
      <form
        className="space-y-4"
        onSubmit={async (evento) => {
          evento.preventDefault();
          setEnviando(true);
          setSemCadastro(false);
          setSenhaErrada(false);
          const emailLimpo = email.trim().toLowerCase();
          const { error } = await supabase.auth.signInWithPassword({ email: emailLimpo, password: senha });
          if (error) {
            if (error.message.includes("Invalid login")) {
              const r = await conferir({ data: { email: emailLimpo } }).catch(() => ({ existe: true }));
              if (r.existe) setSenhaErrada(true);
              else setSemCadastro(true);
            } else {
              toast.error("Não foi possível entrar agora. Tente de novo.");
            }
            setEnviando(false);
            return;
          }
          // A tela inicial espera os dados dela carregarem, então pode ir direto.
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
            onChange={(e) => {
              setEmail(e.target.value);
              setSemCadastro(false);
              setSenhaErrada(false);
            }}
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
            onChange={(e) => {
              setSenha(e.target.value);
              setSenhaErrada(false);
            }}
          />
        </div>
        {semCadastro ? (
          <div className="rounded-xl border border-accent bg-accent-soft p-4 text-center" role="alert">
            <p className="text-[15px] font-semibold text-foreground">Você ainda não é aluna!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Não achei nenhum cadastro com o e-mail <span className="font-medium text-foreground">{email.trim().toLowerCase()}</span>. Se você já comprou, confere se digitou o mesmo e-mail da compra.
            </p>
            <a
              href={PAGINA_VENDAS_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Torne-se aluna aqui
            </a>
          </div>
        ) : null}
        {senhaErrada ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm" role="alert">
            <p className="font-semibold text-destructive">Senha incorreta.</p>
            <p className="mt-1 text-muted-foreground">
              Tenta de novo ou{" "}
              <Link to="/esqueci-senha" className="font-medium text-primary hover:underline">
                crie uma senha nova
              </Link>
              .
            </p>
          </div>
        ) : null}
        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </CartaoAuth>
  );
}
