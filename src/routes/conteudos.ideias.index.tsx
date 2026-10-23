import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarPlus,
  ExternalLink,
  Heart,
  Images,
  Instagram,
  Link2,
  Music2,
  Search,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/AppLayout";
import { CardConteudo } from "@/components/metodo/card-conteudo";
import { Dropdown } from "@/components/metodo/dropdown-pilula";
import { EstadoVazio } from "@/components/PaginaTopo";
import { useAluna } from "@/lib/aluna";
import {
  type ConteudoAcervo,
  DECISOES,
  type Decisao,
  embedPanda,
  FORMATOS_ACERVO,
  type Nicho,
  TIPOS_ACERVO,
  redeDoLink,
  salvarDecisao,
  salvarIdeia,
  tipoAcervo,
  useConteudosAcervo,
  useDecisoesFormatos,
  useFormatosVirais,
  useIdeiasSalvas,
  useNichos,
} from "@/lib/acervo";
import type { CamposConteudo } from "@/lib/dados-loja";
import { hojeSaoPaulo } from "@/lib/formato";
import { cn } from "@/lib/utils";

type Busca = {
  aba?: "formatos" | undefined;
  nicho?: string | undefined;
  tipo?: string | undefined;
  formato?: string | undefined;
  salvos?: boolean | undefined;
};

