# AI handoff — MicroDrama Studio

Last updated: 2026-11-22  
Repository: `Blackleets/microdrama-studio`  
Active working branch: `feat/streaming-cinematic-motion`  
Base branch: `main` (do not push directly)  
Open draft PR: https://github.com/Blackleets/microdrama-studio/pull/1  
Current branch head: always fetch `feat/streaming-cinematic-motion` from GitHub; do not assume a hard-coded SHA is current.  
Latest verified preview for commit `597016276e7f8940bf0cad7d3ca22720f9402dc3`: https://microdrama-studio-3ef7b34uu-nfyns-projects-b0cc0f41.vercel.app (**READY**, preview only). This preview predates the accessibility commits after `5970162`; verify the exact SHA and READY state for the current head before sharing it.  
CI run #321 passed on `5970162` (dependency audit, high-severity audit gate, lint, production build and Playwright browser smoke tests). Accessibility changes after that commit are awaiting their own CI run; do not call the current head verified until that run is green.

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
- Player lifecycle now closes IndexedDB connections in `finally`, releases object URLs on cleanup, handles blocked/missing local media and reports unsupported video decoding; subtitle failures are separated from video playback failures.
- Continue-watching is implemented with versioned localStorage key `microdrama-watch-progress-v1`, 5-second checkpoints, episode/time resume and a consumer row. It is device/browser-profile local; no cross-device sync.
- Mobile bottom navigation and detail-page episode list are implemented on the active branch. Compact 320px and landscape dialog checks are now included in E2E coverage; manual device and screen-reader checks remain pending.
- Detail/player modal has dialog semantics, Escape dismissal, focus trapping/restoration, background scroll lock and a labelled close control.
- Episode lists support Arrow Up/Down, Home and End navigation, expose the current episode with `aria-current`, and use larger touch targets.
- Studio stores working data in browser localStorage; imported media blobs are in IndexedDB.
- Approved episode masters can be played in the same browser profile. Validated local SRT/WebVTT captions can be attached.
- Studio includes asset registry, episode EDL, local WebM render path, editorial review and local publishing gate.
- Studio backup export/restore covers supported metadata and edit plans, but **does not include IndexedDB media blobs**.
- Current catalog's built-in four series are explicitly demo/catalog-demo content, not licensed commercial shows.
- The last verified preview is READY for commit `5970162`, not the later accessibility commits. Check the exact commit SHA on every new preview. CI must pass on the current head; Vercel READY alone does not replace lint/build/E2E verification.

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
- The player cannot access local media imported in a different browser profile/device. Continue-watching progress is local to the same browser profile and currently has no cross-device sync.
- Public streaming/CDN, adaptive bitrate, signed playback and server-side media processing are not built.
- The browser renderer currently exports WebM with hard cuts, not MP4 or transitions.
- AI media generation providers are not wired into production workflows.
- Payments, subscriptions, entitlements, wallet ledger and real analytics are not connected.
- The local rights flag is an operator declaration, not legal verification.

If unsure whether a change could affect stored data or publishing, stop and document the risk rather than guessing.

## Accessibility verification status (2026-11-22)

- Automated coverage added for dialog focus entry, focus trap, Escape dismissal, focus restoration, episode-list Arrow/Home/End navigation and 320px/landscape layout bounds.
- CSS now supports a scrollable modal backdrop, dynamic viewport-height constraints, 44px close/navigation/episode controls and compact 320px header sizing.
- See `docs/MOBILE_ACCESSIBILITY_CHECKLIST.md` for manual checks still required. A screenshot-based browser audit has not been completed in this environment; do not claim visual or assistive-technology sign-off from source review and CI alone.
