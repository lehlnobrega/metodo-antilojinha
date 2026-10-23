import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { CartaoAuth } from "@/components/auth/CartaoAuth";
import { PopupAviso } from "@/components/auth/PopupAviso";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAGINA_VENDAS_URL } from "@/config";
import { criarSenhaPrimeiroAcesso, type SituacaoPrimeiroAcesso } from "@/lib/primeiro-acesso.functions";

export const Route = createFileRoute("/primeiro-acesso")({
  head: () => ({
    meta: [
      { title: "Primeiro acesso | Método" },
      { name: "description", content: "Crie a sua senha para entrar no app do Método." },
      { property: "og:title", content: "Primeiro acesso | Método" },
      { property: "og:description", content: "Crie a sua senha para entrar no app do Método." },
    ],
  }),
  component: PrimeiroAcesso,
});

const botaoCls =
  "inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover";

function PrimeiroAcesso() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [popup, setPopup] = useState<Exclude<SituacaoPrimeiroAcesso, "erro"> | null>(null);
  const criar = useServerFn(criarSenhaPrimeiroAcesso);
  const navigate = useNavigate();

  return (
    <>
      <CartaoAuth
        titulo="Primeiro acesso"
        texto="Use o e-mail da sua compra e crie a sua senha. A senha precisa ter no mínimo 8 caracteres."
        rodape={
          <>
            Já criou a sua senha?{" "}
            <Link to="/login" className="transicao-suave font-medium text-primary hover:underline">
              Entrar
            </Link>
          </>
        }
      >
        <form
          className="space-y-4"
          onSubmit={async (evento) => {
            evento.preventDefault();
            if (senha.length < 8) {
              toast.error("A senha precisa ter no mínimo 8 caracteres.");
              return;
            }
            if (senha !== confirmacao) {
              toast.error("As duas senhas precisam ser iguais.");
              return;
            }
            setEnviando(true);
            try {
              const r = await criar({ data: { email: email.trim().toLowerCase(), senha } });
              if (r.situacao === "erro") toast.error(r.motivo ?? "Não consegui criar a sua senha agora. Tenta de novo em alguns minutos.");
              else setPopup(r.situacao);
            } catch {
              toast.error("Não consegui criar a sua senha agora. Tenta de novo em alguns minutos.");
            } finally {
              setEnviando(false);
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">E-mail da compra</Label>
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
            <Input id="senha" type="password" autoComplete="new-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmacao">Confirmar senha</Label>
            <Input
              id="confirmacao"
              type="password"
              autoComplete="new-password"
              required
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? "Criando..." : "Criar minha senha"}
          </Button>
        </form>
      </CartaoAuth>

      <PopupAviso
        aberto={popup === "criada"}
        tipo="sucesso"
        titulo="Senha cadastrada com sucesso!"
        texto="Agora é só entrar com o seu e-mail e a senha que você acabou de criar."
        acao={
          <button type="button" className={botaoCls} onClick={() => navigate({ to: "/login" })}>
            Voltar para o login
          </button>
        }
      />
      <PopupAviso
        aberto={popup === "ja_criou"}
        tipo="senha"
        titulo="Você já criou sua senha"
        texto="Esse e-mail já tem senha. Se você não lembra qual é, dá pra criar uma nova."
        onFechar={() => setPopup(null)}
        acao={
          <Link to="/esqueci-senha" className={botaoCls}>
            Redefinir senha
          </Link>
        }
      />
      <PopupAviso
        aberto={popup === "sem_acesso"}
        tipo="bloqueio"
        titulo="Você não tem acesso ao Método"
        texto="Não achei nenhuma compra com esse e-mail. Se você já comprou, confere se digitou o mesmo e-mail da compra."
        onFechar={() => setPopup(null)}
        acao={
          <a href={PAGINA_VENDAS_URL} target="_blank" rel="noreferrer" className={botaoCls}>
            Conhecer o Método
          </a>
        }
      />
    </>
  );
}
