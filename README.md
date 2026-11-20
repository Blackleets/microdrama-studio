# MicroDrama Studio

AI-assisted production workspace for vertical micro-series, designed to grow into a complete creator studio and consumer streaming app.

## Product architecture

- **Studio** — story development, series bible, characters, scripts, storyboard, production preparation, editorial review and release planning.
- **Stream** — planned mobile-first vertical series discovery and playback app.
- **Hybrid production** — live-action AI and animated-universe adapters, with owner approval required before publication.
- **Business model** — free episodes, premium unlocks and subscriptions are designed; payment processing is not connected yet.

## Current development mode

The Studio currently runs in **local-first mode** so product work can continue before the Supabase project is available.

- Series, story bibles, characters, episodes, scripts and storyboard notes are saved in the browser's localStorage.
- A starter example series is included on first launch.
- The workspace is responsive and supports navigation between its production modules.
- Local data is specific to the current browser/device. It is not backed up or synchronized across devices.
- No real image, video, voice or LLM generation is triggered in local mode. Script structure preparation is a local editable template, not a provider-generated result.
- Editorial approval in local mode is a planning state only; it does not publish content.

## Stack

Next.js 15, React 19, TypeScript, Tailwind CSS 4. Supabase Auth, Postgres and Storage remain the planned backend. Provider integrations will sit behind adapters so image, video, voice and language-model vendors can be replaced without rewriting product workflows.

## Local setup

1. Install Node.js 20.9+.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Supabase is not required for the current local-first workspace. The database migrations and server-side integration scaffolding remain in the repository for the later backend connection.

## Not yet implemented

Public streaming/player, real AI media generation, provider job queues, cloud asset storage, production authentication, cross-device persistence, payments, wallet ledger, live analytics and release/CDN delivery.
