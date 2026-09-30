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

## FluentRise architecture rules
- Design tokens live only in `src/styles.css` (paper/ink/accent/correct/incorrect, Fraunces + IBM Plex); components never hardcode colors, so theming stays in one place.
- Learner data is read/written from the browser Supabase client under RLS; only the AI tutor uses a server function (`src/lib/tutor.functions.ts`) so the AI key stays server-side.
- Exercise rendering and grading are centralised in `src/components/ExercisePlayer.tsx` + `src/lib/cefr.ts`, so new exercise types are added in one place.
- Schema changes go through migrations; content rows are seeded with SQL data statements, because the migration tool rejects data-only SQL.
