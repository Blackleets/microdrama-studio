# AI handoff — MicroDrama Studio

Last updated: 2026-11-21  
Repository: `Blackleets/microdrama-studio`  
Active working branch: `feat/streaming-cinematic-motion`  
Base branch: `main` (do not push directly)  
Open draft PR: https://github.com/Blackleets/microdrama-studio/pull/1  
Latest known branch commit: `a0c9a0abe581cbef8d51c85926fa0e8a3d7f9098`  
Latest known preview: https://microdrama-studio-p7buxrcyj-nfyns-projects-b0cc0f41.vercel.app  
Preview state when this handoff was written: **READY** (Vercel deployment `dpl_DhVy712P5b2MGHCUB34N9oVXjeWy`).

## Mission

Build a polished, reliable vertical microdrama product with two connected surfaces:
1. A consumer streaming experience for discovering and watching short-form vertical series.
2. A local-first production workspace for creating, assembling, reviewing and locally publishing those series.

The product should feel like a premium streaming startup, not a generic admin dashboard. The streaming app should be cinematic, editorial and mobile-first. The Studio can be information-dense, but should remain clear and production-oriented.

## Read these before editing

- `README.md` — current capabilities, local-first constraints and explicit non-goals.
- `docs/LOCAL_FIRST_WORKFLOW.md` — real end-to-end local production workflow.
- `docs/GO_LIVE_CHECKLIST.md` — production blockers and launch gate.
- `docs/AI_HANDOFF.md` — this handoff.
- `docs/ROADMAP.md` — ordered backlog and acceptance criteria.
- `src/app/streaming/streaming-app.tsx` — consumer catalog, details and player.
- `src/app/globals.css` — shared visual system and streaming/Studio styling.
- `src/app/studio/local-workspace.tsx` — primary local-first production workspace.
- `src/app/studio/assets/page.tsx` — asset registry.
- `src/app/studio/post-production/page.tsx` — EDL and browser-local rendering.
- `e2e/` and `.github/workflows/ci.yml` — current browser tests and CI.

## Current implemented state

- Next.js 16 / React 19 / TypeScript / Tailwind CSS 4 / lucide-react.
- `/` redirects to `/streaming`; `/streaming` is the consumer app; `/studio` is the local-first production workspace.
- Streaming includes editorial hero, four original SVG demo artworks, catalog cards, genre/search filters, favorites/watchlist, series detail modal, episode selection and a vertical player.
- Mobile bottom navigation and detail-page episode list are implemented on the active branch.
- Detail/player modal has dialog semantics and Escape-key dismissal.
- Studio stores working data in browser localStorage; imported media blobs are in IndexedDB.
- Approved episode masters can be played in the same browser profile. Validated local SRT/WebVTT captions can be attached.
- Studio includes asset registry, episode EDL, local WebM render path, editorial review and local publishing gate.
- Studio backup export/restore covers supported metadata and edit plans, but **does not include IndexedDB media blobs**.
- Current catalog's built-in four series are explicitly demo/catalog-demo content, not licensed commercial shows.
- Latest preview is READY, but this does not replace local lint/build/E2E verification. Check GitHub Actions for the latest head commit.

## Hard constraints — do not violate

1. **Do not push directly to `main`.** Work on `feat/streaming-cinematic-motion` or create a clearly named feature branch from its latest head if parallel work is needed.
2. Do not merge PR #1 without explicit owner approval.
3. Do not delete, reset, migrate destructively or overwrite existing user data. Preserve localStorage keys, IndexedDB database/store names and backup compatibility.
4. Do not introduce Supabase or require cloud credentials in this phase. Backend integration is deliberately deferred.
5. Do not mix this repository with any other project/repository.
6. Do not add fake functionality. A button must perform a real action or be clearly disabled/labelled as planned.
7. Do not claim AI image/video/voice generation, public streaming, payments, cloud sync or MP4 rendering exists. They are not currently implemented.
8. Do not convert demo titles into claims of real productions. Preserve demo labels until rights-cleared content exists.
9. Avoid new dependencies unless there is a clear, documented need. Respect `prefers-reduced-motion`, keyboard access and mobile performance.
10. Before changing any file, fetch its latest content from the active branch. Never use stale blob SHAs or replace a file with an old snapshot.
11. Do not modify secrets, environment configuration or production deployment settings without explicit approval.
12. No destructive cleanup of existing workflows, tests, migrations or assets just to make CI green.

## Required workflow for every contribution

1. Fetch latest branch head and inspect current files and recent commits.
2. Read the relevant product docs and tests before editing.
3. Make one coherent, scoped improvement; preserve existing behavior.
4. Add/update tests for changed behavior. Prefer real user-visible flows over implementation-only assertions.
5. Run:
   ```bash
   npm install
   npm run lint
   npm run build
   npm run test:e2e
   ```
6. Report the actual command results. If not run, state that explicitly.
7. Commit to the feature branch and update PR #1 (or open a separate PR if the work is intentionally independent).
8. Verify the matching Vercel preview is READY and tied to the exact commit SHA before sharing it.
9. Update `docs/ROADMAP.md` and this handoff when implementation status materially changes.

## Definition of done

A feature is not done because the UI looks finished. It must:
- work with existing local data and without Supabase;
- handle empty, loading, error and success states;
- work on narrow mobile screens and desktop;
- have keyboard/focus behavior where interactive;
- respect reduced-motion preferences;
- have automated coverage for critical behavior;
- pass lint, production build and E2E on the exact commit;
- have a verified preview deployment;
- be documented without overstating capability.

## Important known limitations

- Local data belongs to one browser profile/device. Clearing browser data or losing the device can remove the only copy.
- JSON backup does not include media blobs stored in IndexedDB.
- The player cannot access local media imported in a different browser profile/device.
- Public streaming/CDN, adaptive bitrate, signed playback and server-side media processing are not built.
- The browser renderer currently exports WebM with hard cuts, not MP4 or transitions.
- AI media generation providers are not wired into production workflows.
- Payments, subscriptions, entitlements, wallet ledger and real analytics are not connected.
- The local rights flag is an operator declaration, not legal verification.

If unsure whether a change could affect stored data or publishing, stop and document the risk rather than guessing.
