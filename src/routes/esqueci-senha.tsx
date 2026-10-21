import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { CartaoAuth } from "@/components/auth/CartaoAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/metodo/client";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({
    meta: [
      { title: "Esqueci minha senha | Método" },
      { name: "description", content: "Receba um link por e-mail para criar uma nova senha." },
      { property: "og:title", content: "Esqueci minha senha | Método" },
      { property: "og:description", content: "Receba um link por e-mail para criar uma nova senha." },
    ],
  }),
  component: EsqueciSenha,
});

function EsqueciSenha() {
  const [email, setEmail] = useState("");

  return (
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
          const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
            redirectTo: `${window.location.origin}/criar-senha`,
          });
          if (error) {
            toast.error("Não foi possível enviar o link agora. Tente de novo em alguns minutos.");
            return;
          }
          toast.success("Pronto! Se esse e-mail tiver acesso, o link chega em instantes.");
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
        <Button type="submit" className="w-full">
          Enviar link
        </Button>
      </form>
    </CartaoAuth>
  );
}
