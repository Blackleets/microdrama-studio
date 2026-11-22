import { expect, test } from "@playwright/test";

test("root route opens the streaming catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/streaming\/?$/);
  await expect(page.getByRole("heading", { name: /La última/ }).first()).toBeVisible();
});

test("streaming player navigates between episodes and clamps at both ends", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("microdrama-studio-local-v1", JSON.stringify([{
      id: "player-nav-series",
      title: "Player Nav Test",
      logline: "Episode navigation regression",
      genre: "Drama",
      status: "Publicado",
      episodes: [
        { id: "player-nav-1", title: "First Chapter", status: "Aprobado" },
        { id: "player-nav-2", title: "Second Chapter", status: "Aprobado" },
      ],
    }]));
    localStorage.setItem("microdrama-assets-v1", "[]");
  });
  await page.goto("/streaming");
  await page.locator(".show-poster").filter({ hasText: "PLAYER NAV TEST" }).click();
  await page.getByRole("dialog", { name: "Player Nav Test" }).getByRole("button", { name: "Ver episodio 1" }).click();

  const position = page.getByTestId("player-episode-position");
  const previous = page.getByTestId("player-previous-episode");
  const next = page.getByTestId("player-next-episode");
  await expect(position).toHaveText("EPISODIO 1 DE 2");
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();

  await next.click();
  await expect(position).toHaveText("EPISODIO 2 DE 2");
  await expect(previous).toBeEnabled();
  await expect(next).toBeDisabled();

  await previous.click();
  await expect(position).toHaveText("EPISODIO 1 DE 2");
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
});

test("continue watching opens the saved episode and restores its playback position", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "duration", {
      configurable: true,
      get: () => 30,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "currentTime", {
      configurable: true,
      get() { return Number((this as HTMLMediaElement).dataset.mockCurrentTime || "0"); },
      set(value: number) { (this as HTMLMediaElement).dataset.mockCurrentTime = String(value); },
    });
  });
  await page.addInitScript(() => {
    const seriesId = "resume-series";
    const episodeId = "resume-episode-2";
    localStorage.setItem("microdrama-studio-local-v1", JSON.stringify([{
      id: seriesId, title: "Resume Test", logline: "Saved playback position", genre: "Drama", status: "Publicado",
      episodes: [
        { id: "resume-episode-1", title: "First Chapter", status: "Aprobado" },
        { id: episodeId, title: "Second Chapter", status: "Aprobado" },
        { id: "resume-episode-3", title: "Final Chapter", status: "Aprobado" },
      ],
    }]));
    localStorage.setItem("microdrama-assets-v1", JSON.stringify([{
      id: "resume-master", seriesId, episodeId, kind: "Vídeo", assetRole: "Máster de episodio", fileId: "resume-media", fileName: "resume.webm", mimeType: "video/webm", versionStatus: "Actual",
    }, {
      id: "resume-master-3", seriesId, episodeId: "resume-episode-3", kind: "Vídeo", assetRole: "Máster de episodio", fileId: "resume-media", fileName: "resume.webm", mimeType: "video/webm", versionStatus: "Actual",
    }]));
    localStorage.setItem("microdrama-watch-progress-v1", JSON.stringify({
      ["studio-" + seriesId]: { episode: 1, time: 10, duration: 30, updatedAt: "2026-11-21T18:00:00.000Z" },
    }));
  });
  await page.goto("/streaming");
  await expect(page.getByRole("button", { name: "Continuar viendo Resume Test" })).toBeVisible();
  await page.evaluate(async () => {
    const seriesId = "resume-series";
    const episodeId = "resume-episode-2";
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 284;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable for playback fixture");
    context.fillStyle = "#263c49";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const stream = canvas.captureStream(15);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: Blob[] = [];
    const recording = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => reject(new Error("Could not create playback fixture"));
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    });
    recorder.start();
    await new Promise(resolve => window.setTimeout(resolve, 1200));
    recorder.stop();
    const videoFile = new File([await recording], "resume.webm", { type: "video/webm" });
    stream.getTracks().forEach(track => track.stop());

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("microdrama-media-v1", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("files")) request.result.createObjectStore("files", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("files", "readwrite");
      transaction.objectStore("files").put({
        id: "resume-media",
        file: videoFile,
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  });
  await page.reload();

  await page.getByRole("button", { name: "Continuar viendo Resume Test" }).click();
  const player = page.locator(".vertical-player video");
  await expect(player).toBeVisible();
  await expect(player).toHaveAttribute("src", /^blob:/);
  await player.evaluate(video => video.dispatchEvent(new Event("loadedmetadata")));
  await expect(player).toHaveAttribute("data-mock-current-time", "10");
  await expect(page.getByTestId("player-episode-position")).toHaveText("EPISODIO 2 DE 3");

  await player.evaluate(video => video.dispatchEvent(new Event("ended")));
  const countdown = page.getByTestId("player-auto-next-countdown");
  await expect(countdown).toBeVisible();
  await expect(page.getByTestId("player-auto-next-seconds")).toHaveText("8");
  await page.getByTestId("player-auto-next-cancel").click();
  await expect(countdown).toBeHidden();

  await player.evaluate(video => video.dispatchEvent(new Event("ended")));
  await expect(countdown).toBeVisible();
  await expect(page.getByTestId("player-episode-position")).toHaveText("EPISODIO 3 DE 3", { timeout: 12_000 });
  await expect(player).toHaveAttribute("src", /^blob:/);
  await expect(countdown).toBeHidden();

  await player.evaluate(video => video.dispatchEvent(new Event("ended")));
  await expect(countdown).toBeHidden();
});

