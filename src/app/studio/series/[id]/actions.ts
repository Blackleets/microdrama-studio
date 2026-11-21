"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function ownerClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const ownerId = data?.claims?.sub;
  if (error || !ownerId) redirect("/login");
  return { supabase, ownerId };
}

function textField(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function fail(seriesId: string, code: string): never {
  redirect(`/studio/series/${seriesId}?error=${code}`);
}

export async function updateSeries(formData: FormData) {
  const id = textField(formData, "seriesId", 80);
  const title = textField(formData, "title", 90);
  const logline = textField(formData, "logline", 1000);
  if (!id || title.length < 2) redirect("/studio?error=invalid");
  const { supabase } = await ownerClient();
  const { error } = await supabase.from("series")
    .update({ title, logline: logline || null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) fail(id, "save");
  revalidatePath(`/studio/series/${id}`);
  redirect(`/studio/series/${id}?saved=1`);
}

export async function saveStoryBible(formData: FormData) {
  const seriesId = textField(formData, "seriesId", 80);
  const premise = textField(formData, "premise", 4000);
  const worldRules = textField(formData, "worldRules", 4000);
  const tone = textField(formData, "tone", 2000);
  const arc = textField(formData, "arc", 3000);
  if (!seriesId) redirect("/studio");
  const { supabase } = await ownerClient();
  const { data: current, error: readError } = await supabase.from("story_bibles")
    .select("id").eq("series_id", seriesId).eq("is_current", true).maybeSingle();
  if (readError) fail(seriesId, "bible-read");

  const payload = {
    premise: premise || null,
    world_rules: { text: worldRules },
    tone_and_style: { text: tone },
    narrative_arc: { text: arc },
  };
  if (current?.id) {
    const { error } = await supabase.from("story_bibles").update(payload).eq("id", current.id);
    if (error) fail(seriesId, "bible-save");
  } else {
    const { data: latest, error: versionError } = await supabase.from("story_bibles")
      .select("version").eq("series_id", seriesId).order("version", { ascending: false }).limit(1);
    if (versionError) fail(seriesId, "bible-read");
    const { error } = await supabase.from("story_bibles").insert({
      series_id: seriesId, version: (latest?.[0]?.version ?? 0) + 1, ...payload, is_current: true,
    });
    if (error) fail(seriesId, "bible-save");
  }
  revalidatePath(`/studio/series/${seriesId}`);
  redirect(`/studio/series/${seriesId}?bible=saved`);
}

export async function addCharacter(formData: FormData) {
  const seriesId = textField(formData, "seriesId", 80);
  const name = textField(formData, "name", 80);
  const description = textField(formData, "description", 1000);
  const continuity = textField(formData, "continuityNotes", 2000);
  if (!seriesId || name.length < 2) redirect("/studio");
  const { supabase } = await ownerClient();
  const { error } = await supabase.from("characters").insert({
    series_id: seriesId, name, description: description || null,
    continuity_notes: continuity || null,
  });
  if (error) fail(seriesId, "character");
  revalidatePath(`/studio/series/${seriesId}`);
  redirect(`/studio/series/${seriesId}?character=created`);
}

export async function addEpisode(formData: FormData) {
  const seriesId = textField(formData, "seriesId", 80);
  const title = textField(formData, "title", 100);
  const synopsis = textField(formData, "synopsis", 1000);
  if (!seriesId || title.length < 2) redirect("/studio");
  const { supabase } = await ownerClient();
  const { data: existing, error: readError } = await supabase.from("episodes")
    .select("episode_number").eq("series_id", seriesId)
    .order("episode_number", { ascending: false }).limit(1);
  if (readError) fail(seriesId, "read");
  const nextNumber = (existing?.[0]?.episode_number ?? 0) + 1;
  const { error } = await supabase.from("episodes").insert({
    series_id: seriesId, episode_number: nextNumber, title,
    synopsis: synopsis || null, status: "development",
  });
  if (error) fail(seriesId, "episode");
  revalidatePath(`/studio/series/${seriesId}`);
  redirect(`/studio/series/${seriesId}?episode=created`);
}

export async function saveEpisodeScript(formData: FormData) {
  const seriesId = textField(formData, "seriesId", 80);
  const episodeId = textField(formData, "episodeId", 80);
  const content = textField(formData, "content", 30000);
  if (!seriesId || !episodeId || content.length < 20) fail(seriesId, "script-short");
  const { supabase, ownerId } = await ownerClient();
  const { data: latest, error: readError } = await supabase.from("scripts")
    .select("version").eq("episode_id", episodeId)
    .order("version", { ascending: false }).limit(1);
  if (readError) fail(seriesId, "script-read");
  const { error } = await supabase.from("scripts").insert({
    episode_id: episodeId, version: (latest?.[0]?.version ?? 0) + 1,
    content, format: "screenplay", created_by: ownerId,
    change_summary: "Nueva versión guardada desde Script Room",
  });
  if (error) fail(seriesId, "script-save");
  revalidatePath(`/studio/series/${seriesId}`);
  redirect(`/studio/series/${seriesId}?script=saved`);
}

export async function addScene(formData: FormData) {
  const seriesId = textField(formData, "seriesId", 80);
  const episodeId = textField(formData, "episodeId", 80);
  const heading = textField(formData, "heading", 180);
  const action = textField(formData, "action", 3000);
  const visual = textField(formData, "visualDirection", 2000);
  if (!seriesId || !episodeId || heading.length < 2 || action.length < 5) fail(seriesId, "scene-invalid");
  const { supabase } = await ownerClient();
  const { data: latest, error: readError } = await supabase.from("scenes")
    .select("scene_number").eq("episode_id", episodeId)
    .order("scene_number", { ascending: false }).limit(1);
  if (readError) fail(seriesId, "scene-read");
  const { error } = await supabase.from("scenes").insert({
    episode_id: episodeId, scene_number: (latest?.[0]?.scene_number ?? 0) + 1,
    heading, action, visual_direction: { description: visual },
  });
  if (error) fail(seriesId, "scene-save");
  revalidatePath(`/studio/series/${seriesId}`);
  redirect(`/studio/series/${seriesId}?scene=created`);
}


export async function generateEpisodeScript(formData: FormData) {
  const seriesId = textField(formData, "seriesId", 80);
  const episodeId = textField(formData, "episodeId", 80);
  const brief = textField(formData, "creativeBrief", 4000);
  if (!seriesId || !episodeId) redirect("/studio");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) fail(seriesId, "ai-not-configured");
  const model = process.env.GEMINI_MODEL;
  if (!model) fail(seriesId, "ai-model-not-configured");

  const { supabase, ownerId } = await ownerClient();
  const [{ data: series, error: seriesError }, { data: episode, error: episodeError }, { data: bible }, { data: characters }] = await Promise.all([
    supabase.from("series").select("title,logline,genre,language,visual_style").eq("id", seriesId).single(),
    supabase.from("episodes").select("id,episode_number,title,synopsis").eq("id", episodeId).eq("series_id", seriesId).single(),
    supabase.from("story_bibles").select("premise,world_rules,tone_and_style,narrative_arc").eq("series_id", seriesId).eq("is_current", true).maybeSingle(),
    supabase.from("characters").select("name,description,continuity_notes").eq("series_id", seriesId).limit(30),
  ]);
  if (seriesError || episodeError || !series || !episode) fail(seriesId, "ai-context");

  const prompt = [
    "Actúa como showrunner y guionista profesional especializado en microseries verticales.",
    "Escribe en español un episodio breve de ficción serializada pensado para móvil en formato vertical 9:16.",
    "Entrega un guion filmable, no un resumen. Duración objetivo: 60 a 120 segundos.",
    "Estructura: cold open potente en los primeros 3 segundos; escenas numeradas; encabezado INT./EXT., lugar y momento; acción visual concreta; diálogo natural; ritmo ágil; giro o cliffhanger final que impulse el siguiente episodio.",
    "No inventes cambios que contradigan la biblia o la continuidad de personajes. Si falta información, toma decisiones creativas coherentes y no añadas explicaciones fuera del guion.",
    "FORMATO DE SALIDA: título del episodio, duración estimada, después escenas con encabezado, acción, personajes y diálogo. Termina en un cliffhanger.",
    "",
    "SERIE: " + series.title,
    "LOGLINE: " + (series.logline || ""),
    "GÉNERO: " + (series.genre || []).join(", "),
    "ESTILO VISUAL: " + series.visual_style,
    "PREMISA: " + (bible?.premise || ""),
    "REGLAS DEL UNIVERSO: " + JSON.stringify(bible?.world_rules || {}),
    "TONO Y ESTILO: " + JSON.stringify(bible?.tone_and_style || {}),
    "ARCO NARRATIVO: " + JSON.stringify(bible?.narrative_arc || {}),
    "PERSONAJES Y CONTINUIDAD: " + JSON.stringify(characters || []),
    "EPISODIO " + episode.episode_number + ": " + episode.title,
    "SINOPSIS / GANCHO: " + (episode.synopsis || ""),
    "INDICACIONES DEL CREADOR: " + (brief || "Desarrolla el episodio respetando la continuidad y dejando un cliffhanger potente."),
  ].join("\n");

  const configuredLimit = Number.parseInt(process.env.GEMINI_DAILY_DRAFT_LIMIT || "20", 10);
  const dailyLimit = Number.isFinite(configuredLimit) ? Math.max(1, Math.min(100, configuredLimit)) : 20;
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count, error: countError } = await supabase.from("production_jobs")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId).eq("task_type", "script_generation")
    .gte("created_at", dayStart.toISOString());
  if (countError) fail(seriesId, "ai-job");
  if ((count ?? 0) >= dailyLimit) fail(seriesId, "ai-limit");

  const { data: job, error: jobError } = await supabase.from("production_jobs").insert({
    owner_id: ownerId, series_id: seriesId, episode_id: episodeId,
    task_type: "script_generation", provider: "google", model, status: "running",
    input: { episode_title: episode.title, brief_length: brief.length },
    idempotency_key: randomUUID(),
  }).select("id").single();
  if (jobError || !job) fail(seriesId, "ai-job");

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
    await supabase.from("production_jobs").update({
      status: "failed", error_message: "Provider network request failed", finished_at: new Date().toISOString(),
    }).eq("id", job.id);
    fail(seriesId, "ai-network");
  }
  if (!response.ok) {
    await supabase.from("production_jobs").update({
      status: "failed", error_message: "Provider returned HTTP " + response.status,
      finished_at: new Date().toISOString(),
    }).eq("id", job.id);
    fail(seriesId, response.status === 429 ? "ai-limit" : "ai-provider");
  }
  let result: { steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> };
  try {
    result = await response.json() as typeof result;
  } catch {
    await supabase.from("production_jobs").update({
      status: "failed", error_message: "Provider returned invalid JSON",
      finished_at: new Date().toISOString(),
    }).eq("id", job.id);
    fail(seriesId, "ai-empty");
  }
  const generated = (result.steps || [])
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content || [])
    .filter((part) => part.type === "text")
    .map((part) => part.text || "")
    .join("\n")
    .trim();
  if (generated.length < 80 || generated.length > 30000) {
    await supabase.from("production_jobs").update({
      status: "failed", error_message: "Provider returned empty or oversized text",
      finished_at: new Date().toISOString(),
    }).eq("id", job.id);
    fail(seriesId, "ai-empty");
  }

  const { data: latest, error: readError } = await supabase.from("scripts")
    .select("version").eq("episode_id", episodeId)
    .order("version", { ascending: false }).limit(1);
  if (readError) {
    await supabase.from("production_jobs").update({
      status: "failed", error_message: "Could not read current script version",
      finished_at: new Date().toISOString(),
    }).eq("id", job.id);
    fail(seriesId, "script-read");
  }
  const { data: savedScript, error: saveError } = await supabase.from("scripts").insert({
    episode_id: episodeId,
    version: (latest?.[0]?.version ?? 0) + 1,
    content: generated,
    format: "screenplay",
    created_by: ownerId,
    change_summary: "Borrador generado con " + model + " · pendiente de revisión humana",
  }).select("id").single();
  if (saveError || !savedScript) {
    await supabase.from("production_jobs").update({
      status: "failed", error_message: "Could not persist generated script",
      finished_at: new Date().toISOString(),
    }).eq("id", job.id);
    fail(seriesId, "script-save");
  }
  await supabase.from("production_jobs").update({
    status: "succeeded", output: { script_id: savedScript.id },
    finished_at: new Date().toISOString(),
  }).eq("id", job.id);
  revalidatePath(`/studio/series/${seriesId}`);
  redirect(`/studio/series/${seriesId}?script=saved`);
}


