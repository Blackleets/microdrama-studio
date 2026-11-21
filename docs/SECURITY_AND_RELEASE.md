# Security and release checklist

## Verified local-first capabilities

- [x] Browser-local Studio for series, story bibles, characters, episodes, scripts and storyboard notes.
- [x] Browser-local media registry with IndexedDB files, asset versions, rights metadata and subtitle structure checks.
- [x] Episode EDL editor with source in/out points, asset previews, snapshots and JSON export.
- [x] Same-browser playback of approved local episode masters with validated subtitle tracks.
- [x] Local release QA gate and explicit owner publication to the browser-local catalog.
- [x] Optional Gemini script-generation endpoint guarded by a separate server-side token; this is not a substitute for production owner authentication.
- [x] JSON backup of local Studio metadata and edit plans; media blobs are not included.

## Required before public production

- [ ] Configure Supabase Auth and restrict Studio routes to authorized owners.
- [ ] Apply SQL migrations and verify RLS using separate owner and non-owner accounts.
- [ ] Keep service-role keys and AI provider keys server-side only.
- [ ] Create private Storage buckets; issue short-lived signed URLs for private assets.
- [ ] Add server-side owner authorization to every mutation and generation endpoint; replace the shared local AI token with per-owner authorization and persistent rate limiting.
- [ ] Make payment webhooks signature-verified and idempotent.
- [ ] Use a transactional server-side ledger for wallet credit/debit.
- [ ] Prevent episode publication without a valid owner approval.
- [ ] Add moderation, rights, privacy and content takedown workflows.
- [ ] Configure durable media backups, monitoring, error reporting and persistent rate limits.
- [ ] Implement production MP4/server-side rendering, transitions, immutable outputs, codec validation and output-integrity tests; the current browser renderer exports WebM only.
- [ ] Configure public streaming/CDN delivery only after signed access and takedown controls are in place.
- [x] Run dependency audit and remediate reported vulnerabilities (current CI audit: no reported vulnerabilities).
- [x] Run ESLint and production build in GitHub Actions; Next.js build performs TypeScript validation.\n- [x] Add and run Playwright Chromium smoke tests for streaming, Studio, asset registry, post-production, protected Gemini endpoint and mobile viewport.

The local-first workflow is usable for same-browser production planning and local playback. It is not a production-ready public service. Do not deploy with real users or payments until the remaining checklist is completed.
