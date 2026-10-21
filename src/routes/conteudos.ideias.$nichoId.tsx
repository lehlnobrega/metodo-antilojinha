import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, ChevronDown, ExternalLink, Images, Instagram, Link2, MessageCircle, Music2, Video } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { EstadoVazio } from "@/components/PaginaTopo";
import { CardConteudo } from "@/components/metodo/card-conteudo";
import type { CamposConteudo } from "@/lib/dados-loja";
import { hojeSaoPaulo } from "@/lib/formato";
import { type ConteudoAcervo, TIPOS_ACERVO, redeDoLink, tipoAcervo, useConteudosAcervo, useNichos } from "@/lib/acervo";
import { cn } from "@/lib/utils";

type Busca = { tipo?: string; formato?: string };

export const Route = createFileRoute("/conteudos/ideias/$nichoId")({
  validateSearch: (s: Record<string, unknown>): Busca => {
    const r: Busca = {};
    if (typeof s["tipo"] === "string" && s["tipo"]) r.tipo = s["tipo"];
    if (typeof s["formato"] === "string" && s["formato"]) r.formato = s["formato"];
    return r;
  },
  head: () => ({
    meta: [
      { title: "Ideias do nicho | Método" },
      { name: "description", content: "Conteúdos que funcionam neste nicho, com filtros por tipo e formato." },
      { property: "og:title", content: "Ideias do nicho | Método" },
      { property: "og:description", content: "Conteúdos que funcionam neste nicho, com filtros por tipo e formato." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaginaNicho,
});

const POR_VEZ = 24;

type Opcao = { valor: string; rotulo: string };

function Dropdown({ rotulo, valor, opcoes, onChange }: { rotulo: string; valor?: string | undefined; opcoes: Opcao[]; onChange: (v?: string) => void }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [aberto]);
  const atual = opcoes.find((o) => o.valor === valor);
  const todas: Opcao[] = [{ valor: "", rotulo: "Todos" }, ...opcoes];
  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto(!aberto)}
        className={cn(
          "inline-flex h-11 w-full items-center justify-between gap-3 rounded-full border bg-surface px-5 text-sm transition-colors sm:w-auto",
          atual ? "border-primary text-primary" : "border-border text-foreground hover:border-primary",
        )}
      >
        <span className="truncate"><span className={atual ? "" : "text-muted-foreground"}>{rotulo}:</span> <span className="font-medium">{atual?.rotulo ?? "Todos"}</span></span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", aberto && "rotate-180")} />
      </button>
      {aberto ? (
        <ul role="listbox" className="absolute left-0 z-20 mt-2 min-w-full overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
          {todas.map((o) => {
            const sel = (valor ?? "") === o.valor;
            return (
              <li key={o.valor || "todos"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={sel}
                  onClick={() => { onChange(o.valor || undefined); setAberto(false); }}
                  className={cn("flex w-full items-center justify-between gap-4 whitespace-nowrap px-4 py-2.5 text-left text-sm hover:bg-muted", sel && "font-medium text-primary")}
                >
                  {o.rotulo}
                  {sel ? <Check className="size-4" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function PaginaNicho() {
  const { nichoId } = Route.useParams();
  const busca = Route.useSearch();
  const navigate = Route.useNavigate();
  const nichos = useNichos();
  const conteudos = useConteudosAcervo(true);
  const [limite, setLimite] = useState(POR_VEZ);
  const [salvar, setSalvar] = useState<CamposConteudo | null>(null);

  const nicho = (nichos.data ?? []).find((n) => String(n.id) === nichoId);
  const doNicho = useMemo(() => (conteudos.data ?? []).filter((c) => String(c.nicho_id) === nichoId), [conteudos.data, nichoId]);
  const filtrados = useMemo(
    () => doNicho.filter((c) => (!busca.tipo || c.tipo_cqc === busca.tipo) && (!busca.formato || c.formato === busca.formato)),
    [doNicho, busca],
  );
  const temFiltro = Boolean(busca.tipo || busca.formato);

  const mudar = (p: { tipo?: string | undefined; formato?: string | undefined }) => {
    setLimite(POR_VEZ);
    navigate({ search: (prev) => { const n = { ...prev, ...p } as Busca; if (!n.tipo) delete n.tipo; if (!n.formato) delete n.formato; return n; }, replace: true });
  };
  const limpar = () => { setLimite(POR_VEZ); navigate({ search: {}, replace: true }); };

  return (
    <AppLayout titulo={nicho ? `${nicho.emoji ?? ""} ${nicho.nome}`.trim() : nichos.isLoading ? "Carregando..." : "Nicho não encontrado"}>
      <CardConteudo aberto={salvar !== null} inicial={salvar} onFechar={() => setSalvar(null)} />
      <div className="-mt-3 mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        {nicho ? <span className="text-[15px] text-muted-foreground">{doNicho.length} {doNicho.length === 1 ? "ideia" : "ideias"} pra adaptar pra sua loja</span> : null}
        <Link to="/conteudos/ideias" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Todos os nichos
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Dropdown
          rotulo="Tipo de conteúdo"
          valor={busca.tipo}
          opcoes={TIPOS_ACERVO.map((t) => ({ valor: t.valor, rotulo: `${t.emoji} ${t.rotulo}` }))}
          onChange={(v) => mudar({ tipo: v })}
        />
        <Dropdown
          rotulo="Formato"
          valor={busca.formato}
          opcoes={[{ valor: "video", rotulo: "Vídeo" }, { valor: "carrossel", rotulo: "Carrossel" }]}
          onChange={(v) => mudar({ formato: v })}
        />
        {temFiltro ? <button onClick={limpar} className="text-sm font-medium text-primary hover:underline sm:ml-1">Limpar filtros</button> : null}
      </div>

      {conteudos.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : conteudos.isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar: {conteudos.error.message}</p>
      ) : filtrados.length === 0 ? (
        temFiltro ? (
          <EstadoVazio
            titulo="Nenhuma ideia com esses filtros ainda."
            acao={<button onClick={limpar} className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Limpar filtros</button>}
          />
        ) : (
          <EstadoVazio titulo="As ideias deste nicho estão chegando" texto="Enquanto isso, dá uma olhada nos outros nichos." />
        )
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.slice(0, limite).map((c) => <CardIdeia
                key={c.id}
                c={c}
                onSalvar={() =>
                  setSalvar({
                    titulo: `Inspirado em: ${c.titulo}`,
                    tipo_cqc: c.tipo_cqc,
                    formato: c.formato,
                    status: "nao_roteirizado",
                    data_post: hojeSaoPaulo(),
                    sobre_video: `Referência: ${c.link}${c.feedback ? `\n\n${c.feedback}` : ""}`,
                  })
                }
              />)}
          </div>
          {filtrados.length > limite ? (
            <div className="mt-6 flex justify-center">
              <button onClick={() => setLimite((l) => l + POR_VEZ)} className="h-11 rounded-xl border border-border bg-surface px-6 text-sm font-medium hover:bg-muted">Carregar mais</button>
            </div>
          ) : null}
        </>
      )}

      <p className="mt-10 text-center text-xs text-muted-foreground">Inspiração, não cópia. Entende a lógica e traz pra sua loja.</p>
    </AppLayout>
  );
}

function CardIdeia({ c, onSalvar }: { c: ConteudoAcervo; onSalvar: () => void }) {
  const [aberto, setAberto] = useState(false);
  const tipo = tipoAcervo(c.tipo_cqc);
  const rede = redeDoLink(c.link);
  const longo = (c.feedback ?? "").length > 140;
  return (
    <article className="card-metodo flex flex-col p-5 sm:p-6">
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
          {c.formato === "video" ? <Video className="size-3" /> : <Images className="size-3" />}
          {c.formato === "video" ? "Vídeo" : "Carrossel"}
        </span>
        {tipo ? <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", tipo.chip)}>{tipo.emoji} {tipo.rotulo}</span> : null}
      </div>
      <h3 className="mt-3 text-base font-semibold leading-snug">{c.titulo}</h3>
      {c.feedback ? (
        <div className="mt-2 flex gap-2 text-sm text-muted-foreground">
          <MessageCircle className="mt-0.5 size-3.5 shrink-0" />
          <div>
            <p className={cn("whitespace-pre-line", !aberto && "line-clamp-3")}>{c.feedback}</p>
            {longo ? <button onClick={() => setAberto(!aberto)} className="mt-1 text-xs font-medium text-primary hover:underline">{aberto ? "ver menos" : "ver mais"}</button> : null}
          </div>
        </div>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <span className="text-muted-foreground" aria-label={rede}>
          {rede === "instagram" ? <Instagram className="size-4" /> : rede === "tiktok" ? <Music2 className="size-4" /> : <Link2 className="size-4" />}
        </span>
        <button onClick={onSalvar} className="ml-auto inline-flex h-9 items-center rounded-full border border-border bg-surface px-3.5 text-xs font-medium hover:border-primary hover:text-primary">
          Salvar no meu calendário
        </button>
        <a href={c.link} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover">
          Ver conteúdo <ExternalLink className="size-3.5" />
        </a>
      </div>
    </article>
  );
}
