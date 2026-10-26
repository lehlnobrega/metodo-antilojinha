-- =====================================================================
-- BANCO DE IDEIAS: 18 referências de Roupas
-- Rode inteiro no SQL Editor do Supabase do Método.
-- Não duplica: se o post já estiver no banco, ele é pulado. Pode rodar de novo.
-- Se já existir o nicho "Roupa" ou "Roupas", usa ele; se não, cria "Roupas" 👗.
-- No fim aparece o resumo. Se aparecer o aviso de RLS, clique em "Run without RLS".
-- =====================================================================

drop table if exists pg_temp.novas_ideias;
create temp table novas_ideias (
  ordem int, nicho text, emoji text, titulo text, formato text, tipo_cqc text,
  link text, chave text, feedback text, ja_existia boolean default false
);

insert into novas_ideias (ordem, nicho, emoji, titulo, formato, tipo_cqc, link, chave, feedback) values
  (1, $q$Roupas$q$, $q$👗$q$, $q$Dança do momento com look bonito$q$, $q$video$q$, $q$desejo$q$, $q$https://www.tiktok.com/@alicecantuaria25/video/7669514962380918034$q$, $q$7669514962380918034$q$, $q$Chama atenção por ser a dancinha do momento e faz a pessoa se interessar pelo look babado$q$),
  (2, $q$Roupas$q$, $q$👗$q$, $q$Trend com música em alta$q$, $q$video$q$, $q$desejo$q$, $q$https://www.instagram.com/reel/DdeRO9BqZG-/$q$, $q$DdeRO9BqZG-$q$, $q$Roupa chamativa com música em alta$q$),
  (3, $q$Roupas$q$, $q$👗$q$, $q$Roupas que toda garota que estuda e trabalha deve ter$q$, $q$carrossel$q$, $q$desejo$q$, $q$https://www.instagram.com/p/DdbtNXrlU9Q/$q$, $q$DdbtNXrlU9Q$q$, $q$Também funciona como conexão, pelo efeito "olha, eu sou uma garota que estuda e trabalha, vou dar atenção para esse conteúdo", ao mesmo tempo que desperta desejo$q$),
  (4, $q$Roupas$q$, $q$👗$q$, $q$Takes do produto com headline e música em alta$q$, $q$video$q$, $q$desejo$q$, $q$https://www.instagram.com/p/DezvJtMxVpa/$q$, $q$DezvJtMxVpa$q$, $q$Em vez de dancinha, mostra a blusa em vários takes rápidos e transforma isso em conteúdo$q$),
  (5, $q$Roupas$q$, $q$👗$q$, $q$Respondendo hater$q$, $q$video$q$, $q$desejo$q$, $q$https://www.instagram.com/p/DQr2L6ECQ-A/$q$, $q$DQr2L6ECQ-A$q$, $q$Responder alguém que discorda da marca faz quem concorda ficar mais fiel$q$),
  (6, $q$Roupas$q$, $q$👗$q$, $q$Por que não fico elegante$q$, $q$video$q$, $q$objecao$q$, $q$https://www.instagram.com/reel/DcT2aqhR2DR/$q$, $q$DcT2aqhR2DR$q$, $q$Mostra na prática como o mesmo look usado de uma maneira diferente fica muito mais bonito$q$),
  (7, $q$Roupas$q$, $q$👗$q$, $q$Embalando pedido$q$, $q$video$q$, $q$objecao$q$, $q$https://www.tiktok.com/@kamila.motta/video/7473894111959878918$q$, $q$7473894111959878918$q$, $q$Mostra o pedido sendo embalado ao mesmo tempo que mostra a beleza do produto e a experiência de compra, provando que é uma loja real$q$),
  (8, $q$Roupas$q$, $q$👗$q$, $q$Esse é o produto que mais sai da minha loja e vou te explicar o porquê$q$, $q$video$q$, $q$objecao$q$, $q$https://www.tiktok.com/@naatfrodl/video/7473247185648291077$q$, $q$7473247185648291077$q$, $q$Fala sobre a composição do produto, exaltando ele e fazendo as pessoas enxergarem VALOR$q$),
  (9, $q$Roupas$q$, $q$👗$q$, $q$Roupa com feedback$q$, $q$video$q$, $q$objecao$q$, $q$https://www.instagram.com/p/Dejeci7JJIO/$q$, $q$Dejeci7JJIO$q$, $q$Mesmo sendo um vídeo simples, o feedback da cliente faz outras pessoas sentirem mais confiança em comprar da loja$q$),
  (10, $q$Roupas$q$, $q$👗$q$, $q$5 motivos$q$, $q$video$q$, $q$objecao$q$, $q$https://www.instagram.com/reel/DdJ9OkYpWAr/$q$, $q$DdJ9OkYpWAr$q$, $q$Dá motivos para a pessoa que estava indecisa comprar logo$q$),
  (11, $q$Roupas$q$, $q$👗$q$, $q$Uma peça, várias formas de usar$q$, $q$video$q$, $q$objecao$q$, $q$https://www.instagram.com/reel/DZKm69tuCzP/$q$, $q$DZKm69tuCzP$q$, $q$Mostra a peça em diferentes formas de usar$q$),
  (12, $q$Roupas$q$, $q$👗$q$, $q$A blusa x o processo$q$, $q$carrossel$q$, $q$conexao$q$, $q$https://www.instagram.com/p/Dcv8lTpltw2/$q$, $q$Dcv8lTpltw2$q$, $q$Mostra o produto junto com os bastidores dele. Perfeito para gerar conexão e fazer a cliente se sentir mais próxima da loja$q$),
  (13, $q$Roupas$q$, $q$👗$q$, $q$Pessoas usando a marca$q$, $q$video$q$, $q$conexao$q$, $q$https://www.instagram.com/p/DepCBP7xEtl/$q$, $q$DepCBP7xEtl$q$, $q$A música melancólica com a headline faz as pessoas pararem no vídeo e perceberem que tem uma pessoa por trás da marca, o que traz humanização$q$),
  (14, $q$Roupas$q$, $q$👗$q$, $q$Frase afetiva da dona: "em algum lugar tem uma mulher usando uma peça da minha loja"$q$, $q$carrossel$q$, $q$conexao$q$, $q$https://www.instagram.com/p/DeriCBJkfus/$q$, $q$DeriCBJkfus$q$, $q$Faz a pessoa se conectar com a loja através da humanização$q$),
  (15, $q$Roupas$q$, $q$👗$q$, $q$Bastidores da loja$q$, $q$video$q$, $q$conexao$q$, $q$https://www.instagram.com/reel/Dbok9o8Pk94/$q$, $q$Dbok9o8Pk94$q$, $q$Conecta com a cliente mostrando que tem pessoas por trás da loja$q$),
  (16, $q$Roupas$q$, $q$👗$q$, $q$Fotos de cliente$q$, $q$carrossel$q$, $q$conexao$q$, $q$https://www.instagram.com/p/DZaNP1BFuAg/$q$, $q$DZaNP1BFuAg$q$, $q$Mostra como a marca valoriza as clientes, colocando elas como inspiração$q$),
  (17, $q$Roupas$q$, $q$👗$q$, $q$Look com desconto na legenda$q$, $q$video$q$, $q$oferta$q$, $q$https://www.instagram.com/p/DdEiTaUquDZ/$q$, $q$DdEiTaUquDZ$q$, $q$Mostra o look e coloca o desconto na legenda$q$),
  (18, $q$Roupas$q$, $q$👗$q$, $q$Embalando pedido com desconto$q$, $q$video$q$, $q$oferta$q$, $q$https://www.instagram.com/reel/DbBjTWQpIRx/$q$, $q$DbBjTWQpIRx$q$, $q$Mostra o pedido sendo embalado e informa sobre a promoção no site$q$);

-- 1. Cria o nicho se ainda não existir
insert into public.nichos_acervo (nome, ordem, emoji)
select n.nicho, coalesce((select max(ordem) from public.nichos_acervo), 0) + 1, min(n.emoji)
from novas_ideias n
where not exists (select 1 from public.nichos_acervo x where regexp_replace(lower(trim(x.nome)), 's$', '') = regexp_replace(lower(trim(n.nicho)), 's$', ''))
group by n.nicho;

-- 2. Marca os posts que já estão no banco (compara o código do post, ignorando ?parâmetros)
update novas_ideias n set ja_existia = true
where exists (select 1 from public.conteudos_acervo c where coalesce(substring(c.link from 'instagram\.com/(?:[^/]+/)?(?:p|reel|reels|tv)/([^/?#]+)'), substring(c.link from 'tiktok\.com/.*/(?:video|photo)/([0-9]+)'), rtrim(split_part(c.link, '?', 1), '/')) = n.chave);

-- 3. Sobe só as novas
insert into public.conteudos_acervo (nicho_id, titulo, feedback, formato, tipo_cqc, link, ativo)
select (select x.id from public.nichos_acervo x where regexp_replace(lower(trim(x.nome)), 's$', '') = regexp_replace(lower(trim(n.nicho)), 's$', '') order by x.id limit 1),
       n.titulo, n.feedback, n.formato, n.tipo_cqc, n.link, true
from novas_ideias n
where not n.ja_existia
order by n.ordem desc;

-- 4. Resumo
select
  count(*) filter (where not ja_existia) as entraram_agora,
  count(*) filter (where ja_existia)     as ja_existiam,
  coalesce(string_agg(titulo, ' | ') filter (where ja_existia), '') as quais_ja_existiam
from novas_ideias;