test("Studio exposes local workspace and production navigation", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByText("LOCAL WORKSPACE")).toBeVisible();
  await expect(page.getByRole("button", { name: "Exportar copia de seguridad" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Post Production/ })).toBeVisible();
});

test("Studio tolerates legacy series records without optional genre metadata", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByText("LOCAL WORKSPACE")).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem("microdrama-studio-local-v1", JSON.stringify([{
      id: "legacy-series",
      title: "Legacy Series",
      logline: "A record created by an earlier version",
      status: "Desarrollo",
      episodes: [],
      characters: [],
    }]));
  });
  await page.reload();
  await expect(page.getByText("LOCAL WORKSPACE")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Legacy Series" })).toBeVisible();
  await expect(page.getByText("SIN GÉNERO")).toBeVisible();
});

test("asset registry and post-production routes render", async ({ page }) => {
  await page.goto("/studio/assets");
  await expect(page.getByRole("heading", { name: /Media Asset Registry/ })).toBeVisible();

  await page.goto("/studio/post-production");
  await expect(page.getByText("Selecciona un episodio")).toBeVisible();
});

test("Gemini endpoint stays disabled without a server access token", async ({ request }) => {
  const response = await request.post("/api/local/story", {
    data: { series: { title: "Prueba" }, episode: { title: "Episodio" } },
  });
  expect(response.status()).toBe(503);
  const body = await response.json();
  expect(body.error).toBe("token_not_configured");
});

test("Studio and post-production fit a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio");
  const studioWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(studioWidth).toBeLessThanOrEqual(390);

  await page.goto("/studio/post-production");
  const editorWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(editorWidth).toBeLessThanOrEqual(390);
});

