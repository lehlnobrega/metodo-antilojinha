import { Home, ListChecks, FolderOpen, Instagram, BarChart3, Wrench, Heart, LayoutGrid } from "lucide-react";

export type ItemMenu = {
  rotulo: string;
  para: string;
  icone: typeof Home;
  grupo?: string;
};

export const ITENS_MENU: ItemMenu[] = [
  { rotulo: "Início", para: "/", icone: Home, grupo: "Seu método" },
  { rotulo: "Plano prático", para: "/plano-pratico", icone: ListChecks, grupo: "Seu método" },
  { rotulo: "Materiais de apoio", para: "/materiais", icone: FolderOpen, grupo: "Seu método" },
  { rotulo: "Meus conteúdos", para: "/conteudos", icone: Instagram, grupo: "Sua loja" },
  { rotulo: "Dados da loja", para: "/dados-da-loja", icone: BarChart3, grupo: "Sua loja" },
  { rotulo: "Ferramentas", para: "/ferramentas", icone: Wrench, grupo: "Recursos" },
  { rotulo: "Indicações", para: "/indicacoes", icone: Heart, grupo: "Recursos" },
];

/** Barra inferior do celular. */
export const ITENS_CELULAR: ItemMenu[] = [
  { rotulo: "Início", para: "/", icone: Home },
  { rotulo: "Plano", para: "/plano-pratico", icone: ListChecks },
  { rotulo: "Conteúdos", para: "/conteudos", icone: Instagram },
  { rotulo: "Dados", para: "/dados-da-loja", icone: BarChart3 },
  { rotulo: "Mais", para: "/mais", icone: LayoutGrid },
];

/** Título da topbar a partir do endereço. */
export function tituloDaPagina(pathname: string) {
  if (pathname.startsWith("/admin")) return "Painel admin";
  if (pathname.startsWith("/mais")) return "Mais";
  if (pathname.startsWith("/conteudos/ideias")) return "Ideias de conteúdo";
  if (pathname.startsWith("/plano-de-negocios")) return "Plano de negócios";
  if (pathname.startsWith("/bonus")) return "Bônus";
  const item = [...ITENS_MENU].reverse().find((i) => i.para !== "/" && pathname.startsWith(i.para));
  return item?.rotulo ?? "Início";
}
