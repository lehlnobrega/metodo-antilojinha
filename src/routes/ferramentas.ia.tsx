import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { PaginaTopo } from "@/components/PaginaTopo";
import { useAluna } from "@/lib/aluna";
import { conversarIA } from "@/lib/ferramentas.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ferramentas/ia")({
  head: () => ({
    meta: [
      { title: "IA do Método | Método" },
      { name: "description", content: "Uma assistente que já conhece a sua loja e responde pensando nela." },
      { property: "og:title", content: "IA do Método | Método" },
      { property: "og:description", content: "Uma assistente que já conhece a sua loja e responde pensando nela." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FerramentaIA,
});

type Msg = { role: "user" | "assistant"; content: string };
const SUGESTOES = [
  "Me dá 5 ideias de post para essa semana",
  "Como aumentar a minha taxa de conversão?",
  "Escreve uma legenda para um produto novo",
  "O que devo priorizar na minha loja agora?",
];

function FerramentaIA() {
  const { sessao } = useAluna();
  const conversar = useServerFn(conversarIA);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => fim.current?.scrollIntoView({ behavior: "smooth" }), [msgs, carregando]);

  const enviar = async (t: string) => {
    const conteudo = t.trim();
    if (!conteudo || carregando || !sessao) return;
    const novas: Msg[] = [...msgs, { role: "user", content: conteudo }];
    setMsgs(novas);
    setTexto("");
    setCarregando(true);
    try {
      const r = await conversar({ data: { token: sessao.access_token, mensagens: novas } });
      setMsgs([...novas, { role: "assistant", content: "texto" in r && r.texto ? r.texto : (r as { erro?: string }).erro ?? "Tente de novo." }]);
    } catch {
      setMsgs([...novas, { role: "assistant", content: "Não consegui responder agora. Tente de novo." }]);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <AppLayout>
      <PaginaTopo titulo="IA do Método" subtitulo="Uma assistente que já conhece o seu plano e os seus números." />
      <div className="card-metodo flex min-h-[60vh] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {msgs.length === 0 ? (
            <div className="py-8 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-primary">
                <Sparkles className="size-6" />
              </span>
              <p className="mt-3 font-semibold">Sobre o que vamos conversar?</p>
              <div className="mx-auto mt-4 grid max-w-xl gap-2 sm:grid-cols-2">
                {SUGESTOES.map((s) => (
                  <button key={s} onClick={() => enviar(s)} className="rounded-xl border border-border px-4 py-3 text-left text-sm hover:border-primary">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {msgs.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent-soft text-foreground",
                )}
              >
                {m.content.replace(/\*\*/g, "")}
              </div>
            </div>
          ))}
          {carregando ? <p className="text-sm text-muted-foreground">Digitando...</p> : null}
          <div ref={fim} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); enviar(texto); }} className="flex gap-2 border-t border-border p-3">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva a sua pergunta"
            maxLength={2000}
            className="h-11 flex-1 rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary"
          />
          <button disabled={carregando || !texto.trim()} aria-label="Enviar" className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50">
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