test("local WebM renderer creates a rights-pending episode master", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/studio");
  await expect(page.getByText("LOCAL WORKSPACE")).toBeVisible();
  await page.evaluate(async () => {
    const seriesId = "render-series";
    const episodeId = "render-episode";
    localStorage.setItem("microdrama-studio-local-v1", JSON.stringify([{
      id: seriesId,
      title: "Render Test",
      status: "Publicado",
      episodes: [{ id: episodeId, title: "Test Episode", number: 1, scenes: ["Scene"], synopsis: "", script: "", status: "Aprobado" }],
    }]));
    localStorage.setItem("microdrama-release-qa-v1:" + seriesId, JSON.stringify([true, true, true]));

    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 568;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.fillStyle = "#7347a8";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const stream = canvas.captureStream(15);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: Blob[] = [];
    let frameNumber = 0;
    const frameTimer = window.setInterval(() => { context.fillStyle = frameNumber++ % 2 ? "#7347a8" : "#426b91"; context.fillRect(0, 0, canvas.width, canvas.height); }, 100);
    const videoBlobPromise = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => reject(new Error("Could not create synthetic test video"));
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    });
    recorder.start();
    await new Promise(resolve => window.setTimeout(resolve, 1400));
    recorder.stop();
    window.clearInterval(frameTimer);
    const videoBlob = await videoBlobPromise;
    stream.getTracks().forEach(track => track.stop());
    const sourceFile = new File([videoBlob], "scene.webm", { type: "video/webm" });
    const subtitleFile = new File(["1\n00:00:00,000 --> 00:00:00,800\nRender subtitle"], "captions.srt", { type: "text/plain" });
    const sampleRate = 22_050;
    const sampleCount = Math.floor(sampleRate * 1.2);
    const audioBuffer = new ArrayBuffer(44 + sampleCount * 2);
    const audioView = new DataView(audioBuffer);
    const writeAscii = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) audioView.setUint8(offset + i, value.charCodeAt(i)); };
    writeAscii(0, "RIFF");
    audioView.setUint32(4, 36 + sampleCount * 2, true);
    writeAscii(8, "WAVE");
    writeAscii(12, "fmt ");
    audioView.setUint32(16, 16, true);
    audioView.setUint16(20, 1, true);
    audioView.setUint16(22, 1, true);
    audioView.setUint32(24, sampleRate, true);
    audioView.setUint32(28, sampleRate * 2, true);
    audioView.setUint16(32, 2, true);
    audioView.setUint16(34, 16, true);
    writeAscii(36, "data");
    audioView.setUint32(40, sampleCount * 2, true);
    for (let i = 0; i < sampleCount; i++) audioView.setInt16(44 + i * 2, Math.sin(2 * Math.PI * 440 * i / sampleRate) * 4500, true);
    const soundtrackFile = new File([audioBuffer], "score.wav", { type: "audio/wav" });

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("microdrama-media-v1", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("files")) request.result.createObjectStore("files", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("files", "readwrite");
      transaction.objectStore("files").put({ id: "render-source-file", file: sourceFile });
      transaction.objectStore("files").put({ id: "render-subtitle-file", file: subtitleFile });
      transaction.objectStore("files").put({ id: "render-audio-file", file: soundtrackFile });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();

    localStorage.setItem("microdrama-assets-v1", JSON.stringify([{
      id: "render-source-asset",
      logicalId: "render-source-logical",
      seriesId,
      seriesTitle: "Render Test",
      episodeId,
      episodeTitle: "Test Episode",
      title: "Scene clip",
      kind: "Vídeo",
      assetRole: "Clip de escena",
      fileId: "render-source-file",
      fileName: "scene.webm",
      mimeType: "video/webm",
      versionStatus: "Actual",
      rights: "Confirmado",
      durationSeconds: 1.4,
    }, {
      id: "render-subtitle-asset",
      logicalId: "render-subtitle-logical",
      seriesId,
      seriesTitle: "Render Test",
      episodeId,
      episodeTitle: "Test Episode",
      title: "Episode captions",
      kind: "Documento",
      fileId: "render-subtitle-file",
      fileName: "captions.srt",
      mimeType: "text/plain",
      subtitleFormat: "SRT",
      subtitleLanguage: "es",
      subtitleValidation: "Válido",
      subtitleCueCount: 1,
      versionStatus: "Actual",
      rights: "Confirmado",
    }, {
      id: "render-audio-asset",
      logicalId: "render-audio-logical",
      seriesId,
      seriesTitle: "Render Test",
      episodeId,
      episodeTitle: "Test Episode",
      title: "Soundtrack",
      kind: "Audio",
      fileId: "render-audio-file",
      fileName: "score.wav",
      mimeType: "audio/wav",
      audioLanguage: "es",
      versionStatus: "Actual",
      rights: "Confirmado",
      durationSeconds: 1.2,
    }]));
    localStorage.setItem("microdrama-edit-timeline-v1:" + episodeId, JSON.stringify({
      scenes: [{ id: "render-scene", title: "Scene", durationSeconds: 1, sourceInSeconds: 0, sourceOutSeconds: 1, videoAssetId: "render-source-asset" }],
      audioAssetId: "render-audio-asset",
      subtitleAssetId: "render-subtitle-asset",
    }));
  });

  await page.goto("/studio/post-production");
  const renderButton = page.getByRole("button", { name: /Renderizar máster WebM/ });
  await expect(renderButton).toBeEnabled();
  await page.getByRole("checkbox", { name: "Incrustar subtítulos en el vídeo" }).check();
  await renderButton.click();
  await expect(page.getByRole("link", { name: /Descargar .*master\.webm/ })).toBeVisible({ timeout: 60_000 });

  await page.waitForFunction(() => JSON.parse(localStorage.getItem("microdrama-assets-v1") || "[]").some((asset: { seriesId?: string; assetRole?: string }) => asset.seriesId === "render-series" && asset.assetRole === "Máster de episodio"));
  const renderedMaster = await page.evaluate(() => {
    const assets = JSON.parse(localStorage.getItem("microdrama-assets-v1") || "[]");
    return assets.find((asset: { seriesId?: string; assetRole?: string }) => asset.seriesId === "render-series" && asset.assetRole === "Máster de episodio");
  });
  expect(renderedMaster).toBeTruthy();
  expect(renderedMaster.rights).toBe("Pendiente");
  const releaseState = await page.evaluate(() => ({ qa: JSON.parse(localStorage.getItem("microdrama-release-qa-v1:render-series") || "[]"), series: JSON.parse(localStorage.getItem("microdrama-studio-local-v1") || "[]").find((item: { id: string }) => item.id === "render-series") }));
  expect(releaseState.qa).toEqual([false, false, false]);
  expect(releaseState.series.status).toBe("Desarrollo");
  expect(renderedMaster.mimeType).toContain("video/webm");
  expect(renderedMaster.width).toBe(720);
  expect(renderedMaster.height).toBe(1280);
  expect(renderedMaster.subtitleBurnedIn).toBe(true);
  expect(renderedMaster.audioTracks).toBe(1);

  await page.evaluate(() => {
    const assets = JSON.parse(localStorage.getItem("microdrama-assets-v1") || "[]");
    const master = assets.find((asset: { seriesId?: string; assetRole?: string }) => asset.seriesId === "render-series" && asset.assetRole === "Máster de episodio");
    if (master) master.rights = "Confirmado";
    localStorage.setItem("microdrama-assets-v1", JSON.stringify(assets));
    const series = JSON.parse(localStorage.getItem("microdrama-studio-local-v1") || "[]");
    const published = series.map((item: { id: string; status?: string; episodes: Array<{ status?: string }> }) => item.id === "render-series" ? { ...item, status: "Publicado", episodes: item.episodes.map(episode => ({ ...episode, status: "Aprobado" })) } : item);
    localStorage.setItem("microdrama-studio-local-v1", JSON.stringify(published));
    localStorage.setItem("microdrama-release-qa-v1:render-series", JSON.stringify([true, true, true]));
  });

  await page.goto("/streaming");
  await expect(page.getByRole("button", { name: /RENDER TEST/ })).toBeVisible();
  await page.getByRole("button", { name: /RENDER TEST/ }).click();
  await page.getByRole("button", { name: /Ver episodio 1/ }).last().click();
  const localPlayer = page.locator(".vertical-player video");
  await expect(localPlayer).toBeVisible();
  await expect(localPlayer).toHaveAttribute("src", /^blob:/);
  await expect(localPlayer.locator("track")).toHaveCount(0);
});

