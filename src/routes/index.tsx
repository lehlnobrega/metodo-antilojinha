import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, BarChart3, CalendarDays, CalendarPlus, Check, ChevronRight, ExternalLink, FolderOpen, Lock, ShoppingBag, Smartphone, Video } from "lucide-react";
import { useEffect, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { CardResultados } from "@/components/metodo/cards-registro";
import { CardConteudo, CardMarcarPublicado } from "@/components/metodo/card-conteudo";
import { CardDadosSemana } from "@/components/metodo/card-semana";
import { ChipStatus } from "@/components/metodo/chips";
import { ResumoAcaoSemana } from "@/components/metodo/diagnostico";
import { Anel, Barra } from "@/components/metodo/visual";
import { Skeleton } from "@/components/ui/skeleton";
import { META_FATURAMENTO } from "@/config";
import { useAluna } from "@/lib/aluna";
import { useModulos, usePostsDatas, useTarefas } from "@/lib/dados";
import { type Aula, type CamposConteudo, type Post, resultadoPendente, useAulasDoMes, useDiagnosticos, useMetricasSemana, usePosts, useRespostas } from "@/lib/dados-loja";
import { FUSO } from "@/config";
import { formatarDataExtenso, formatarMoeda, hojeSaoPaulo, primeiroNome, saudacao, segundaDe, somarDias } from "@/lib/formato";
import { MARCOS_OFENSIVA, calcularOfensiva, diaSP, mensagemDaSemana } from "@/lib/ofensiva";
import { moduloAtual, moduloConcluido, pendenciaAnterior, porcentagemGeral, tarefasDoModulo } from "@/lib/plano";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início | Método" },
      { name: "description", content: "Seu escritório virtual: próxima tarefa, progresso, posts e metas." },
      { property: "og:title", content: "Início | Método" },
      { property: "og:description", content: "Seu escritório virtual: próxima tarefa, progresso, posts e metas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inicio,
});

const DIAS = ["S", "T", "Q", "Q", "S", "S", "D"];

function diasDaSemana(hoje: string) {
  const base = new Date(`${hoje}T12:00:00Z`);
  const desloc = (base.getUTCDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base.getTime() + (i - desloc) * 86400000);
    return d.toISOString().slice(0, 10);
  });
}

