// Diagnóstico semanal com IA: reúne os dados da aluna, pede a análise e grava em diagnosticos.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { calcularOfensiva } from "./ofensiva";
import { chamarIA, validarAluna } from "./ia.server";

const SISTEMA = `Você é a mentora do Método, o curso da Letícia Nóbrega para donas de loja online. Toda semana você analisa os números da aluna e diz, com carinho e franqueza, o que está funcionando, onde ela provavelmente está errando e o que fazer nesta semana. Fale em português do Brasil, direto, prático, sem travessão e sem jargão. Baseie cada ponto nos dados enviados e cite o número que te levou à conclusão. Nunca invente dados. Se houver poucos dados (menos de 2 semanas registradas ou menos de 3 posts com resultados), diga isso com clareza, marque confianca como baixa e foque em constância e em registrar os números. Relacione os problemas com o método: pouca visita no site pede mais conteúdo; muita visita e pouca venda pede revisar o site; ticket baixo pede kits e precificação; muito conteúdo de oferta e pouco de desejo e conexão cansa o público; muita ideia planejada e pouca publicada pede organização. Indique o módulo que ensina cada ajuste (use o slug de um dos módulos enviados). A ação da semana deve ser UMA só, concreta e possível de fazer em 7 dias. No máximo 3 itens em ajustar, do mais importante para o menos. Responda SOMENTE em JSON no formato:
{ "resumo": "2 frases", "semana_em_numeros": "1 frase comparando com a semana anterior", "confianca": "baixa" | "media" | "alta", "funcionando": ["até 3 itens"], "ajustar": [{ "ponto": "", "por_que": "", "como_ajustar": "", "modulo": "slug do módulo" }], "acao_da_semana": { "titulo": "", "passos": ["3 passos"], "modulo": "slug" }, "replicar": { "post_id": número ou null, "motivo": "" } }`;

const somarDias = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const n = (v: number | null | undefined) => v ?? 0;

type PostDiag = {
  id: number; titulo: string | null; data_post: string; status: string; tipo_cqc: string | null; formato: string | null; plataforma: string | null;
  views: number | null; curtidas: number | null; comentarios: number | null; compartilhamentos: number | null; salvamentos: number | null;
  visitas_perfil: number | null; seguidores_ganhos: number | null; metricas_atualizadas_em: string | null;
};

function lerJson(bruto: string) {
  const limpo = bruto.replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
  const ini = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");
  const obj = JSON.parse(limpo.slice(ini, fim + 1)) as Record<string, unknown>;
  if (typeof obj["resumo"] !== "string" || !obj["acao_da_semana"]) throw new Error("JSON incompleto");
  if (Array.isArray(obj["ajustar"])) obj["ajustar"] = (obj["ajustar"] as unknown[]).slice(0, 3);
  return obj;
}

