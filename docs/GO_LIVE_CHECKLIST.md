# MicroDrama Studio — production launch gate

This checklist separates a usable local production prototype from a public commercial streaming service. A green local UI or a successful browser render is not evidence that the public service is ready.

## Current local product

- [x] Series, bible, characters, episodes, scripts and storyboard workspace in browser storage.
- [x] Optional server-side Gemini script drafting behind a server token and explicit model configuration.
- [x] Local asset registry with file import, version history, metadata and operator-declared rights.
- [x] Episode EDL, local previews and browser WebM rendering.
- [x] SRT/WebVTT structural validation and burned-in captions.
- [x] Editorial approval and local release QA gates.
- [x] Local streaming catalog and same-browser playback of registered episode masters.
- [x] JSON workspace backup export and validated restore.
- [ ] Automated CI result verified for the latest commit (must be checked in GitHub Actions).

## Required before public launch

### Backend and identity
- [ ] Provision Supabase project and configure Auth, Postgres, Storage and server-side authorization.
- [ ] Define tenant/business ownership and row-level security for every user-owned record.
- [ ] Migrate local series, episode, asset and release records with idempotent import and reconciliation.
- [ ] Add audit events for approvals, rights declarations, publication, takedown and billing.
- [ ] Add account recovery, session revocation, rate limits and abuse controls.

### Media pipeline
- [ ] Use private object storage with resumable uploads, signed URLs, retention and backups.
- [ ] Probe uploaded media server-side; verify actual codecs, duration, frame rate, dimensions, tracks and file integrity.
- [ ] Implement server render/transcode jobs with retries, cancellation, idempotency, observability and MP4 output.
- [ ] Verify final rendered outputs by decoding and playback tests on supported devices.
- [ ] Keep source assets immutable and bind each master to exact source versions and render parameters.

### AI production
- [ ] Select and configure real image, video, voice and speech providers; no such generation is currently wired into the product.
- [ ] Implement provider adapters with server-held credentials, signed callbacks, job state, retries and provider provenance.
- [ ] Add per-user budgets, cost estimates, quotas and cancellation.
- [ ] Add content moderation and human review before assets can be published.
- [ ] Do not represent a storyboard placeholder or local template as generated media.

### Rights, safety and legal
- [ ] Store documentary evidence for licenses, releases, music, likeness and commercial usage rights.
- [ ] Treat the current rights flag as an operator declaration only; it is not legal verification.
- [ ] Implement takedown, complaint, appeal, territory and expiry workflows.
- [ ] Complete privacy, terms, cookie, age-rating, content-rating and consumer-law review for target markets.

### Streaming and commerce
- [ ] Deliver video through authenticated playback and a CDN with adaptive bitrate and access control.
- [ ] Implement real payment provider checkout, webhooks, refunds, taxes and reconciliation.
- [ ] Implement a server-authoritative wallet/coin ledger if episode unlocks use coins.
- [ ] Add entitlement checks, subscription lifecycle, chargeback and fraud handling.
- [ ] Add analytics based on real playback and transaction events, with consent controls.

### Reliability and release
- [ ] Run lint, production build, E2E, accessibility and dependency/security audits on the release commit.
- [ ] Add staging environment, deployment approvals, rollback, backups and restore drills.
- [ ] Perform load, mobile network, browser compatibility and media failure testing.
- [ ] Define support, incident response, monitoring and data deletion procedures.

## Backup and local data warning

The JSON backup includes Studio records and selected local metadata, QA flags, watchlists and edit plans. It does not contain IndexedDB media blobs. A restored workspace can therefore reference assets whose files are absent on the target browser. Re-import and verify those files before rendering or publishing. Local data is not encrypted or synchronized by this prototype.

## Release decision

**Current status: local production prototype; not a public commercial launch.**

Do not enable public publication, collect payments, promise cross-device persistence, or claim AI video/image/voice generation until the corresponding gates above are implemented and tested.