function Inicio() {
  const { aluna } = useAluna();
  const modulos = useModulos();
  const tarefas = useTarefas();
  const semanas = useMetricasSemana();
  const diagnosticos = useDiagnosticos();
  const navigate = useNavigate();
  const posts = usePostsDatas();
  const todosPosts = usePosts();
  const respostas = useRespostas();
  const aulas = useAulasDoMes();
  const [conteudo, setConteudo] = useState<CamposConteudo | null>(null);
  const [marcar, setMarcar] = useState<Post | null>(null);
  const [dadosAberto, setDadosAberto] = useState(false);
  const [resultado, setResultado] = useState<Post | null>(null);

  const lista = modulos.data ?? [];
  const geral = porcentagemGeral(lista.filter((m) => m.liberado));
  const atual = moduloAtual(lista);
  const pendencia = pendenciaAnterior(lista);
  const proxima = atual ? tarefasDoModulo(tarefas.data, atual.id).find((t) => !tarefas.data?.feitas.has(t.id)) : undefined;

  const hoje = hojeSaoPaulo();
  const datas = (posts.data ?? []).map((d) => diaSP(d));
  const ofensiva = calcularOfensiva(posts.data ?? [], hoje);
  const proximoMarco = MARCOS_OFENSIVA.find((m) => m > ofensiva.dias);
  const semana = diasDaSemana(hoje);
  const postsSemana = datas.filter((d) => semana.includes(d)).length;

  const mesAtual = hoje.slice(0, 7);
  const fat = (semanas.data ?? []).filter((m) => m.semana.slice(0, 7) === mesAtual).reduce((s, m) => s + (m.faturamento ?? 0), 0);
  const segundaAtual = segundaDe(hoje);
  const diagSemana = (diagnosticos.data ?? []).find((d) => d.semana >= somarDias(segundaAtual, -7));
  const doDia = (todosPosts.data ?? []).filter((p) => p.data_post.slice(0, 10) === hoje);
  const publicadoHoje = doDia.find((p) => p.status === "publicado");
  const planejadoHoje = doDia.find((p) => p.status !== "publicado");
  const pctMeta = Math.min(100, Math.round((fat / META_FATURAMENTO) * 100));
  const carregando = modulos.isLoading || tarefas.isLoading;

  const pendentes = (todosPosts.data ?? []).filter(resultadoPendente).sort((a, b) => a.data_post.localeCompare(b.data_post));
  const proximoPendente = resultado ? pendentes.find((p) => p.id !== resultado.id) : undefined;

  const tarefaReuniao = tarefas.data?.tarefas.find((t) => t.chave_auto === "form_reuniao");
  const reuniao = tarefaReuniao ? (respostas.data?.get(tarefaReuniao.id)?.dados as { dia_semana?: number; hora?: string } | undefined) : undefined;
  const diaHoje = new Date(`${hoje}T12:00:00Z`).getUTCDay();
  const [reuniaoOculta, setReuniaoOculta] = useState(true);
  useEffect(() => setReuniaoOculta(localStorage.getItem("metodo-reuniao-feita") === hoje), [hoje]);
  const mostrarReuniao = reuniao?.dia_semana === diaHoje && !reuniaoOculta;

  const titulo = `${saudacao()}${aluna?.nome ? `, ${primeiroNome(aluna.nome)}` : ""}`;

  return (
    <AppLayout titulo={titulo}>
      <p className="-mt-4 mb-8 text-[15px] text-muted-foreground">{formatarDataExtenso()}</p>

      <CardConteudo aberto={conteudo !== null} inicial={conteudo} onFechar={() => setConteudo(null)} />
      <CardMarcarPublicado post={marcar} onFechar={() => setMarcar(null)} />
      <CardDadosSemana
        aberto={dadosAberto}
        onFechar={() => setDadosAberto(false)}
        onSalvo={(s) => navigate({ to: "/dados-da-loja", search: { semana: s, gerar: "1" } })}
      />
      <CardResultados post={resultado} onFechar={() => setResultado(null)} proximo={proximoPendente} onProximo={setResultado} />

      {mostrarReuniao ? (
        <section className="hero-metodo mb-6">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15">
              <CalendarDays className="size-5" />
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Hoje é dia de analisar dados e organizar sua semana 📊</h2>
              <p className="mt-1 text-sm text-primary-foreground/80">Sua reunião com a empresa é às {reuniao?.hora}.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => setDadosAberto(true)} className="h-10 rounded-full bg-surface px-4 text-sm font-semibold text-primary hover:bg-accent-soft">Registrar dados da semana</button>
                {pendentes.length ? (
                  <button onClick={() => setResultado(pendentes[0]!)} className="h-10 rounded-full bg-surface px-4 text-sm font-semibold text-primary hover:bg-accent-soft">Preencher resultados dos posts</button>
                ) : null}
                <Link to="/plano-pratico" className="inline-flex h-10 items-center rounded-full bg-surface px-4 text-sm font-semibold text-primary hover:bg-accent-soft">Ver minha próxima tarefa</Link>
              </div>
            </div>
          </div>
          <div className="mt-3 text-right">
            <button
              onClick={() => { localStorage.setItem("metodo-reuniao-feita", hoje); setReuniaoOculta(true); }}
              className="text-[13px] text-primary-foreground/80 underline-offset-2 hover:underline"
            >
              Feito por hoje ✓
            </button>
          </div>
        </section>
      ) : null}

      {pendentes.length ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-accent-soft px-5 py-4 text-sm text-foreground">
          <BarChart3 className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
          <span className="min-w-[200px] flex-1">
            Você tem {pendentes.length} {pendentes.length === 1 ? "post esperando" : "posts esperando"} os resultados. É com esses números que você descobre o que funciona.
          </span>
          <button onClick={() => setResultado(pendentes[0]!)} className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Preencher agora</button>
        </div>
      ) : null}

      {pendencia ? (
        <Link
          to="/plano-pratico"
          className="mb-6 flex items-center gap-3 rounded-2xl bg-warning-soft px-5 py-4 text-sm font-medium text-warning"
        >
          <AlertTriangle className="size-5 shrink-0" strokeWidth={1.75} />
          <span className="flex-1">
            Você tem {pendencia.faltam} {pendencia.faltam === 1 ? "tarefa pendente" : "tarefas pendentes"} em{" "}
            {pendencia.modulo.titulo}. Loja que pula etapa trava lá na frente.
          </span>
          <ChevronRight className="size-4" />
        </Link>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Linha 1 */}
        <section className="hero-metodo flex min-h-[260px] flex-col lg:col-span-8">
          {atual ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-12 right-6 -z-10 select-none text-[220px] font-semibold leading-none tracking-[-0.08em] text-primary-foreground/12"
            >
              {String(atual.ordem).padStart(2, "0")}
            </span>
          ) : null}
          <p className="text-[13px] font-medium text-primary-foreground/80">Sua próxima tarefa</p>
          {carregando ? (
            <Skeleton className="mt-3 h-8 w-2/3 bg-primary-foreground/20" />
          ) : (
            <h2 className="mt-3 max-w-[26ch] text-[26px] font-semibold leading-[1.2] tracking-[-0.025em] lg:text-[30px]">
              {proxima ? proxima.titulo : atual ? `Continue em ${atual.titulo}` : "Tudo feito por enquanto! 🎉"}
            </h2>
          )}
          {atual && !carregando ? (
            <p className="mt-3 text-[13px] text-primary-foreground/80">
              Módulo {atual.ordem}: {atual.titulo}, {atual.tarefas_feitas ?? 0} de {atual.total_tarefas ?? 0} tarefas feitas
            </p>
          ) : null}
          <div className="mt-auto pt-8">
            <Link
              {...(proxima?.chave_auto?.startsWith("plano_")
                ? { to: "/plano-de-negocios" as const, search: { etapa: Math.min(proxima.ordem, 9) } }
                : { to: "/plano-pratico" as const })}
              className="transicao-suave inline-flex h-11 items-center gap-2 rounded-xl bg-surface px-5 text-sm font-semibold text-primary hover:bg-accent-soft"
            >
              Abrir plano prático <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section className="card-metodo flex flex-col p-6 lg:col-span-4">
          <p className="titulo-card">Conteúdo de hoje</p>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-[48px] font-semibold leading-none tracking-[-0.05em] text-destaque tabular-nums">{ofensiva.dias}</span>
            <span className="text-sm text-muted-foreground">{ofensiva.dias === 1 ? "dia seguido postando" : "dias seguidos postando"}</span>
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {proximoMarco ? `Faltam ${proximoMarco - ofensiva.dias} para o marco de ${proximoMarco} dias.` : "Você passou de 100 dias!"}
          </p>
          <div className="mt-auto pt-5">
            {publicadoHoje ? (
              <div className="rounded-xl bg-surface p-3 text-sm">
                <p className="font-semibold text-success">Post de hoje publicado ✓</p>
                {publicadoHoje.link ? (
                  <a href={publicadoHoje.link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">
                    ver post <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </div>
            ) : planejadoHoje ? (
              <div className="rounded-xl bg-surface p-3">
                <p className="line-clamp-2 text-sm font-semibold">{planejadoHoje.titulo || "Conteúdo sem título"}</p>
                <div className="mt-1.5"><ChipStatus valor={planejadoHoje.status} pequeno /></div>
                <button onClick={() => setMarcar(planejadoHoje)} className="transicao-suave mt-3 h-10 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
                  Marcar como publicado
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm">Nada no calendário pra hoje.</p>
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    onClick={() => setConteudo({ status: "publicado", data_post: hoje })}
                    className="transicao-suave h-10 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                  >
                    Registrar post de hoje
                  </button>
                  <Link to="/conteudos" className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface text-sm font-medium hover:border-primary hover:text-primary">
                    Abrir calendário
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Linha 2 */}
        <section className="card-metodo p-6 lg:col-span-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="titulo-card">Seu progresso</p>
              <p className="text-[13px] text-muted-foreground">
                {geral.feitas} de {geral.total} tarefas dos módulos liberados
              </p>
            </div>
            <span className="numero-destaque text-[40px] leading-none">{geral.pct}%</span>
          </div>
          <Barra valor={geral.pct} className="mt-5 h-1.5" />
          <div className="mt-8 overflow-x-auto pb-1">
            <ol className="relative flex min-w-[600px] justify-between">
              <span className="absolute left-4 right-4 top-4 h-0.5 bg-border" aria-hidden="true" />
              {lista.map((m) => {
                const feito = moduloConcluido(m);
                const ehAtual = atual?.id === m.id;
                return (
                  <li key={m.id} className="relative flex w-[66px] flex-col items-center text-center" title={m.titulo}>
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full text-xs font-semibold",
                        feito && "bg-primary text-primary-foreground",
                        ehAtual && "border-[3px] border-primary bg-surface text-primary",
                        !feito && !ehAtual && m.liberado && "border-2 border-border bg-surface text-muted-foreground",
                        !m.liberado && "bg-locked text-muted-foreground",
                      )}
                    >
                      {feito ? <Check className="size-4" strokeWidth={3} /> : !m.liberado ? <Lock className="size-3.5" /> : m.ordem}
                    </span>
                    <span className={cn("mt-2 text-[11px] leading-tight", ehAtual ? "font-semibold text-primary" : "text-muted-foreground")}>
                      {m.titulo}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="card-metodo flex flex-col items-center p-6 text-center lg:col-span-4">
          <p className="titulo-card self-start">Meta R$ 10 mil</p>
          <div className="my-4">
            <Anel valor={pctMeta} tamanho={132}>
              <span className="numero-destaque text-2xl">{pctMeta}%</span>
            </Anel>
          </div>
          <p className="numero-destaque text-xl">{formatarMoeda(fat)}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {fat ? "somando as semanas deste mês" : "Registre as semanas em Dados da loja"}
          </p>
        </section>

        <ResumoAcaoSemana d={diagSemana} />

        {/* Linha 3 */}
        <section className="card-metodo p-6 lg:col-span-6">
          <div className="flex items-center justify-between">
            <p className="titulo-card">Esta semana</p>
            <span className="text-[13px] text-muted-foreground">
              {postsSemana} {postsSemana === 1 ? "post" : "posts"}
            </span>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-2">
            {semana.map((d, i) => {
              const teve = datas.includes(d);
              const ehHoje = d === hoje;
              return (
                <div key={d} className="flex flex-col items-center gap-2">
                  <span className={cn("text-xs", ehHoje ? "font-semibold text-primary" : "text-muted-foreground")}>{DIAS[i]}</span>
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full",
                      teve ? "bg-primary text-primary-foreground" : "bg-muted",
                      ehHoje && !teve && "border-2 border-primary",
                    )}
                  >
                    {teve ? <Check className="size-4" strokeWidth={3} /> : null}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-5 rounded-xl bg-muted px-4 py-3 text-sm">{mensagemDaSemana(postsSemana)}</p>
        </section>

        <LivesDoMes aulas={aulas.data ?? []} carregando={aulas.isLoading} />

        {/* Linha 4 */}
        <section className="card-metodo p-4 lg:col-span-12">
          <p className="titulo-card px-2 pb-2 pt-2">Acesso rápido</p>
          <div className="grid gap-1 md:grid-cols-4">
          {[
            { rotulo: "Materiais de apoio", texto: "Aulas, planilhas e modelos", para: "/materiais", icone: FolderOpen },
            { rotulo: "Produtos que eu indico", texto: "Os achados da minha vitrine", para: "/indicacoes", aba: "produto", icone: ShoppingBag },
            { rotulo: "Apps que eu uso", texto: "As ferramentas do meu dia a dia", para: "/indicacoes", aba: "app", icone: Smartphone },
            { rotulo: "Dados da semana", texto: "Registrar os números da loja", acao: () => setDadosAberto(true), icone: BarChart3 },
          ].map((a) => {
            const Icone = a.icone;
            const conteudo = (
              <>
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-primary">
                  <Icone className="size-[18px]" strokeWidth={1.75} />
                </span>
                <span className="flex-1 text-left">
                  <span className="block text-sm font-medium">{a.rotulo}</span>
                  <span className="block text-[13px] text-muted-foreground">{a.texto}</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </>
            );
            if (a.acao) return <button key={a.rotulo} onClick={a.acao} className="item-metodo flex items-center gap-3 px-2 py-3">{conteudo}</button>;
            return (
              <Link key={a.rotulo} to={a.para as "/materiais"} {...(a.aba ? { search: { aba: a.aba } as never } : {})} className="item-metodo flex items-center gap-3 px-2 py-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-primary">
                  <Icone className="size-[18px]" strokeWidth={1.75} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{a.rotulo}</span>
                  <span className="block text-[13px] text-muted-foreground">{a.texto}</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            );
          })}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function partesSP(iso: string) {
  const p: { [k: string]: string } = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  const hora = p["hour"] === "24" ? "00" : p["hour"];
  return { dia: `${p["year"]}-${p["month"]}-${p["day"]}`, rotulo: `${p["day"]}/${p["month"]}, ${Number(hora)}h${p["minute"] !== "00" ? p["minute"] : ""}` };
}

// Datas no formato dos calendários (UTC, sem separadores): 20261028T220000Z
const paraCalendario = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function linkGoogleAgenda(a: Aula) {
  const inicio = new Date(a.data_hora);
  const fim = new Date(inicio.getTime() + 90 * 60 * 1000);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `Live do Método: ${a.titulo}`,
    dates: `${paraCalendario(inicio)}/${paraCalendario(fim)}`,
    details: `${a.descricao ? `${a.descricao}\n\n` : ""}Link da aula: ${a.link}`,
    location: a.link,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

function baixarIcs(a: Aula) {
  const inicio = new Date(a.data_hora);
  const fim = new Date(inicio.getTime() + 90 * 60 * 1000);
  const esc = (t: string) => t.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Metodo Loja Online Lucrativa//PT-BR",
    "BEGIN:VEVENT",
    `UID:live-${a.id}@metodo`,
    `DTSTAMP:${paraCalendario(new Date())}`,
    `DTSTART:${paraCalendario(inicio)}`,
    `DTEND:${paraCalendario(fim)}`,
    `SUMMARY:${esc(`Live do Método: ${a.titulo}`)}`,
    `DESCRIPTION:${esc(`${a.descricao ? `${a.descricao}\n\n` : ""}Link da aula: ${a.link}`)}`,
    `URL:${a.link}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:A live começa em 30 minutos",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `live-metodo-${a.id}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function LivesDoMes({ aulas, carregando }: { aulas: Aula[]; carregando: boolean }) {
  const hoje = hojeSaoPaulo();
  const agora = Date.now();
  const proxima = aulas.find((a) => new Date(a.data_hora).getTime() + 2 * 3600e3 >= agora);
  return (
    <section className="card-metodo p-6 lg:col-span-6">
      <div className="flex items-center gap-2">
        <Video className="size-[18px] text-primary" strokeWidth={1.75} />
        <p className="titulo-card">Lives do mês</p>
      </div>
      {carregando ? (
        <Skeleton className="mt-4 h-16 w-full" />
      ) : aulas.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">As lives do mês aparecem aqui assim que forem marcadas.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {aulas.map((a) => {
            const { dia, rotulo } = partesSP(a.data_hora);
            const passou = new Date(a.data_hora).getTime() + 2 * 3600e3 < agora;
            const ehProxima = proxima?.id === a.id;
            const ehHoje = dia === hoje;
            return (
              <li key={a.id} className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border p-3", passou && "opacity-55")}>
                <span className="numero-destaque w-[78px] shrink-0 text-sm">{rotulo}</span>
                <div className="min-w-0 flex-[1_1_160px]">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                    {a.titulo}
                    {ehHoje && !passou ? <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">Hoje</span> : ehProxima ? <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-primary">Próxima</span> : null}
                  </p>
                  {a.descricao ? <p className="line-clamp-2 text-xs text-muted-foreground">{a.descricao}</p> : null}
                </div>
                <div className="flex w-full flex-wrap items-center gap-2">
                  {!passou ? (
                    <>
                      <a
                        href={linkGoogleAgenda(a)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium hover:border-primary hover:text-primary"
                      >
                        <CalendarPlus className="size-3.5" /> Google Agenda
                      </a>
                      <button
                        type="button"
                        onClick={() => baixarIcs(a)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium hover:border-primary hover:text-primary"
                      >
                        <CalendarPlus className="size-3.5" /> iPhone ou Outlook
                      </button>
                    </>
                  ) : null}
                  <a href={a.link} target="_blank" rel="noreferrer" className="ml-auto shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-hover">
                    Acessar aula
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
