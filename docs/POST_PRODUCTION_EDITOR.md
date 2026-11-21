# Post-production editor

The editor at `/studio/post-production` provides an episode-level edit decision list (EDL) and a browser-local WebM renderer. It operates on the current browser profile and the shared local Asset Registry.

## Current capabilities

- Select a series and episode from the local Studio workspace.
- Create, rename, remove and reorder scenes.
- Set source in/out points per scene, calculate clip durations and cumulative timeline timecodes, and cap source points to known media duration.
- Assign locally imported video assets to scenes and preview source video/audio from IndexedDB.
- Assign an optional episode/series soundtrack and a structurally validated SRT/WebVTT subtitle file.
- Save edits automatically, create named snapshots, restore snapshots, and export a JSON EDL with scene order, source ranges and linked asset references.
- Render an actual vertical WebM master in the browser at 720×1280 and 30 fps using MediaRecorder and Canvas capture.
- Render scene clips sequentially with hard cuts, center-crop/fill framing, clip audio, optional soundtrack mix, and optional burned-in subtitle cues.
- Register the resulting WebM as a new `Máster de episodio` asset in IndexedDB/Asset Registry. The new asset starts with rights status `Pendiente`; the owner must review rights and repeat release QA.
- Show render progress, preview the resulting WebM and download it.

## Persistence and safety

Edit decisions and snapshots are stored in localStorage under episode-specific keys. Source media and rendered masters are stored in the `microdrama-media-v1` IndexedDB database. The editor does not upload source files or synchronize data across devices. Browser storage can be cleared or evicted; export the EDL and keep independent copies of important media.

The editor guards episode changes so an edit loaded for one episode cannot be autosaved over another episode's key. Source files remain unchanged; the renderer creates a separate output asset. Rendering a new master changes the current asset inventory and invalidates prior release QA/publication attestations for the affected series.

## Explicit limitations

- Output is WebM only (VP9/Opus or VP8/Opus where supported by the browser); MP4 export is not implemented.
- The renderer uses hard cuts only. It does not provide transitions, keyframe animation, color grading, effects, or a full nonlinear editing timeline.
- Rendering depends on browser MediaRecorder, Canvas capture, AudioContext and supported source codecs. Browser/device memory and performance limit practical input size and duration.
- The soundtrack is mixed with clip audio; this is not a multitrack audio mixer.
- Subtitle burning uses locally parsed SRT/WebVTT cues. It is not a subtitle translation, synchronization, readability, or legal-rights review.
- The app does not perform authoritative container probing for codec, FPS, or track layout. Some technical metadata remains operator-entered.
- Local assets and rendered outputs are available only in the browser profile that imported or rendered them. There is no public CDN delivery or durable cloud storage.

## Next production requirements

Before enabling public distribution, implement and validate:

1. Durable object storage with resumable uploads and signed access.
2. Server-side media probing and validation of MIME type, codecs, duration, dimensions, frame rate, audio/subtitle tracks and output integrity.
3. A server-side render pipeline for MP4/transcoding, deterministic jobs, progress, cancellation, retries, logs and idempotency.
4. Rights and owner-approval checks against the exact source asset versions used by each EDL and rendered master.
5. Persistent audit history, backup/restore, access control and takedown workflows.
6. Automated playback and output-integrity tests across supported browsers/devices.

The local renderer is useful for production prototyping and same-browser review. It is not a substitute for a secure, durable public media pipeline.
