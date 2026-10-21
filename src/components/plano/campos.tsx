// Campos do plano de negócios e o modal "Preciso de ajuda".
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/metodo/client";
import { mascaraMoeda, separarSugestoes } from "@/lib/plano-negocios";
import { sugestaoPlano } from "@/lib/sugestao.functions";
import { cn } from "@/lib/utils";

export const CLASSE_INPUT =
  "transicao-suave w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

export function Rotulo({ children, obrigatorio, extra }: { children: ReactNode; obrigatorio?: boolean | undefined; extra?: ReactNode | undefined }) {
  return (
    <div className="mb-1.5 flex items-start justify-between gap-3">
      <span className="text-sm font-medium text-foreground">
        {children}
        {obrigatorio ? <span className="text-primary"> *</span> : null}
      </span>
      {extra}
    </div>
  );
}

export function Campo({
  rotulo,
  valor,
  onChange,
  placeholder,
  obrigatorio,
  tipo = "text",
}: {
  rotulo: string;
  valor: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  obrigatorio?: boolean | undefined;
  tipo?: string;
}) {
  return (
    <label className="block">
      <Rotulo obrigatorio={obrigatorio}>{rotulo}</Rotulo>
      <input type={tipo} className={CLASSE_INPUT} value={valor ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function CampoMoeda({ rotulo, valor, onChange }: { rotulo: string; valor: string | undefined; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <Rotulo>{rotulo}</Rotulo>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
        <input
          inputMode="numeric"
          className={cn(CLASSE_INPUT, "pl-10 tabular-nums")}
          value={valor ?? ""}
          placeholder="0,00"
          onChange={(e) => onChange(mascaraMoeda(e.target.value))}
        />
      </div>
    </label>
  );
}

export function CampoNumero({ rotulo, valor, onChange }: { rotulo: string; valor: string | undefined; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <Rotulo>{rotulo}</Rotulo>
      <input
        inputMode="numeric"
        className={cn(CLASSE_INPUT, "tabular-nums")}
        value={valor ?? ""}
        placeholder="0"
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      />
    </label>
  );
}

/** Texto longo com o botão "✦ Preciso de ajuda". */
export function CampoTexto({
  rotulo,
  valor,
  onChange,
  exemplo,
  obrigatorio,
  linhas = 3,
  semRotulo,
}: {
  rotulo: string;
  valor: string | undefined;
  onChange: (v: string) => void;
  exemplo?: string | undefined;
  obrigatorio?: boolean | undefined;
  linhas?: number;
  semRotulo?: ReactNode | undefined;
}) {
  const [aberto, setAberto] = useState(false);
  const [brilho, setBrilho] = useState(false);
  const botao = (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="transicao-suave shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold text-primary hover:bg-accent-soft"
          >
            ✦ Preciso de ajuda
          </button>
        </TooltipTrigger>
        <TooltipContent>Preciso de ajuda para responder essa pergunta</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
  return (
    <div>
      {semRotulo ? (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          {semRotulo}
          {botao}
        </div>
      ) : (
        <Rotulo obrigatorio={obrigatorio} extra={botao}>
          {rotulo}
        </Rotulo>
      )}
      <textarea
        rows={linhas}
        className={cn(CLASSE_INPUT, "resize-y leading-relaxed", brilho && "brilho-rosa")}
        value={valor ?? ""}
        placeholder={exemplo}
        onChange={(e) => onChange(e.target.value)}
      />
      <AjudaModal
        aberto={aberto}
        onFechar={() => setAberto(false)}
        pergunta={rotulo}
        exemplo={exemplo}
        onUsar={(t) => {
          onChange(t);
          setAberto(false);
          setBrilho(true);
          setTimeout(() => setBrilho(false), 1200);
        }}
      />
    </div>
  );
}

type Passo = "escrever" | "carregando" | "resultado" | "erro";

export function AjudaModal({
  aberto,
  onFechar,
  pergunta,
  exemplo,
  onUsar,
}: {
  aberto: boolean;
  onFechar: () => void;
  pergunta: string;
  exemplo?: string | undefined;
  onUsar: (texto: string) => void;
}) {
  const gerar = useServerFn(sugestaoPlano);
  const [passo, setPasso] = useState<Passo>("escrever");
  const [texto, setTexto] = useState("");
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [escolhida, setEscolhida] = useState(0);
  const [erro, setErro] = useState("");
  const pedido = useRef(0);

  const executar = async () => {
    const id = ++pedido.current;
    setPasso("carregando");
    try {
      const { data } = await supabase.auth.getSession();
      const r = await gerar({
        data: { token: data.session?.access_token ?? "", acao: "sugerir", pergunta, textoDaAluna: texto },
      });
      if (id !== pedido.current) return;
      const lista = "texto" in r && r.texto ? separarSugestoes(r.texto) : [];
      if (lista.length) {
        setSugestoes(lista);
        setEscolhida(0);
        setPasso("resultado");
      } else {
        setErro("erro" in r && r.erro ? r.erro : "Não conseguimos gerar as respostas agora. Tente novamente.");
        setPasso("erro");
      }
    } catch {
      if (id !== pedido.current) return;
      setErro("Não conseguimos gerar as respostas agora. Tente novamente.");
      setPasso("erro");
    }
  };

  const BOTAO = "transicao-suave inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold";

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        if (!v) {
          pedido.current++;
          setPasso("escrever");
          onFechar();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[24px] sm:max-w-xl">
        <DialogTitle className="text-xl">Assistente de respostas</DialogTitle>
        <DialogDescription className="sr-only">Ajuda da IA para responder a pergunta do plano.</DialogDescription>

        {passo === "escrever" ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted px-4 py-3 text-sm font-medium">{pergunta}</div>
            <p className="text-[13px] text-muted-foreground">
              Explique com suas palavras. Não precisa ser perfeito, pode ser uma ideia solta. Vou transformar no texto ideal
              para o seu plano.
            </p>
            <textarea
              rows={5}
              autoFocus
              className={cn(CLASSE_INPUT, "resize-y")}
              value={texto}
              placeholder={exemplo}
              onChange={(e) => setTexto(e.target.value)}
            />
            <button
              type="button"
              disabled={!texto.trim()}
              onClick={executar}
              className={cn(BOTAO, "w-full bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50")}
            >
              ✦ Gerar respostas
            </button>
          </div>
        ) : passo === "carregando" ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Criando suas respostas personalizadas...</p>
          </div>
        ) : passo === "erro" ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="text-sm">{erro}</p>
            <button type="button" onClick={executar} className={cn(BOTAO, "bg-primary text-primary-foreground hover:bg-primary-hover")}>
              Tentar novamente
            </button>
            <button type="button" onClick={() => setPasso("escrever")} className="text-sm font-medium text-primary hover:underline">
              ← Refinar minha resposta
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-medium">Selecione a resposta que mais combina com você</p>
            <div className="space-y-3">
              {sugestoes.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setEscolhida(i)}
                  className={cn(
                    "transicao-suave w-full rounded-2xl border p-4 text-left text-sm leading-relaxed",
                    escolhida === i ? "border-2 border-primary bg-accent-soft" : "border-border bg-surface hover:border-primary/40",
                  )}
                >
                  <span className="mb-1 block text-xs font-semibold text-primary">Sugestão {i + 1}</span>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => onUsar(sugestoes[escolhida] ?? "")}
                className={cn(BOTAO, "flex-1 bg-primary text-primary-foreground hover:bg-primary-hover")}
              >
                Usar esta resposta
              </button>
              <button type="button" onClick={executar} className={cn(BOTAO, "flex-1 border border-border bg-surface hover:bg-muted")}>
                Gerar novas respostas
              </button>
            </div>
            <button type="button" onClick={() => setPasso("escrever")} className="text-sm font-medium text-primary hover:underline">
              ← Refinar minha resposta
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function BotoesOpcao<T extends string>({
  opcoes,
  valor,
  onChange,
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: string | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onChange(o.valor)}
          className={cn(
            "transicao-suave rounded-xl border px-4 py-2 text-sm font-medium",
            valor === o.valor ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary/40",
          )}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

export function Chips({ opcoes, valor, onChange }: { opcoes: string[]; valor: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => {
        const ativo = valor.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(ativo ? valor.filter((x) => x !== o) : [...valor, o])}
            className={cn(
              "transicao-suave rounded-full border px-3.5 py-1.5 text-xs font-medium",
              ativo ? "border-primary bg-accent-soft text-primary" : "border-border bg-surface text-muted-foreground hover:border-primary/40",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function CartaoItem({ titulo, onRemover, children }: { titulo: string; onRemover?: (() => void) | undefined; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-primary">{titulo}</p>
        {onRemover ? (
          <button type="button" onClick={onRemover} className="text-xs font-medium text-muted-foreground hover:text-destructive">
            Remover
          </button>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function BotaoAdicionar({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="transicao-suave w-full rounded-2xl border-2 border-dashed border-accent py-4 text-sm font-semibold text-primary hover:bg-accent-soft"
    >
      {children}
    </button>
  );
}
