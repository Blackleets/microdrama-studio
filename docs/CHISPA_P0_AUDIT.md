# CHISPA P0 — audit matrix and architecture decision

Date: 2026-11-26  
Scope: repository source review on `feat/streaming-cinematic-motion`  
Master plan: [Issue #6](https://github.com/Blackleets/microdrama-studio/issues/6)

## Decision

**Keep the local-first Studio as the only active `/studio` entry point for this phase.** `src/app/studio/page.tsx` currently renders `LocalWorkspace`, and this is the path that owns the established localStorage/IndexedDB workflow. Treat it as the compatibility baseline for all existing user data.

The Supabase-backed `StudioDashboard` and `/studio/series/[id]` server-action flow are separate scaffolding, not a safe replacement for the local workspace. Do not route users into that flow, delete it, or attempt a bulk migration until Supabase is explicitly provisioned, its schema/RLS is verified, and an export/import/reconciliation/rollback path is tested against real backups.

This is a containment decision, not a claim that the long-term architecture is complete. The future target remains one authenticated, persistent Studio with a deliberate migration from local data.

## Route and data-source matrix

| Surface / path | Current implementation | Data / auth boundary | P0 disposition |
| --- | --- | --- | --- |
| `/` | Redirects to `/streaming` | No independent data store | Keep |
| `/streaming` | Consumer catalog and local player | Built-in demo catalogue plus locally published series; localStorage and IndexedDB | Keep; do not describe as public streaming |
| `/studio` | `src/app/studio/page.tsx` renders `LocalWorkspace` | `microdrama-studio-local-v1` in localStorage; imported media blobs in IndexedDB | Canonical active workspace; preserve keys and stores |
| `/studio/assets` | Asset registry | Local metadata plus IndexedDB media blobs | Keep tied to local workspace |
| `/studio/post-production` | EDL and browser renderer | Local edit plans and IndexedDB media; WebM output | Keep; WebM is not MP4 |
| `/studio/series/[id]` | Supabase-backed series workspace/server actions | Authenticated Supabase owner context; Postgres tables | Dormant backend path; do not make canonical before backend gate |
| `StudioDashboard` | Separate Supabase dashboard component | Supabase client/session and remote records | Do not substitute for `LocalWorkspace` |
| Gemini script drafting | Optional server-side text generation path | Server-held Gemini key plus local access token; Supabase-backed action path also exists | Text draft only; not image/video/voice generation |

## Data preservation constraints

- Preserve localStorage key `microdrama-studio-local-v1`, all related versioned keys, IndexedDB database/store names, existing records and media blobs.
- Preserve the existing JSON backup schema and restore behavior. Current JSON backups do not contain IndexedDB media blobs; users must retain original media separately.
- Do not add an automatic redirect from the local Studio to the Supabase route.
- Do not copy or merge local records into remote tables until stable IDs, duplicate handling, conflict rules, media upload verification and rollback are implemented and tested.
- Do not delete the Supabase scaffold; it is not currently safe to activate as the default.

## Verified product boundaries

- Local browser rendering creates WebM, not server-rendered MP4.
- Streaming playback is limited to media available in the same browser profile; no CDN/adaptive streaming or cross-device resume is present.
- Provider adapters for real AI image/video/voice generation are not connected to a production pipeline.
- Payments, subscriptions, entitlements and a server-authoritative wallet ledger are not implemented.
- A successful CI run or Vercel preview does not prove those external capabilities.

## Next implementation gates

1. Add regression tests proving that the existing local workspace can open, create/edit a series, export a backup and restore it without changing the stored schema.
2. Add end-to-end tests for the complete local publishing gate: all episodes approved, QA passed, publish, then playback from the local catalog; verify rejection paths.
3. Add an explicit backup warning and recovery path for IndexedDB media blobs, without changing the existing backup format incompatibly.
4. Only after a Supabase project is deliberately provisioned: test migrations and RLS with two owners, then design a reversible importer and reconciliation report.
5. Keep Android, cloud media generation, public streaming and commerce as separate release gates under Issue #6.

## Review evidence

- `AGENTS.md`, `README.md`, `docs/AI_HANDOFF.md`, `docs/ROADMAP.md`, `docs/LOCAL_FIRST_WORKFLOW.md` and `docs/GO_LIVE_CHECKLIST.md` were reviewed.
- The current PR #1 is still a draft and must not be merged without owner approval.
- No production data, secrets, environment variables, migrations or deployment configuration were changed in this audit.
