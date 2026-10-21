# Integração Lastlink + n8n + planilha do Método

## Como funciona
* Compra aprovada na Lastlink: o n8n cria o login da aluna, manda o e-mail pra ela criar a senha e libera 1 ano de acesso
* Renovação: o acesso ganha mais 1 ano a partir do pagamento novo
* Reembolso ou chargeback: o acesso fecha na hora (nada é apagado, a aluna só fica como Reembolsada ou Cancelada)
* Cada aviso da Lastlink vira uma linha na aba **Vendas** da planilha
* A cada 30 minutos o n8n atualiza a aba **Alunas** com a situação de cada uma e as respostas da pesquisa

## 1. Banco (Supabase)
* [ ] SQL Editor > New query > colar o arquivo `supabase/integracao-lastlink.sql` inteiro > **Run**
* [ ] No fim aparece `alunas_na_planilha`. Apareceu? Deu certo

## 2. E-mails do Supabase (sem isso as alunas NÃO recebem o e-mail de acesso)
O e-mail padrão do Supabase só entrega pra quem é da sua equipe no Supabase e no máximo 2 por hora. Precisa ligar um envio próprio. Sugestão: Resend (grátis até 3 mil e-mails por mês).
* [ ] Criar conta em resend.com
* [ ] Em **Domains**, adicionar `lnobrega.com` e colocar no seu DNS os registros que ele mostrar. Esperar ficar **Verified**
* [ ] Em **API Keys**, criar uma chave com nome `supabase-metodo` e copiar
* [ ] No Supabase: Authentication > Emails > **SMTP Settings** > ligar **Enable custom SMTP** e preencher:
  * [ ] Sender email: `suporte@lnobrega.com`
  * [ ] Sender name: `Letícia Nóbrega | Método`
  * [ ] Host: `smtp.resend.com`
  * [ ] Port: `465`
  * [ ] Username: `resend`
  * [ ] Password: a chave do Resend (você cola direto lá)
  * [ ] Salvar
* [ ] Authentication > **Rate Limits**: subir "emails sent per hour" pra `100`
* [ ] Authentication > Emails > **Templates** > **Invite user**: trocar o assunto e o texto pelo modelo do fim deste guia
* [ ] Authentication > **URL Configuration**: conferir se o endereço do app está em Site URL e em Redirect URLs (com `/**` no fim)

## 3. Planilha
* [ ] Subir o arquivo `Planilha-Metodo-alunas.xlsx` no Google Drive
* [ ] Abrir com o Google Planilhas e ir em **Arquivo > Salvar como Planilhas Google**
* [ ] Copiar o link da planilha nova (é ela que o n8n vai usar)

## 4. Ligar o n8n ao Google Planilhas (uma vez só)
* [ ] Entrar em console.cloud.google.com e criar um projeto chamado `n8n-lnobrega`
* [ ] Em **APIs e serviços > Biblioteca**, ativar **Google Sheets API** e **Google Drive API**
* [ ] Em **APIs e serviços > Credenciais**: **Criar credenciais > Conta de serviço**, nome `n8n`, concluir
* [ ] Abrir a conta de serviço criada > aba **Chaves** > **Adicionar chave > JSON**. Baixa um arquivo
* [ ] No n8n: **Credentials > Add credential > Google Service Account API**. Colar o `client_email` e a `private_key` do arquivo baixado. Salvar com o nome `Google Planilhas`
* [ ] Na planilha, clicar em **Compartilhar** e adicionar o `client_email` da conta de serviço como **Editor**

## 5. Ligar o n8n ao Supabase do Método
* [ ] No n8n: **Credentials > Add credential > Supabase API**
* [ ] Host: `https://ivfgpircfwwgpumrrcwp.supabase.co`
* [ ] Service Role Secret: a chave `service_role` do Supabase (você cola direto lá)
* [ ] Salvar com o nome `Método Supabase`

## 6. Importar os fluxos no n8n
Para cada arquivo da pasta `n8n`: no n8n, **Create workflow > menu ... > Import from file**.
* [ ] `1-lastlink-acesso.json`
  * [ ] Nó **Conferir e preparar**: preencher no topo o `TOKEN_LASTLINK` (o token que aparece na Lastlink, na tela do webhook) e o `APP_URL` (endereço do app)
  * [ ] Nós **Enviar convite**, **Liberar no banco** e **Bloquear no banco**: em Credential, escolher `Método Supabase`
  * [ ] Nó **Registrar na aba Vendas**: credencial `Google Planilhas`, colar o link da planilha, aba `Vendas`
  * [ ] Salvar e ligar o botão **Active**
* [ ] `2-planilha-alunas.json`
  * [ ] Nó **Buscar alunas e respostas**: credencial `Método Supabase`
  * [ ] Nó **Atualizar aba Alunas**: credencial `Google Planilhas`, link da planilha, aba `Alunas`, coluna de comparação `E-mail`
  * [ ] Clicar em **Test workflow** uma vez pra ver as alunas aparecendo na planilha
  * [ ] Salvar e ligar **Active**
* [ ] `3-importar-alunas-antigas.json` (fica desligado, você roda na mão)
  * [ ] Nó **Preparar**: preencher o `APP_URL` no topo
  * [ ] Mesmas credenciais dos outros, link da planilha, aba `Importar`

## 7. Webhook na Lastlink
* [ ] Lastlink > Integrações > Webhooks > novo webhook
* [ ] URL: `https://n8n.lnobrega.cloud/webhook/metodo-lastlink`
* [ ] Produto: só o **Método Loja Online Lucrativa**
* [ ] Eventos: Compra aprovada (`Purchase_Order_Confirmed`), Pagamento recorrente (`Recurrent_Payment`), Reembolso (`Payment_Refund`) e Chargeback (`Payment_Chargeback`)
* [ ] Copiar o token que a Lastlink mostra e colar no `TOKEN_LASTLINK` do fluxo 1
* [ ] Mandar um evento de teste e conferir se apareceu uma linha na aba **Vendas**

## 8. Trazer as alunas que já compraram
* [ ] Exportar as compradoras do Método na Lastlink
* [ ] Colar na aba **Importar**: Nome, E-mail, WhatsApp, Data da compra (dia/mês/ano)
* [ ] No n8n, abrir o fluxo 3 e clicar em **Test workflow**. Ele manda um e-mail a cada 3 segundos
* [ ] Conferir a coluna **Resultado** na aba Importar. Se rodar de novo, quem já foi importada é pulada

## Modelo do e-mail de convite (Supabase > Templates > Invite user)
Assunto: `Seu acesso ao Método chegou 💗`

```html
<div style="font-family:Poppins,Arial,sans-serif;background:#f5f4f6;padding:32px 16px">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;color:#1c1519">
    <p style="font-size:22px;font-weight:700;margin:0 0 16px">Bem-vinda ao Método! 🎉</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px">Seu acesso ao app do Método Loja Online Lucrativa está liberado. Clica no botão pra criar a sua senha e começar.</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#d10f67;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:999px">Criar minha senha</a>
    <p style="font-size:13px;color:#736b71;line-height:1.6;margin:24px 0 0">Se o link expirar, é só entrar no app e clicar em "Esqueci minha senha".</p>
    <p style="font-size:13px;color:#736b71;margin:16px 0 0">Com carinho, Letícia</p>
  </div>
</div>
```
