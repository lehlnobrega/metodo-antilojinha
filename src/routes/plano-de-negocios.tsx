import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AppLayout } from "@/components/layout/AppLayout";
import { COMPONENTES_ETAPAS } from "@/components/plano/etapas";
import { gerarPdf, textosAbertos } from "@/components/plano/pdf";
import { Barra } from "@/components/metodo/visual";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { GRUPO_VIP_URL } from "@/config";
import { supabase } from "@/integrations/metodo/client";
import { useAluna } from "@/lib/aluna";
import { usePlanoNegocios } from "@/lib/dados";
import {
  type DadosPlano,
  ETAPAS,
  etapaCompleta,
  financas,
  notaPublico,
  useSalvarPlano,
} from "@/lib/plano-negocios";
import { sugestaoPlano } from "@/lib/sugestao.functions";
import { cn } from "@/lib/utils";

const busca = z.object({ etapa: z.coerce.number().int().min(1).max(9).optional().catch(undefined) });

export const Route = createFileRoute("/plano-de-negocios")({
  validateSearch: (s) => busca.parse(s),
  head: () => ({
    meta: [
      { title: "Plano de Negócios | Método" },
      { name: "description", content: "Monte o plano de negócios da sua loja em 9 etapas, com ajuda da IA e PDF no final." },
      { property: "og:title", content: "Plano de Negócios | Método" },
      { property: "og:description", content: "Monte o plano de negócios da sua loja em 9 etapas, com ajuda da IA e PDF no final." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanoDeNegocios,
});

const RODAPE = "© Método Loja Online Lucrativa | CNPJ 42.311.629/0001-00 | Leticia Nóbrega MKT LTDA";
const MENSAGENS = [
  "Analisando seu nicho e posicionamento...",
  "Refinando sua proposta de valor...",
  "Organizando análise de concorrência...",
  "Calculando projeções financeiras...",
  "Montando seu plano de marketing...",
  "Finalizando seu documento...",
];
const TERMOS = [
  "O acesso é estritamente pessoal e intransferível.",
  "É proibido compartilhar o link, login ou qualquer forma de acesso desta ferramenta com terceiros.",
  "O material gerado é de uso exclusivo do aluno matriculado no curso Método Loja Online Lucrativa.",
  "O descumprimento destes termos pode resultar no cancelamento do acesso sem direito a reembolso.",
];

type Modo = "etapas" | "gerando" | "pronto";

function PlanoDeNegocios() {
  const { etapa: etapaBusca } = Route.useSearch();
  const navigate = useNavigate({ from: "/plano-de-negocios" });
  const { aluna } = useAluna();
  const plano = usePlanoNegocios();
  const salvar = useSalvarPlano();
  const aprimorar = useServerFn(sugestaoPlano);

  const [d, setD] = useState<DadosPlano | null>(null);
  const [concluidas, setConcluidas] = useState<string[]>([]);
  const [estadoSalvo, setEstadoSalvo] = useState<"" | "salvando" | "salvo">("");
  const [termosAbertos, setTermosAbertos] = useState(false);
  const [aceite, setAceite] = useState(false);
  const [faltando, setFaltando] = useState<string[] | null>(null);
  const [modo, setModo] = useState<Modo>("etapas");
  const [msg, setMsg] = useState(0);
  const [aprimorados, setAprimorados] = useState<Record<string, string> | null>(null);
  const [baixando, setBaixando] = useState(false);
  const [baixado, setBaixado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refD = useRef<DadosPlano | null>(null);
  const refConc = useRef<string[]>([]);

  // Carrega uma vez do banco e completa nome e e-mail.
  useEffect(() => {
    if (d || plano.isLoading || !aluna) return;
    const base = (plano.data?.dados ?? {}) as DadosPlano;
    const inicial: DadosPlano = {
      ...base,
      fullName: base.fullName || aluna.nome || "",
      email: base.email || aluna.email || "",
      date: base.date || new Date().toISOString().slice(0, 10),
    };
    const conc = Array.isArray(plano.data?.etapas_concluidas) ? (plano.data!.etapas_concluidas as string[]) : [];
    refD.current = inicial;
    refConc.current = conc;
    setD(inicial);
    setConcluidas(conc);
    // Plano já finalizado: abre direto no plano completo.
    if (plano.data?.concluido_em && !etapaBusca) {
      setAprimorados(plano.data.textos_aprimorados ?? null);
      setModo("pronto");
    }
  }, [d, plano.isLoading, plano.data, aluna]);

  const indiceAtual = (() => {
    if (etapaBusca) return etapaBusca - 1;
    const i = ETAPAS.findIndex((e) => !concluidas.includes(e.chave));
    return i === -1 ? 0 : i;
  })();
  const etapa = ETAPAS[indiceAtual]!;

  const gravar = useCallback(
    async (extra?: { etapas_concluidas?: string[] }) => {
      if (!refD.current) return;
      setEstadoSalvo("salvando");
      try {
        await salvar.mutateAsync({ dados: refD.current, ...extra });
        setEstadoSalvo("salvo");
      } catch {
        setEstadoSalvo("");
        toast.error("Não consegui salvar agora. Confira sua internet.");
      }
    },
    [salvar],
  );

  const set = useCallback(
    (patch: Partial<DadosPlano>) => {
      const novo = { ...refD.current, ...patch };
      refD.current = novo;
      setD(novo);
      setEstadoSalvo("salvando");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        // Se apagou um campo mínimo, a etapa deixa de contar como concluída.
        const conc = refConc.current.filter((k) => etapaCompleta(k as never, novo));
        if (conc.length !== refConc.current.length) {
          refConc.current = conc;
          setConcluidas(conc);
          void gravar({ etapas_concluidas: conc });
        } else void gravar();
      }, 1000);
    },
    [gravar],
  );

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const irPara = (i: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate({ search: { etapa: i + 1 } });
  };

  const concluirAtual = async (dados: DadosPlano) => {
    if (timer.current) clearTimeout(timer.current);
    refD.current = dados;
    let conc = refConc.current;
    if (etapaCompleta(etapa.chave, dados) && !conc.includes(etapa.chave)) {
      conc = [...conc, etapa.chave];
      toast.success("Etapa concluída! ✓");
    }
    refConc.current = conc;
    setConcluidas(conc);
    await gravar({ etapas_concluidas: conc });
  };

  const continuar = async () => {
    if (!d) return;
    if (indiceAtual === 0 && !d.termsAccepted) {
      setTermosAbertos(true);
      return;
    }
    await concluirAtual(d);
    if (indiceAtual < 8) irPara(indiceAtual + 1);
    else {
      const falta = ETAPAS.filter((e) => !etapaCompleta(e.chave, refD.current!)).map((e) => e.titulo);
      if (falta.length) setFaltando(falta);
      else void finalizar();
    }
  };

  const aceitarTermos = async () => {
    const novo = { ...refD.current, termsAccepted: true };
    setD(novo);
    setTermosAbertos(false);
    await concluirAtual(novo);
    irPara(1);
  };

  const finalizar = async () => {
    setFaltando(null);
    setModo("gerando");
    setMsg(0);
    window.scrollTo({ top: 0 });
    const inicio = Date.now();
    let resultado: Record<string, string> | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      const r = await Promise.race([
        aprimorar({ data: { token: data.session?.access_token ?? "", acao: "aprimorar", textos: textosAbertos(refD.current!) } }),
        new Promise<null>((ok) => setTimeout(() => ok(null), 15000)),
      ]);
      if (r && "enhanced" in r) resultado = r.enhanced ?? null;
    } catch {
      resultado = null;
    }
    const espera = Math.max(0, 4000 - (Date.now() - inicio));
    setTimeout(() => {
      setAprimorados(resultado);
      setModo("pronto");
      window.scrollTo({ top: 0 });
      void salvar.mutateAsync({ concluido_em: new Date().toISOString(), textos_aprimorados: resultado }).catch(() => {});
    }, espera);
  };

  useEffect(() => {
    if (modo !== "gerando") return;
    const id = setInterval(() => setMsg((m) => Math.min(m + 1, MENSAGENS.length - 1)), 2000);
    return () => clearInterval(id);
  }, [modo]);

  const baixar = async () => {
    if (!d) return;
    setBaixando(true);
    try {
      await gerarPdf(d, aprimorados);
      await salvar.mutateAsync({ pdf_exportado_em: new Date().toISOString() });
      setBaixado(true);
    } catch {
      toast.error("Não consegui gerar o PDF. Tente de novo.");
    } finally {
      setBaixando(false);
    }
  };

  const refazer = async () => {
    setModo("etapas");
    setBaixado(false);
    irPara(0);
    window.scrollTo({ top: 0 });
    try {
      await salvar.mutateAsync({ concluido_em: null });
    } catch {
      /* segue mesmo assim; o plano continua salvo */
    }
    toast.success("Tudo que você escreveu continua aqui. É só ajustar e finalizar de novo.");
  };

  const Componente = COMPONENTES_ETAPAS[indiceAtual]!;
  const pctGeral = Math.round((concluidas.length / 9) * 100);

  return (
    <AppLayout
      titulo="Plano de negócios"
      acaoTopo={
        <span className="text-xs text-muted-foreground">
          {estadoSalvo === "salvando" ? "Salvando..." : estadoSalvo === "salvo" ? "Salvo ✓" : ""}
        </span>
      }
    >
      <div className="mx-auto -mt-3 mb-6 flex max-w-[760px] items-center justify-between gap-3">
        <Link to="/ferramentas" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Voltar às ferramentas
        </Link>
        <span className="text-xs text-muted-foreground sm:hidden">
          {estadoSalvo === "salvando" ? "Salvando..." : estadoSalvo === "salvo" ? "Salvo ✓" : ""}
        </span>
      </div>

      {!d ? (
        <Skeleton className="mx-auto h-[480px] w-full max-w-[760px] rounded-[24px]" />
      ) : modo === "gerando" ? (
        <div className="card-metodo mx-auto flex max-w-[760px] flex-col items-center px-6 py-20 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="mt-6 text-lg font-semibold">Gerando seu Plano de Negócios</p>
          <p key={msg} className="mt-2 animate-in fade-in text-sm text-muted-foreground">
            {MENSAGENS[msg]}
          </p>
          <Barra valor={((msg + 1) / MENSAGENS.length) * 100} className="mt-8 max-w-sm" />
        </div>
      ) : modo === "pronto" ? (
        <Pronto d={d} aprimorados={aprimorados} baixando={baixando} baixado={baixado} onBaixar={baixar} onRefazer={refazer} />
      ) : (
        <>
          {/* Progresso: só uma barra fina, como no plano original */}
          <div className="mx-auto mb-5 max-w-[760px]">
            <div className="mb-2 flex items-center justify-between text-[13px] text-muted-foreground">
              <span>Etapa {indiceAtual + 1} de 9</span>
              <label className="flex items-center gap-2">
                <span className="hidden sm:inline">Ir para</span>
                <select
                  value={indiceAtual}
                  onChange={(e) => irPara(Number(e.target.value))}
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-[13px] text-foreground"
                >
                  {ETAPAS.map((e, i) => (
                    <option key={e.chave} value={i}>
                      {i + 1}. {e.titulo}
                      {concluidas.includes(e.chave) ? " ✓" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Barra valor={((indiceAtual + 1) / 9) * 100} className="h-1" />
          </div>

          <div className="card-metodo mx-auto max-w-[760px] p-6 sm:p-8">
            <h3 className="text-[26px] font-semibold leading-tight">{etapa.titulo}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{etapa.subtitulo}</p>
            <hr className="my-6 border-border" />
            <Componente d={d} set={set} />
          </div>

          <div className="sticky bottom-[64px] z-10 mx-auto mt-4 flex max-w-[760px] items-center justify-between gap-3 rounded-2xl border border-border bg-surface/95 p-3 backdrop-blur lg:bottom-4">
            <button
              type="button"
              disabled={indiceAtual === 0}
              onClick={() => irPara(indiceAtual - 1)}
              className="transicao-suave h-11 rounded-xl border border-border bg-surface px-5 text-sm font-semibold hover:bg-muted disabled:opacity-40"
            >
              Voltar
            </button>
            <span className="hidden text-xs text-muted-foreground sm:block">{pctGeral}% do plano concluído</span>
            <button
              type="button"
              onClick={continuar}
              className="transicao-suave h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              {indiceAtual === 8 ? "Finalizar" : "Continuar"}
            </button>
          </div>
        </>
      )}

      <p className="mt-10 text-center text-[11px] text-muted-foreground">{RODAPE}</p>

      {/* Termos de uso */}
      <Dialog open={termosAbertos} onOpenChange={setTermosAbertos}>
        <DialogContent className="rounded-[24px] sm:max-w-lg">
          <DialogTitle className="text-xl">Termos de Uso</DialogTitle>
          <DialogDescription>Leia com atenção antes de continuar.</DialogDescription>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {TERMOS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <p className="text-[11px] text-muted-foreground">Método Loja Online Lucrativa | CNPJ 42.311.629/0001-00 | Leticia Nóbrega MKT LTDA</p>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
            Li e concordo com os Termos de Uso
          </label>
          <button
            type="button"
            disabled={!aceite}
            onClick={aceitarTermos}
            className="transicao-suave h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            Concordar e continuar
          </button>
        </DialogContent>
      </Dialog>

      {/* Etapas faltando antes de finalizar */}
      <Dialog open={faltando !== null} onOpenChange={(v) => !v && setFaltando(null)}>
        <DialogContent className="rounded-[24px] sm:max-w-md">
          <DialogTitle className="text-xl">Ainda faltam algumas etapas</DialogTitle>
          <DialogDescription>Seu plano fica mais completo com elas, mas você pode gerar mesmo assim.</DialogDescription>
          <ul className="space-y-1.5 text-sm">
            {faltando?.map((t) => (
              <li key={t} className="rounded-lg bg-warning-soft px-3 py-2 font-medium text-warning">
                {t}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                const i = ETAPAS.findIndex((e) => e.titulo === faltando?.[0]);
                setFaltando(null);
                if (i >= 0) irPara(i);
              }}
              className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Completar agora
            </button>
            <button type="button" onClick={finalizar} className="h-11 flex-1 rounded-xl border border-border bg-surface text-sm font-semibold hover:bg-muted">
              Gerar mesmo assim
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

const STATUS_NICHO: Record<string, string> = { growing: "Crescendo", stable: "Estável", declining: "Em declínio" };
const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Pronto({
  d,
  aprimorados,
  baixando,
  baixado,
  onBaixar,
  onRefazer,
}: {
  d: DadosPlano;
  aprimorados: Record<string, string> | null;
  baixando: boolean;
  baixado: boolean;
  onBaixar: () => void;
  onRefazer: () => void;
}) {
  const f = financas(d);
  const t = (k: string, v?: string) => (aprimorados?.[k] ?? v ?? "").trim();
  const melhor = [...(d.audiences ?? [])].filter((a) => a.name).sort((a, b) => notaPublico(b) - notaPublico(a))[0];
  const cards = [
    { r: "Margem bruta", v: f.preco > 0 ? `${f.margem.toFixed(1).replace(".", ",")}%` : "-" },
    { r: "Ponto de equilíbrio", v: f.equilibrio !== null ? `${f.equilibrio} un/mês` : "-" },
    { r: "Melhor público", v: melhor ? `${melhor.name} (${notaPublico(melhor).toFixed(1).replace(".", ",")})` : "-" },
  ];
  const proposta = d.valueField1 ? `Minha loja existe para ajudar ${d.valueField1} a ${d.valueField2 || "..."} sem ${d.valueField3 || "..."}.` : "";

  const Linha = ({ r, v }: { r: string; v?: string | null | undefined }) =>
    v && v.trim() ? (
      <div>
        <dt className="text-[12.5px] text-muted-foreground">{r}</dt>
        <dd className="mt-0.5 whitespace-pre-line text-[14.5px] leading-relaxed">{v}</dd>
      </div>
    ) : null;
  const Secao = ({ n, titulo, mostrar = true, children }: { n: number; titulo: string; mostrar?: boolean; children: React.ReactNode }) =>
    !mostrar ? null : (
    <section className="grid gap-1 border-b border-border py-6 last:border-b-0 sm:grid-cols-[48px_minmax(0,1fr)] sm:gap-3">
      <p className="text-[22px] font-semibold tracking-[-0.05em] text-numero-leve">{String(n).padStart(2, "0")}</p>
      <div className="min-w-0">
        <h3 className="text-[19px] font-semibold tracking-[-0.02em]">{titulo}</h3>
        <dl className="mt-3 grid gap-3">{children}</dl>
      </div>
    </section>
  );

  return (
    <div className="mx-auto max-w-[760px]">
      <section className="hero-metodo">
        <p className="text-[13px] font-medium text-primary-foreground/80">Seu plano de negócios</p>
        <h2 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.03em]">{d.storeName || "Sua loja"}</h2>
        <p className="mt-2 text-[13px] text-primary-foreground/80">Feito com as suas respostas, nas 9 etapas do método.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={baixando}
            onClick={onBaixar}
            className="transicao-suave inline-flex h-11 items-center gap-2 rounded-xl bg-surface px-5 text-sm font-semibold text-primary hover:bg-accent-soft disabled:opacity-70"
          >
            {baixando ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {baixando ? "Gerando PDF..." : "Baixar em PDF"}
          </button>
          {baixado ? (
            <a
              href={GRUPO_VIP_URL}
              target="_blank"
              rel="noreferrer"
              className="transicao-suave inline-flex h-11 items-center rounded-xl border border-primary-foreground/40 px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10"
            >
              Postar no grupo
            </a>
          ) : null}
        </div>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.r} className="card-metodo p-5">
            <p className="text-xs text-muted-foreground">{c.r}</p>
            <p className="mt-1 break-words text-lg font-semibold tracking-[-0.02em]">{c.v}</p>
          </div>
        ))}
      </div>

      <article className="card-metodo mt-4 px-5 py-2 sm:px-8">
        <Secao n={1} titulo="Nicho e posicionamento">
          <Linha r="Nicho" v={d.niche} />
          <Linha r="Por que esse nicho" v={t("nicheWhy", d.nicheWhy)} />
          <Linha r="Produto principal" v={t("mainProduct", d.mainProduct)} />
          <Linha r="Como quer ser percebida" v={d.marketPerception} />
          <Linha r="Diferencial" v={t("competitiveDifferential", d.competitiveDifferential)} />
          <Linha r="Momento do nicho" v={[STATUS_NICHO[d.nicheStatus ?? ""] ?? "", t("nicheStatusWhy", d.nicheStatusWhy)].filter(Boolean).join(". ")} />
        </Secao>
        <Secao n={2} titulo="Público-alvo" mostrar={(d.audiences ?? []).some((a) => a.name)}>
          {(d.audiences ?? []).filter((a) => a.name).map((a) => (
            <Linha
              key={a.id}
              r={`${a.name}, nota ${notaPublico(a).toFixed(1).replace(".", ",")}`}
              v={[[a.ageRange, a.gender, a.location, a.purchasingPower && `poder aquisitivo ${a.purchasingPower.toLowerCase()}`].filter(Boolean).join(", "), t(`aud.${a.id}.onlineConsumption`, a.onlineConsumption)].filter(Boolean).join("\n")}
            />
          ))}
        </Secao>
        <Secao n={3} titulo="Personas" mostrar={(d.personas ?? []).some((p) => p.name)}>
          {(d.personas ?? []).filter((p) => p.name).map((p) => (
            <Linha
              key={p.id}
              r={[p.name, p.age && `${p.age} anos`, p.profession].filter(Boolean).join(", ")}
              v={[
                t(`per.${p.id}.painOrDesire`, p.painOrDesire) && `Dor ou desejo: ${t(`per.${p.id}.painOrDesire`, p.painOrDesire)}`,
                t(`per.${p.id}.researchBefore`, p.researchBefore) && `O que pesquisa: ${t(`per.${p.id}.researchBefore`, p.researchBefore)}`,
                p.onlinePresence && `Onde está online: ${p.onlinePresence}`,
                p.buyingBarriers && `O que impede de comprar: ${p.buyingBarriers}`,
                p.quote && `Ela diria: "${p.quote}"`,
              ].filter(Boolean).join("\n")}
            />
          ))}
        </Secao>
        <Secao n={4} titulo="Proposta de valor" mostrar={Boolean(proposta || d.benefit1 || d.beforeTransformation || d.afterTransformation || d.whyBuyFromYou)}>
          <Linha r="Frase" v={proposta} />
          <Linha r="Benefícios" v={[d.benefit1, d.benefit2, d.benefit3].filter(Boolean).join("\n")} />
          <Linha r="Antes de me encontrar" v={t("beforeTransformation", d.beforeTransformation)} />
          <Linha r="Depois de comprar comigo" v={t("afterTransformation", d.afterTransformation)} />
          <Linha r="Por que comprar de mim" v={t("whyBuyFromYou", d.whyBuyFromYou)} />
        </Secao>
        <Secao n={5} titulo="Concorrência" mostrar={(d.competitors ?? []).some((c) => c.name) || Boolean(d.marketPositioning)}>
          {(d.competitors ?? []).filter((c) => c.name).map((c) => (
            <Linha
              key={c.id}
              r={[c.name, c.averagePrice && `preço médio ${reais(Number(String(c.averagePrice).replace(",", ".")) || 0)}`].filter(Boolean).join(", ")}
              v={[
                t(`con.${c.id}.strengths`, c.strengths) && `Faz bem: ${t(`con.${c.id}.strengths`, c.strengths)}`,
                t(`con.${c.id}.weaknesses`, c.weaknesses) && `Fraqueza: ${t(`con.${c.id}.weaknesses`, c.weaknesses)}`,
                (c.channels ?? []).length ? `Forte em: ${c.channels.join(", ")}` : "",
                t(`con.${c.id}.whatBetter`, c.whatBetter) && `Onde eu faço melhor: ${t(`con.${c.id}.whatBetter`, c.whatBetter)}`,
              ].filter(Boolean).join("\n")}
            />
          ))}
          <Linha r="Meu posicionamento" v={t("marketPositioning", d.marketPositioning)} />
        </Secao>
        <Secao n={6} titulo="Finanças">
          {f.preco > 0 ? (
            <>
              <Linha r="Produto" v={`Custo ${reais(f.custo)}, venda ${reais(f.preco)}, margem de ${f.margem.toFixed(1).replace(".", ",")}%`} />
              <Linha r="Custos fixos" v={`${reais(f.fixos)} por mês`} />
              <Linha r="Investimento inicial" v={reais(f.invest)} />
              <Linha r="Receita por cenário" v={`Pessimista ${reais(f.receita.pessimista)}, realista ${reais(f.receita.realista)}, otimista ${reais(f.receita.otimista)}`} />
            </>
          ) : (
            <Linha r="Finanças" v="Ainda não preenchida." />
          )}
        </Secao>
        <Secao n={7} titulo="Análise SWOT" mostrar={Boolean(d.strengths || d.weaknesses || d.opportunities || d.threats)}>
          <Linha r="Forças" v={t("strengths", d.strengths)} />
          <Linha r="Fraquezas" v={t("weaknesses", d.weaknesses)} />
          <Linha r="Oportunidades" v={t("opportunities", d.opportunities)} />
          <Linha r="Ameaças" v={t("threats", d.threats)} />
        </Secao>
        <Secao n={8} titulo="Plano de marketing">
          <Linha r="Canais" v={(d.marketingChannels ?? []).join(", ")} />
          {Object.entries(d.channelStrategies ?? {}).map(([canal, v]) => (
            <Linha key={canal} r={`Como vou usar: ${canal}`} v={t(`can.${canal}`, v)} />
          ))}
          <Linha r="Conteúdo" v={t("contentType", d.contentType)} />
          <Linha r="Frequência" v={d.contentFrequency} />
          <Linha r="Quem produz" v={d.contentProducer} />
          <Linha r="Processo de venda" v={t("salesProcess", d.salesProcess)} />
          <Linha r="Oferta de entrada" v={t("entryOffer", d.entryOffer)} />
          <Linha r="Recompra" v={t("retentionStrategy", d.retentionStrategy)} />
          <Linha r="Indicação e pós-venda" v={t("loyaltyProgram", d.loyaltyProgram)} />
          <Linha r="Meta de audiência" v={d.followerGoal} />
          <Linha
            r="Metas de vendas"
            v={d.salesMonth1 || d.salesMonth2 || d.salesMonth3 ? `Mês 1: ${d.salesMonth1 || "-"}, mês 2: ${d.salesMonth2 || "-"}, mês 3: ${d.salesMonth3 || "-"}` : ""}
          />
        </Secao>
      </article>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-border pt-6">
        <p className="text-[13px] text-muted-foreground">Quer mudar alguma coisa? Você volta pras etapas com tudo que já escreveu.</p>
        <button
          type="button"
          onClick={onRefazer}
          className="transicao-suave h-11 rounded-xl border border-border bg-surface px-5 text-sm font-semibold hover:border-primary hover:text-primary"
        >
          Refazer plano de negócios
        </button>
      </div>
    </div>
  );
}
