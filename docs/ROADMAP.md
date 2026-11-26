# Product roadmap

This roadmap distinguishes the current local-first prototype from the work required for a commercial service. Priority is ordered by risk and user value, not by visual novelty.

## Active GitHub task tickets

- [#6 — CHISPA commercial platform and Google Play master plan](https://github.com/Blackleets/microdrama-studio/issues/6)
- [#2 — E2E coverage for streaming and local publishing](https://github.com/Blackleets/microdrama-studio/issues/2)
- [#3 — Harden local player lifecycle and media errors](https://github.com/Blackleets/microdrama-studio/issues/3)
- [#4 — Versioned continue-watching progress](https://github.com/Blackleets/microdrama-studio/issues/4)
- [#5 — Mobile accessibility and responsive dialogs](https://github.com/Blackleets/microdrama-studio/issues/5)

## P0 — Stabilize the current local product

- [x] Audit Studio routes and persistence boundaries; record the route/data/auth matrix and non-destructive architecture decision in [CHISPA P0 audit](CHISPA_P0_AUDIT.md).
- [ ] Run and verify GitHub Actions on the current feature branch head; resolve genuine lint/build/E2E failures without weakening checks.
- [x] Add E2E coverage for streaming discovery, genre/search filters, favorites persistence, opening a series, episode selection, Escape dismissal and mobile navigation.
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
- [x] Add search, genre filtering, persistent favorites and mobile-navigation state assertions to Playwright.
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
- [ ] Evaluate and implement the Android packaging strategy; no Android application/AAB is currently verified.

## Explicit non-goals for the current local-first phase

- No Supabase connection or auth migration.
- No real payments, wallet/coins, subscriptions or entitlement claims.
- No public CDN/video hosting or cross-device playback.
- No claims of generated AI media until real providers are connected and tested.
- No MP4 export or server-side transcoding claims.
- No merge to `main` without owner approval.

## Current implementation snapshot (2026-11-26)

- [x] Cinematic streaming CSS and reduced-motion support.
- [x] Studio shell visual polish.
- [x] Four original SVG catalog artworks integrated; catalog labels remain demo.
- [x] Mobile bottom navigation, accessible dialogs, keyboard episode navigation and responsive 320px/landscape coverage on the feature branch.
- [x] Local player lifecycle hardening and media error fallback.
- [x] Local continue-watching checkpoints and resume row.
- [x] P0 route/data/auth audit recorded in `docs/CHISPA_P0_AUDIT.md`; the local workspace remains canonical until a reversible cloud migration is proven.
- [ ] Current feature head CI and manual device/accessibility verification remain to be checked for this contribution.
