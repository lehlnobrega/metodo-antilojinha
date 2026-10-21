// Cards com overlay: registrar post, preencher resultados e dados do mês.
import { Link2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  BotaoPrimario,
  BotaoSecundario,
  CardOverlay,
  CardsOpcao,
  Pilulas,
  Rotulo,
  SeletorData,
  SeletorMes,
  inputCls,
} from "@/components/metodo/overlay";
import { formatarMoeda, formatarNumero, hojeSaoPaulo } from "@/lib/formato";
import {
  PLATAFORMAS,
  TIPOS_CQC,
  type Metrica,
  type Post,
  type Resultados,
  nomePlataforma,
  useMetricas,
  useRegistrarPost,
  useSalvarMetrica,
  useSalvarResultados,
} from "@/lib/dados-loja";
import { cn } from "@/lib/utils";

function IconeInsta() {
  return <span aria-hidden className="text-base leading-none">📸</span>;
}
function IconeTikTok() {
  return <span aria-hidden className="text-base leading-none">🎵</span>;
}
const ICONES: Record<string, React.ReactNode> = { instagram: <IconeInsta />, tiktok: <IconeTikTok />, ambos: <span aria-hidden>✦</span> };

// ---------------- Registrar post ----------------
export function CardRegistrarPost({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const registrar = useRegistrarPost();
  const vazio = { link: "", data: hojeSaoPaulo(), plataforma: "instagram", tipo: "" as string };
  const [f, setF] = useState(vazio);
  useEffect(() => { if (aberto) setF({ ...vazio, data: hojeSaoPaulo() }); }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps
  const sujo = f.link.trim() !== "" || f.tipo !== "";

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    let link = f.link.trim();
    if (!link) {
      toast.error("Cole o link do post.");
      return;
    }
    if (!/^https?:\/\//i.test(link)) link = `https://${link}`;
    try {
      await registrar.mutateAsync({ link, data_post: f.data, plataforma: f.plataforma, tipo_cqc: f.tipo && f.tipo !== "nao_sei" ? f.tipo : null });
      toast.success("Post registrado! 🔥");
      onFechar();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <CardOverlay
      aberto={aberto}
      onFechar={onFechar}
      sujo={sujo}
      titulo="Registrar post"
      subtitulo="Os resultados você preenche 7 dias depois, quando os números já estabilizaram."
      rodape={
        <>
          <BotaoSecundario onClick={onFechar}>Cancelar</BotaoSecundario>
          <BotaoPrimario type="submit" form="form-post" disabled={registrar.isPending}>{registrar.isPending ? "Salvando..." : "Registrar post"}</BotaoPrimario>
        </>
      }
    >
      <form id="form-post" onSubmit={salvar} className="space-y-5">
        <Rotulo texto="Link do post" obrigatorio>
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary" />
            <input autoFocus value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="https://instagram.com/p/..." className={cn(inputCls, "pl-11")} />
          </div>
        </Rotulo>
        <Rotulo texto="Data do post">
          <SeletorData valor={f.data} max={hojeSaoPaulo()} onChange={(v) => setF({ ...f, data: v })} />
        </Rotulo>
        <div className="space-y-1.5">
          <span className="text-[13px] font-medium">Plataforma</span>
          <Pilulas
            valor={f.plataforma}
            onChange={(v) => setF({ ...f, plataforma: v })}
            opcoes={PLATAFORMAS.map((p) => ({ valor: p.valor as string, rotulo: <>{ICONES[p.valor]} {p.rotulo}</> }))}
          />
        </div>
        <div className="space-y-1.5">
          <span className="text-[13px] font-medium">Tipo de conteúdo</span>
          <CardsOpcao valor={f.tipo} onChange={(v) => setF({ ...f, tipo: v })} opcoes={TIPOS_CQC.map((t) => ({ ...t }))} />
          <button
            type="button"
            onClick={() => setF({ ...f, tipo: "nao_sei" })}
            className={cn("mt-1 text-[13px] underline-offset-2 hover:underline", f.tipo === "nao_sei" ? "font-semibold text-primary" : "text-muted-foreground")}
          >
            {f.tipo === "nao_sei" ? "✓ Não sei" : "Não sei"}
          </button>
        </div>
      </form>
    </CardOverlay>
  );
}

// ---------------- Resultados ----------------
const CAMPOS_RESULTADO = [
  ["views", "Views"],
  ["curtidas", "Curtidas"],
  ["comentarios", "Comentários"],
  ["compartilhamentos", "Compartilhamentos"],
  ["salvamentos", "Salvamentos"],
  ["visitas_perfil", "Visitas ao perfil"],
  ["seguidores_ganhos", "Seguidores ganhos"],
] as const;

export function CardResultados({
  post,
  onFechar,
  proximo,
  onProximo,
}: {
  post: Post | null;
  onFechar: () => void;
  proximo?: Post | null | undefined;
  onProximo?: ((p: Post) => void) | undefined;
}) {
  const salvar = useSalvarResultados();
  const [f, setF] = useState<Record<string, string>>({});
  const [salvo, setSalvo] = useState(false);
  useEffect(() => {
    setSalvo(false);
    const base: Record<string, string> = {};
    for (const [k] of CAMPOS_RESULTADO) base[k] = post?.[k] != null ? String(post[k]) : "";
    setF(base);
  }, [post]);
  const original = useMemo(() => {
    const b: Record<string, string> = {};
    for (const [k] of CAMPOS_RESULTADO) b[k] = post?.[k] != null ? String(post[k]) : "";
    return JSON.stringify(b);
  }, [post]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    const r = {} as Resultados;
    for (const [k] of CAMPOS_RESULTADO) r[k] = f[k] === "" || f[k] == null ? null : Math.max(0, Math.round(Number(f[k])));
    try {
      await salvar.mutateAsync({ id: post.id, ...r });
      toast.success("Resultados salvos! 📊");
      if (proximo && onProximo) setSalvo(true);
      else onFechar();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const data = post ? post.data_post.slice(0, 10).split("-").reverse().join("/") : "";
  return (
    <CardOverlay
      aberto={Boolean(post)}
      onFechar={onFechar}
      sujo={!salvo && JSON.stringify(f) !== original}
      titulo={salvo ? "Resultados salvos!" : "Preencher resultados"}
      subtitulo={salvo ? "Você tem outro post esperando os números." : `Pega os números no Insights do post. ${post ? `${nomePlataforma(post.plataforma)}, ${data}.` : ""}`}
      rodape={
        salvo ? (
          <>
            <BotaoSecundario onClick={onFechar}>Fechar</BotaoSecundario>
            <BotaoPrimario type="button" onClick={() => proximo && onProximo?.(proximo)}>Próximo post</BotaoPrimario>
          </>
        ) : (
          <>
            <BotaoSecundario onClick={onFechar}>Cancelar</BotaoSecundario>
            <BotaoPrimario type="submit" form="form-resultados" disabled={salvar.isPending}>{salvar.isPending ? "Salvando..." : "Salvar resultados"}</BotaoPrimario>
          </>
        )
      }
    >
      {salvo ? (
        <p className="text-sm">É com esses números que você descobre o que funciona. Bora pro próximo? 💪</p>
      ) : (
        <form id="form-resultados" onSubmit={enviar} className="space-y-4">
          {post?.link ? (
            <a href={post.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline">
              <Link2 className="size-4" /> Abrir o post
            </a>
          ) : null}
          <p className="text-xs text-muted-foreground">Todos os campos são opcionais.</p>
          <div className="grid grid-cols-2 gap-3">
            {CAMPOS_RESULTADO.map(([k, r]) => (
              <Rotulo key={k} texto={r}>
                <input type="number" min={0} inputMode="numeric" value={f[k] ?? ""} onChange={(e) => setF((s) => ({ ...s, [k]: e.target.value }))} className={inputCls} />
              </Rotulo>
            ))}
          </div>
        </form>
      )}
    </CardOverlay>
  );
}

// ---------------- Dados do mês ----------------
function mesAnterior() {
  const [a, m] = hojeSaoPaulo().split("-").map(Number);
  const d = new Date(Date.UTC(a!, m! - 2, 1));
  return d.toISOString().slice(0, 7);
}
function mascararMoeda(txt: string) {
  const dig = txt.replace(/\D/g, "");
  if (!dig) return "";
  return (Number(dig) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
const moedaParaNumero = (v: string) => (v ? Number(v.replace(/\./g, "").replace(",", ".")) : null);
const inteiro = (v: string) => (v.trim() === "" ? null : Math.max(0, Math.round(Number(v.replace(/\D/g, "")))));
const deMetrica = (m: Metrica | undefined) => ({
  faturamento: m?.faturamento != null ? mascararMoeda(String(Math.round(m.faturamento * 100))) : "",
  pedidos: m?.pedidos != null ? String(m.pedidos) : "",
  sessoes: m?.sessoes != null ? String(m.sessoes) : "",
  seguidores_instagram: m?.seguidores_instagram != null ? String(m.seguidores_instagram) : "",
  seguidores_tiktok: m?.seguidores_tiktok != null ? String(m.seguidores_tiktok) : "",
});

export function CardDadosMes({ aberto, onFechar, mesInicial }: { aberto: boolean; onFechar: () => void; mesInicial?: string | undefined }) {
  const metricas = useMetricas();
  const salvar = useSalvarMetrica();
  const lista = metricas.data ?? [];
  const [parte, setParte] = useState<1 | 2>(1);
  const [mes, setMes] = useState(mesAnterior());
  const [f, setF] = useState(deMetrica(undefined));
  const [original, setOriginal] = useState("");
  const existente = lista.find((m) => m.mes.slice(0, 7) === mes);

  const carregarMes = (novo: string) => {
    setMes(novo);
    const v = deMetrica(lista.find((m) => m.mes.slice(0, 7) === novo));
    setF(v);
    setOriginal(JSON.stringify(v));
  };
  useEffect(() => {
    if (aberto) {
      setParte(1);
      carregarMes(mesInicial ?? mesAnterior());
    }
  }, [aberto, mesInicial, metricas.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const fat = moedaParaNumero(f.faturamento);
  const ped = inteiro(f.pedidos);
  const ses = inteiro(f.sessoes);
  const ticket = fat != null && ped ? fat / ped : null;
  const conversao = ped != null && ses ? (ped / ses) * 100 : null;

  const enviar = async () => {
    try {
      await salvar.mutateAsync({
        mes: `${mes}-01`,
        faturamento: fat,
        pedidos: ped,
        sessoes: ses,
        seguidores_instagram: inteiro(f.seguidores_instagram),
        seguidores_tiktok: inteiro(f.seguidores_tiktok),
      });
      toast.success(existente ? "Dados do mês atualizados" : "Dados do mês salvos 💖");
      onFechar();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <CardOverlay
      aberto={aberto}
      onFechar={onFechar}
      sujo={JSON.stringify(f) !== original}
      titulo={parte === 1 ? "Vendas do mês" : "Seguidores"}
      subtitulo={parte === 1 ? "Os números do painel da sua loja." : "Quantos seguidores você tinha no último dia do mês."}
      topo={
        <div className="px-6 pt-5 sm:px-8">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Parte {parte} de 2</span>
            {existente ? <span className="text-primary">Esse mês já tem dados</span> : null}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-track">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: parte === 1 ? "50%" : "100%" }} />
          </div>
        </div>
      }
      rodape={
        parte === 1 ? (
          <>
            <BotaoSecundario onClick={onFechar}>Cancelar</BotaoSecundario>
            <BotaoPrimario type="button" onClick={() => setParte(2)}>Continuar</BotaoPrimario>
          </>
        ) : (
          <>
            <BotaoSecundario onClick={() => setParte(1)}>Voltar</BotaoSecundario>
            <BotaoPrimario type="button" onClick={enviar} disabled={salvar.isPending}>
              {salvar.isPending ? "Salvando..." : existente ? "Atualizar" : "Salvar"}
            </BotaoPrimario>
          </>
        )
      }
    >
      {parte === 1 ? (
        <div className="space-y-4">
          <Rotulo texto="Mês de referência">
            <SeletorMes valor={mes} max={hojeSaoPaulo().slice(0, 7)} onChange={carregarMes} />
          </Rotulo>
          <Rotulo texto="Faturamento">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <input inputMode="numeric" value={f.faturamento} onChange={(e) => set("faturamento", mascararMoeda(e.target.value))} placeholder="0,00" className={cn(inputCls, "pl-11")} />
            </div>
          </Rotulo>
          <div className="grid grid-cols-2 gap-3">
            <Rotulo texto="Número de pedidos">
              <input inputMode="numeric" value={f.pedidos} onChange={(e) => set("pedidos", e.target.value.replace(/\D/g, ""))} className={inputCls} />
            </Rotulo>
            <Rotulo texto="Sessões no site">
              <input inputMode="numeric" value={f.sessoes} onChange={(e) => set("sessoes", e.target.value.replace(/\D/g, ""))} className={inputCls} />
            </Rotulo>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-accent-soft p-4">
            <div>
              <p className="text-xs text-muted-foreground">Ticket médio</p>
              <p className="numero-destaque text-lg">{ticket != null ? formatarMoeda(ticket) : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taxa de conversão</p>
              <p className="numero-destaque text-lg">{conversao != null ? `${conversao.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%` : "-"}</p>
            </div>
            <p className="col-span-2 text-[11px] text-muted-foreground">Prévia calculada na hora. O sistema calcula o valor final sozinho.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Rotulo texto="Seguidores no Instagram">
            <input inputMode="numeric" value={f.seguidores_instagram} onChange={(e) => set("seguidores_instagram", e.target.value.replace(/\D/g, ""))} placeholder={f.seguidores_instagram ? "" : "ex: 1250"} className={inputCls} />
          </Rotulo>
          <Rotulo texto="Seguidores no TikTok">
            <input inputMode="numeric" value={f.seguidores_tiktok} onChange={(e) => set("seguidores_tiktok", e.target.value.replace(/\D/g, ""))} placeholder="ex: 800" className={inputCls} />
          </Rotulo>
          {f.seguidores_instagram ? <p className="text-xs text-muted-foreground">{formatarNumero(Number(f.seguidores_instagram))} no Instagram</p> : null}
        </div>
      )}
    </CardOverlay>
  );
}
