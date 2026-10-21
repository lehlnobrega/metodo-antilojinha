// Card com overlay dos dados da semana (2 partes).
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BotaoPrimario, BotaoSecundario, CardOverlay, Rotulo, inputCls } from "@/components/metodo/overlay";
import { type MetricaSemana, useMetricasSemana, useSalvarSemana } from "@/lib/dados-loja";
import { formatarMoeda, rotuloSemana, somarDias, ultimaSemanaCompleta } from "@/lib/formato";
import { cn } from "@/lib/utils";

function mascararMoeda(txt: string) {
  const dig = txt.replace(/\D/g, "");
  if (!dig) return "";
  return (Number(dig) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
const moedaParaNumero = (v: string) => (v ? Number(v.replace(/\./g, "").replace(",", ".")) : null);
const inteiro = (v: string) => (v.trim() === "" ? null : Math.max(0, Math.round(Number(v.replace(/\D/g, "")))));
const deSemana = (m: MetricaSemana | undefined) => ({
  faturamento: m?.faturamento != null ? mascararMoeda(String(Math.round(m.faturamento * 100))) : "",
  pedidos: m?.pedidos != null ? String(m.pedidos) : "",
  sessoes: m?.sessoes != null ? String(m.sessoes) : "",
  seguidores_instagram: m?.seguidores_instagram != null ? String(m.seguidores_instagram) : "",
  seguidores_tiktok: m?.seguidores_tiktok != null ? String(m.seguidores_tiktok) : "",
});

export function SeletorSemana({ valor, onChange, max }: { valor: string; onChange: (v: string) => void; max?: string }) {
  return (
    <div className="flex h-12 items-center justify-between rounded-xl border border-border bg-muted px-2">
      <button type="button" onClick={() => onChange(somarDias(valor, -7))} aria-label="Semana anterior" className="rounded-lg p-2 hover:bg-surface hover:text-primary"><ChevronLeft className="size-4" /></button>
      <span className="text-sm font-semibold">{rotuloSemana(valor)}</span>
      <button type="button" disabled={max ? valor >= max : false} onClick={() => onChange(somarDias(valor, 7))} aria-label="Próxima semana" className="rounded-lg p-2 hover:bg-surface hover:text-primary disabled:opacity-30"><ChevronRight className="size-4" /></button>
    </div>
  );
}

export function CardDadosSemana({
  aberto,
  onFechar,
  semanaInicial,
  onSalvo,
}: {
  aberto: boolean;
  onFechar: () => void;
  semanaInicial?: string | undefined;
  onSalvo?: (semana: string) => void;
}) {
  const metricas = useMetricasSemana();
  const salvar = useSalvarSemana();
  const lista = metricas.data ?? [];
  const [parte, setParte] = useState<1 | 2>(1);
  const [semana, setSemana] = useState(ultimaSemanaCompleta());
  const [f, setF] = useState(deSemana(undefined));
  const [original, setOriginal] = useState("");
  const existente = lista.find((m) => m.semana === semana);

  const carregar = (nova: string) => {
    setSemana(nova);
    const v = deSemana(lista.find((m) => m.semana === nova));
    setF(v);
    setOriginal(JSON.stringify(v));
  };
  useEffect(() => {
    if (aberto) {
      setParte(1);
      carregar(semanaInicial ?? ultimaSemanaCompleta());
    }
  }, [aberto, semanaInicial, metricas.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const fat = moedaParaNumero(f.faturamento);
  const ped = inteiro(f.pedidos);
  const ses = inteiro(f.sessoes);
  const ticket = fat != null && ped ? fat / ped : null;
  const conversao = ped != null && ses ? (ped / ses) * 100 : null;

  const enviar = async () => {
    try {
      await salvar.mutateAsync({
        semana,
        faturamento: fat,
        pedidos: ped,
        sessoes: ses,
        seguidores_instagram: inteiro(f.seguidores_instagram),
        seguidores_tiktok: inteiro(f.seguidores_tiktok),
      });
      toast.success(existente ? "Semana atualizada" : "Semana salva 💖");
      onFechar();
      onSalvo?.(semana);
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
      titulo={parte === 1 ? "Vendas da semana" : "Seguidores"}
      subtitulo={parte === 1 ? "Os números do painel da sua loja, de segunda a domingo." : "Quantos seguidores você tinha no domingo."}
      topo={
        <div className="px-6 pt-5 sm:px-8">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Parte {parte} de 2</span>
            {existente ? <span className="text-primary">Essa semana já tem dados</span> : null}
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
          <Rotulo texto="Semana">
            <SeletorSemana valor={semana} max={ultimaSemanaCompleta()} onChange={carregar} />
          </Rotulo>
          <Rotulo texto="Faturamento da semana">
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
          <Rotulo texto="Seguidores no Instagram no domingo">
            <input inputMode="numeric" value={f.seguidores_instagram} onChange={(e) => set("seguidores_instagram", e.target.value.replace(/\D/g, ""))} placeholder="ex: 1250" className={inputCls} />
          </Rotulo>
          <Rotulo texto="Seguidores no TikTok no domingo">
            <input inputMode="numeric" value={f.seguidores_tiktok} onChange={(e) => set("seguidores_tiktok", e.target.value.replace(/\D/g, ""))} placeholder="ex: 800" className={inputCls} />
          </Rotulo>
        </div>
      )}
    </CardOverlay>
  );
}
