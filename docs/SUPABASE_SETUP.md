# Supabase setup

The Studio code expects a dedicated Supabase project. Do not connect it to an unrelated production database.

## Configure the project

1. Create a dedicated Supabase project in a European region.
2. Enable Email/Password authentication.
3. Disable public sign-ups after the owner account has been provisioned. Create the owner account from the Supabase Auth dashboard or an administrator invite.
4. Enable the Data API for the required public schema tables if the project has the new opt-in exposure setting.
5. Apply migrations in order: `0001_initial_schema.sql`, `0002_rls_hardening.sql`, `0003_auth_function_hardening.sql`.
6. Create private Storage buckets named `studio-private` and `published-media`. Do not make draft assets public.
7. Add the Project URL and publishable key to deployment environment variables.

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `GEMINI_API_KEY` (optional; server-side only, for Story Engine draft generation)
- `GEMINI_MODEL` (optional; defaults to `gemini-3.8-flash`)
- `GEMINI_DAILY_DRAFT_LIMIT` (optional; maximum 1–100 draft requests per UTC day, defaults to 20)

Never add service-role or secret API keys to `NEXT_PUBLIC_*` variables or commit them to Git.

## Current integration status

The app has an email/password sign-in route, cookie-based SSR clients, session refresh middleware, and owner-scoped server actions for series, the story bible, characters, episodes, versioned scripts and scenes. The Script Room can call the Gemini Interactions API from a server action and save the result as a new draft version. AI generation remains disabled until GEMINI_API_KEY is configured in the server environment. These features become live only after the dedicated Supabase project is configured and migrations are applied.

The existing Supabase account currently exposes a project named `Blackleets's Project` that is inactive. It has not been restored or modified because it has not been confirmed as the database for this product.
