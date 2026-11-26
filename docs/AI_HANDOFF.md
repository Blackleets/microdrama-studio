# AI handoff — MicroDrama Studio

Last updated: 2026-11-26  
Repository: `Blackleets/microdrama-studio`  
Active working branch: `feat/chispa-p0-audit` (documentation-only child branch from `feat/streaming-cinematic-motion`)  
Base branch: `main` (do not push directly)  
Open draft PR: https://github.com/Blackleets/microdrama-studio/pull/1  
CHISPA master plan: https://github.com/Blackleets/microdrama-studio/issues/6  
Current contribution: [P0 audit matrix and architecture decision](CHISPA_P0_AUDIT.md).

## Current P0 decision

Keep `LocalWorkspace` as the active canonical `/studio` entry point for the current local-first phase. It owns the established browser storage workflow. The Supabase-backed `StudioDashboard` and `/studio/series/[id]` actions are separate scaffolding; do not route users into them, delete them, or migrate data until a Supabase project, RLS, stable identifiers, import reconciliation and rollback are proven. This decision is documented in `docs/CHISPA_P0_AUDIT.md`.

## Current product state and hard constraints

- Next.js 16 / React 19 / TypeScript / Tailwind CSS 4 / lucide-react.
- `/` redirects to `/streaming`; `/studio` is the local-first workspace.
- Studio records use localStorage; media blobs use IndexedDB. Preserve existing keys, schemas, stores, records and backups.
- JSON backups do not contain IndexedDB media blobs.
- Streaming is browser-profile local; no public CDN, adaptive streaming or cross-device sync.
- Browser rendering outputs WebM, not MP4/server-rendered media.
- Real AI image/video/voice production providers are not connected.
- Payments, subscriptions, entitlements, wallet ledger and real analytics are not connected.
- The built-in catalog titles remain demo content, not licensed commercial productions.
- Android packaging/AAB and Google Play readiness are not verified.
- Supabase remains deferred; do not require cloud credentials for the local-first app.
- Do not push directly to `main`, merge PR #1, modify production secrets or deployment configuration, or perform destructive migrations without explicit owner approval.

## Required workflow

1. Fetch the latest branch head and files before editing.
2. Preserve localStorage/IndexedDB and backup compatibility.
3. Make one scoped change per PR and add E2E coverage for behavior changes.
4. Run `npm run lint`, `npm run build` and `npm run test:e2e`; report actual outcomes and never infer success from an old CI run.
5. Keep roadmap and handoff aligned with verified implementation.
6. If credentials or owner actions are required, document the exact blocker and continue independent work.

## Previous verified feature work

PR #1 remains an open draft and contains the streaming cinematic polish, mobile navigation, accessible dialogs, player hardening and local continue-watching changes. Its documented CI successes belong to earlier commits; they are not proof that this new branch has passed CI. Do not merge it without explicit owner approval.
