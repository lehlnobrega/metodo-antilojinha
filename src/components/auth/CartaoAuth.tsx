import type { ReactNode } from "react";

import { Logo } from "@/components/Logo";

export function CartaoAuth({
  titulo,
  texto,
  children,
  rodape,
}: {
  titulo: string;
  texto?: string;
  children: ReactNode;
  rodape?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo tamanho="lg" />
        </div>
        <div className="card-metodo p-7">
          <h1 className="text-xl font-semibold text-foreground">{titulo}</h1>
          {texto ? <p className="mt-1 text-sm text-muted-foreground">{texto}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
        {rodape ? <div className="mt-5 text-center text-sm text-muted-foreground">{rodape}</div> : null}
      </div>
    </div>
  );
}
