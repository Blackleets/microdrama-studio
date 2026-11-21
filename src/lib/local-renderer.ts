export type LocalRenderScene = {
  file: File;
  sourceInSeconds: number;
  sourceOutSeconds: number;
};

export type LocalRenderOptions = {
  scenes: LocalRenderScene[];
  audioFile?: File | null;
  subtitleFile?: File | null;
  width?: number;
  height?: number;
  fps?: number;
  onProgress?: (progress: number) => void;
};

export type LocalRenderResult = {
  blob: Blob;
  mimeType: string;
  codec: string;
  durationSeconds: number;
  width: number;
  height: number;
  fps: number;
};

type CaptionCue = { start: number; end: number; text: string };

function parseTime(value: string): number {
  const parts = value.trim().replace(",", ".").split(":");
  const seconds = Number(parts.pop());
  const minutes = Number(parts.pop());
  const hours = parts.length ? Number(parts.pop()) : 0;
  return hours * 3600 + minutes * 60 + seconds;
}

function parseCaptions(text: string): CaptionCue[] {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r/g, "").trim();
  const blocks = normalized.split(/\n\s*\n/).filter(Boolean);
  const cues: CaptionCue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const index = lines.findIndex(line => /((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})\s*-->\s*((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})/.test(line));
    if (index < 0) continue;
    const match = lines[index].match(/((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})\s*-->\s*((?:\d{2}:)?\d{2}:\d{2}[.,]\]\d{3})/);
    const timeMatch = lines[index].match(/((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})\s*-->\s*((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})/);
    if (!timeMatch) continue;
    const start = parseTime(timeMatch[1]);
    const end = parseTime(timeMatch[2]);
    const cueText = lines.slice(index + 1).join(" ").replace(/<[^>]*>/g, "").trim();
    if (Number.isFinite(start) && Number.isFinite(end) && end > start && cueText) cues.push({ start, end, text: cueText });
  }
  return cues;
}

function waitForEvent(target: EventTarget, eventName: string, timeoutMs = 20000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("Tiempo de espera agotado al cargar el medio."));
    }, timeoutMs);
    const onDone = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("El navegador no pudo decodificar el archivo multimedia."));
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      target.removeEventListener(eventName, onDone);
      target.removeEventListener("error", onError);
    };
    target.addEventListener(eventName, onDone, { once: true });
    target.addEventListener("error", onError, { once: true });
  });
}

