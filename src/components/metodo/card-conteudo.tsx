// Card com overlay do conteúdo (criar e editar, estilo página do Notion) e mini card "Marcar como publicado".
import { Instagram, Link2, Music2, Trash2 } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { BotaoPrimario, BotaoSecundario, CardOverlay, Rotulo, SeletorData, inputCls } from "@/components/metodo/overlay";
import { TIPOS_ACERVO } from "@/lib/acervo";
import { FORMATOS, LIMITE_LEGENDA, STATUS, normalizarLink } from "@/lib/calendario";
import { type CamposConteudo, type Post, useApagarPost, useSalvarConteudo } from "@/lib/dados-loja";
import { hojeSaoPaulo } from "@/lib/formato";
import { cn } from "@/lib/utils";

type Form = {
  titulo: string;
  data_post: string;
  plataforma: string | null;
  formato: string | null;
  tipo_cqc: string | null;
  status: string;
  sobre_video: string;
  roteiro: string;
  legenda: string;
  link: string;
};

function paraForm(p: Partial<Post> | CamposConteudo | null | undefined): Form {
  return {
    titulo: p?.titulo ?? "",
    data_post: (p?.data_post ?? hojeSaoPaulo()).slice(0, 10),
    plataforma: p?.plataforma?.toLowerCase() ?? null,
    formato: p?.formato ?? null,
    tipo_cqc: p?.tipo_cqc ?? null,
    status: p?.status ?? "nao_roteirizado",
    sobre_video: p?.sobre_video ?? "",
    roteiro: p?.roteiro ?? "",
    legenda: p?.legenda ?? "",
    link: p?.link ?? "",
  };
}

function paraBanco(f: Form): CamposConteudo {
  return {
    titulo: f.titulo.trim() || null,
    data_post: f.data_post,
    plataforma: f.plataforma,
    formato: f.formato,
    tipo_cqc: f.tipo_cqc,
    status: f.status,
    sobre_video: f.sobre_video.trim() ? f.sobre_video : null,
    roteiro: f.roteiro.trim() ? f.roteiro : null,
    legenda: f.legenda.trim() ? f.legenda : null,
    link: normalizarLink(f.link) || null,
  };
}

const TOAST_PUBLICADO = "Publicado! 🔥 Em 7 dias você preenche os resultados.";

