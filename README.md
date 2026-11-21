# MicroDrama Studio

AI-assisted production workspace for vertical micro-series, paired with a mobile-first consumer streaming catalog.

## Product surfaces

- **Streaming App** at `/` and `/streaming`: discovery catalog, featured series, genre filters, search, saved list, series detail and vertical 9:16 player shell.
- **Private Studio** at `/studio`: command center, story bible, character studio, script room, storyboard, AI production preparation, editorial approval, distribution and revenue planning.
- **Media Asset Registry** at `/studio/assets`: versioned production assets, episode linkage, browser-local file import/preview through IndexedDB, and manually maintained master metadata.
- **Local publishing bridge**: a series created in Studio can enter the local streaming catalog only after every episode has editorial status `Aprobado` and the owner publishes its catalog entry.
- **Hybrid production**: live-action AI and animated-universe adapters are planned, with owner approval required before release.
- **Business model**: free episodes, premium unlocks and subscriptions are designed; payment processing is not connected.

## Current development mode

The product runs in **local-first mode** so development can continue before the Supabase project is available.

- Studio data (series, story bibles, characters, episodes, scripts and storyboard notes) is saved in browser localStorage.
- Asset metadata is saved in localStorage; imported media files are stored in IndexedDB in the current browser profile. Video masters must have a local file and manually completed technical metadata to pass the local release gate. Basic dimensions/duration are read from browser media metadata when available.
- Streaming watchlist is saved in browser localStorage.
- Published Studio series are read from the same browser's local Studio data and shown in the streaming catalog after editorial approval.
- The streaming player is a UI shell. It clearly marks video as not connected; it does not pretend to play media.
- Script structure preparation is an editable local template, not an AI-generated provider result.
- Local data is specific to the current browser/device. It is not backed up or synchronized across devices.

## Stack

Next.js 15, React 19, TypeScript, Tailwind CSS 4 and lucide-react. Supabase Auth, Postgres and Storage remain the planned backend. Provider integrations will sit behind adapters so image, video, voice and language-model vendors can be replaced without rewriting product workflows.

## Local setup

1. Install Node.js 20.9+.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Supabase is not required for the current local-first workspace. The database migrations and server-side integration scaffolding remain in the repository for the later backend connection.

## Not yet implemented

Actual audiovisual generation, streaming playback and CDN delivery, cloud asset storage, automatic codec/FPS/track inspection, checksum generation, production authentication, cross-device persistence, payments, wallet ledger, live analytics, subscriptions and release automation. Local asset preview is available only inside the Studio browser that imported the file.
