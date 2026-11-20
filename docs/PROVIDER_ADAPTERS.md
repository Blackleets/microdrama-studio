# AI provider integration contract

Keep vendor-specific SDKs out of product workflows. Each provider adapter should implement a stable internal contract and return normalized job and asset records.

## Capability interfaces

- Text generation: story premise, series bible, episode outline, screenplay, scene prompts
- Image generation: character sheets, locations, props, keyframes, covers
- Video generation: shot/scene clips with duration, aspect ratio and reference assets
- Voice generation: character voice, narration, multilingual dialogue
- Speech recognition: transcription with timestamps and speaker labels

## Job lifecycle

`queued -> running -> succeeded | failed | cancelled`

Every request must include an idempotency key, owner ID, capability, provider/model, input references, estimated cost and timeout. Persist the job before calling a vendor. Update status from verified provider responses or webhooks. Never trust a browser-supplied cost or completion status.

## Normalized output

A successful job returns one or more media assets with:
- storage path in private object storage
- MIME type, dimensions or duration
- provider and model provenance
- generation parameters and seed when available
- source/reference asset IDs
- moderation and QA metadata

## Safety and cost controls

- API keys remain server-side.
- Enforce per-user and per-series generation budgets.
- Require owner review before generated assets enter a published episode.
- Do not expose private draft URLs publicly.
- Verify webhook signatures and deduplicate webhook events.
- Support provider timeouts, retries with bounded backoff and cancellation.
