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

## GIA prototype
- Auth is real (Lovable Cloud); /app is ssr:false and gated in its beforeLoad via loadSession in src/lib/auth.ts. Business screens still read src/lib/mock.ts until connected. Why: staged migration off mock data.
- Internal system lives under /app (layout in src/routes/app.tsx); public site pages wrap content in SiteLayout. Why: separate chrome for public vs ERP.