function drawVideo(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, width: number, height: number) {
  ctx.fillStyle = "#08090d";
  ctx.fillRect(0, 0, width, height);
  const sourceWidth = video.videoWidth || width;
  const sourceHeight = video.videoHeight || height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  ctx.drawImage(video, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawCaption(ctx: CanvasRenderingContext2D, text: string, width: number, height: number) {
  const fontSize = Math.round(width * 0.045);
  const lineHeight = Math.round(fontSize * 1.25);
  const maxTextWidth = width - 88;
  ctx.font = "700 " + fontSize + "px Arial, sans-serif";
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? line + " " + word : word;
    if (ctx.measureText(candidate).width > maxTextWidth && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  const boxHeight = lines.length * lineHeight + 30;
  const boxY = height - boxHeight - Math.round(height * 0.065);
  const widest = Math.min(maxTextWidth, Math.max(...lines.map(item => ctx.measureText(item).width))) + 34;
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.fillRect((width - widest) / 2, boxY, widest, boxHeight);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((item, index) => ctx.fillText(item, width / 2, boxY + 15 + lineHeight * (index + 0.5), maxTextWidth));
}

export async function renderEpisodeWebm(options: LocalRenderOptions): Promise<LocalRenderResult> {
  if (!options.scenes.length) throw new Error("Añade al menos una escena al montaje.");
  if (typeof MediaRecorder === "undefined") throw new Error("Este navegador no admite grabación local WebM.");
  if (!window.AudioContext) throw new Error("Este navegador no admite mezcla de audio local.");

  const width = options.width || 720;
  const height = options.height || 1280;
  const fps = options.fps || 30;
  const totalDuration = options.scenes.reduce((sum, scene) => sum + Math.max(0.1, scene.sourceOutSeconds - scene.sourceInSeconds), 0);
  if (!Number.isFinite(totalDuration) || totalDuration <= 0) throw new Error("La duración del montaje no es válida.");

  const mimeCandidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  const mimeType = mimeCandidates.find(type => MediaRecorder.isTypeSupported(type));
  if (!mimeType) throw new Error("No hay un códec WebM compatible en este navegador.");

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo crear el lienzo de render.");
  context.fillStyle = "#08090d";
  context.fillRect(0, 0, width, height);

  const audioContext = new AudioContext();
  const audioDestination = audioContext.createMediaStreamDestination();
  const canvasStream = canvas.captureStream(fps);
  const stream = new MediaStream([...canvasStream.getVideoTracks(), ...audioDestination.stream.getAudioTracks()]);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000, audioBitsPerSecond: 128_000 });
  const chunks: Blob[] = [];
  const stopped = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => reject(new Error("La grabación WebM falló en el navegador."));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });

  const captionCues = options.subtitleFile ? parseCaptions(await options.subtitleFile.text()) : [];
  let audioElement: HTMLAudioElement | null = null;
  let audioObjectUrl = "";
  let audioSource: MediaElementAudioSourceNode | null = null;
  let audioGain: GainNode | null = null;
  let elapsed = 0;
  let lastProgress = -1;
  let completed = false;

  try {
    await audioContext.resume();
    if (options.audioFile) {
      audioElement = document.createElement("audio");
      audioElement.preload = "auto";
      audioObjectUrl = URL.createObjectURL(options.audioFile);
      const audioReady = waitForEvent(audioElement, "canplay");
      audioElement.src = audioObjectUrl;
      await audioReady;
      audioSource = audioContext.createMediaElementSource(audioElement);
      audioGain = audioContext.createGain();
      audioGain.gain.value = 0.7;
      audioSource.connect(audioGain).connect(audioDestination);
    }

    recorder.start(1000);
    if (audioElement) await audioElement.play();

    for (const scene of options.scenes) {
      const video = document.createElement("video");
      const videoUrl = URL.createObjectURL(scene.file);
      video.preload = "auto";
      video.playsInline = true;
      const videoReady = waitForEvent(video, "loadedmetadata");
      video.src = videoUrl;
      await videoReady;
      if (!video.videoWidth || !video.videoHeight || !Number.isFinite(video.duration)) {
        URL.revokeObjectURL(videoUrl);
        throw new Error("Uno de los clips no tiene metadatos de vídeo utilizables.");
      }

      const start = Math.max(0, Math.min(scene.sourceInSeconds, Math.max(0, video.duration - 0.1)));
      const end = Math.max(start + 0.1, Math.min(scene.sourceOutSeconds, video.duration));
      if (Math.abs(video.currentTime - start) > 0.01) {
        const seeked = waitForEvent(video, "seeked");
        video.currentTime = start;
        await seeked;
      }

      const videoSource = audioContext.createMediaElementSource(video);
      const videoGain = audioContext.createGain();
      videoGain.gain.value = options.audioFile ? 0.85 : 1;
      videoSource.connect(videoGain).connect(audioDestination);
      await video.play();

      await new Promise<void>((resolve, reject) => {
        const startedAt = window.setTimeout(() => {
          cleanup();
          reject(new Error("El render se ha quedado esperando un fotograma."));
        }, (end - start + 30) * 1000);
        const cleanup = () => window.clearTimeout(startedAt);
        const draw = () => {
          drawVideo(context, video, width, height);
          const clipElapsed = Math.max(0, Math.min(end - start, video.currentTime - start));
          const timelineTime = elapsed + clipElapsed;
          const cue = captionCues.find(item => timelineTime >= item.start && timelineTime < item.end);
          if (cue) drawCaption(context, cue.text, width, height);
          const percent = Math.min(99, Math.round(((elapsed + clipElapsed) / totalDuration) * 100));
          if (percent !== lastProgress) { lastProgress = percent; options.onProgress?.(percent); }
          if (video.currentTime >= end - 0.025 || video.ended) {
            video.pause();
            cleanup();
            resolve();
            return;
          }
          window.requestAnimationFrame(draw);
        };
        window.requestAnimationFrame(draw);
      });

      video.pause();
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(videoUrl);
      videoSource.disconnect();
      videoGain.disconnect();
      elapsed += end - start;
    }

    if (audioElement) audioElement.pause();
    recorder.stop();
    const blob = await stopped;
    if (!blob.size) throw new Error("El render terminó sin datos de vídeo.");
    completed = true;
    options.onProgress?.(100);
    const codec = mimeType.includes("vp9") ? "VP9 / Opus" : mimeType.includes("vp8") ? "VP8 / Opus" : "WebM";
    return { blob, mimeType, codec, durationSeconds: Number(elapsed.toFixed(2)), width, height, fps };
  } finally {
    if (!completed && recorder.state !== "inactive") {
      try { recorder.stop(); } catch {}
    }
    if (audioElement) {
      audioElement.pause();
      audioElement.removeAttribute("src");
      audioElement.load();
    }
    if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
    audioSource?.disconnect();
    audioGain?.disconnect();
    stream.getTracks().forEach(track => track.stop());
    canvasStream.getTracks().forEach(track => track.stop());
    audioDestination.stream.getTracks().forEach(track => track.stop());
    await audioContext.close().catch(() => undefined);
  }
}
