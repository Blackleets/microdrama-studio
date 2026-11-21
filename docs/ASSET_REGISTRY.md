# Asset Registry & Master Delivery

The Asset Registry is a browser-local production inventory. Media files can be imported into IndexedDB in the current browser profile and previewed locally. Files are not uploaded to a server, synchronized, transcoded, or hosted publicly.

## Asset identity and versions

- Every logical asset has a stable `logicalId`.
- Each revision is a separate record with its own `id`, version label, creation timestamp, rights state, and technical metadata.
- Creating a new version archives the previous current version and creates a new current revision.
- Rights must be reviewed again for every new revision. A prior version's clearance is not inherited.

## Series and episode linkage

An asset can be linked to a series and optionally to one episode. Series-level assets can represent key art, trailers, music packages, or shared production documents. Episode-level assets can represent the episode master, scene renders, dialogue stems, subtitles, or other deliverables.

## Technical master metadata

The local registry supports manually entered:
- Width and height in pixels
- Frame rate (fps)
- Duration in seconds
- Codec
- Audio-track count
- Subtitle-track count
- SHA-256 checksum

Width, height, and duration are prefilled from browser-readable media metadata when possible. FPS, codec, track counts, and checksum remain operator-entered. The app does not inspect container internals or certify the media. SRT and WebVTT subtitle files are parsed locally for cue structure, timestamp format, ordering, overlapping intervals, non-empty text, and cue count. The language code and validation summary are stored with the asset. Imported subtitle files can also be previewed as plain text in the local asset viewer. This is a structural check only: it does not assess translation quality, readability, synchronization against the video, or burned-in captions. The release gate checks the declared video-master metadata and requires a positive audio-track count; it does not inspect the underlying media container.

## Release QA behavior

The release gate evaluates only current asset versions linked to a series. Every episode must have a current video master linked to that episode, with a locally attached file, manually declared dimensions, frame rate, duration, codec, a positive audio-track count, and portrait 9:16 aspect ratio. Every episode must also have at least one current locally attached SRT or WebVTT document that passes structural validation and contains at least one cue. Every current asset linked to the series must have rights marked `Confirmado`. Archived versions do not block the current release gate.

Manual checks for story continuity, vertical framing, audio, and subtitles remain operator attestations. A green local gate is not a legal opinion, technical certification, or proof that a remote media URL works.

## Current limitations

- Data is stored in the current browser's localStorage and is not synchronized.
- Local IndexedDB storage is browser/device-specific and subject to browser quota, eviction, and private-mode limitations. It is not a backup or durable cloud store.
- No server upload, CDN delivery, transcoding, codec/FPS/audio-track probing, waveform, subtitle timing alignment, subtitle rendering QA, or checksum generation.
- No automatic codec/FPS/audio-track probing, transcoding, waveform, subtitle timing alignment, subtitle rendering QA, or checksum generation.
- No immutable audit log; browser storage can be edited or cleared.
- Do not use the local catalog as a public distribution or paid streaming service.

## Next production milestone

Implement actual file ingestion and durable object storage, then add server-side media probing, checksum calculation, subtitle validation, and a versioned audit trail before enabling real playback or public distribution.