export const gerarDiagnostico = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().min(10), semana: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d))
  .handler(async ({ data }) => {
    const v = await validarAluna(data.token);
    if ("erro" in v) return { erro: v.erro };
    const { admin, comoAluna, userId } = v;
    const semana = data.semana;

    const { data: existente } = await admin
      .from("diagnosticos")
      .select("id, semana, conteudo, gerado_vezes, created_at")
      .eq("aluna_id", userId)
      .eq("semana", semana)
      .maybeSingle();
    if (existente && existente.gerado_vezes >= 2) return { diagnostico: existente, aviso: "Você já gerou o diagnóstico dessa semana." };

    const { data: semanas } = await comoAluna
      .from("metricas_semana")
      .select("semana, faturamento, pedidos, sessoes, ticket_medio, taxa_conversao, seguidores_instagram, seguidores_tiktok")
      .eq("aluna_id", userId)
      .lte("semana", semana)
      .order("semana", { ascending: false })
      .limit(8);
    if (!semanas?.length) return { erro: "Registra os dados da sua semana pra eu conseguir analisar." };

    const [postsR, publicadosR, modulosR, planoR, respostasR, siteR] = await Promise.all([
      comoAluna
        .from("posts")
        .select("id, titulo, data_post, status, tipo_cqc, formato, plataforma, views, curtidas, comentarios, compartilhamentos, salvamentos, visitas_perfil, seguidores_ganhos, metricas_atualizadas_em")
        .eq("aluna_id", userId)
        .gte("data_post", somarDias(semana, -21))
        .lte("data_post", somarDias(semana, 6)),
      comoAluna.from("posts").select("data_post").eq("aluna_id", userId).eq("status", "publicado").order("data_post", { ascending: false }).limit(400),
      comoAluna.from("meus_modulos").select("id, ordem, slug, titulo, liberado, total_tarefas, tarefas_feitas").order("ordem"),
      comoAluna.from("plano_negocios").select("dados").eq("aluna_id", userId).maybeSingle(),
      comoAluna.from("respostas_tarefas").select("dados, tarefas(chave_auto, titulo)").eq("aluna_id", userId),
      comoAluna.from("analises_site").select("nota, created_at").eq("aluna_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const posts = ((postsR.data ?? []) as PostDiag[]).map((p) => ({
      ...p,
      pontuacao: p.metricas_atualizadas_em
        ? n(p.views) + n(p.curtidas) + 3 * n(p.comentarios) + 5 * (n(p.compartilhamentos) + n(p.salvamentos)) + 10 * n(p.visitas_perfil) + 20 * n(p.seguidores_ganhos)
        : null,
    }));
    const datasPublicadas = ((publicadosR.data ?? []) as { data_post: string }[]).map((p) => p.data_post.slice(0, 10));
    const fimSemana = somarDias(semana, 6);
    const diasComPost = new Set(datasPublicadas.filter((d) => d >= semana && d <= fimSemana)).size;
    const ofensiva = calcularOfensiva(datasPublicadas, fimSemana).dias;

    type Mod = { id: number; ordem: number; slug: string; titulo: string; liberado: boolean; total_tarefas: number; tarefas_feitas: number };
    const modulos = (modulosR.data ?? []) as Mod[];
    const atual = modulos.find((m) => m.liberado && m.tarefas_feitas < m.total_tarefas);
    let pendentes: string[] = [];
    if (atual) {
      const [t, c] = await Promise.all([
        comoAluna.from("tarefas").select("id, titulo").eq("modulo_id", atual.id),
        comoAluna.from("tarefas_concluidas").select("tarefa_id").eq("aluna_id", userId),
      ]);
      const feitas = new Set(((c.data ?? []) as { tarefa_id: number }[]).map((x) => x.tarefa_id));
      pendentes = ((t.data ?? []) as { id: number; titulo: string }[]).filter((x) => !feitas.has(x.id)).map((x) => x.titulo);
    }
    const dadosPlano = (planoR.data?.dados ?? {}) as Record<string, unknown>;

    const contexto = {
      semana_analisada: `${semana} a ${fimSemana}`,
      metricas_semanas_mais_recente_primeiro: semanas,
      conteudos_ultimas_4_semanas: {
        planejados: posts.length,
        publicados: posts.filter((p) => p.status === "publicado").length,
        lista: posts,
      },
      dias_com_post_na_semana: diasComPost,
      ofensiva_dias: ofensiva,
      modulos: modulos.map((m) => ({ slug: m.slug, titulo: m.titulo, liberado: m.liberado, feitas: m.tarefas_feitas, total: m.total_tarefas })),
      modulo_atual: atual ? { slug: atual.slug, titulo: atual.titulo, tarefas_pendentes: pendentes } : null,
      plano_de_negocios: JSON.stringify(dadosPlano).slice(0, 5000),
      respostas_das_tarefas: JSON.stringify(respostasR.data ?? []).slice(0, 3000),
      ultima_nota_site: siteR.data?.nota ?? null,
    };

    let conteudo: Record<string, unknown> | null = null;
    for (let tentativa = 0; tentativa < 2 && !conteudo; tentativa += 1) {
      try {
        const bruto = await chamarIA(
          [
            { role: "system", content: SISTEMA },
            { role: "user", content: `Dados da aluna em JSON:\n${JSON.stringify(contexto)}` },
          ],
          2000,
          "google/gemini-2.5-pro",
        );
        conteudo = lerJson(bruto);
      } catch (e) {
        if (tentativa === 1) return { erro: (e as Error).message.includes("IA") ? (e as Error).message : "Não consegui analisar agora. Tenta de novo em instantes." };
      }
    }

    const { data: salvo, error } = await admin
      .from("diagnosticos")
      .upsert({ aluna_id: userId, semana, conteudo, gerado_vezes: (existente?.gerado_vezes ?? 0) + 1 }, { onConflict: "aluna_id,semana" })
      .select("id, semana, conteudo, gerado_vezes, created_at")
      .single();
    if (error) return { erro: "Não consegui salvar o diagnóstico. Tenta de novo." };
    return { diagnostico: salvo };
  });
