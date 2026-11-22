# Product roadmap

This roadmap distinguishes the current local-first prototype from the work required for a commercial service. Priority is ordered by risk and user value, not by visual novelty.

## Active GitHub task tickets

- [#2 — E2E coverage for streaming and local publishing](https://github.com/Blackleets/microdrama-studio/issues/2)
- [#3 — Harden local player lifecycle and media errors](https://github.com/Blackleets/microdrama-studio/issues/3)
- [#4 — Versioned continue-watching progress](https://github.com/Blackleets/microdrama-studio/issues/4)
- [#5 — Mobile accessibility and responsive dialogs](https://github.com/Blackleets/microdrama-studio/issues/5)

## P0 — Stabilize the current local product

- [ ] Run and verify GitHub Actions on the current feature branch head; resolve genuine lint/build/E2E failures without weakening checks.
- [ ] Add E2E coverage for streaming discovery, genre/search filters, favorites persistence, opening a series, episode selection, Escape dismissal and mobile navigation.
- [ ] Add E2E coverage for Studio-to-streaming local publishing, including rejection when any episode is not approved or release QA fails.
- [x] Harden player lifecycle: release object URLs and IndexedDB connections on cleanup/failure; handle missing files, blocked storage, unsupported codecs and subtitle loading errors visibly. Keep E2E coverage as the remaining verification gate.
- [x] Add local resume/continue-watching state (series + episode + playback position) using the separate `microdrama-watch-progress-v1` key and 5-second checkpoints. E2E coverage and migration tests remain open.
- [x] Implement modal focus management, focus return, keyboard episode navigation, meaningful close labels and visible focus handling; automated coverage added. Manual screen-reader and contrast checks remain open.
- [x] Add narrow 320px and landscape 844×390 E2E coverage for streaming navigation and detail-dialog bounds. Manual iOS/Android device and safe-area verification remains open.
- [ ] Test backup export/restore compatibility and clearly warn that media blobs are not included.
- [ ] Add a documented manual smoke-test matrix for Chrome Android, Safari iOS and desktop Chromium.

## P1 — Improve consumer streaming experience

- [x] Add continue-watching row using real saved progress, not placeholder percentages.
- [x] Add previous/next episode navigation and end-of-episode continuation with an 8-second user-controlled countdown.
- [ ] Improve player controls and error recovery while keeping browser-native media playback where practical.
- [ ] Add series synopsis, episode metadata, progress indicators and accurate availability states.
- [ ] Improve catalog sorting and filtering without implying real-time trends or analytics.
- [ ] Add robust empty/loading/error states and image fallbacks for artwork.
- [ ] Verify mobile detail modal and player layouts on small screens and landscape rotation.

## P1 — Improve Studio production workflow

- [ ] Add end-to-end regression for create series → import master/subtitles → EDL → render WebM → review/QA → publish locally → stream.
- [ ] Improve media validation and explain which properties are verified by browser metadata versus operator-declared.
- [ ] Add safe recovery/backup UX and IndexedDB quota/error handling.
- [ ] Improve render cancellation/progress/error handling and output verification.
- [ ] Add immutable asset version references to edit plans and render metadata.
- [ ] Add production activity/audit trail locally before designing cloud multi-tenant equivalents.

## P2 — Commercial production architecture (requires separate approval and backend design)

- [ ] Design Supabase Auth, tenant ownership, Postgres schema, Storage, RLS and migration/import strategy.
- [ ] Implement private media object storage, resumable uploads, signed URLs, CDN delivery and adaptive streaming.
- [ ] Implement server-side media probing, transcoding/render queue, MP4/HLS outputs, retries and observability.
- [ ] Integrate real AI image/video/voice providers through server-side adapters, quotas, cost tracking, provenance and human approval.
- [ ] Implement real checkout, webhooks, refunds, taxes, entitlement checks, subscriptions and server-authoritative wallet ledger.
- [ ] Implement rights evidence, takedown, territory/expiry and moderation workflows.
- [ ] Add privacy/legal review, account recovery, security controls, analytics consent, monitoring, backups and incident response.

## Explicit non-goals for the current local-first phase

- No Supabase connection or auth migration.
- No real payments, wallet/coins, subscriptions or entitlement claims.
- No public CDN/video hosting or cross-device playback.
- No claims of generated AI media until real providers are connected and tested.
- No MP4 export or server-side transcoding claims.
- No merge to `main` without owner approval.

## Current implementation snapshot (2026-11-22)

- [x] Cinematic streaming CSS and reduced-motion support.
- [x] Studio shell visual polish.
- [x] Four original SVG catalog artworks integrated; catalog labels remain demo.
- [x] Mobile bottom navigation.
- [x] Episode list in series detail view.
- [x] Modal dialog semantics, Escape dismissal, focus trapping/restoration, body scroll locking and accessible close label.
- [x] Keyboard episode-list navigation (Arrow Up/Down, Home, End) and 44px minimum key touch targets.
- [x] Local player lifecycle hardening and media error fallback.
- [x] Local continue-watching checkpoints and resume row.
- [x] GitHub Actions run #328 passed on commit `7e3d823` (dependency audit, high-severity audit gate, lint, production build and Playwright smoke tests).
- [ ] Latest feature preview smoke-tested on a real mobile device; browser-based screenshot audit and assistive-technology checks are still pending.