test("asset rights cannot be confirmed without license evidence", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByText("LOCAL WORKSPACE")).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem("microdrama-studio-local-v1", JSON.stringify([{
      id: "rights-series",
      title: "Rights Test",
      episodes: [],
      status: "Desarrollo",
    }]));
  });
  await page.goto("/studio/assets");
  await page.getByLabel("Serie asociada").selectOption("rights-series");
  await page.getByLabel("Nombre del activo").fill("Master sin licencia");
  await page.getByRole("button", { name: "Registrar activo" }).click();
  await page.getByRole("button", { name: "Cambiar derechos" }).first().click();
  await expect(page.getByText(/No se pueden confirmar derechos sin identificar/)).toBeVisible();
  await expect(page.getByText("PENDIENTE").first()).toBeVisible();
});

test("subtitle parser accepts valid overlapping SRT cues", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByText("LOCAL WORKSPACE")).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem("microdrama-studio-local-v1", JSON.stringify([{
      id: "subtitle-series",
      title: "Subtitle Test",
      episodes: [],
      status: "Desarrollo",
    }]));
  });
  await page.goto("/studio/assets");
  await page.getByLabel("Serie asociada").selectOption("subtitle-series");
  await page.getByLabel("Nombre del activo").fill("Overlapping captions");
  await page.getByLabel("Tipo").selectOption("Documento");
  await page.getByTestId("asset-file-input").setInputFiles({
    name: "overlap.srt",
    mimeType: "text/plain",
    buffer: Buffer.from("1\n00:00:00,000 --> 00:00:02,000\nFirst line\n\n2\n00:00:01,000 --> 00:00:03,000\nSecond line"),
  });
  await expect(page.getByText("ESTRUCTURA VÁLIDA")).toBeVisible();
  await expect(page.getByText(/2 cues de subtítulos validados localmente/)).toBeVisible();
});

