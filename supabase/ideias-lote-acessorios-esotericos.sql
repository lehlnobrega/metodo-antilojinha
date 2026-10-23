-- =====================================================================
-- BANCO DE IDEIAS: 31 referências novas (Acessórios e Produtos esotéricos)
-- Rode inteiro no SQL Editor do Supabase.
-- Não duplica nada: se o post já estiver no banco (mesmo link, mesmo
-- que com ?parâmetros diferentes), ele é pulado. Pode rodar de novo.
-- No fim aparece o resumo: quantas entraram e quais já existiam.
-- =====================================================================

drop table if exists pg_temp.novas_ideias;
create temp table novas_ideias (
  ordem int, nicho text, emoji text, titulo text, formato text, tipo_cqc text,
  link text, chave text, feedback text, ja_existia boolean default false
);

insert into novas_ideias (ordem, nicho, emoji, titulo, formato, tipo_cqc, link, chave, feedback) values
  (1, $q$Acessórios$q$, $q$💍$q$, $q$Pov: cheguei e vc é meu porta joias$q$, $q$video$q$, $q$desejo$q$, $q$https://www.instagram.com/reel/C4IxzuSuLKA/$q$, $q$C4IxzuSuLKA$q$, $q$Gravado de um ângulo diferente (chama atenção) ao mesmo tempo que mostra as joias, despertando desejo$q$),
  (2, $q$Acessórios$q$, $q$💍$q$, $q$Semana de acessorios$q$, $q$video$q$, $q$desejo$q$, $q$https://www.instagram.com/reel/CtzPAk8A_Wh/$q$, $q$CtzPAk8A_Wh$q$, $q$Mostra variedade de produtos e em que momento usar$q$),
  (3, $q$Acessórios$q$, $q$💍$q$, $q$Roube minha wishlist de acessorios$q$, $q$carrossel$q$, $q$desejo$q$, $q$https://www.instagram.com/p/Dd605nnIOgY/$q$, $q$Dd605nnIOgY$q$, $q$Gera curiosidade para saber os produtos que você está interessada ao mesmo tempo que gera interesse na pessoa também$q$),
  (4, $q$Acessórios$q$, $q$💍$q$, $q$Sem acessórios vs com acessórios$q$, $q$video$q$, $q$desejo$q$, $q$https://www.instagram.com/reel/DN6MUmakRDp/$q$, $q$DN6MUmakRDp$q$, $q$Mostra como acessórios fazem diferença no look. Chama atenção pela música agitada e os cortes rápidos para mudança de ângulo$q$),
  (5, $q$Acessórios$q$, $q$💍$q$, $q$Acessórios que toda diva icônica deveria ter$q$, $q$video$q$, $q$desejo$q$, $q$https://www.instagram.com/reel/DbEjcAXPo3V/$q$, $q$DbEjcAXPo3V$q$, $q$Gera curiosidade nas "divas icônicas", que precisam ver se já têm esses acessórios. A fala animada com a mudança de ângulo para aproximar o produto faz a diferença$q$),
  (6, $q$Acessórios$q$, $q$💍$q$, $q$"Joias são caras"$q$, $q$video$q$, $q$objecao$q$, $q$https://www.instagram.com/reel/DXYWQ_KkmtX/$q$, $q$DXYWQ_KkmtX$q$, $q$Mostrar a objeção junto com os produtos e o preço quebra a objeção de que o produto é caro$q$),
  (7, $q$Acessórios$q$, $q$💍$q$, $q$Bijuterias x prata legitima$q$, $q$video$q$, $q$objecao$q$, $q$https://www.instagram.com/reel/DUJnJNjiRQy/$q$, $q$DUJnJNjiRQy$q$, $q$Vídeo que gera comparação visível, fazendo com que seja mais fácil enxergar valor$q$),
  (8, $q$Acessórios$q$, $q$💍$q$, $q$Minha joia escureceu$q$, $q$video$q$, $q$objecao$q$, $q$https://www.instagram.com/reel/DVv8A1DCEOB/$q$, $q$DVv8A1DCEOB$q$, $q$Mostra que é normal a joia oxidar e mostra na prática como resolver$q$),
  (9, $q$Acessórios$q$, $q$💍$q$, $q$"mas eu só comprei umas pecinhas na sua loja"$q$, $q$video$q$, $q$conexao$q$, $q$https://www.instagram.com/reel/DanfQkuOr1H/$q$, $q$DanfQkuOr1H$q$, $q$A música melancólica de fundo faz quem está assistindo parar no vídeo para ver o carinho que a marca deposita no produto$q$),
  (10, $q$Acessórios$q$, $q$💍$q$, $q$Minha galeria tendo uma loja de joias$q$, $q$carrossel$q$, $q$conexao$q$, $q$https://www.instagram.com/p/DduUoifEVRH/$q$, $q$DduUoifEVRH$q$, $q$Mostra os bastidores da loja ao mesmo tempo que mostra a beleza das peças$q$),
  (11, $q$Acessórios$q$, $q$💍$q$, $q$Acessorios favoritos do momento$q$, $q$video$q$, $q$conexao$q$, $q$https://www.instagram.com/reel/DZGQEMCJiP3/$q$, $q$DZGQEMCJiP3$q$, $q$Mostra o gosto pessoal da dona da loja, o que gera conexão$q$),
  (12, $q$Acessórios$q$, $q$💍$q$, $q$Oferta direta$q$, $q$video$q$, $q$oferta$q$, $q$https://www.instagram.com/reel/DcwuM_6R7Wh/$q$, $q$DcwuM_6R7Wh$q$, $q$O intuito do vídeo não é engajar, mas sim divulgar uma ação que a loja terá$q$),
  (13, $q$Acessórios$q$, $q$💍$q$, $q$Oferta mascarada$q$, $q$carrossel$q$, $q$oferta$q$, $q$https://www.instagram.com/p/DeKZQvsGs-5/$q$, $q$DeKZQvsGs-5$q$, $q$Post com potencial viral e chamada para oferta no final. Bom para engajar e alcançar mais pessoas$q$),
  (14, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Ritual semanal para amor$q$, $q$video$q$, $q$desejo$q$, $q$https://www.instagram.com/reel/DcUPYSkBQXf/$q$, $q$DcUPYSkBQXf$q$, $q$Desperta desejo ao mesmo tempo que gera conexão. Mostra a rotina com uso dos produtos, despertando o desejo de compra$q$),
  (15, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Problema x solução$q$, $q$video$q$, $q$desejo$q$, $q$https://www.instagram.com/reel/DcB_mNsqdl0/$q$, $q$DcB_mNsqdl0$q$, $q$Vídeo clássico de "se você precisa DISSO, use ISSO". Funciona em todos os nichos$q$),
  (16, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Produto direcionado ao interesse da pessoa$q$, $q$carrossel$q$, $q$desejo$q$, $q$https://www.instagram.com/p/Db3WC7TEbom/$q$, $q$Db3WC7TEbom$q$, $q$Gera identificação com o que a pessoa faz e desperta desejo de compra, porque ela se reconhece no direcionamento do post$q$),
  (17, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Respondendo comentário com produto desejado$q$, $q$video$q$, $q$desejo$q$, $q$https://www.instagram.com/reel/DZtEO6Lil1k/$q$, $q$DZtEO6Lil1k$q$, $q$Engaja com a comunidade ao mesmo tempo que faz uma divulgação direta do produto$q$),
  (18, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Top 10 produtos para tratar algo$q$, $q$carrossel$q$, $q$desejo$q$, $q$https://www.instagram.com/p/DcyTpKWkUSH/$q$, $q$DcyTpKWkUSH$q$, $q$A pessoa se identifica com a headline e para para ver os produtos, criando interesse por eles$q$),
  (19, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$"minha loja é golpe?"$q$, $q$video$q$, $q$objecao$q$, $q$https://www.instagram.com/reel/DcPIFf3BNRw/$q$, $q$DcPIFf3BNRw$q$, $q$Sana uma dúvida real ao mesmo tempo que mostra provas sociais. Ótimo para converter em venda$q$),
  (20, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Respondendo comentários: produto caro$q$, $q$video$q$, $q$objecao$q$, $q$https://www.instagram.com/reel/DXezzkVEarF/$q$, $q$DXezzkVEarF$q$, $q$Agrega valor à marca e ao produto mostrando exatamente por que ele custa mais que outros do mercado$q$),
  (21, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Meus produtos chegaram, o que fazer?$q$, $q$carrossel$q$, $q$objecao$q$, $q$https://www.instagram.com/p/DL3bxYCpd6K/$q$, $q$DL3bxYCpd6K$q$, $q$Dá o passo a passo do que fazer assim que o pedido chega. Se a pessoa tinha alguma dúvida sobre o produto, já sana$q$),
  (22, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Use quando...$q$, $q$carrossel$q$, $q$objecao$q$, $q$https://www.instagram.com/p/DcTXPc4ka-m/$q$, $q$DcTXPc4ka-m$q$, $q$Se a pessoa gostou da loja mas ficou com dúvida de qual produto levar, esse post sana a dúvida$q$),
  (23, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Como usar os produtos$q$, $q$carrossel$q$, $q$objecao$q$, $q$https://www.instagram.com/p/DX7R35wkalK/$q$, $q$DX7R35wkalK$q$, $q$Às vezes a pessoa não compra por medo de não saber usar o produto corretamente. Esse post remove essa dúvida$q$),
  (24, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Fazendo produtos comigo$q$, $q$video$q$, $q$conexao$q$, $q$https://www.instagram.com/reel/Deu2TIzCNSM/$q$, $q$Deu2TIzCNSM$q$, $q$Mostra "ao vivo" um processo real dentro da loja. Dá para adaptar fazendo um dia comigo embalando pedidos$q$),
  (25, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Falando com a câmera sobre assunto do público$q$, $q$video$q$, $q$conexao$q$, $q$https://www.instagram.com/reel/DbyyOdrqz_7/$q$, $q$DbyyOdrqz_7$q$, $q$Não é um vídeo direto de bastidor, mas gera conexão pela identificação com o tema. A pessoa tem interesse em seguir a loja porque ela tem conhecimento e propriedade para falar dos assuntos que interessam$q$),
  (26, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Magias antigas que quase ninguém ensina$q$, $q$carrossel$q$, $q$conexao$q$, $q$https://www.instagram.com/p/DckGU9agKHK/$q$, $q$DckGU9agKHK$q$, $q$Gera conexão ao mesmo tempo que gera autoridade. No nicho esotérico é ótimo para fazer 1x por semana: o alcance é muito bom e aumenta a base de seguidores$q$),
  (27, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Mais um dia de produção no ateliê$q$, $q$video$q$, $q$conexao$q$, $q$https://www.instagram.com/p/Dew_ZzfhQrb/$q$, $q$Dew_ZzfhQrb$q$, $q$Mostra as etapas do processo, fazendo a percepção de valor do produto aumentar$q$),
  (28, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Curiosidade sobre a loja$q$, $q$carrossel$q$, $q$conexao$q$, $q$https://www.instagram.com/p/DekKXTPGvP-/$q$, $q$DekKXTPGvP-$q$, $q$Faz a pessoa conhecer mais sobre a sua loja$q$),
  (29, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Oferta direta estilo banner$q$, $q$carrossel$q$, $q$oferta$q$, $q$https://www.instagram.com/p/Deesz3yEeB9/$q$, $q$Deesz3yEeB9$q$, $q$Post informativo direto sobre promoção$q$),
  (30, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Post educativo com oferta mascarada$q$, $q$carrossel$q$, $q$oferta$q$, $q$https://www.instagram.com/p/DdEIVgdEZFS/$q$, $q$DdEIVgdEZFS$q$, $q$Conta sobre um assunto que interessa ao público, com oferta no final$q$),
  (31, $q$Produtos esotéricos$q$, $q$🔮$q$, $q$Informativo de oferta$q$, $q$video$q$, $q$oferta$q$, $q$https://www.instagram.com/reel/DdCqF1_h9Hd/$q$, $q$DdCqF1_h9Hd$q$, $q$Vídeo que não engaja, mas é bom para informar sobre uma oferta que está por vir$q$);

-- 1. Cria os nichos que ainda não existem
insert into public.nichos_acervo (nome, ordem, emoji)
select n.nicho, coalesce((select max(ordem) from public.nichos_acervo), 0) + row_number() over (order by min(n.ordem)), min(n.emoji)
from novas_ideias n
where not exists (select 1 from public.nichos_acervo x where lower(trim(x.nome)) = lower(trim(n.nicho)))
group by n.nicho;

-- 2. Marca os posts que já estão no banco (compara o código do post, ignorando ?parâmetros)
update novas_ideias n set ja_existia = true
where exists (
  select 1 from public.conteudos_acervo c
  where coalesce(substring(c.link from 'instagram\.com/(?:[^/]+/)?(?:p|reel|reels|tv)/([^/?#]+)'),
                 rtrim(split_part(c.link, '?', 1), '/')) = n.chave
);

-- 3. Sobe só as novas
insert into public.conteudos_acervo (nicho_id, titulo, feedback, formato, tipo_cqc, link, ativo)
select x.id, n.titulo, n.feedback, n.formato, n.tipo_cqc, n.link, true
from novas_ideias n
join public.nichos_acervo x on lower(trim(x.nome)) = lower(trim(n.nicho))
where not n.ja_existia
order by n.ordem desc;

-- 4. Resumo
select
  count(*) filter (where not ja_existia) as entraram_agora,
  count(*) filter (where ja_existia)     as ja_existiam,
  coalesce(string_agg(titulo, ' | ') filter (where ja_existia), '') as quais_ja_existiam
from novas_ideias;
