import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { CartaoAuth } from "@/components/auth/CartaoAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PopupAviso } from "@/components/auth/PopupAviso";
import { PAGINA_VENDAS_URL } from "@/config";
import { supabase } from "@/integrations/metodo/client";
import { verificarCadastro } from "@/lib/login.functions";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({
    meta: [
      { title: "Esqueci minha senha | Método" },
      { name: "description", content: "Receba um link por e-mail para criar uma nova senha." },
      { property: "og:title", content: "Esqueci minha senha | Método" },
      {
        property: "og:description",
        content: "Receba um link por e-mail para criar uma nova senha.",
      },
    ],
  }),
  component: EsqueciSenha,
});

function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [popup, setPopup] = useState<"enviado" | "sem_acesso" | null>(null);
  const conferir = useServerFn(verificarCadastro);
  const botaoCls =
    "inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover";

  return (
    <>
      <CartaoAuth
        titulo="Vamos recuperar o seu acesso"
        texto="Coloca o seu e-mail que eu te mando um link para criar uma nova senha."
        rodape={
          <Link to="/login" className="transicao-suave font-medium text-primary hover:underline">
            Voltar para o login
          </Link>
        }
      >
        <form
          className="space-y-4"
          onSubmit={async (evento) => {
            evento.preventDefault();
            const emailLimpo = email.trim().toLowerCase();
            setEnviando(true);
            const r = await conferir({ data: { email: emailLimpo } }).catch(() => ({
              existe: true,
            }));
            if (!r.existe) {
              setEnviando(false);
              setPopup("sem_acesso");
              return;
            }
            const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, {
              redirectTo: `${window.location.origin}/criar-senha`,
            });
            setEnviando(false);
            if (error) {
              toast.error("Não foi possível enviar o link agora. Tente de novo em alguns minutos.");
              return;
            }
            setPopup("enviado");
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
          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar link"}
          </Button>
        </form>
      </CartaoAuth>
      <PopupAviso
        aberto={popup === "enviado"}
        tipo="sucesso"
        titulo="Link enviado!"
        texto={`Mandei o link pra criar a senha nova no e-mail ${email.trim().toLowerCase()}. Confere também a caixa de spam.`}
        onFechar={() => setPopup(null)}
        acao={
          <Link to="/login" className={botaoCls}>
            Voltar para o login
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
