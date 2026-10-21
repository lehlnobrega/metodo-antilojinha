import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Flame, LogOut, Shield } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/metodo/visual";
import { GRUPO_VIP_URL } from "@/config";
import { primeiroNome } from "@/lib/formato";
import { useAluna, useGuardaAcesso } from "@/lib/aluna";
import { usePostsDatas } from "@/lib/dados";
import { calcularOfensiva } from "@/lib/ofensiva";
import { cn } from "@/lib/utils";
import { ITENS_CELULAR, ITENS_MENU, tituloDaPagina } from "./menu-itens";

type AppLayoutProps = {
  children: ReactNode;
  /** Sobrescreve o título da topbar. */
  titulo?: string;
  /** Conteúdo extra à direita da topbar, antes da ofensiva. */
  acaoTopo?: ReactNode;
  /** Modo leitura: recolhe o menu lateral e esconde o título grande, pra sobrar só o texto. */
  foco?: boolean;
};

function estaAtivo(atual: string, para: string) {
  if (para === "/") return atual === "/";
  if (para === "/ferramentas" && atual.startsWith("/plano-de-negocios")) return true;
  if (para === "/materiais" && atual.startsWith("/bonus")) return true;
  return atual === para || atual.startsWith(`${para}/`);
}

export function AppLayout({ children, titulo, acaoTopo, foco }: AppLayoutProps) {
  const liberado = useGuardaAcesso();
  const { aluna, acessoAtivo, sair } = useAluna();
  const navigate = useNavigate();
  const posts = usePostsDatas();
  const ofensiva = calcularOfensiva(posts.data ?? []);
  const nomeAluna = aluna?.nome ? primeiroNome(aluna.nome) : (aluna?.email ?? "");
  const isAdmin = Boolean(aluna?.is_admin);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Primeiro login: a pesquisa vem antes de qualquer tela.
  useEffect(() => {
    if (liberado && aluna && !aluna.pesquisa_concluida && !aluna.is_admin) {
      navigate({ to: "/pesquisa", replace: true });
    }
  }, [liberado, aluna, navigate]);

  const onSair = async () => {
    await sair();
    navigate({ to: "/login", replace: true });
  };

  if (!liberado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Logo />
      </div>
    );
  }

  if (!acessoAtivo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="card-metodo max-w-md p-8 text-center">
          <Logo />
          <h1 className="mt-6 text-xl font-semibold">Seu acesso não está ativo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Não encontramos um acesso válido para este e-mail. Fale com o suporte no Grupo VIP.
          </p>
          <button type="button" onClick={onSair} className="mt-6 text-sm font-medium text-primary hover:underline">
            Sair
          </button>
        </div>
      </div>
    );
  }

  const itemClasse = (ativo: boolean) =>
    cn(
      "transicao-suave group flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium",
      ativo ? "bg-accent-soft text-primary" : "text-foreground/70 hover:bg-muted hover:text-foreground",
    );

  const grupos = ITENS_MENU.reduce<{ nome: string; itens: typeof ITENS_MENU }[]>((acc, item) => {
    const nome = item.grupo ?? "";
    const g = acc.find((x) => x.nome === nome);
    if (g) g.itens.push(item);
    else acc.push({ nome, itens: [item] });
    return acc;
  }, []);

  const tituloAtual = titulo ?? tituloDaPagina(pathname);

  return (
    <div className="min-h-screen bg-background">
      {/* Menu lateral (desktop) */}
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden w-[256px] flex-col border-r border-border bg-surface", !foco && "lg:flex")}>
        <div className="px-6 pb-6 pt-7">
          <Link to="/" aria-label="Início">
            <Logo />
          </Link>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3">
          {grupos.map((g) => (
            <div key={g.nome}>
              {g.nome ? <p className="rotulo-pequeno mb-1.5 px-3">{g.nome}</p> : null}
              <div className="space-y-0.5">
                {g.itens.map((item) => {
                  const Icone = item.icone;
                  const ativo = estaAtivo(pathname, item.para);
                  return (
                    <Link key={item.para} to={item.para} className={itemClasse(ativo)} aria-current={ativo ? "page" : undefined}>
                      <Icone className={cn("size-[18px]", ativo ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} strokeWidth={1.75} />
                      {item.rotulo}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          {isAdmin ? (
            <div>
              <p className="rotulo-pequeno mb-1.5 px-3">Administração</p>
              <Link to="/admin" className={itemClasse(estaAtivo(pathname, "/admin"))}>
                <Shield className={cn("size-[18px]", estaAtivo(pathname, "/admin") ? "text-primary" : "text-muted-foreground")} strokeWidth={1.75} />
                Painel admin
              </Link>
            </div>
          ) : null}
        </nav>

        <div className="space-y-3 p-3">
          <div className="rounded-2xl border border-border bg-muted p-4">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              <p className="text-[13px] font-semibold">Grupo VIP</p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">O suporte do método acontece lá. Travou? Fala no grupo.</p>
            <a
              href={GRUPO_VIP_URL}
              target="_blank"
              rel="noreferrer"
              className="transicao-suave mt-3 flex h-9 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Entrar no grupo
            </a>
          </div>

          <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
            <Avatar nome={aluna?.nome ?? aluna?.email} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{nomeAluna}</p>
              {aluna?.email ? <p className="truncate text-[11px] text-muted-foreground">{aluna.email}</p> : null}
            </div>
            <button
              type="button"
              onClick={onSair}
              aria-label="Sair"
              title="Sair"
              className="transicao-suave rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      <div className={cn(!foco && "lg:ml-[256px]")}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex h-14 w-full max-w-[1180px] items-center justify-between gap-3 px-4 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <Link to="/" className={cn(!foco && "lg:hidden")} aria-label="Início">
                <Logo tamanho="sm" />
              </Link>
              <p className="hidden truncate text-[13px] text-muted-foreground lg:block">{tituloDaPagina(pathname)}</p>
            </div>
            <div className="flex items-center gap-2">
              {acaoTopo ? <div className="hidden sm:block">{acaoTopo}</div> : null}
              <span
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold tabular-nums",
                  ofensiva.dias > 0 ? "bg-destaque-soft text-destaque" : "bg-surface text-muted-foreground ring-1 ring-border",
                )}
                title="Dias seguidos postando"
              >
                <Flame className="size-3.5" strokeWidth={2.25} />
                {ofensiva.dias} {ofensiva.dias === 1 ? "dia" : "dias"}
              </span>
              <Avatar nome={aluna?.nome ?? aluna?.email} className="size-8 lg:hidden" />
              <button
                type="button"
                onClick={onSair}
                aria-label="Sair"
                className="transicao-suave rounded-lg p-2 text-muted-foreground hover:text-primary lg:hidden"
              >
                <LogOut className="size-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 pb-28 pt-7 lg:px-10 lg:pb-16 lg:pt-10">
          <div className="mx-auto w-full max-w-[1180px]">
            {foco ? <h1 className="sr-only">{tituloAtual}</h1> : <h1 className="titulo-pagina mb-6">{tituloAtual}</h1>}
            {children}
          </div>
        </main>
      </div>

      {/* Barra inferior (celular) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-surface lg:hidden">
        {ITENS_CELULAR.map((item) => {
          const Icone = item.icone;
          const ativo = estaAtivo(pathname, item.para);
          return (
            <Link
              key={item.para}
              to={item.para}
              className={cn(
                "transicao-suave flex flex-col items-center gap-1 px-1 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2.5 text-[11px] font-medium",
                ativo ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icone className="size-5" strokeWidth={1.75} />
              <span className="truncate">{item.rotulo}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
