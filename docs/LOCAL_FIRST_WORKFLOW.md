# Local-first production workflow

This workflow describes the current end-to-end path using one browser profile. It does not require Supabase.

## 1. Create the series and episode

1. Open `/studio`.
2. Create a series and define its premise, genre, characters and story bible.
3. Add an episode and prepare its script and storyboard.
4. Keep the episode in draft until the creative package is ready for human review.

The local Story Engine creates an editable screenplay structure. Optional Gemini generation is available without Supabase when the server has `GEMINI_API_KEY`, an explicitly selected `GEMINI_MODEL`, and a random `LOCAL_STUDIO_AI_TOKEN` of at least 32 characters. Enter that access token in Script Room; it is held in sessionStorage and the Google API key stays server-side. The in-memory request limit is best-effort per server process, not a durable account quota.

## 2. Import production assets

1. Open `/studio/assets`.
2. Select the series and episode before importing each episode-specific master.
3. Import each video and classify it as `Máster de episodio`, `Clip de escena`, `Tráiler` or `Referencia`. The release gate and Streaming App use only episode masters. Then confirm the rights state and license/ownership notes.
4. Confirm the extracted width, height and duration. Enter FPS, codec and audio-track count manually; the browser does not inspect those container fields.
5. Import the episode's SRT or WebVTT subtitle file and set its language. The structural parser checks timestamps, ordering, overlap and non-empty cues.
6. Confirm rights for every current asset linked to the series.

Files are stored in IndexedDB and metadata in localStorage. Keep the browser profile and do not clear site data while producing.

## 3. Plan and review the edit

1. Open `/studio/post-production`.
2. Select the episode, order its scenes, assign the imported video master to each scene, and set source in/out points for the clip segment.
3. Set planned scene durations and assign the audio and validated subtitle assets.
4. Preview the original video/audio files from the local browser store.
5. Save named edit snapshots and export the EDL JSON for backup or later processing.

The EDL is an edit decision list, not a rendered video. It does not trim clips, mix audio, burn captions or export MP4.

## 4. Approve and pass release QA

1. Open the series' Review & Approval area in Studio.
2. Mark each episode as approved only after the owner/editor has reviewed it.
3. Open Distribution and complete the three human QA attestations.
4. Resolve any rights or technical-master/subtitle coverage failures shown by the gate.
5. Publish the series entry to the local catalog.

The local gate checks attached current files, declared metadata, 9:16 dimensions, audio-track declaration, subtitle structure and final cue duration. It cannot certify codecs, FPS, audio quality, translation quality, contractual rights or actual synchronization.

## 5. Verify playback

1. Open `/streaming` in the same browser profile.
2. Open the published series and select an episode.
3. Play the attached local master. If a valid local subtitle file is linked, the player exposes it as a captions track.

This is browser-local playback. It is not a public stream, does not use a CDN and is not accessible from another device or browser profile.

## Data durability

Use the Studio header backup control to export series, asset metadata, watchlist, release checks, edit plans and snapshots as JSON. This export does not include media blobs. Studio data and edit plans use localStorage; media blobs use IndexedDB. Browser quota, private browsing, clearing site data, profile changes or device loss can remove the only copy. Exported EDL files do not contain media blobs. Keep independent copies of source media and EDL exports until durable cloud storage and backup are implemented.
