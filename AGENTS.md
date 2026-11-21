# Instructions for coding agents

Read `docs/AI_HANDOFF.md`, `docs/ROADMAP.md`, `README.md`, `docs/LOCAL_FIRST_WORKFLOW.md` and `docs/GO_LIVE_CHECKLIST.md` before making product changes.

- Repository: `Blackleets/microdrama-studio`.
- Work only on `feat/streaming-cinematic-motion` (or a named child feature branch based on its latest commit). Never push to `main`.
- Never merge PR #1 without explicit owner approval.
- Preserve all localStorage/IndexedDB data, keys, schemas, media blobs, backups and migrations. No resets or destructive migrations.
- Supabase remains deferred. Keep the app usable without Supabase credentials.
- Do not claim planned integrations are implemented. No fake buttons or fake catalog rights.
- Fetch latest file contents before editing; do not use stale file versions or SHAs.
- Add/update E2E tests for user-facing behavior. Run `npm run lint`, `npm run build`, and `npm run test:e2e`; report exact results.
- Keep the UI premium, cinematic, accessible, responsive and performant. Respect `prefers-reduced-motion`.
- Update `docs/ROADMAP.md` and `docs/AI_HANDOFF.md` when the state changes.
- Do not touch secrets, deployment configuration or production data without approval.