export async function submitEpisodeForReview(formData: FormData) {
  const seriesId = textField(formData, "seriesId", 80);
  const episodeId = textField(formData, "episodeId", 80);
  if (!seriesId || !episodeId) redirect("/studio");
  const { supabase } = await ownerClient();
  const { data: script, error: scriptError } = await supabase.from("scripts")
    .select("id").eq("episode_id", episodeId).order("version", { ascending: false }).limit(1).maybeSingle();
  if (scriptError) fail(seriesId, "review-check");
  if (!script) fail(seriesId, "review-no-script");
  const { error } = await supabase.from("episodes").update({ status: "review" })
    .eq("id", episodeId).eq("series_id", seriesId);
  if (error) fail(seriesId, "review-submit");
  revalidatePath(`/studio/series/${seriesId}`);
  redirect(`/studio/series/${seriesId}?review=submitted`);
}

export async function approveEpisodePackage(formData: FormData) {
  const seriesId = textField(formData, "seriesId", 80);
  const episodeId = textField(formData, "episodeId", 80);
  if (!seriesId || !episodeId) redirect("/studio");
  const { supabase, ownerId } = await ownerClient();
  const { data: episode, error: episodeError } = await supabase.from("episodes")
    .select("id,status").eq("id", episodeId).eq("series_id", seriesId).single();
  if (episodeError || !episode || episode.status !== "review") fail(seriesId, "review-state");
  const { data: script } = await supabase.from("scripts")
    .select("id").eq("episode_id", episodeId).order("version", { ascending: false }).limit(1).maybeSingle();
  if (!script) fail(seriesId, "review-no-script");
  const { error: approvalError } = await supabase.from("approvals").insert({
    owner_id: ownerId, episode_id: episodeId, decision: "approved",
    notes: "Paquete narrativo aprobado por el propietario.",
  });
  if (approvalError) fail(seriesId, "review-approval");
  const { error } = await supabase.from("episodes").update({
    status: "approved", approved_at: new Date().toISOString(),
  }).eq("id", episodeId).eq("series_id", seriesId);
  if (error) fail(seriesId, "review-state");
  revalidatePath(`/studio/series/${seriesId}`);
  redirect(`/studio/series/${seriesId}?approved=1`);
}

export async function requestEpisodeChanges(formData: FormData) {
  const seriesId = textField(formData, "seriesId", 80);
  const episodeId = textField(formData, "episodeId", 80);
  const notes = textField(formData, "notes", 2000);
  if (!seriesId || !episodeId || notes.length < 3) fail(seriesId, "review-notes");
  const { supabase, ownerId } = await ownerClient();
  const { data: episode, error: episodeError } = await supabase.from("episodes")
    .select("id,status").eq("id", episodeId).eq("series_id", seriesId).single();
  if (episodeError || !episode || episode.status !== "review") fail(seriesId, "review-state");
  const { error: approvalError } = await supabase.from("approvals").insert({
    owner_id: ownerId, episode_id: episodeId, decision: "changes_requested", notes,
  });
  if (approvalError) fail(seriesId, "review-approval");
  const { error } = await supabase.from("episodes").update({ status: "development" })
    .eq("id", episodeId).eq("series_id", seriesId);
  if (error) fail(seriesId, "review-state");
  revalidatePath(`/studio/series/${seriesId}`);
  redirect(`/studio/series/${seriesId}?changes=requested`);
}
