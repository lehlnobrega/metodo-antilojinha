import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { CartaoAuth } from "@/components/auth/CartaoAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/metodo/client";

export const Route = createFileRoute("/criar-senha")({
  head: () => ({
    meta: [
      { title: "Criar senha | Método" },
      { name: "description", content: "Crie a sua senha para entrar no app do Método." },
      { property: "og:title", content: "Criar senha | Método" },
      { property: "og:description", content: "Crie a sua senha para entrar no app do Método." },
    ],
  }),
  component: CriarSenha,
});

function CriarSenha() {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const navigate = useNavigate();

  return (
    <CartaoAuth
      titulo="Bem-vinda ao Método! Crie sua senha pra começar."
      texto="A senha precisa ter no mínimo 8 caracteres."
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
          const { error } = await supabase.auth.updateUser({ password: senha, data: { senha_criada: true } });
          if (error) {
            toast.error("O link expirou ou já foi usado. Peça um novo em Esqueci minha senha.");
            return;
          }
          toast.success("Senha salva!");
          navigate({ to: "/", replace: true });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="senha">Crie sua senha</Label>
          <Input
            id="senha"
            type="password"
            autoComplete="new-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmacao">Confirme a senha</Label>
          <Input
            id="confirmacao"
            type="password"
            autoComplete="new-password"
            required
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full">
          Salvar senha
        </Button>
      </form>
    </CartaoAuth>
  );
}
