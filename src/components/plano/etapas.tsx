// Conteúdo das 9 etapas do plano de negócios.
import { Slider } from "@/components/ui/slider";
import {
  type Concorrente,
  type DadosPlano,
  type Persona,
  type Publico,
  TOM_CLASSE,
  faixaMargem,
  faixaNota,
  financas,
  notaPublico,
  novaPersona,
  novoConcorrente,
  novoPublico,
  reais,
} from "@/lib/plano-negocios";
import { cn } from "@/lib/utils";
import {
  BotaoAdicionar,
  BotoesOpcao,
  Campo,
  CampoMoeda,
  CampoNumero,
  CampoTexto,
  CartaoItem,
  Chips,
  CLASSE_INPUT,
  Rotulo,
} from "./campos";

export type PropsEtapa = { d: DadosPlano; set: (patch: Partial<DadosPlano>) => void };

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-[15px] font-semibold">{titulo}</h3>
      {children}
    </div>
  );
}

export function Etapa1({ d, set }: PropsEtapa) {
  return (
    <div className="space-y-5">
      <Campo rotulo="Nome completo" obrigatorio placeholder="Seu nome completo" valor={d.fullName} onChange={(v) => set({ fullName: v })} />
      <Campo rotulo="E-mail" obrigatorio tipo="email" placeholder="seu@email.com" valor={d.email} onChange={(v) => set({ email: v })} />
      <Campo rotulo="Nome da loja ou negócio" obrigatorio placeholder="Nome da sua loja" valor={d.storeName} onChange={(v) => set({ storeName: v })} />
    </div>
  );
}

export function Etapa2({ d, set }: PropsEtapa) {
  return (
    <div className="space-y-5">
      <Campo rotulo="Qual é o seu nicho?" obrigatorio placeholder="ex: moda plus size, suplementos naturais, decoração minimalista" valor={d.niche} onChange={(v) => set({ niche: v })} />
      <CampoTexto
        rotulo="Por que você escolheu esse nicho? Você tem experiência ou paixão por esse mercado?"
        exemplo="Ex: tenho paixão por esse mercado há anos e conheço bem o que o público precisa..."
        valor={d.nicheWhy}
        onChange={(v) => set({ nicheWhy: v })}
      />
      <CampoTexto
        rotulo="Qual é o seu produto principal? Descreva o produto carro-chefe da sua loja."
        obrigatorio
        exemplo="Ex: meu produto principal são conjuntos femininos casuais, confortáveis e com boa modelagem..."
        valor={d.mainProduct}
        onChange={(v) => set({ mainProduct: v })}
      />
      <Campo rotulo="Como você quer ser percebido pelo mercado?" placeholder="ex: a opção mais acessível, a mais premium, a mais especializada" valor={d.marketPerception} onChange={(v) => set({ marketPerception: v })} />
      <CampoTexto
        rotulo="Qual é o seu diferencial competitivo?"
        obrigatorio
        exemplo="O que te separa de quem já vende a mesma coisa?"
        valor={d.competitiveDifferential}
        onChange={(v) => set({ competitiveDifferential: v })}
      />
      <div>
        <Rotulo>Como está o seu nicho hoje?</Rotulo>
        <BotoesOpcao
          opcoes={[
            { valor: "growing", rotulo: "📈 Crescendo" },
            { valor: "stable", rotulo: "➡️ Estável" },
            { valor: "declining", rotulo: "📉 Em declínio" },
          ]}
          valor={d.nicheStatus}
          onChange={(v) => set({ nicheStatus: v })}
        />
      </div>
      <CampoTexto rotulo="Por que você acredita nisso?" valor={d.nicheStatusWhy} onChange={(v) => set({ nicheStatusWhy: v })} />
    </div>
  );
}

const SLIDERS: { chave: keyof Publico; rotulo: string }[] = [
  { chave: "sizeScore", rotulo: "Tamanho do público" },
  { chave: "trendScore", rotulo: "Tendência de crescimento" },
  { chave: "competitionScore", rotulo: "Nível de concorrência" },
  { chave: "ticketScore", rotulo: "Potencial de ticket médio" },
  { chave: "recurrenceScore", rotulo: "Potencial de recorrência" },
];

