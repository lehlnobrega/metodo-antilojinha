import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { GRUPO_VIP_URL } from "@/config";
import { supabase } from "@/integrations/metodo/client";
import { useAluna, useGuardaAcesso } from "@/lib/aluna";
import { type Pergunta, usePerguntas } from "@/lib/dados";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pesquisa")({
  head: () => ({
    meta: [
      { title: "Pesquisa inicial | Método" },
      { name: "description", content: "Poucas perguntas para eu acompanhar a sua loja de perto." },
      { property: "og:title", content: "Pesquisa inicial | Método" },
      { property: "og:description", content: "Poucas perguntas para eu acompanhar a sua loja de perto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pesquisa,
});

const FOTO = "https://lnobrega.com/wp-content/uploads/2026/05/@maymayjacques-235-2.jpg";
const ABERTURA = [
  "oie!",
  "fico MUITO feliz de ter você no método! você acabou de dar um passo importante pro seu negócio",
  "tenho certeza que o Método Loja Online Lucrativa e o Grupo de Acompanhamento vão fazer muita diferença na sua loja",
  "antes de liberar seu acesso ao grupo de acompanhamento, quero te conhecer melhor. leva só uns minutinhos, vamos lá?",
];
const FINAL = ["perfeito! recebi tudo aqui 🎉"];

type Resposta = string | string[] | number | null;
type Passo =
  | { tipo: "bot"; texto: string; pequeno?: boolean; chave: string }
  | { tipo: "aluna"; texto: string; indice?: number; chave: string };

function mascaraTelefone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function textoResposta(r: Resposta) {
  if (r === null) return "pulei";
  if (Array.isArray(r)) return r.join(", ");
  return String(r);
}

function Pesquisa() {
  const liberado = useGuardaAcesso();
  const { aluna, sessao, recarregar } = useAluna();
  const navigate = useNavigate();
  const perguntas = usePerguntas();
  const lista = perguntas.data ?? [];

  const [comecou, setComecou] = useState(false);
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, Resposta>>({});
  const [fim, setFim] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [visiveis, setVisiveis] = useState(0);
  const [digitando, setDigitando] = useState(false);
  const jaTerminou = useRef(false);
  const fundo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (liberado && aluna?.pesquisa_concluida && !jaTerminou.current) navigate({ to: "/", replace: true });
  }, [liberado, aluna, navigate]);

  const passos = useMemo<Passo[]>(() => {
    const p: Passo[] = ABERTURA.map((t, i) => ({ tipo: "bot", texto: t, chave: `a${i}` }));
    if (!comecou) return p;
    p.push({ tipo: "aluna", texto: "bora!", chave: "bora" });
    lista.forEach((q, i) => {
      if (!fim && i > indice) return;
      p.push({ tipo: "bot", texto: q.texto, chave: `q${q.id}` });
      if (q.dica) p.push({ tipo: "bot", texto: q.dica, pequeno: true, chave: `d${q.id}` });
      if (q.chave in respostas && (i < indice || fim)) {
        p.push({ tipo: "aluna", texto: textoResposta(respostas[q.chave]!), indice: i, chave: `r${q.id}` });
      }
    });
    if (fim && jaTerminou.current) FINAL.forEach((t, i) => p.push({ tipo: "bot", texto: t, chave: `f${i}` }));
    return p;
  }, [comecou, lista, indice, respostas, fim, enviando]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalBot = passos.filter((p) => p.tipo === "bot").length;

  useEffect(() => {
    if (visiveis >= totalBot) {
      setDigitando(false);
      return;
    }
    setDigitando(true);
    const t = setTimeout(() => setVisiveis((v) => v + 1), 600);
    return () => clearTimeout(t);
  }, [visiveis, totalBot]);

  useEffect(() => {
    fundo.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visiveis, digitando, passos.length]);

  const tudoVisivel = visiveis >= totalBot && !digitando;
  const perguntaAtual: Pergunta | undefined = comecou && !fim ? lista[indice] : undefined;

  function proximoIndice(apos: number, r: Record<string, Resposta>) {
    for (let i = apos + 1; i < lista.length; i += 1) if (!(lista[i]!.chave in r)) return i;
    return -1;
  }

  async function responder(valor: Resposta) {
    if (!perguntaAtual) return;
    const novas = { ...respostas, [perguntaAtual.chave]: valor };
    setRespostas(novas);
    const prox = proximoIndice(indice, novas);
    if (prox >= 0) {
      setIndice(prox);
      return;
    }
    setIndice(lista.length);
    setFim(true);
    await enviar(novas);
  }

  async function enviar(r: Record<string, Resposta>) {
    if (!sessao) return;
    setEnviando(true);
    const limpas: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) if (v !== null && v !== "") limpas[k] = v;
    const { error } = await supabase.from("pesquisa_inicial").insert({ aluna_id: sessao.user.id, respostas: limpas });
    setEnviando(false);
    if (error) {
      toast.error("Não consegui salvar suas respostas. Tente de novo.");
      setFim(false);
      setIndice(lista.length - 1);
      return;
    }
    jaTerminou.current = true;
    setFim(true);
    await recarregar();
  }

  function corrigir(i: number) {
    if (enviando || jaTerminou.current) return;
    setFim(false);
    setIndice(i);
  }

  if (!liberado || perguntas.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Logo />
      </div>
    );
  }

  const respondidas = Object.keys(respostas).length;
  const progresso = lista.length ? Math.round((respondidas / lista.length) * 100) : 0;
  let botMostrados = 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-[640px] px-4 pb-3 pt-5">
          <Logo tamanho="sm" />
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-track">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progresso}%` }} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 pb-48 pt-4">
        <div className="space-y-3">
          {passos.map((p) => {
            if (p.tipo === "bot") {
              botMostrados += 1;
              if (botMostrados > visiveis) return null;
              return (
                <div key={p.chave} className="flex items-end gap-2">
                  <img src={FOTO} alt="Letícia" className="size-8 shrink-0 rounded-full object-cover" />
                  <div
                    className={cn(
                      "max-w-[85%] rounded-[20px] rounded-tl-md bg-surface px-4 py-2.5 text-foreground shadow-[0_1px_2px_rgb(42_22_33/0.04)]",
                      p.pequeno ? "text-[13px] text-muted-foreground" : "text-sm",
                    )}
                  >
                    {p.texto}
                  </div>
                </div>
              );
            }
            if (botMostrados > visiveis) return null;
            return (
              <div key={p.chave} className="flex justify-end">
                <button
                  type="button"
                  onClick={() => (p.indice !== undefined ? corrigir(p.indice) : undefined)}
                  title={p.indice !== undefined && !jaTerminou.current ? "clique para corrigir" : undefined}
                  className="max-w-[85%] rounded-[20px] rounded-tr-md bg-primary px-4 py-2.5 text-left text-sm text-primary-foreground"
                >
                  {p.texto}
                </button>
              </div>
            );
          })}
          {digitando ? (
            <div className="flex items-end gap-2">
              <img src={FOTO} alt="" className="size-8 shrink-0 rounded-full object-cover" />
              <div className="flex gap-1 rounded-[20px] rounded-tl-md bg-surface px-4 py-3.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="pontinho size-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          ) : null}
          {enviando ? <p className="text-center text-xs text-muted-foreground">salvando...</p> : null}
          <div ref={fundo} />
        </div>
      </main>

      {tudoVisivel ? (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto w-full max-w-[640px] px-4 py-4">
            {!comecou ? (
              <div className="flex justify-end">
                <BotaoPrimario onClick={() => setComecou(true)}>bora!</BotaoPrimario>
              </div>
            ) : jaTerminou.current ? (
              <div className="flex flex-wrap justify-end gap-2">
                <a
                  href={GRUPO_VIP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center rounded-xl border border-border bg-surface px-5 text-sm font-semibold"
                >
                  entrar no grupo
                </a>
                <BotaoPrimario onClick={() => navigate({ to: "/" })}>ir pro meu painel</BotaoPrimario>
              </div>
            ) : perguntaAtual ? (
              <AreaResposta
                key={perguntaAtual.id}
                pergunta={perguntaAtual}
                inicial={respostas[perguntaAtual.chave]}
                onResponder={responder}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BotaoPrimario({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="transicao-suave inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Pilula({ ativa, children, onClick }: { ativa?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "transicao-suave rounded-full border px-4 py-2 text-sm font-medium",
        ativa ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground hover:border-primary",
      )}
    >
      {children}
    </button>
  );
}

function AreaResposta({
  pergunta,
  inicial,
  onResponder,
}: {
  pergunta: Pergunta;
  inicial: Resposta | undefined;
  onResponder: (v: Resposta) => void;
}) {
  const [texto, setTexto] = useState(typeof inicial === "string" || typeof inicial === "number" ? String(inicial) : "");
  const [marcadas, setMarcadas] = useState<string[]>(Array.isArray(inicial) ? inicial : []);
  const opcoes = pergunta.opcoes ?? [];
  const pular = !pergunta.obrigatoria ? (
    <button type="button" onClick={() => onResponder(null)} className="h-11 px-3 text-sm font-medium text-muted-foreground hover:text-primary">
      pular
    </button>
  ) : null;
  const campo = "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary";

  if (pergunta.tipo === "escolha_unica") {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        {opcoes.map((o) => (
          <Pilula key={o} ativa={inicial === o} onClick={() => onResponder(o)}>
            {o}
          </Pilula>
        ))}
        {pular}
      </div>
    );
  }

  if (pergunta.tipo === "multipla") {
    return (
      <div>
        <div className="flex flex-wrap justify-end gap-2">
          {opcoes.map((o) => (
            <Pilula
              key={o}
              ativa={marcadas.includes(o)}
              onClick={() => setMarcadas((m) => (m.includes(o) ? m.filter((x) => x !== o) : [...m, o]))}
            >
              {o}
            </Pilula>
          ))}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          {pular}
          <BotaoPrimario disabled={marcadas.length === 0} onClick={() => onResponder(marcadas)}>
            avançar
          </BotaoPrimario>
        </div>
      </div>
    );
  }

  if (pergunta.tipo === "escala") {
    return (
      <div className="flex flex-wrap justify-end gap-1.5">
        {Array.from({ length: 11 }, (_, n) => (
          <Pilula key={n} ativa={inicial === n} onClick={() => onResponder(n)}>
            {n}
          </Pilula>
        ))}
        {pular}
      </div>
    );
  }

  const valido =
    pergunta.tipo === "telefone" ? texto.replace(/\D/g, "").length >= 10 : texto.trim().length > 0;
  const enviar = () => {
    if (!valido) return;
    if (pergunta.tipo === "numero") onResponder(Number(texto.replace(",", ".")));
    else onResponder(texto.trim());
  };

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
    >
      {pergunta.tipo === "texto_longo" ? (
        <textarea
          autoFocus
          rows={2}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
          }}
          placeholder="sua resposta..."
          className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
        />
      ) : (
        <input
          autoFocus
          value={texto}
          inputMode={pergunta.tipo === "telefone" ? "tel" : pergunta.tipo === "numero" ? "decimal" : "text"}
          onChange={(e) => setTexto(pergunta.tipo === "telefone" ? mascaraTelefone(e.target.value) : e.target.value)}
          placeholder={pergunta.tipo === "telefone" ? "(11) 99999-9999" : "sua resposta..."}
          className={campo}
        />
      )}
      {pular}
      <BotaoPrimario disabled={!valido} onClick={enviar}>
        avançar
      </BotaoPrimario>
    </form>
  );
}
