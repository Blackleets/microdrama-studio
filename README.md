# MicroDrama Studio

A private AI-powered production studio and vertical micro-series streaming platform.

## Product architecture

- **Studio** — private production workspace for story development, scripts, characters, storyboards, generation jobs, review, approval and release.
- **Stream** — mobile-first vertical series discovery and episode playback.
- **Hybrid production** — AI-assisted generation with mandatory owner review before publication.
- **Mixed visual language** — photoreal live action, 2D and 3D animation can coexist within a series.

## Stack

Next.js 15, React 19, TypeScript, Tailwind CSS 4, Supabase (Auth, Postgres, Storage). Provider integrations are designed behind adapters so image, video, voice and language-model vendors can be replaced without rewriting product workflows.

## Local setup

1. Install Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in Supabase values.
4. Run `npm run dev`.

The first milestone is the Studio shell and production workflow. External AI generation, billing and streaming delivery remain disabled until credentials and provider contracts are configured.
