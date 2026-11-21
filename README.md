# MicroDrama Studio

AI-assisted production workspace for vertical micro-series, paired with a mobile-first consumer streaming catalog.

## Product surfaces

- **Streaming App** at `/` and `/streaming`: discovery catalog, featured series, genre filters, search, saved list, series detail and vertical 9:16 local media player.
- **Local-first Studio** at `/studio`: command center, story bible, character studio, script room, storyboard, AI production preparation, editorial approval, distribution and revenue planning.
- **Media Asset Registry** at `/studio/assets`: versioned production assets with master/scene/trailer/reference roles, episode linkage, browser-local file import/preview through IndexedDB, subtitle validation, language metadata and SHA-256 for supported file sizes.
- **Post-production editor** at `/studio/post-production`: episode EDL with ordered scenes, source in/out points, cumulative timecodes, local previews, audio/subtitle assignment, named snapshots, JSON export and a browser-local WebM renderer that creates a real vertical master.
- **Local publishing bridge**: a series created in Studio can enter the local streaming catalog only after every episode has editorial status `Aprobado`, the release QA gate passes, and the owner publishes its catalog entry.
- **Hybrid production**: live-action AI and animated-universe adapters are planned, with owner approval required before release.
- **Business model**: free episodes, premium unlocks and subscriptions are designed; payment processing is not connected.

## Validation commands

```bash
npm run lint
npm run build
npm run test:e2e
```

GitHub Actions runs dependency auditing, lint, production build and Chromium browser smoke tests.

## Current development mode

The product runs in **local-first mode** so development can continue before the Supabase project is available.

- Studio data (series, story bibles, characters, episodes, scripts and storyboard notes) is saved in browser localStorage. The Studio header can export a JSON backup of series, asset metadata, watchlist, QA checks, edit plans and snapshots; media blobs are not included.
- Asset metadata is saved in localStorage; imported media files are stored in IndexedDB in the current browser profile. Every episode must have a current video asset classified as `Máster de episodio`, with an audio track, plus a locally attached SRT/WebVTT subtitle file that passes structural validation, to pass the local release gate. Scene clips, trailers and references are tracked separately. Basic dimensions/duration are read from browser media metadata when available.
- Streaming watchlist is saved in browser localStorage.
- Published Studio series are read from the same browser's local Studio data and shown in the streaming catalog after editorial approval.
- The streaming player can play approved episode masters stored in this browser profile via IndexedDB and attach validated local SRT/WebVTT captions when available. Catalog-only/demo titles without a local master are clearly marked as unavailable. This is local playback, not public CDN delivery.
- Post-production edits are local EDL data: source in/out points are stored as render instructions and exported to JSON. The browser renderer assembles assigned clips with hard cuts, mixes their audio and an optional soundtrack, and can burn in validated captions. It saves a real WebM master into IndexedDB; it does not export MP4 or add transitions.
- Script structure preparation remains available locally. Optional Gemini script generation works without Supabase when the server has `GEMINI_API_KEY`, an explicitly selected `GEMINI_MODEL` and `LOCAL_STUDIO_AI_TOKEN`; the Google key remains server-side.
- Local data is specific to the current browser/device. A manual JSON backup covers Studio metadata and edit plans, but not IndexedDB media blobs; there is no cloud backup or cross-device synchronization.

## End-to-end local workflow

See [the local-first production workflow](docs/LOCAL_FIRST_WORKFLOW.md) for the full path from series creation and asset import through QA, local publishing and browser playback.

## Optional Gemini setup

See [the secure local Gemini setup guide](docs/LOCAL_GEMINI_SETUP.md).

## Stack

Next.js 16, React 19.2, TypeScript, Tailwind CSS 4 and lucide-react. Supabase Auth, Postgres and Storage remain the planned backend. Provider integrations will sit behind adapters so image, video, voice and language-model vendors can be replaced without rewriting product workflows.

## Local setup

1. Install Node.js 22.13 or newer.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Supabase is not required for the current local-first workspace. The database migrations and server-side integration scaffolding remain in the repository for the later backend connection.

## Not yet implemented

AI image/video/voice generation, MP4/server-side rendering and transitions, public streaming/CDN delivery, cloud asset storage, automatic codec/FPS/track inspection, large-file checksum verification, production authentication, cross-device persistence, payments, wallet ledger, live analytics, subscriptions and release automation. Local media files are available to Studio and Streaming only in the browser profile that imported them.
