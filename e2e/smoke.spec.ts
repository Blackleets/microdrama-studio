import { expect, test } from "@playwright/test";

test("root route opens the streaming catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/streaming\/?$/);
  await expect(page.getByRole("heading", { name: /La última/ }).first()).toBeVisible();
});

test("Studio exposes local workspace and production navigation", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByText("LOCAL WORKSPACE")).toBeVisible();
  await expect(page.getByRole("button", { name: "Exportar copia de seguridad" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Post Production/ })).toBeVisible();
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