export const Route = createFileRoute("/conteudos/ideias/")({
  validateSearch: (s: Record<string, unknown>): Busca => {
    const r: Busca = {};
    if (s["aba"] === "formatos") r.aba = "formatos";
    for (const k of ["nicho", "tipo", "formato"] as const) {
      const v = s[k];
      if ((typeof v === "string" && v) || typeof v === "number") r[k] = String(v);
    }
    if (s["salvos"] === true || s["salvos"] === "true" || s["salvos"] === 1) r.salvos = true;
    return r;
  },
  head: () => ({
    meta: [
      { title: "Ideias de conteúdo | Método" },
      {
        name: "description",
        content:
          "Banco de ideias com filtros por nicho, tipo e formato, e os formatos que estão viralizando.",
      },
      { property: "og:title", content: "Ideias de conteúdo | Método" },
      {
        property: "og:description",
        content:
          "Banco de ideias com filtros por nicho, tipo e formato, e os formatos que estão viralizando.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Ideias,
});

function Ideias() {
  const busca = Route.useSearch();
  const navigate = Route.useNavigate();
  const atual = busca.aba ?? "banco";
  return (
    <AppLayout titulo="Ideias de conteúdo">
      <Link
        to="/conteudos"
        className="-mt-2 mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Voltar aos conteúdos
      </Link>
      <div className="mb-6 flex">
        <div className="inline-flex rounded-xl border border-border bg-surface p-1" role="tablist">
          {(
            [
              ["banco", "Banco de ideias"],
              ["formatos", "Formatos virais"],
            ] as const
          ).map(([v, r]) => (
            <button
              key={v}
              role="tab"
              aria-selected={atual === v}
              onClick={() =>
                navigate({ search: v === "banco" ? {} : { aba: "formatos" }, replace: true })
              }
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                atual === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      {atual === "banco" ? <BancoIdeias /> : <Formatos />}
    </AppLayout>
  );
}

const POR_VEZ = 24;

function BancoIdeias() {
  const busca = Route.useSearch();
  const navigate = Route.useNavigate();
  const { aluna } = useAluna();
  const qc = useQueryClient();
  const nichos = useNichos();
  const conteudos = useConteudosAcervo(true);
  const salvas = useIdeiasSalvas();
  const [texto, setTexto] = useState("");
  const [limite, setLimite] = useState(POR_VEZ);
  const [calendario, setCalendario] = useState<CamposConteudo | null>(null);

  const nomeNicho = useMemo(
    () => new Map((nichos.data ?? []).map((n) => [n.id, n])),
    [nichos.data],
  );
  const setSalvas = salvas.data ?? new Set<number>();

  const itens = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return (conteudos.data ?? []).filter((c) => {
      if (busca.nicho && String(c.nicho_id) !== busca.nicho) return false;
      if (busca.tipo && c.tipo_cqc !== busca.tipo) return false;
      if (busca.formato && c.formato !== busca.formato) return false;
      if (busca.salvos && !setSalvas.has(c.id)) return false;
      if (q) {
        const alvo =
          `${c.titulo} ${c.feedback ?? ""} ${nomeNicho.get(c.nicho_id)?.nome ?? ""}`.toLowerCase();
        if (!alvo.includes(q)) return false;
      }
      return true;
    });
  }, [conteudos.data, busca, texto, setSalvas, nomeNicho]);

  const temFiltro = Boolean(
    busca.nicho || busca.tipo || busca.formato || busca.salvos || texto.trim(),
  );

  const mudar = (p: Partial<Busca>) => {
    setLimite(POR_VEZ);
    navigate({
      search: (prev) => {
        const n = { ...prev, ...p } as Busca;
        (Object.keys(n) as (keyof Busca)[]).forEach((k) => {
          if (!n[k]) delete n[k];
        });
        return n;
      },
      replace: true,
    });
  };
  const limpar = () => {
    setTexto("");
    setLimite(POR_VEZ);
    navigate({ search: {}, replace: true });
  };

  const alternar = async (id: number) => {
    if (!aluna) return;
    const salvar = !setSalvas.has(id);
    qc.setQueryData<Set<number>>(["acervo", "salvas"], (s) => {
      const n = new Set(s ?? []);
      if (salvar) n.add(id);
      else n.delete(id);
      return n;
    });
    try {
      await salvarIdeia(aluna.id, id, salvar);
      if (salvar) toast.success("Salvo nos seus favoritos");
    } catch {
      toast.error("Não consegui salvar agora. Tenta de novo.");
      void qc.invalidateQueries({ queryKey: ["acervo", "salvas"] });
    }
  };

  const nichosComConteudo = useMemo(() => {
    const ids = new Set((conteudos.data ?? []).map((c) => c.nicho_id));
    return (nichos.data ?? []).filter((n) => ids.has(n.id));
  }, [nichos.data, conteudos.data]);

  return (
    <>
      <CardConteudo
        aberto={calendario !== null}
        inicial={calendario}
        onFechar={() => setCalendario(null)}
      />
      <p className="mb-5 max-w-2xl text-[15px] text-muted-foreground">
        Todas as referências num lugar só. Filtra pelo seu nicho, mas vale olhar os outros também:
        ideia boa de um nicho pode virar a melhor ideia do seu.
      </p>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <label className="relative w-full lg:max-w-xs">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setLimite(POR_VEZ);
            }}
            placeholder="Buscar: hater, vela, embalando..."
            className="h-11 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
          <Dropdown
            rotulo="Nicho"
            valor={busca.nicho}
            opcoes={nichosComConteudo.map((n) => ({
              valor: String(n.id),
              rotulo: `${n.emoji ?? ""} ${n.nome}`.trim(),
            }))}
            onChange={(v) => mudar({ nicho: v })}
          />
          <Dropdown
            rotulo="Tipo de conteúdo"
            valor={busca.tipo}
            opcoes={TIPOS_ACERVO.map((t) => ({ valor: t.valor, rotulo: `${t.emoji} ${t.rotulo}` }))}
            onChange={(v) => mudar({ tipo: v })}
          />
          <Dropdown
            rotulo="Formato"
            valor={busca.formato}
            opcoes={FORMATOS_ACERVO.map((f) => ({ valor: f.valor, rotulo: f.rotulo }))}
            onChange={(v) => mudar({ formato: v })}
          />
          <button
            type="button"
            aria-pressed={Boolean(busca.salvos)}
            onClick={() => mudar({ salvos: !busca.salvos })}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors",
              busca.salvos
                ? "border-primary bg-accent-soft text-primary"
                : "border-border bg-surface hover:border-primary",
            )}
          >
            <Heart className={cn("size-4", busca.salvos && "fill-current")} /> Só os salvos
            {setSalvas.size ? (
              <span className="text-xs text-muted-foreground">({setSalvas.size})</span>
            ) : null}
          </button>
        </div>
      </div>
      <div className="mb-5 flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          {itens.length} {itens.length === 1 ? "conteúdo" : "conteúdos"}
        </span>
        {temFiltro ? (
          <button onClick={limpar} className="font-medium text-primary hover:underline">
            Limpar filtros
          </button>
        ) : null}
      </div>

      {conteudos.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : conteudos.isError ? (
        <p className="text-sm text-destructive">
          Não foi possível carregar: {conteudos.error.message}
        </p>
      ) : (conteudos.data ?? []).length === 0 ? (
        <EstadoVazio
          titulo="As ideias estão chegando"
          texto="Logo aparecem aqui os conteúdos separados pra te inspirar."
        />
      ) : itens.length === 0 ? (
        <EstadoVazio
          titulo={
            busca.salvos && !setSalvas.size
              ? "Você ainda não salvou nenhuma ideia"
              : "Nenhum conteúdo com esses filtros"
          }
          {...(busca.salvos && !setSalvas.size
            ? { texto: "Toca no coração das ideias que você quer guardar pra depois." }
            : {})}
          acao={
            <button
              onClick={limpar}
              className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Ver todas as ideias
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {itens.slice(0, limite).map((c) => (
              <CardIdeia
                key={c.id}
                c={c}
                nicho={nomeNicho.get(c.nicho_id)}
                salva={setSalvas.has(c.id)}
                onCoracao={() => alternar(c.id)}
                onCalendario={() =>
                  setCalendario({
                    titulo: `Inspirado em: ${c.titulo}`,
                    tipo_cqc: c.tipo_cqc,
                    formato: c.formato,
                    status: "nao_roteirizado",
                    data_post: hojeSaoPaulo(),
                    sobre_video: `Referência: ${c.link}${c.feedback ? `\n\n${c.feedback}` : ""}`,
                  })
                }
              />
            ))}
          </div>
          {itens.length > limite ? (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setLimite((l) => l + POR_VEZ)}
                className="h-11 rounded-full border border-border bg-surface px-6 text-sm font-medium hover:border-primary hover:text-primary"
              >
                Carregar mais ({itens.length - limite} restantes)
              </button>
            </div>
          ) : null}
        </>
      )}
      <p className="mt-10 text-center text-xs text-muted-foreground">
        Inspiração, não cópia. Entende a lógica e traz pra sua loja.
      </p>
    </>
  );
}

function CardIdeia({
  c,
  nicho,
  salva,
  onCoracao,
  onCalendario,
}: {
  c: ConteudoAcervo;
  nicho: Nicho | undefined;
  salva: boolean;
  onCoracao: () => void;
  onCalendario: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const tipo = tipoAcervo(c.tipo_cqc);
  const rede = redeDoLink(c.link);
  const nomeRede = rede === "instagram" ? "Instagram" : rede === "tiktok" ? "TikTok" : null;
  const IconeRede = rede === "instagram" ? Instagram : rede === "tiktok" ? Music2 : Link2;
  const longo = (c.feedback ?? "").length > 160;
  return (
    <article className="card-metodo relative flex flex-col p-5">
      <button
        type="button"
        onClick={onCoracao}
        aria-pressed={salva}
        aria-label={salva ? "Tirar dos salvos" : "Salvar ideia"}
        title={salva ? "Tirar dos salvos" : "Salvar ideia"}
        className={cn(
          "absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full transition-colors",
          salva
            ? "bg-accent-soft text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-primary",
        )}
      >
        <Heart className={cn("size-5 transition-transform", salva && "scale-110 fill-current")} />
      </button>
      <div className="flex flex-wrap gap-1.5 pr-11">
        {nomeRede ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium">
            <IconeRede className="size-3" /> {nomeRede}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
          {c.formato === "video" ? <Video className="size-3" /> : <Images className="size-3" />}
          {c.formato === "video" ? "Vídeo" : "Carrossel"}
        </span>
        {tipo ? (
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", tipo.chip)}>
            {tipo.emoji} {tipo.rotulo}
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 text-base font-semibold leading-snug">{c.titulo}</h3>
      {c.feedback ? (
        <div className="mt-3 flex gap-2">
          <span className="mt-1.5 shrink-0 text-sm" aria-hidden="true">
            💬
          </span>
          <div className="rounded-[4px_16px_16px_16px] bg-muted px-3 py-2.5 text-[13.5px] leading-relaxed">
            <p className={cn("whitespace-pre-line", !aberto && "line-clamp-4")}>{c.feedback}</p>
            {longo ? (
              <button
                onClick={() => setAberto(!aberto)}
                className="mt-1 text-xs font-medium text-primary hover:underline"
              >
                {aberto ? "ver menos" : "ver mais"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <a
          href={c.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 min-w-[150px] flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <IconeRede className="size-4" /> {nomeRede ? `Ver no ${nomeRede}` : "Ver conteúdo"}
        </a>
        <button
          type="button"
          onClick={onCalendario}
          title="Salvar no meu calendário"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-[13px] font-medium hover:border-primary hover:text-primary"
        >
          <CalendarPlus className="size-4" /> Calendário
        </button>
      </div>
      {nicho ? (
        <span className="mt-3 text-xs text-muted-foreground">
          {nicho.emoji ?? ""} {nicho.nome}
        </span>
      ) : null}
    </article>
  );
}

function Formatos() {
  const { aluna } = useAluna();
  const formatos = useFormatosVirais(true);
  const decisoes = useDecisoesFormatos();
  const qc = useQueryClient();

  const decidir = async (id: number, valor: Decisao) => {
    if (!aluna) return;
    const atual = decisoes.data?.get(id);
    const novo = atual === valor ? null : valor;
    qc.setQueryData<Map<number, Decisao>>(["acervo", "decisoes"], (m) => {
      const n = new Map(m ?? []);
      if (novo) n.set(id, novo);
      else n.delete(id);
      return n;
    });
    try {
      await salvarDecisao(aluna.id, id, novo);
    } catch {
      toast.error("Não consegui salvar agora. Tenta de novo.");
      void qc.invalidateQueries({ queryKey: ["acervo", "decisoes"] });
    }
  };

  return (
    <>
      <p className="mb-6 max-w-2xl text-[15px] text-muted-foreground">
        Formatos que estão viralizando. Assiste a referência e decide se combina com a sua loja.
      </p>
      {formatos.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : formatos.isError ? (
        <p className="text-sm text-destructive">
          Não foi possível carregar: {formatos.error.message}
        </p>
      ) : (formatos.data ?? []).length === 0 ? (
        <EstadoVazio
          titulo="Os formatos estão chegando"
          texto="Logo aparecem aqui os formatos que estão viralizando, com vídeo de referência."
        />
      ) : (
        <div className="grid max-w-4xl grid-cols-1 gap-4">
          {(formatos.data ?? []).map((f) => {
            const d = decisoes.data?.get(f.id);
            return (
              <article
                key={f.id}
                className={cn(
                  "card-metodo flex flex-col gap-5 p-5 sm:p-6",
                  embedPanda(f.link) && "sm:flex-row",
                )}
              >
                {embedPanda(f.link) ? (
                  <figure className="mx-auto w-full max-w-[240px] shrink-0 sm:mx-0 sm:w-[220px]">
                    <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-muted">
                      <iframe
                        src={embedPanda(f.link)!}
                        title={`Vídeo de referência: ${f.nome}`}
                        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                        className="absolute inset-0 size-full border-0"
                      />
                    </div>
                    {f.credito ? (
                      <figcaption className="mt-2 text-center text-xs text-muted-foreground">
                        Crédito:{" "}
                        <a
                          href={`https://instagram.com/${f.credito}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          @{f.credito}
                        </a>
                      </figcaption>
                    ) : null}
                  </figure>
                ) : null}
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-[17px] font-semibold tracking-[-0.015em]">{f.nome}</h3>
                    {f.link && !embedPanda(f.link) ? (
                      <a
                        href={f.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-[12.5px] font-medium hover:border-primary hover:text-primary"
                      >
                        <Video className="size-3.5" /> Ver vídeo de referência{" "}
                        <ExternalLink className="size-3" />
                      </a>
                    ) : null}
                  </div>
                  <dl className="mt-4 grid gap-3">
                    {(
                      [
                        ["O que é", f.o_que_e],
                        ["Por que funciona", f.por_que],
                        ["Como aplicar", f.como_adaptar],
                      ] as const
                    ).map(([r, v]) =>
                      v ? (
                        <div key={r}>
                          <dt className="text-xs font-semibold text-muted-foreground">{r}</dt>
                          <dd className="mt-0.5 whitespace-pre-line text-sm leading-relaxed">
                            {v}
                          </dd>
                        </div>
                      ) : null,
                    )}
                  </dl>
                  <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-border pt-4">
                    <span className="mr-1 text-[12.5px] text-muted-foreground">
                      Pra minha loja:
                    </span>
                    {DECISOES.map((o) => (
                      <button
                        key={o.valor}
                        onClick={() => decidir(f.id, o.valor)}
                        aria-pressed={d === o.valor}
                        className={cn(
                          "rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors",
                          d === o.valor
                            ? "border-foreground bg-foreground text-surface"
                            : "border-border bg-surface hover:border-foreground",
                        )}
                      >
                        {o.rotulo}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