test("confirming asset rights requires operator acknowledgement and invalidates release QA", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByText("LOCAL WORKSPACE")).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem("microdrama-studio-local-v1", JSON.stringify([{
      id: "rights-approval-series",
      title: "Rights Approval Test",
      episodes: [],
      status: "Publicado",
    }]));
    localStorage.setItem("microdrama-release-qa-v1:rights-approval-series", JSON.stringify([true, true, true]));
  });
  await page.goto("/studio/assets");
  await page.getByLabel("Serie asociada").selectOption("rights-approval-series");
  await page.getByLabel("Nombre del activo").fill("Licensed master");
  await page.getByLabel("Licencia / titularidad").fill("Cesión comercial firmada");
  await page.getByRole("button", { name: "Registrar activo" }).click();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Cambiar derechos" }).first().click();
  await expect(page.getByText("CONFIRMADO").first()).toBeVisible();
  const qa = await page.evaluate(() => JSON.parse(localStorage.getItem("microdrama-release-qa-v1:rights-approval-series") || "[]"));
  expect(qa).toEqual([false, false, false]);
});

test("local backup restore validates the format and replaces workspace metadata", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByText("LOCAL WORKSPACE")).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem("microdrama-studio-local-v1", JSON.stringify([{
      id: "before-restore",
      title: "Current Workspace",
      episodes: [],
      characters: [],
      status: "Desarrollo",
    }]));
    localStorage.setItem("microdrama-release-qa-v1:stale-series", JSON.stringify([true, true, true]));
    localStorage.setItem("microdrama-edit-timeline-v1:stale-episode", JSON.stringify({ scenes: [] }));
  });
  await page.reload();
  const backup = {
    format: "microdrama-local-backup",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    series: [{
      id: "restored-series",
      title: "Restored Series",
      logline: "Backup test",
      genre: "Drama",
      style: "Vertical",
      status: "Desarrollo",
      updatedAt: new Date().toISOString(),
      characters: [],
      episodes: [{ id: "restored-episode", title: "Episode 1", number: 1, status: "Borrador", duration: 90, script: "A valid restored script", scenes: [] }],
      bible: "Restored story bible",
    }],
    localData: { "microdrama-watchlist-v1": ["restored-series"] },
    mediaBlobsIncluded: false,
  };
  page.once("dialog", dialog => dialog.accept());
  await page.getByTestId("studio-backup-input").setInputFiles({
    name: "microdrama-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.getByText(/Copia restaurada/)).toBeVisible();
  const restored = await page.evaluate(() => ({
    series: JSON.parse(localStorage.getItem("microdrama-studio-local-v1") || "[]"),
    watchlist: JSON.parse(localStorage.getItem("microdrama-watchlist-v1") || "[]"),
  }));
  expect(restored.series[0].id).toBe("restored-series");
  expect(restored.series[0].episodes[0].id).toBe("restored-episode");
  expect(restored.watchlist).toEqual(["restored-series"]);
  const staleKeys = await page.evaluate(() => ({
    qa: localStorage.getItem("microdrama-release-qa-v1:stale-series"),
    timeline: localStorage.getItem("microdrama-edit-timeline-v1:stale-episode"),
  }));
  expect(staleKeys).toEqual({ qa: null, timeline: null });
});

