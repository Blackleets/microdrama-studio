# Post-production editor

The editor at `/studio/post-production` creates an episode-level edit decision list (EDL) in the current browser.

## Current capabilities

- Select a series and episode from the local Studio workspace.
- Create, rename, remove and reorder scenes.
- Set a planned duration per scene and calculate cumulative timecodes.
- Assign current, locally imported video masters to scenes.
- Preview selected video and audio files from the existing IndexedDB media store.
- Assign a local audio asset and a structurally validated SRT/WebVTT subtitle asset to the episode.
- Save the current edit automatically and create named snapshots that can be restored.
- Keep each episode's edit and snapshot history under separate localStorage keys.

## Persistence and safety

The editor stores edit decisions in localStorage and reads media blobs from the existing `microdrama-media-v1` IndexedDB database. It does not duplicate or upload source media. The edit plan is specific to the browser profile and can be lost if browser storage is cleared or evicted. It is not a backup or a shared team workspace.

The editor guards episode changes so an edit loaded for one episode cannot be autosaved over another episode's key. Source files are previews only; changing scene duration or order does not modify the underlying media.

## Explicit limitations

This is an EDL/planning editor, not a nonlinear video editor or renderer. It does not trim media, create transitions, mix audio, burn subtitles, transcode, probe codec/FPS/tracks, or export MP4. The assigned subtitle file is stored as an episode-level reference; the editor does not render its cues over the preview. A final render pipeline requires a separate media-processing service or a verified browser-side FFmpeg/WASM workflow, plus durable storage and resource limits.

## Next production requirements

Before enabling real distribution, implement and validate:
1. A deterministic render job that consumes a versioned EDL and produces a new immutable output asset.
2. Server-side validation of media types, codecs, durations, dimensions, track layout and subtitle timing.
3. Durable object storage with resumable uploads and signed access.
4. Render-job progress, cancellation, retries, logs and idempotency.
5. Automated playback and output-integrity tests.
6. Rights and owner approval checks against the exact source asset versions used by the EDL.