export function Etapa3({ d, set }: PropsEtapa) {
  const lista = d.audiences?.length ? d.audiences : [novoPublico()];
  const mudar = (id: string, patch: Partial<Publico>) => set({ audiences: lista.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  return (
    <div className="space-y-5">
      {lista.map((a, i) => {
        const nota = notaPublico(a);
        const faixa = faixaNota(nota);
        return (
          <CartaoItem
            key={a.id}
            titulo={`Público ${i + 1}`}
            onRemover={i > 0 ? () => set({ audiences: lista.filter((x) => x.id !== a.id) }) : undefined}
          >
            <Campo rotulo="Nome do segmento" obrigatorio placeholder="ex: Mães de 30 a 40 anos" valor={a.name} onChange={(v) => mudar(a.id, { name: v })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Faixa etária predominante" placeholder="ex: 25 a 35 anos" valor={a.ageRange} onChange={(v) => mudar(a.id, { ageRange: v })} />
              <Campo rotulo="Gênero predominante" placeholder="ex: feminino" valor={a.gender} onChange={(v) => mudar(a.id, { gender: v })} />
              <Campo rotulo="Localização principal" placeholder="ex: Brasil todo, Sul e Sudeste" valor={a.location} onChange={(v) => mudar(a.id, { location: v })} />
              <Campo rotulo="Poder aquisitivo" placeholder="ex: classe B e C" valor={a.purchasingPower} onChange={(v) => mudar(a.id, { purchasingPower: v })} />
            </div>
            <CampoTexto rotulo="Como esse público consome online?" valor={a.onlineConsumption} onChange={(v) => mudar(a.id, { onlineConsumption: v })} />
            <div className="rounded-2xl bg-surface p-4">
              <p className="mb-4 text-sm font-semibold">Avaliação do público</p>
              <div className="space-y-4">
                {SLIDERS.map((s) => (
                  <div key={s.chave} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 sm:grid-cols-[200px_1fr_auto]">
                    <span className="text-[13px] text-muted-foreground">{s.rotulo}</span>
                    <Slider
                      className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto"
                      min={1}
                      max={5}
                      step={1}
                      value={[a[s.chave] as number]}
                      onValueChange={([v]) => mudar(a.id, { [s.chave]: v ?? 3 })}
                    />
                    <span className="w-5 text-right text-sm font-semibold tabular-nums">{a[s.chave] as number}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                <span className="text-3xl font-bold tabular-nums text-primary">{nota.toFixed(1).replace(".", ",")}</span>
                <span className="text-xs text-muted-foreground">de 10</span>
                <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", TOM_CLASSE[faixa.tom])}>{faixa.texto}</span>
              </div>
            </div>
          </CartaoItem>
        );
      })}
      <BotaoAdicionar onClick={() => set({ audiences: [...lista, novoPublico()] })}>+ Adicionar público</BotaoAdicionar>
    </div>
  );
}

export function Etapa4({ d, set }: PropsEtapa) {
  const lista = d.personas?.length ? d.personas : [novaPersona()];
  const mudar = (id: string, patch: Partial<Persona>) => set({ personas: lista.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  return (
    <div className="space-y-5">
      {lista.map((p, i) => (
        <CartaoItem key={p.id} titulo={`Persona ${i + 1}`} onRemover={i > 0 ? () => set({ personas: lista.filter((x) => x.id !== p.id) }) : undefined}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo rotulo="Nome fictício" obrigatorio placeholder="ex: Carla, 34 anos" valor={p.name} onChange={(v) => mudar(p.id, { name: v })} />
            <Campo rotulo="Idade" valor={p.age} onChange={(v) => mudar(p.id, { age: v })} />
            <Campo rotulo="Profissão" valor={p.profession} onChange={(v) => mudar(p.id, { profession: v })} />
          </div>
          <CampoTexto
            rotulo="Qual dor ou desejo essa persona tem que o seu produto resolve?"
            obrigatorio
            exemplo="Ex: ela quer se sentir bonita mas sempre encontra roupas que não servem bem no seu corpo..."
            valor={p.painOrDesire}
            onChange={(v) => mudar(p.id, { painOrDesire: v })}
          />
          <CampoTexto
            rotulo="O que ela pesquisa antes de comprar?"
            exemplo="Ex: ela pesquisa avaliações de outras clientes e fotos reais antes de decidir..."
            valor={p.researchBefore}
            onChange={(v) => mudar(p.id, { researchBefore: v })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Onde ela passa o tempo online?" placeholder="ex: Instagram, TikTok, YouTube" valor={p.onlinePresence} onChange={(v) => mudar(p.id, { onlinePresence: v })} />
            <Campo rotulo="O que impede ela de comprar hoje?" placeholder="ex: preço, desconfiança, não conhece minha marca" valor={p.buyingBarriers} onChange={(v) => mudar(p.id, { buyingBarriers: v })} />
          </div>
          <CampoTexto rotulo="Frase que ela diria antes de te encontrar" linhas={2} valor={p.quote} onChange={(v) => mudar(p.id, { quote: v })} />
        </CartaoItem>
      ))}
      <BotaoAdicionar onClick={() => set({ personas: [...lista, novaPersona()] })}>+ Adicionar persona</BotaoAdicionar>
    </div>
  );
}

export function fraseProposta(d: DadosPlano) {
  const f = (v?: string) => (v?.trim() ? v.trim() : "___");
  return `Minha loja existe para ajudar ${f(d.valueField1)} a ${f(d.valueField2)} sem ${f(d.valueField3)}.`;
}

export function Etapa5({ d, set }: PropsEtapa) {
  const inline = "min-w-[140px] flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none";
  return (
    <div className="space-y-6">
      <div>
        <Rotulo obrigatorio>Monte sua frase de proposta de valor:</Rotulo>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>Minha loja existe para ajudar</span>
          <input className={inline} placeholder="quem?" value={d.valueField1 ?? ""} onChange={(e) => set({ valueField1: e.target.value })} />
          <span>a</span>
          <input className={inline} placeholder="fazer o quê?" value={d.valueField2 ?? ""} onChange={(e) => set({ valueField2: e.target.value })} />
          <span>sem</span>
          <input className={inline} placeholder="qual obstáculo?" value={d.valueField3 ?? ""} onChange={(e) => set({ valueField3: e.target.value })} />
          <span>.</span>
        </div>
        <div className="mt-4 rounded-2xl bg-accent-soft px-5 py-4 text-[15px] font-semibold leading-relaxed text-primary">{fraseProposta(d)}</div>
      </div>
      <div>
        <Rotulo>Quais são os 3 principais benefícios que seu produto entrega?</Rotulo>
        <div className="space-y-2">
          {(["benefit1", "benefit2", "benefit3"] as const).map((k, i) => (
            <input key={k} className={CLASSE_INPUT} placeholder={`Benefício ${i + 1}`} value={d[k] ?? ""} onChange={(e) => set({ [k]: e.target.value })} />
          ))}
        </div>
      </div>
      <div>
        <Rotulo>Transformação do cliente</Rotulo>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto
            rotulo="Antes de me encontrar..."
            exemplo="Ex: ela se sentia frustrada e sem opções que a representassem..."
            valor={d.beforeTransformation}
            onChange={(v) => set({ beforeTransformation: v })}
          />
          <CampoTexto rotulo="Depois de comprar comigo..." valor={d.afterTransformation} onChange={(v) => set({ afterTransformation: v })} />
        </div>
      </div>
      <CampoTexto
        rotulo="Por que o cliente deveria comprar de você e não do concorrente?"
        exemplo="Ex: porque eu sou o público que atendo e sei exatamente o que a cliente precisa..."
        valor={d.whyBuyFromYou}
        onChange={(v) => set({ whyBuyFromYou: v })}
      />
    </div>
  );
}

const CANAIS_CONC = ["Instagram", "TikTok", "Loja própria", "Marketplace", "WhatsApp", "Outros"];

export function Etapa6({ d, set }: PropsEtapa) {
  const lista = d.competitors?.length ? d.competitors : [novoConcorrente(), novoConcorrente(), novoConcorrente()];
  const mudar = (id: string, patch: Partial<Concorrente>) => set({ competitors: lista.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  return (
    <div className="space-y-5">
      {lista.map((c, i) => (
        <CartaoItem key={c.id} titulo={`Concorrente ${i + 1}`} onRemover={i > 2 ? () => set({ competitors: lista.filter((x) => x.id !== c.id) }) : undefined}>
          <Campo rotulo="Nome ou loja do concorrente" obrigatorio valor={c.name} onChange={(v) => mudar(c.id, { name: v })} />
          <CampoTexto rotulo="O que ele faz bem?" exemplo="Ex: eles têm uma comunidade ativa e muita prova social nas redes sociais..." valor={c.strengths} onChange={(v) => mudar(c.id, { strengths: v })} />
          <CampoTexto rotulo="Qual é a fraqueza dele?" exemplo="Ex: o atendimento deles é lento e os produtos às vezes decepcionam na qualidade..." valor={c.weaknesses} onChange={(v) => mudar(c.id, { weaknesses: v })} />
          <div className="max-w-xs">
            <CampoMoeda rotulo="Preço médio (R$)" valor={c.averagePrice} onChange={(v) => mudar(c.id, { averagePrice: v })} />
          </div>
          <div>
            <Rotulo>Onde ele é forte?</Rotulo>
            <Chips opcoes={CANAIS_CONC} valor={c.channels ?? []} onChange={(v) => mudar(c.id, { channels: v })} />
          </div>
          <CampoTexto rotulo="O que você pode fazer melhor do que ele?" obrigatorio exemplo="Ex: posso oferecer um atendimento muito mais humano e personalizado..." valor={c.whatBetter} onChange={(v) => mudar(c.id, { whatBetter: v })} />
        </CartaoItem>
      ))}
      <BotaoAdicionar onClick={() => set({ competitors: [...lista, novoConcorrente()] })}>+ Adicionar concorrente</BotaoAdicionar>
      <CampoTexto
        rotulo="Qual é o seu posicionamento em relação ao mercado?"
        exemplo="Ex: quero ser a referência do nicho com curadoria e atendimento de excelência..."
        valor={d.marketPositioning}
        onChange={(v) => set({ marketPositioning: v })}
      />
    </div>
  );
}

function Total({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm">
      <span className="font-medium">{rotulo}</span>
      <span className="font-bold tabular-nums text-primary">{reais(valor)}</span>
    </div>
  );
}

export function Etapa7({ d, set }: PropsEtapa) {
  const f = financas(d);
  const faixa = faixaMargem(f.margem);
  const cenarios = [
    { chave: "pessimisticSales", titulo: "Pessimista", borda: "border-destructive", receita: f.receita.pessimista },
    { chave: "realisticSales", titulo: "Realista", borda: "border-info", receita: f.receita.realista },
    { chave: "optimisticSales", titulo: "Otimista", borda: "border-success", receita: f.receita.otimista },
  ] as const;
  return (
    <div className="space-y-8">
      <Secao titulo="Produto">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoMoeda rotulo="Custo do produto (R$) *" valor={d.productCost} onChange={(v) => set({ productCost: v })} />
          <CampoMoeda rotulo="Preço de venda (R$) *" valor={d.sellingPrice} onChange={(v) => set({ sellingPrice: v })} />
        </div>
        {f.preco > 0 ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted px-4 py-3">
            <span className="text-sm font-medium">Margem bruta</span>
            <span className="text-xl font-bold tabular-nums text-primary">{f.margem.toFixed(1).replace(".", ",")}%</span>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", TOM_CLASSE[faixa.tom])}>{faixa.texto}</span>
          </div>
        ) : null}
      </Secao>

      <Secao titulo="Custos Fixos Mensais">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoMoeda rotulo="Plataforma de e-commerce (R$)" valor={d.platformCost} onChange={(v) => set({ platformCost: v })} />
          <CampoMoeda rotulo="Ferramentas e aplicativos (R$)" valor={d.toolsCost} onChange={(v) => set({ toolsCost: v })} />
          <CampoMoeda rotulo="Embalagens estimadas/mês (R$)" valor={d.packagingCost} onChange={(v) => set({ packagingCost: v })} />
          <CampoMoeda rotulo="Outros custos fixos (R$)" valor={d.otherFixedCosts} onChange={(v) => set({ otherFixedCosts: v })} />
        </div>
        <Total rotulo="Total de custos fixos" valor={f.fixos} />
      </Secao>

      <Secao titulo="Ponto de Equilíbrio">
        <div className="rounded-2xl bg-accent-soft px-5 py-4 text-sm">
          {f.equilibrio !== null ? (
            <>
              Você precisa vender <span className="text-lg font-bold text-primary">{f.equilibrio}</span> unidades por mês para cobrir seus
              custos.
            </>
          ) : (
            "Preencha o custo e um preço de venda maior que o custo para calcular."
          )}
        </div>
      </Secao>

      <Secao titulo="Investimento Inicial">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoMoeda rotulo="Estoque inicial (R$)" valor={d.initialStock} onChange={(v) => set({ initialStock: v })} />
          <CampoMoeda rotulo="Identidade visual e site (R$)" valor={d.brandingCost} onChange={(v) => set({ brandingCost: v })} />
          <CampoMoeda rotulo="Verba de marketing inicial (R$)" valor={d.marketingBudget} onChange={(v) => set({ marketingBudget: v })} />
          <CampoMoeda rotulo="Outros investimentos (R$)" valor={d.otherInvestments} onChange={(v) => set({ otherInvestments: v })} />
        </div>
        <Total rotulo="Total de investimento inicial" valor={f.invest} />
      </Secao>

      <Secao titulo="Projeção de Receita (3 cenários)">
        <div className="grid gap-3 sm:grid-cols-3">
          {cenarios.map((c) => (
            <div key={c.chave} className={cn("rounded-2xl border-2 bg-surface p-4", c.borda)}>
              <p className="mb-3 text-sm font-semibold">
                {c.titulo}
                {c.chave === "realisticSales" ? <span className="text-primary"> *</span> : null}
              </p>
              <CampoNumero rotulo="Vendas/mês" valor={d[c.chave]} onChange={(v) => set({ [c.chave]: v })} />
              <p className="mt-3 text-lg font-bold tabular-nums">{reais(c.receita)}</p>
              <p className="text-xs text-muted-foreground">receita mensal</p>
            </div>
          ))}
        </div>
      </Secao>
    </div>
  );
}

export function Etapa8({ d, set }: PropsEtapa) {
  const caixas = [
    { k: "strengths", t: "💪 Forças", p: "O que você tem de bom que outros não têm? Conhecimento do nicho, rede de contatos, produto exclusivo..." },
    { k: "weaknesses", t: "⚠️ Fraquezas", p: "O que ainda está faltando? Capital limitado, pouca experiência, sem audiência, sem fornecedor fixo..." },
    { k: "opportunities", t: "🚀 Oportunidades", p: "O que está acontecendo no mercado que você pode aproveitar? Tendência, sazonalidade, lacuna não atendida..." },
    { k: "threats", t: "🛡️ Ameaças", p: "O que pode atrapalhar seu crescimento? Concorrência grande, dependência de fornecedor, mudança de algoritmo..." },
  ] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {caixas.map((c) => (
        <div key={c.k} className="rounded-2xl border border-border bg-background/60 p-4">
          <CampoTexto
            rotulo={c.t.replace(/^\S+\s/, "")}
            semRotulo={<span className="text-[15px] font-semibold">{c.t}</span>}
            exemplo={c.p}
            linhas={6}
            valor={d[c.k]}
            onChange={(v) => set({ [c.k]: v })}
          />
        </div>
      ))}
    </div>
  );
}

const CANAIS = ["Instagram", "TikTok", "Pinterest", "Google Ads", "Meta Ads", "SEO", "Influenciadores", "Email marketing", "WhatsApp", "Outros"];

export function Etapa9({ d, set }: PropsEtapa) {
  const canais = d.marketingChannels ?? [];
  const estrategias = d.channelStrategies ?? {};
  return (
    <div className="space-y-8">
      <Secao titulo="Canais de Aquisição *">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CANAIS.map((c) => {
            const ativo = canais.includes(c);
            return (
              <label
                key={c}
                className={cn(
                  "transicao-suave flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm",
                  ativo ? "border-primary bg-accent-soft font-medium text-primary" : "border-border bg-surface",
                )}
              >
                <input
                  type="checkbox"
                  className="accent-[var(--primary)]"
                  checked={ativo}
                  onChange={() => set({ marketingChannels: ativo ? canais.filter((x) => x !== c) : [...canais, c] })}
                />
                {c}
              </label>
            );
          })}
        </div>
        {canais.map((c) => (
          <CampoTexto
            key={c}
            rotulo={`Como você vai usar o ${c}?`}
            exemplo="Ex: vou postar reels diários mostrando os bastidores e dicas do nicho..."
            valor={estrategias[c]}
            onChange={(v) => set({ channelStrategies: { ...estrategias, [c]: v } })}
          />
        ))}
      </Secao>

      <Secao titulo="Conteúdo">
        <CampoTexto
          rotulo="Que tipo de conteúdo você vai produzir?"
          exemplo="Ex: bastidores, depoimentos de clientes, dicas práticas e lançamentos..."
          valor={d.contentType}
          onChange={(v) => set({ contentType: v })}
        />
        <Campo rotulo="Com que frequência?" placeholder="ex: 3x por semana" valor={d.contentFrequency} onChange={(v) => set({ contentFrequency: v })} />
        <div>
          <Rotulo>Quem vai produzir?</Rotulo>
          <BotoesOpcao
            opcoes={[
              { valor: "Eu mesmo", rotulo: "Eu mesmo" },
              { valor: "Vou contratar", rotulo: "Vou contratar" },
              { valor: "Ainda não sei", rotulo: "Ainda não sei" },
            ]}
            valor={d.contentProducer}
            onChange={(v) => set({ contentProducer: v })}
          />
        </div>
      </Secao>

      <Secao titulo="Vendas e fidelização">
        <CampoTexto rotulo="Qual será o seu processo de venda?" obrigatorio exemplo="Ex: conteúdo no Instagram, perfil, link na bio, loja, checkout..." valor={d.salesProcess} onChange={(v) => set({ salesProcess: v })} />
        <CampoTexto rotulo="Qual oferta de entrada você terá para atrair o primeiro cliente?" exemplo="Ex: frete grátis na primeira compra acima de R$80..." valor={d.entryOffer} onChange={(v) => set({ entryOffer: v })} />
        <CampoTexto rotulo="Como você vai fazer o cliente comprar de novo?" exemplo="Ex: cupom de 10% enviado por WhatsApp 7 dias após a entrega..." valor={d.retentionStrategy} onChange={(v) => set({ retentionStrategy: v })} />
        <CampoTexto
          rotulo="Terá programa de indicação, cupom de recompra ou pós-venda estruturado?"
          exemplo="Ex: grupo VIP no WhatsApp com lançamentos exclusivos e descontos..."
          valor={d.loyaltyProgram}
          onChange={(v) => set({ loyaltyProgram: v })}
        />
      </Secao>

      <Secao titulo="Metas para os Primeiros 3 Meses">
        <Campo rotulo="Meta de seguidores ou audiência" placeholder="ex: 2.000 seguidores" valor={d.followerGoal} onChange={(v) => set({ followerGoal: v })} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="Meta vendas Mês 1 *" placeholder="ex: 20 vendas" valor={d.salesMonth1} onChange={(v) => set({ salesMonth1: v })} />
          <Campo rotulo="Meta vendas Mês 2" placeholder="ex: 40 vendas" valor={d.salesMonth2} onChange={(v) => set({ salesMonth2: v })} />
          <Campo rotulo="Meta vendas Mês 3" placeholder="ex: 70 vendas" valor={d.salesMonth3} onChange={(v) => set({ salesMonth3: v })} />
        </div>
      </Secao>
    </div>
  );
}

export const COMPONENTES_ETAPAS = [Etapa1, Etapa2, Etapa3, Etapa4, Etapa5, Etapa6, Etapa7, Etapa8, Etapa9];
