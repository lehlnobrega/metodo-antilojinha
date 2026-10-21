import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { useAluna } from "@/lib/aluna";
import { gerarDiagnostico } from "@/lib/diagnostico.functions";

export function useGerarDiagnostico() {
  const { sessao } = useAluna();
  const qc = useQueryClient();
  const chamar = useServerFn(gerarDiagnostico);
  const [gerando, setGerando] = useState(false);
  const gerar = async (semana: string) => {
    if (!sessao || gerando) return;
    setGerando(true);
    try {
      const r = await chamar({ data: { token: sessao.access_token, semana } });
      if ("erro" in r && r.erro) toast.error(r.erro);
      else if ("aviso" in r && r.aviso) toast(r.aviso);
      await qc.invalidateQueries({ queryKey: ["diagnosticos"] });
    } catch {
      toast.error("Não consegui analisar agora. Tenta de novo em instantes.");
    } finally {
      setGerando(false);
    }
  };
  return { gerar, gerando };
}
