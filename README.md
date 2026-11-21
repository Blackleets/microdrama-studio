# MicroDrama Studio

AI-assisted production workspace for vertical micro-series, paired with a mobile-first consumer streaming catalog.

## Product surfaces

- **Streaming App** at `/` and `/streaming`: discovery catalog, featured series, genre filters, search, saved list, series detail and vertical 9:16 player shell.
- **Private Studio** at `/studio`: command center, story bible, character studio, script room, storyboard, AI production preparation, editorial approval, distribution and revenue planning.
- **Media Asset Registry** at `/studio/assets`: versioned production assets, episode linkage, browser-local file import/preview through IndexedDB, subtitle validation, language metadata and SHA-256 for supported file sizes.\n- **Post-production editor** at `/studio/post-production`: episode EDL with ordered scenes, duration planning, real local video/audio previews, audio/subtitle asset assignment and named edit snapshots.
- **Local publishing bridge**: a series created in Studio can enter the local streaming catalog only after every episode has editorial status `Aprobado` and the owner publishes its catalog entry.
- **Hybrid production**: live-action AI and animated-universe adapters are planned, with owner approval required before release.
- **Business model**: free episodes, premium unlocks and subscriptions are designed; payment processing is not connected.

## Current development mode

The product runs in **local-first mode** so development can continue before the Supabase project is available.

- Studio data (series, story bibles, characters, episodes, scripts and storyboard notes) is saved in browser localStorage.
- Asset metadata is saved in localStorage; imported media files are stored in IndexedDB in the current browser profile. Every episode must have its own current vertical video master with an audio track, plus a locally attached SRT/WebVTT subtitle file that passes structural validation, to pass the local release gate. Basic dimensions/duration are read from browser media metadata when available.
- Streaming watchlist is saved in browser localStorage.
- Published Studio series are read from the same browser's local Studio data and shown in the streaming catalog after editorial approval.
- The streaming player can play approved episode masters stored in this browser profile via IndexedDB and attach validated local SRT/WebVTT captions when available. Catalog-only/demo titles without a local master are clearly marked as unavailable. This is local playback, not public CDN delivery.
- Post-production edits are local EDL data: the editor previews original files but does not trim, mix, transcode or render a finished episode.\n- Script structure preparation remains available locally; external AI generation requires a configured and verified provider key/model.
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

Actual audiovisual generation, rendered episode export, public streaming/CDN delivery, cloud asset storage, automatic codec/FPS/track inspection, large-file checksum verification, production authentication, cross-device persistence, payments, wallet ledger, live analytics, subscriptions and release automation. Local asset preview is available only inside the Studio browser that imported the file.
