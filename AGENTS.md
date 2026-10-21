<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Banco: usar somente o Supabase externo "Método" via src/integrations/metodo (client.ts no navegador, admin.server.ts no servidor com METODO_SUPABASE_SERVICE_ROLE_KEY). Nunca usar src/integrations/supabase nem ativar o Lovable Cloud. Por quê: a usuária exige a base própria dela.