test("invalid local backup does not overwrite existing workspace", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByText("LOCAL WORKSPACE")).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem("microdrama-studio-local-v1", JSON.stringify([{
      id: "keep-series",
      title: "Keep This Series",
      episodes: [],
      characters: [],
      status: "Desarrollo",
    }]));
  });
  await page.reload();
  await page.getByTestId("studio-backup-input").setInputFiles({
    name: "invalid-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ format: "wrong-format", schemaVersion: 99, series: [] })),
  });
  await expect(page.getByText(/no pertenece a una versión compatible/)).toBeVisible();
  const current = await page.evaluate(() => JSON.parse(localStorage.getItem("microdrama-studio-local-v1") || "[]"));
  expect(current[0].id).toBe("keep-series");
});


test("malformed local backup metadata is rejected without modifying workspace", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByText("LOCAL WORKSPACE")).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem("microdrama-studio-local-v1", JSON.stringify([{
      id: "safe-series",
      title: "Safe Series",
      logline: "",
      genre: "Drama",
      style: "Vertical",
      status: "Desarrollo",
      updatedAt: new Date().toISOString(),
      characters: [],
      episodes: [],
      bible: "",
    }]));
  });
  await page.reload();
  const malformed = {
    format: "microdrama-local-backup",
    schemaVersion: 1,
    series: [{
      id: "bad-series",
      title: "Bad Series",
      logline: "",
      genre: "Drama",
      style: "Vertical",
      status: "Desarrollo",
      updatedAt: new Date().toISOString(),
      characters: [],
      episodes: [],
      bible: "",
    }],
    localData: { "microdrama-release-qa-v1:bad-series": [true, "yes", false] },
  };
  await page.getByTestId("studio-backup-input").setInputFiles({
    name: "malformed-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(malformed)),
  });
  await expect(page.getByText(/lista de QA no válida/)).toBeVisible();
  const current = await page.evaluate(() => JSON.parse(localStorage.getItem("microdrama-studio-local-v1") || "[]"));
  expect(current[0].id).toBe("safe-series");
});


test("exported local backup can be imported as a round trip", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByText("LOCAL WORKSPACE")).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem("microdrama-studio-local-v1", JSON.stringify([{
      id: "roundtrip-series",
      title: "Round Trip Series",
      logline: "A real export/import check",
      genre: "Drama",
      style: "Vertical",
      status: "Desarrollo",
      updatedAt: new Date().toISOString(),
      characters: [],
      episodes: [{
        id: "roundtrip-episode",
        title: "Episode One",
        number: 1,
        status: "Borrador",
        duration: 90,
        script: "Round trip script",
        scenes: ["Opening shot"],
      }],
      bible: "Round trip bible",
    }]));
    localStorage.setItem("microdrama-watchlist-v1", JSON.stringify(["roundtrip-series"]));
  });
  await page.reload();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Exportar copia de seguridad" }).click(),
  ]);
  const stream = await download.createReadStream();
  if (!stream) throw new Error("Backup download stream unavailable");
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const backupBuffer = Buffer.concat(chunks);
  const exported = JSON.parse(backupBuffer.toString("utf8"));
  expect(exported.format).toBe("microdrama-local-backup");
  expect(exported.schemaVersion).toBe(1);
  expect(exported.series[0].id).toBe("roundtrip-series");

  await page.evaluate(() => {
    localStorage.setItem("microdrama-studio-local-v1", JSON.stringify([{
      id: "temporary-series",
      title: "Temporary Series",
      episodes: [],
      characters: [],
      status: "Desarrollo",
    }]));
  });
  await page.reload();
  page.once("dialog", dialog => dialog.accept());
  await page.getByTestId("studio-backup-input").setInputFiles({
    name: "roundtrip-backup.json",
    mimeType: "application/json",
    buffer: backupBuffer,
  });
  await expect(page.getByText(/Copia restaurada/)).toBeVisible();
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem("microdrama-studio-local-v1") || "[]"));
  expect(restored[0].id).toBe("roundtrip-series");
  expect(restored[0].episodes[0].scenes).toEqual(["Opening shot"]);
});


