import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Shield, Users } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { ITENS_MENU } from "@/components/layout/menu-itens";
import { GRUPO_VIP_URL } from "@/config";
import { useAluna } from "@/lib/aluna";

export const Route = createFileRoute("/mais")({
  head: () => ({
    meta: [
      { title: "Mais | Método" },
      { name: "description", content: "Todas as áreas do Método em um lugar só." },
      { property: "og:title", content: "Mais | Método" },
      { property: "og:description", content: "Todas as áreas do Método em um lugar só." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Mais,
});

function Mais() {
  const { aluna } = useAluna();
  const itens = [...ITENS_MENU, ...(aluna?.is_admin ? [{ rotulo: "Painel admin", para: "/admin", icone: Shield }] : [])];
  return (
    <AppLayout>
      <div className="card-metodo p-2">
        {itens.map((item) => {
          const Icone = item.icone;
          return (
            <Link key={item.para} to={item.para} className="item-metodo flex items-center gap-3 px-3 py-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-primary">
                <Icone className="size-[18px]" strokeWidth={1.75} />
              </span>
              <span className="flex-1 text-sm font-medium">{item.rotulo}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
      <div className="mt-4 rounded-[20px] bg-accent p-5 text-foreground">
        <p className="flex items-center gap-2 font-semibold">
          <Users className="size-4" /> Grupo VIP
        </p>
        <p className="mt-1 text-[13px]">É lá que acontece o suporte e a troca com as meninas.</p>
        <a
          href={GRUPO_VIP_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          Entrar no grupo
        </a>
      </div>
    </AppLayout>
  );
}
