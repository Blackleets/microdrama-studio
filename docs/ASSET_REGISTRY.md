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

Width, height, and duration are prefilled from browser-readable media metadata when possible. FPS, codec, track counts, and checksum remain operator-entered. The app does not inspect container internals or certify the media. The release gate checks the declared video-master metadata; it does not verify the underlying file.

## Release QA behavior

The release gate evaluates only current asset versions linked to a series. For a video master, it requires a locally attached file plus manually declared dimensions, frame rate, duration, codec, and portrait 9:16 aspect ratio. At least one current linked asset must exist, and every such asset must have rights marked `Confirmado`. At least one current video asset must also declare width, height, frame rate, duration, and codec, with a portrait 9:16 aspect ratio (within a small tolerance). Archived versions do not block the current release gate.

Manual checks for story continuity, vertical framing, audio, and subtitles remain operator attestations. A green local gate is not a legal opinion, technical certification, or proof that a remote media URL works.

## Current limitations

- Data is stored in the current browser's localStorage and is not synchronized.
- Local IndexedDB storage is browser/device-specific and subject to browser quota, eviction, and private-mode limitations. It is not a backup or durable cloud store.
- No server upload, CDN delivery, transcoding, codec/FPS/track probing, waveform, subtitle parsing, or checksum generation.
- No automatic media probing, transcoding, waveform, subtitle parsing, or checksum generation.
- No immutable audit log; browser storage can be edited or cleared.
- Do not use the local catalog as a public distribution or paid streaming service.

## Next production milestone

Implement actual file ingestion and durable object storage, then add server-side media probing, checksum calculation, subtitle validation, and a versioned audit trail before enabling real playback or public distribution.