test("streaming dialog traps keyboard focus and restores the invoking control", async ({ page }) => {
  await page.goto("/streaming");
  const trigger = page.locator(".show-poster").first();
  await trigger.focus();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "La última promesa" });
  const close = dialog.getByRole("button", { name: "Cerrar ventana" });
  const lastEpisode = dialog.locator(".detail-episode-list button").last();
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(lastEpisode).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  const detail = page.getByRole("dialog", { name: "La última promesa" });
  await detail.getByRole("button", { name: "Ver episodio 1" }).click();
  const playerDialog = page.getByRole("dialog", { name: "La última promesa" });
  await expect(playerDialog.getByRole("button", { name: "Cerrar ventana" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(playerDialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("series episode list supports arrow, Home and End keyboard navigation", async ({ page }) => {
  await page.goto("/streaming");
  await page.locator(".show-poster").first().click();
  const dialog = page.getByRole("dialog", { name: "La última promesa" });
  const episodes = dialog.locator(".detail-episode-list button");
  await episodes.first().focus();
  await page.keyboard.press("ArrowDown");
  await expect(episodes.nth(1)).toBeFocused();
  await page.keyboard.press("End");
  await expect(episodes.last()).toBeFocused();
  await page.keyboard.press("Home");
  await expect(episodes.first()).toBeFocused();
});

test("streaming catalog and detail dialog fit 320px and landscape viewports", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/streaming");
  await expect(page.getByRole("button", { name: "Descubrir" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator(".show-poster").first().click();
  const dialog = page.getByRole("dialog", { name: "La última promesa" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cerrar ventana" })).toBeVisible();
  const compactBox = await dialog.boundingBox();
  expect(compactBox?.x).toBeGreaterThanOrEqual(0);
  expect(compactBox?.width).toBeLessThanOrEqual(320);
  await page.setViewportSize({ width: 844, height: 390 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(844);
  await expect(dialog.getByRole("button", { name: "Cerrar ventana" })).toBeVisible();
  await dialog.getByRole("button", { name: "Ver episodio 1" }).click();
  const playerDialog = page.getByRole("dialog", { name: "La última promesa" });
  await expect(playerDialog.getByRole("button", { name: "Cerrar ventana" })).toBeVisible();
  const playerBox = await playerDialog.boundingBox();
  expect(playerBox?.x).toBeGreaterThanOrEqual(0);
  expect(playerBox?.width).toBeLessThanOrEqual(844);
});


test("streaming discovery supports search, genre filters and persistent favorites", async ({ page }) => {
  await page.goto("/streaming");
  const search = page.getByRole("textbox", { name: "Buscar series" });
  await search.fill("Cero");
  await expect(page.getByRole("heading", { name: "Cero grados" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "La última promesa" })).toBeHidden();
  await search.fill("");

  await page.locator(".stream-tabs").getByRole("button", { name: "Romance" }).click();
  await expect(page.getByRole("heading", { name: "La última promesa" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cero grados" })).toBeHidden();
  await page.locator(".stream-tabs").getByRole("button", { name: "Para ti" }).click();

  const promiseCard = page.locator(".show-card").filter({ has: page.getByRole("heading", { name: "La última promesa" }) });
  await promiseCard.getByRole("button", { name: "Añadir a mi lista" }).click();
  await page.locator(".stream-tabs").getByRole("button", { name: "Mi lista" }).click();
  await expect(page.getByRole("heading", { name: "La última promesa" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cero grados" })).toBeHidden();
  await page.reload();
  await page.locator(".stream-tabs").getByRole("button", { name: "Mi lista" }).click();
  await expect(page.getByRole("heading", { name: "La última promesa" })).toBeVisible();
});

test("mobile navigation updates the active catalog filter", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/streaming");
  const mobileNav = page.getByRole("navigation", { name: "Navegación principal" });
  const romance = mobileNav.getByRole("button", { name: "Romance" });
  await romance.click();
  await expect(romance).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Explora romance" })).toBeVisible();
  const myList = mobileNav.getByRole("button", { name: "Mi lista" });
  await myList.click();
  await expect(myList).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Tu lista" })).toBeVisible();
});
