# Como colocar o app do Método no ar pela Easypanel

## Antes de começar
* [ ] Código novo no GitHub (repositório `lehlnobrega/metodo-antilojinha`)
* [ ] Chave `service_role` do Supabase em mãos (Supabase > Project Settings > API Keys > legacy). Ela vai SÓ na Easypanel, nunca em conversa, print ou código
* [ ] Chave da IA criada no Claude Console (platform.claude.com > API keys), começa com `sk-ant-`

## 0. Atualizar o banco (uma vez só, antes de publicar)
* [ ] Supabase > projeto Método > **SQL Editor** > **New query**
* [ ] Colar o arquivo inteiro `supabase/atualizacao-novo-visual.sql` e clicar em **Run**
* [ ] No fim aparece uma tabelinha com `formatos_virais`, `bonus` (1) e `bonus_itens`. Se apareceu, deu certo
* [ ] Ele só adiciona coisas (situação "pausada", plano finalizado, formatos virais, bônus). Nada das alunas é apagado e pode rodar de novo sem problema
* [ ] O app atual do Lovable continua funcionando normal depois disso

## 1. Criar o app na Easypanel
* [ ] Abrir o projeto na Easypanel e clicar em **+ Service > App**
* [ ] Nome: `metodo-app`
* [ ] Em **Source**, escolher **GitHub**, repositório `lehlnobrega/metodo-antilojinha`, branch `main`
* [ ] Em **Build**, escolher **Dockerfile** (o arquivo já está pronto na raiz do projeto)
* [ ] Ligar o **Auto Deploy** (na aba Source ou Deployments). Assim, toda vez que o código novo chegar no GitHub, a Easypanel publica sozinha

## 2. Variáveis de ambiente (aba Environment)
Cole assim, trocando os valores entre aspas:

```
METODO_SUPABASE_SERVICE_ROLE_KEY=cole-aqui-a-service-role
ANTHROPIC_API_KEY=cole-aqui-a-chave-do-claude
```

Opcional (só se quiser trocar o modelo de IA depois; o padrão é o Claude Haiku 5.5):

```
IA_MODELO=claude-haiku-5-5
```

* [ ] Salvar as variáveis

## 3. Domínio (aba Domains)
* [ ] Adicionar o domínio, por exemplo `app.lnobrega.com`
* [ ] Porta do container: `3000`
* [ ] HTTPS ligado
* [ ] No painel do seu domínio (onde ele está registrado), criar um registro **A** apontando `app` para o IP do servidor da Easypanel

## 4. Avisar o Supabase do endereço novo
Sem isso, os e-mails de "esqueci minha senha" e "criar senha" mandam a aluna pro endereço antigo do Lovable.
* [ ] Supabase > Authentication > URL Configuration
* [ ] **Site URL**: `https://app.lnobrega.com`
* [ ] **Redirect URLs**: adicionar `https://app.lnobrega.com/**`

## 5. Publicar
* [ ] Clicar em **Deploy** e esperar terminar (uns 2 a 4 minutos)
* [ ] Abrir o domínio e testar: login, Plano prático, um material, a IA do Método e o analisador de site

## Depois que estiver no ar
* [ ] Avisar as alunas do link novo (o login e a senha continuam os mesmos)
* [ ] Toda alteração enviada pro GitHub pode ser publicada de novo com um clique em **Deploy** (ou ligando o **Auto Deploy** na Easypanel)

## Trocar o visual quando a identidade da designer chegar
Tudo fica no começo do arquivo `src/styles.css`, no bloco `:root`:
* [ ] `--fonte-texto` e `--fonte-titulo`: as fontes
* [ ] `--primary`, `--accent`, `--accent-soft`, `--destaque`: as cores da marca
* [ ] `--background`, `--foreground`, `--border`: fundo, texto e linhas
* [ ] `--radius`: o arredondado dos cards
* [ ] Se a fonte nova for do Google Fonts, trocar também o link em `src/routes/__root.tsx`
