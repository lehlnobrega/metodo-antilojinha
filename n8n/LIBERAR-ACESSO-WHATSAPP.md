# n8n do Método: Lastlink libera acesso + WhatsApp + Margem Certa

## Como funciona
* Compra aprovada: cria o login da aluna (sem e-mail), libera 1 ano de Método, libera o Margem Certa até a mesma data e manda o WhatsApp com o link de primeiro acesso
* Renovação: mais 1 ano no Método e no Margem Certa, com WhatsApp de renovação
* Reembolso ou chargeback: fecha o Método e o Margem Certa (o Margem Certa só fecha se o acesso dela lá veio do Método)
* Todo dia às 3h: quem completou o ano de Método perde o Margem Certa também. O app do Método já fecha sozinho pela data
* Quem comprou o Margem Certa à parte e tem plano indo mais longe nunca perde o acesso por causa do Método

## 1. Banco do Método (se ainda não rodou)
* [ ] SQL Editor do Supabase do Método > colar `supabase/integracao-lastlink.sql` inteiro > **Run**

## 2. Credencial do Método no n8n (se ainda não criou)
* [ ] n8n > **Credentials > Add credential > Supabase API**
* [ ] Host: `https://ivfgpircfwwgpumrrcwp.supabase.co`
* [ ] Service Role Secret: a chave `service_role` do Supabase do Método (você cola direto lá)
* [ ] Salvar com o nome `Método Supabase`

## 3. Importar o fluxo principal
* [ ] n8n > **Create workflow > menu ... > Import from file** > `1-lastlink-acesso-whatsapp.json`
* [ ] Nó **Conferir e preparar**: colar no topo o `TOKEN_LASTLINK` (o token do webhook do Método na Lastlink)
* [ ] Nós **Criar login**, **Liberar no Método** e **Bloquear no Método**: escolher a credencial `Método Supabase`
* [ ] Nós do Margem Certa: conferir se está a credencial `Margem Certa Supabase` (já vem marcada)
* [ ] Nós **WhatsApp boas-vindas** e **WhatsApp renovação**: conferir a credencial `Evolution account` e a instância `leticia`
* [ ] Nó **Registrar na aba Vendas** (opcional): credencial do Google e link da planilha. Se não ligar, o resto funciona igual
* [ ] Salvar e ligar o botão **Active**

## 4. Importar o fluxo do fim do ano
* [ ] Importar `4-fim-do-acesso-margem-certa.json`
* [ ] Nó **Buscar alunas vencidas**: credencial `Método Supabase`
* [ ] Nós do Margem Certa: credencial `Margem Certa Supabase`
* [ ] Salvar e ligar **Active**

## 5. Webhook na Lastlink
* [ ] Lastlink > Integrações > Webhooks > novo webhook só pro produto **Método Loja Online Lucrativa**
* [ ] URL: `https://n8n.lnobrega.cloud/webhook/metodo-lastlink`
* [ ] Eventos: `Purchase_Order_Confirmed`, `Recurrent_Payment`, `Payment_Refund` e `Payment_Chargeback`
* [ ] Copiar o token e colar no `TOKEN_LASTLINK` do fluxo
* [ ] Fazer uma compra de teste com o seu e-mail e WhatsApp e conferir: chegou a mensagem, o primeiro acesso funcionou no Método e no Margem Certa

## Mensagem de boas-vindas que vai no WhatsApp
oie, Maísa! 👋

Sua compra foi confirmada e o seu acesso ao *Método Loja Online Lucrativa* já está liberado! 🎉

*1. Crie a sua senha do app do Método:*
👉 metodo.lnobrega.com/primeiro-acesso

*2. Você também tem acesso ao Margem Certa*, a ferramenta de precificação. Crie a sua senha lá com o mesmo e-mail:
👉 margemcerta.online/criar-senha

Use o e-mail da compra nos dois:
📧 email@dela.com

O seu acesso vale por 1 ano, até 23/10/2027.

Qualquer dúvida é só me chamar aqui. Bem-vinda! 💗