function TextoCresce({ valor, onChange, placeholder }: { valor: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(72, el.scrollHeight)}px`;
  }, [valor]);
  return (
    <textarea
      ref={ref}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70"
    />
  );
}

function Bloco({ icone, titulo, extra, children }: { icone: string; titulo: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><span aria-hidden>{icone}</span>{titulo}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-center gap-1.5 py-1.5 sm:grid-cols-[140px_1fr] sm:gap-3">
      <span className="text-[13px] text-muted-foreground">{rotulo}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Pilula({ ativo, onClick, children, estilo }: { ativo: boolean; onClick: () => void; children: ReactNode; estilo?: React.CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      style={ativo ? estilo : undefined}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
        ativo ? (estilo ? "border-transparent ring-2 ring-primary/30" : "border-primary bg-primary text-primary-foreground") : "border-border bg-surface hover:border-primary hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

export function CardConteudo({
  aberto,
  onFechar,
  conteudo,
  inicial,
}: {
  aberto: boolean;
  onFechar: () => void;
  conteudo?: Post | null | undefined;
  inicial?: CamposConteudo | null | undefined;
}) {
  const salvar = useSalvarConteudo();
  const apagar = useApagarPost();
  const [f, setF] = useState<Form>(paraForm(null));
  const [id, setId] = useState<number | null>(null);
  const [estado, setEstado] = useState<"" | "salvando" | "salvo" | "erro">("");
  const [aviso, setAviso] = useState("");
  const [copiado, setCopiado] = useState(false);
  const statusSalvo = useRef("nao_roteirizado");
  const fRef = useRef(f);
  fRef.current = f;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alterado = useRef(false);
  const inicialStr = useRef("");

  useEffect(() => {
    if (!aberto) return;
    const base = paraForm(conteudo ?? inicial);
    setF(base);
    inicialStr.current = JSON.stringify(base);
    setId(conteudo?.id ?? null);
    statusSalvo.current = conteudo?.status ?? "nao_roteirizado";
    setEstado("");
    setAviso("");
    alterado.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, conteudo?.id]);

  const gravar = useCallback(async () => {
    if (!id) return;
    timer.current = null;
    const atual = fRef.current;
    const dados = paraBanco(atual);
    if (dados.status === "publicado" && !dados.link) {
      dados.status = statusSalvo.current === "publicado" ? "programado" : statusSalvo.current;
      setAviso("Cole o link do post para salvar como Publicado.");
    } else setAviso("");
    setEstado("salvando");
    try {
      await salvar.mutateAsync({ id, ...dados });
      if (dados.status === "publicado" && statusSalvo.current !== "publicado") toast.success(TOAST_PUBLICADO);
      statusSalvo.current = dados.status ?? statusSalvo.current;
      alterado.current = false;
      setEstado("salvo");
    } catch (e) {
      setEstado("erro");
      toast.error((e as Error).message);
    }
  }, [id, salvar]);

  // Autosave 1 segundo depois da última mudança (só para conteúdo que já existe).
  const mudar = (p: Partial<Form>) => {
    setF((s) => ({ ...s, ...p }));
    if (!id) return;
    alterado.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void gravar(), 1000);
  };

  const fechar = () => {
    if (id && (timer.current || alterado.current)) {
      if (timer.current) clearTimeout(timer.current);
      void gravar();
    }
    onFechar();
  };

  const criar = async () => {
    const dados = paraBanco(f);
    if (!dados.titulo) { toast.error("Dá um título pro conteúdo."); return; }
    if (dados.status === "publicado" && !dados.link) { toast.error("Cole o link do post para marcar como Publicado."); return; }
    try {
      await salvar.mutateAsync(dados);
      toast.success(dados.status === "publicado" ? TOAST_PUBLICADO : "Conteúdo criado no calendário ✨");
      onFechar();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const excluir = () => {
    if (!id || !confirm("Excluir este conteúdo do calendário?")) return;
    if (timer.current) clearTimeout(timer.current);
    apagar.mutate(id, { onSuccess: () => toast.success("Conteúdo excluído"), onError: (e) => toast.error(e.message) });
    onFechar();
  };

  const plats = new Set(f.plataforma === "ambos" ? ["instagram", "tiktok"] : f.plataforma ? [f.plataforma] : []);
  const alternarPlat = (p: string) => {
    const n = new Set(plats);
    if (n.has(p)) n.delete(p); else n.add(p);
    mudar({ plataforma: n.size === 2 ? "ambos" : n.size === 1 ? [...n][0]! : null });
  };
  const mostraLink = f.status === "programado" || f.status === "publicado";
  const tamLegenda = f.legenda.length;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(f.legenda);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não consegui copiar. Seleciona o texto e copia na mão.");
    }
  };

  return (
    <CardOverlay
      aberto={aberto}
      onFechar={fechar}
      largo
      sujo={!id && JSON.stringify(f) !== inicialStr.current}
      titulo={f.titulo || "Conteúdo"}
      cabecalho={
        <div>
          <div className="mb-1 h-4 text-[11px] text-muted-foreground" aria-live="polite">
            {estado === "salvando" ? "Salvando..." : estado === "salvo" ? "Salvo ✓" : estado === "erro" ? "Não salvou, tenta de novo" : ""}
          </div>
          <input
            autoFocus={!id}
            value={f.titulo}
            onChange={(e) => mudar({ titulo: e.target.value })}
            placeholder="Título do conteúdo"
            aria-label="Título do conteúdo"
            className="w-full bg-transparent text-[26px] font-semibold leading-tight outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      }
      rodape={
        <>
          {id ? (
            <button type="button" onClick={excluir} className="mr-auto inline-flex items-center gap-1.5 text-sm font-medium text-destructive hover:underline">
              <Trash2 className="size-4" /> Excluir
            </button>
          ) : null}
          {id ? (
            <BotaoSecundario onClick={fechar}>Fechar</BotaoSecundario>
          ) : (
            <>
              <BotaoSecundario onClick={fechar}>Cancelar</BotaoSecundario>
              <BotaoPrimario type="button" onClick={criar} disabled={salvar.isPending}>{salvar.isPending ? "Criando..." : "Criar conteúdo"}</BotaoPrimario>
            </>
          )}
        </>
      }
    >
      <div className="divide-y-0">
        <Linha rotulo="Data">
          <div className="max-w-[220px]"><SeletorData valor={f.data_post} onChange={(v) => mudar({ data_post: v })} /></div>
        </Linha>
        <Linha rotulo="Plataformas">
          <div className="flex flex-wrap gap-2">
            <Pilula ativo={plats.has("instagram")} onClick={() => alternarPlat("instagram")}><Instagram className="size-3.5" /> Instagram</Pilula>
            <Pilula ativo={plats.has("tiktok")} onClick={() => alternarPlat("tiktok")}><Music2 className="size-3.5" /> TikTok</Pilula>
          </div>
        </Linha>
        <Linha rotulo="Formato">
          <div className="flex flex-wrap gap-2">
            {FORMATOS.map((o) => (
              <Pilula key={o.valor} ativo={f.formato === o.valor} onClick={() => mudar({ formato: f.formato === o.valor ? null : o.valor })}>{o.rotulo}</Pilula>
            ))}
          </div>
        </Linha>
        <Linha rotulo="Tipo de conteúdo">
          <div className="flex flex-wrap gap-2">
            {TIPOS_ACERVO.map((t) => (
              <Pilula key={t.valor} ativo={f.tipo_cqc === t.valor} onClick={() => mudar({ tipo_cqc: f.tipo_cqc === t.valor ? null : t.valor })}>{t.emoji} {t.rotulo}</Pilula>
            ))}
          </div>
        </Linha>
        <Linha rotulo="Status">
          <div className="flex flex-wrap gap-2">
            {STATUS.map((s) => (
              <Pilula key={s.valor} ativo={f.status === s.valor} onClick={() => mudar({ status: s.valor })} estilo={{ background: s.fundo, color: s.texto }}>
                {s.valor === "publicado" ? "✓ " : ""}{s.rotulo}
              </Pilula>
            ))}
          </div>
        </Linha>
        {mostraLink ? (
          <Linha rotulo={f.status === "publicado" ? "Link do post *" : "Link do post"}>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary" />
              <input value={f.link} onChange={(e) => mudar({ link: e.target.value })} placeholder="https://instagram.com/p/..." className={cn(inputCls, "h-10 pl-11")} />
            </div>
            {aviso ? <p className="mt-1 text-xs text-destructive">{aviso}</p> : null}
          </Linha>
        ) : null}
      </div>

      <hr className="my-5 border-border" />

      <div className="space-y-4">
        <Bloco icone="📷" titulo="Sobre o vídeo">
          <p className="mb-2 border-l-2 border-border pl-3 text-[13px] italic text-muted-foreground">
            Como você quer o vídeo? Coloque referências aqui: cenário, estilo, narração, enquadramento, links de vídeos que te inspiraram.
          </p>
          <TextoCresce valor={f.sobre_video} onChange={(v) => mudar({ sobre_video: v })} />
        </Bloco>
        <Bloco icone="✍️" titulo="Roteiro">
          <TextoCresce valor={f.roteiro} onChange={(v) => mudar({ roteiro: v })} placeholder="Gancho dos 3 primeiros segundos, história e chamada pra ação..." />
        </Bloco>
        <Bloco
          icone="🔤"
          titulo="Legenda"
          extra={
            <div className="flex items-center gap-3">
              <span className={cn("text-xs", tamLegenda > LIMITE_LEGENDA ? "font-semibold text-destructive" : "text-muted-foreground")}>
                {tamLegenda.toLocaleString("pt-BR")}/{LIMITE_LEGENDA.toLocaleString("pt-BR")}
              </span>
              <button type="button" onClick={copiar} disabled={!f.legenda} className="text-xs font-medium text-primary hover:underline disabled:opacity-40">
                {copiado ? "Copiado!" : "Copiar legenda"}
              </button>
            </div>
          }
        >
          <TextoCresce valor={f.legenda} onChange={(v) => mudar({ legenda: v })} placeholder="Escreve a legenda do post..." />
        </Bloco>
      </div>
    </CardOverlay>
  );
}

/** Mini card que pede só o link para marcar o conteúdo como publicado. */
export function CardMarcarPublicado({ post, onFechar }: { post: Post | null; onFechar: () => void }) {
  const salvar = useSalvarConteudo();
  const [link, setLink] = useState("");
  useEffect(() => { if (post) setLink(post.link ?? ""); }, [post]);
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    const l = normalizarLink(link);
    if (!l) { toast.error("Cole o link do post."); return; }
    try {
      await salvar.mutateAsync({ id: post.id, status: "publicado", link: l });
      toast.success(TOAST_PUBLICADO);
      onFechar();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  return (
    <CardOverlay
      aberto={Boolean(post)}
      onFechar={onFechar}
      titulo="Marcar como publicado"
      subtitulo={post?.titulo ?? undefined}
      rodape={
        <>
          <BotaoSecundario onClick={onFechar}>Cancelar</BotaoSecundario>
          <BotaoPrimario type="submit" form="form-publicado" disabled={salvar.isPending}>{salvar.isPending ? "Salvando..." : "Marcar como publicado"}</BotaoPrimario>
        </>
      }
    >
      <form id="form-publicado" onSubmit={enviar}>
        <Rotulo texto="Link do post" obrigatorio>
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary" />
            <input autoFocus value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://instagram.com/p/..." className={cn(inputCls, "pl-11")} />
          </div>
        </Rotulo>
      </form>
    </CardOverlay>
  );
}
