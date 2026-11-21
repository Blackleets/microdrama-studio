import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type StoryInput = {
  series?: { title?: string; logline?: string; genre?: string; style?: string; bible?: string; characters?: Array<{ name?: string; role?: string; description?: string }> };
  episode?: { title?: string; number?: number; synopsis?: string };
  brief?: string;
  previousEpisodes?: Array<{ number?: number; title?: string; synopsis?: string; script?: string }>;
};

const windows = new Map<string, { startedAt: number; count: number }>();

function bounded(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const expectedToken = process.env.LOCAL_STUDIO_AI_TOKEN;
  const providedToken = request.headers.get("x-studio-token");
  if (!expectedToken || expectedToken.length < 32) {
    return NextResponse.json({ error: "token_not_configured", message: "Configura LOCAL_STUDIO_AI_TOKEN con al menos 32 caracteres aleatorios." }, { status: 503 });
  }
  const tokenMatches = Boolean(providedToken && Buffer.byteLength(providedToken) === Buffer.byteLength(expectedToken) && timingSafeEqual(Buffer.from(providedToken), Buffer.from(expectedToken)));
  if (!tokenMatches || !providedToken) {
    return NextResponse.json({ error: "unauthorized", message: "El token de acceso de IA no es válido." }, { status: 401 });
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ error: "origin", message: "Origen no permitido." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "origin", message: "Origen no válido." }, { status: 403 });
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "not_configured", message: "Falta GEMINI_API_KEY en el servidor." }, { status: 503 });
  }

  const now = Date.now();
  const limit = Number.parseInt(process.env.GEMINI_DAILY_DRAFT_LIMIT || "20", 10);
  const dailyLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, limit)) : 20;
  const window = windows.get(providedToken);
  if (window && now - window.startedAt < 24 * 60 * 60 * 1000 && window.count >= dailyLimit) {
    return NextResponse.json({ error: "rate_limit", message: "Se alcanzó el límite diario de borradores." }, { status: 429 });
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "body", message: "No se pudo leer la solicitud." }, { status: 400 });
  }
  if (raw.length > 24000) {
    return NextResponse.json({ error: "too_large", message: "El contexto enviado supera el límite permitido." }, { status: 413 });
  }

  let input: StoryInput;
  try {
    input = JSON.parse(raw) as StoryInput;
  } catch {
    return NextResponse.json({ error: "json", message: "El cuerpo no contiene JSON válido." }, { status: 400 });
  }

  const series = input.series || {};
  const episode = input.episode || {};
  const title = bounded(series.title, 90);
  const episodeTitle = bounded(episode.title, 100);
  if (title.length < 2 || episodeTitle.length < 2) {
    return NextResponse.json({ error: "context", message: "Faltan el título de la serie o del episodio." }, { status: 400 });
  }

  const characters = Array.isArray(series.characters) ? series.characters.slice(0, 20).map((character) => ({
    name: bounded(character?.name, 80),
    role: bounded(character?.role, 80),
    description: bounded(character?.description, 600),
  })) : [];

  const prompt = [
    "Actúa como showrunner y guionista profesional especializado en microseries verticales.",
    "Escribe en español un episodio breve de ficción serializada pensado para móvil en formato vertical 9:16.",
    "Entrega un guion filmable, no un resumen. Duración objetivo: 60 a 120 segundos.",
    "Estructura: cold open potente en los primeros 3 segundos; escenas numeradas; encabezado INT./EXT., lugar y momento; acción visual concreta; diálogo natural; ritmo ágil; giro o cliffhanger final que impulse el siguiente episodio.",
    "Respeta la biblia y la continuidad. No añadas explicaciones fuera del guion.",
    "SERIE: " + title,
    "LOGLINE: " + bounded(series.logline, 1000),
    "GÉNERO: " + bounded(series.genre, 120),
    "ESTILO VISUAL: " + bounded(series.style, 120),
    "BIBLIA Y REGLAS: " + bounded(series.bible, 5000),
    "PERSONAJES: " + JSON.stringify(characters),
    "EPISODIOS ANTERIORES: " + JSON.stringify(Array.isArray(input.previousEpisodes) ? input.previousEpisodes.filter(item => item && typeof item === "object").slice(-5).map(item => ({ number: Number(item.number) || 0, title: bounded(item.title, 100), synopsis: bounded(item.synopsis, 500), script: bounded(item.script, 1200) })) : []),
    "EPISODIO " + Math.max(1, Math.min(999, Number(episode.number) || 1)) + ": " + episodeTitle,
    "SINOPSIS: " + bounded(episode.synopsis, 1000),
    "INDICACIONES DEL CREADOR: " + bounded(input.brief, 3000),
    "Termina con un cliffhanger visual o emocional."
  ].join("\n");

  const model = bounded(process.env.GEMINI_MODEL, 100);
  if (!model) return NextResponse.json({ error: "model_not_configured", message: "Configura GEMINI_MODEL con un modelo habilitado en tu cuenta de Google AI." }, { status: 503 });

  const current = windows.get(providedToken);
  if (!current || now - current.startedAt >= 24 * 60 * 60 * 1000) windows.set(providedToken, { startedAt: now, count: 1 });
  else windows.set(providedToken, { ...current, count: current.count + 1 });
  let response: Response;
  try {
    response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ model, input: prompt }),
      cache: "no-store",
      signal: AbortSignal.timeout(90000),
    });
  } catch {
    return NextResponse.json({ error: "network", message: "No se pudo conectar con Gemini." }, { status: 502 });
  }
  if (!response.ok) {
    return NextResponse.json({ error: response.status === 429 ? "rate_limit" : "provider", message: response.status === 429 ? "Gemini limitó temporalmente las solicitudes." : "Gemini devolvió un error. Revisa modelo y credenciales.", providerStatus: response.status }, { status: response.status === 429 ? 429 : 502 });
  }

  let result: { steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> };
  try {
    result = await response.json() as typeof result;
  } catch {
    return NextResponse.json({ error: "response", message: "Gemini devolvió una respuesta no válida." }, { status: 502 });
  }
  const script = (result.steps || [])
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content || [])
    .filter((part) => part.type === "text")
    .map((part) => part.text || "")
    .join("\n")
    .trim();
  if (script.length < 80 || script.length > 30000) {
    return NextResponse.json({ error: "empty", message: "Gemini no devolvió un guion utilizable." }, { status: 502 });
  }

  return NextResponse.json({ script, model, status: "draft" }, { status: 200 });
}
