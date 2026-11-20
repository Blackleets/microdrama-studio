import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addCharacter, addEpisode, addScene, generateEpisodeScript, saveEpisodeScript, saveStoryBible, updateSeries,
} from "./actions";

const field = "mt-2 w-full rounded-xl bg-[#090b10] border border-[#303644] px-3 py-3 text-sm text-[#edf0f5] outline-none focus:border-[#d6ff63]";
const label = "block text-xs text-[#aeb4c0]";

export default async function SeriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/login");

  const [{ data: series }, { data: episodes }, { data: characters }, { data: bible }] = await Promise.all([
    supabase.from("series").select("id,title,logline,genre,status,visual_style").eq("id", id).single(),
    supabase.from("episodes").select("id,episode_number,title,synopsis,status,is_premium,coin_price").eq("series_id", id).order("episode_number"),
    supabase.from("characters").select("id,name,description,continuity_notes").eq("series_id", id).order("created_at"),
    supabase.from("story_bibles").select("premise,world_rules,tone_and_style,narrative_arc,version").eq("series_id", id).eq("is_current", true).maybeSingle(),
  ]);
  if (!series) notFound();

  const episodeIds = (episodes ?? []).map((episode) => episode.id);
  const [{ data: scripts }, { data: scenes }] = episodeIds.length
    ? await Promise.all([
        supabase.from("scripts").select("id,episode_id,version,content").in("episode_id", episodeIds).order("version", { ascending: false }),
        supabase.from("scenes").select("id,episode_id,scene_number,heading,action,visual_direction").in("episode_id", episodeIds).order("scene_number"),
      ])
    : [{ data: [] }, { data: [] }];

  const bibleText = (value: unknown) =>
    value && typeof value === "object" && "text" in value ? String((value as { text?: unknown }).text ?? "") : "";

  const notices: Record<string, string> = {
    saved: "Datos de la serie guardados.",
    bible: "Biblia narrativa guardada.",
    character: "Personaje añadido.",
    episode: "Episodio creado.",
    script: "Nueva versión del guion guardada.",
    scene: "Escena añadida al episodio.",
  };
  const noticeKey = Object.keys(notices).find((key) => query[key] === (key === "saved" || key === "bible" || key === "script" ? "1" : "created"));

  return <main className="min-h-screen bg-[#090b10]">
    <header className="h-[70px] border-b border-[#252a36] px-5 md:px-8 flex items-center justify-between">
      <a href="/studio" className="font-bold text-sm tracking-wider">MICRODRAMA <span className="text-[#d6ff63]">/ STUDIO</span></a>
      <a href="/studio" className="text-xs text-[#aeb4c0]">← Biblioteca</a>
    </header>
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-9">
      <div className="text-[10px] tracking-[.25em] text-[#d6ff63] mb-3">SERIES DEVELOPMENT / PROJECT</div>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">{series.title}</h1>
          <p className="text-sm text-[#858b9a] mt-2">{series.logline || "Todavía no hay una premisa definida."}</p>
          <div className="flex flex-wrap gap-2 mt-4"><span className="pill">{series.status}</span><span className="pill">{series.visual_style}</span>{series.genre?.map((g: string) => <span className="pill" key={g}>{g}</span>)}</div>
        </div>
        <span className="text-xs text-[#858b9a]">WORKSPACE PRIVADO</span>
      </div>

      {noticeKey && <div role="status" className="mt-5 rounded-xl border border-[#46552a] bg-[#171e12] px-4 py-3 text-sm text-[#d6ff63]">{notices[noticeKey]}</div>}
      {query.error && <div role="alert" className="mt-5 rounded-xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">{({
        "ai-not-configured": "Story Engine desactivado: falta configurar GEMINI_API_KEY en el servidor.",
        "ai-context": "No se pudo cargar el contexto narrativo del episodio.",
        "ai-network": "No se pudo conectar con el proveedor de IA. Inténtalo de nuevo.",
        "ai-limit": "El proveedor ha limitado temporalmente las solicitudes. Espera e inténtalo más tarde.",
        "ai-provider": "El proveedor de IA devolvió un error. Revisa la configuración de la clave y el modelo.",
        "ai-empty": "La IA no devolvió un guion válido. Puedes intentarlo otra vez.",
        "ai-job": "No se pudo registrar el trabajo de IA. Comprueba los permisos de la base de datos.",
        "bible-save": "No se pudo guardar la biblia narrativa.",
        "script-save": "No se pudo guardar la nueva versión del guion.",
      } as Record<string, string>)[String(query.error)] || "No se pudo guardar el cambio. Comprueba los datos y vuelve a intentarlo."}</div>}

      <div className="grid lg:grid-cols-2 gap-5 mt-8">
        <section className="rounded-2xl border border-[#252a36] bg-[#11141c] p-5">
          <h2 className="font-semibold">Identidad de la serie</h2>
          <p className="text-xs text-[#858b9a] mt-1">Título y premisa corta que se muestra en el catálogo.</p>
          <form action={updateSeries} className="mt-5 space-y-3">
            <input type="hidden" name="seriesId" value={id}/>
            <label className={label}>Título<input name="title" required minLength={2} maxLength={90} defaultValue={series.title} className={field}/></label>
            <label className={label}>Logline<textarea name="logline" rows={3} maxLength={1000} defaultValue={series.logline ?? ""} className={field}/></label>
            <button className="rounded-xl bg-[#d6ff63] text-[#11150a] font-bold px-4 py-3 text-xs">Guardar identidad</button>
          </form>
        </section>

        <section className="rounded-2xl border border-[#252a36] bg-[#11141c] p-5">
          <div className="flex items-center justify-between"><div><h2 className="font-semibold">Biblia narrativa</h2><p className="text-xs text-[#858b9a] mt-1">Reglas del universo y continuidad de la historia.</p></div>{bible && <span className="pill">v{bible.version}</span>}</div>
          <form action={saveStoryBible} className="mt-5 space-y-3">
            <input type="hidden" name="seriesId" value={id}/>
            <label className={label}>Premisa completa<textarea name="premise" rows={3} maxLength={4000} defaultValue={bible?.premise ?? series.logline ?? ""} className={field} placeholder="¿De qué trata la serie y qué la hace única?"/></label>
            <label className={label}>Reglas del mundo<textarea name="worldRules" rows={3} maxLength={4000} defaultValue={bibleText(bible?.world_rules)} className={field} placeholder="Época, lugar, reglas, límites y hechos que nunca deben cambiar."/></label>
            <label className={label}>Tono y estilo<textarea name="tone" rows={2} maxLength={2000} defaultValue={bibleText(bible?.tone_and_style)} className={field} placeholder="Tono emocional, ritmo, estética y público objetivo."/></label>
            <label className={label}>Arco narrativo<textarea name="arc" rows={3} maxLength={3000} defaultValue={bibleText(bible?.narrative_arc)} className={field} placeholder="Conflicto central, evolución y dirección del final."/></label>
            <button className="rounded-xl bg-[#d6ff63] text-[#11150a] font-bold px-4 py-3 text-xs">Guardar biblia narrativa</button>
          </form>
        </section>
      </div>

      <section className="rounded-2xl border border-[#252a36] bg-[#11141c] p-5 mt-5">
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Personajes y continuidad</h2><p className="text-xs text-[#858b9a] mt-1">Rasgos, motivaciones y detalles que deben mantenerse entre episodios.</p></div><span className="pill">{characters?.length ?? 0} perfiles</span></div>
        <form action={addCharacter} className="grid md:grid-cols-2 gap-3 mt-5">
          <input type="hidden" name="seriesId" value={id}/>
          <input name="name" required minLength={2} maxLength={80} placeholder="Nombre del personaje" className={field}/>
          <input name="description" maxLength={1000} placeholder="Descripción, personalidad y apariencia" className={field}/>
          <textarea name="continuityNotes" rows={2} maxLength={2000} placeholder="Continuidad: edad, relaciones, secretos, vestuario, rasgos invariables..." className={field + " md:col-span-2"}/>
          <div><button className="rounded-xl border border-[#424a5a] px-4 py-3 text-xs">+ Añadir personaje</button></div>
        </form>
        <div className="grid md:grid-cols-2 gap-3 mt-5">
          {characters?.map((character) => <article key={character.id} className="rounded-xl bg-[#0c0f15] border border-[#252a36] p-4">
            <div className="text-sm font-medium">{character.name}</div>
            <p className="text-xs text-[#aeb4c0] mt-2">{character.description || "Sin descripción todavía."}</p>
            <p className="text-xs text-[#858b9a] mt-2">{character.continuity_notes || "Sin notas de continuidad."}</p>
          </article>)}
        </div>
      </section>

      <section className="rounded-2xl border border-[#252a36] bg-[#11141c] p-5 mt-5">
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Episodios</h2><p className="text-xs text-[#858b9a] mt-1">Orden narrativo, sinopsis y estado de producción.</p></div><span className="pill">{episodes?.length ?? 0} episodios</span></div>
        <form action={addEpisode} className="grid md:grid-cols-[1fr_2fr_auto] gap-3 mt-5">
          <input type="hidden" name="seriesId" value={id}/>
          <input name="title" required minLength={2} maxLength={100} placeholder="Título del episodio" className={field}/>
          <input name="synopsis" maxLength={1000} placeholder="Sinopsis y gancho final" className={field}/>
          <button className="rounded-xl bg-[#d6ff63] text-[#11150a] font-bold px-4 py-3 text-xs">Añadir episodio</button>
        </form>
        <div className="mt-5 divide-y divide-[#252a36]">
          {episodes?.map((episode) => <div key={episode.id} className="py-3 flex items-center gap-4">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-[#1b202b] grid place-items-center text-xs text-[#d6ff63]">{String(episode.episode_number).padStart(2, "0")}</div>
            <div className="min-w-0 flex-1"><div className="text-sm font-medium">{episode.title}</div><div className="text-xs text-[#858b9a] mt-1 truncate">{episode.synopsis || "Sinopsis pendiente"}</div></div>
            <span className="pill">{episode.status}</span>{episode.is_premium && <span className="text-[10px] text-[#d6ff63]">PREMIUM</span>}
          </div>)}
          {!episodes?.length && <p className="py-5 text-xs text-[#858b9a]">Todavía no hay episodios. Crea el primero para abrir el taller de guion y escenas.</p>}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4"><div className="text-[10px] tracking-[.25em] text-[#d6ff63]">WRITING & STORYBOARD</div><h2 className="text-2xl font-semibold mt-2">Script Room y escenas</h2><p className="text-sm text-[#858b9a] mt-1">Cada guardado crea una nueva versión del guion; las versiones anteriores se conservan.</p></div>
        <div className="space-y-5">
          {episodes?.map((episode) => {
            const episodeScripts = (scripts ?? []).filter((script) => script.episode_id === episode.id);
            const currentScript = episodeScripts[0];
            const episodeScenes = (scenes ?? []).filter((scene) => scene.episode_id === episode.id);
            return <article key={episode.id} className="rounded-2xl border border-[#252a36] bg-[#11141c] p-5">
              <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] tracking-widest text-[#d6ff63]">EPISODIO {String(episode.episode_number).padStart(2, "0")}</div><h3 className="font-semibold mt-1">{episode.title}</h3></div><span className="pill">{currentScript ? `Guion v${currentScript.version}` : "Sin guion"}</span></div>
              <form action={saveEpisodeScript} className="mt-4 space-y-3">
                <input type="hidden" name="seriesId" value={id}/><input type="hidden" name="episodeId" value={episode.id}/>
                <label className={label}>Guion completo<textarea name="content" required minLength={20} maxLength={30000} rows={10} defaultValue={currentScript?.content ?? ""} className={field + " font-mono leading-6"} placeholder={"ESCENA 1 — INT. LUGAR — NOCHE\n\nACCIÓN: Describe lo que vemos.\n\nPERSONAJE: Diálogo...\n\nCIERRE: Termina con un giro o cliffhanger."}/></label>
                <button className="rounded-xl bg-[#d6ff63] text-[#11150a] font-bold px-4 py-3 text-xs">Guardar nueva versión del guion</button>
              </form>
              <form action={generateEpisodeScript} className="mt-3 rounded-xl border border-[#303644] bg-[#0c0f15] p-4 space-y-3">
                <input type="hidden" name="seriesId" value={id}/><input type="hidden" name="episodeId" value={episode.id}/>
                <div><div className="text-xs font-semibold text-[#d6ff63]">STORY ENGINE · GEMINI</div><p className="text-xs text-[#858b9a] mt-1">Genera un borrador usando la biblia narrativa y los personajes. Se guarda como una nueva versión; tú decides si lo apruebas.</p></div>
                <label className={label}>Dirección creativa opcional<textarea name="creativeBrief" rows={2} maxLength={4000} className={field} placeholder="Ej.: revela una traición, introduce una pista y termina con una llamada inesperada."/></label>
                <button className="rounded-xl border border-[#d6ff63] text-[#d6ff63] px-4 py-3 text-xs font-semibold">✦ Generar borrador con IA</button>
              </form>
              {episodeScripts.length > 1 && <details className="mt-3 text-xs text-[#858b9a]"><summary className="cursor-pointer">Ver versiones anteriores ({episodeScripts.length - 1})</summary><div className="mt-2 space-y-1">{episodeScripts.slice(1).map((script) => <div key={script.id}>Versión {script.version} · guardada</div>)}</div></details>}
              <div className="border-t border-[#252a36] mt-5 pt-5">
                <div className="flex items-center justify-between"><h4 className="text-sm font-semibold">Storyboard / escenas</h4><span className="pill">{episodeScenes.length} escenas</span></div>
                <form action={addScene} className="grid md:grid-cols-2 gap-3 mt-4">
                  <input type="hidden" name="seriesId" value={id}/><input type="hidden" name="episodeId" value={episode.id}/>
                  <input name="heading" required minLength={2} maxLength={180} placeholder="INT. APARTAMENTO — NOCHE" className={field}/>
                  <input name="visualDirection" maxLength={2000} placeholder="Dirección visual, cámara, luz, atmósfera" className={field}/>
                  <textarea name="action" required minLength={5} maxLength={3000} rows={3} placeholder="Acción de la escena, qué ocurre y qué debe ver el espectador..." className={field + " md:col-span-2"}/>
                  <div><button className="rounded-xl border border-[#424a5a] px-4 py-3 text-xs">+ Añadir escena</button></div>
                </form>
                <div className="mt-4 space-y-2">{episodeScenes.map((scene) => <div key={scene.id} className="rounded-xl bg-[#0c0f15] border border-[#252a36] p-3">
                  <div className="text-[10px] text-[#d6ff63] tracking-widest">ESCENA {String(scene.scene_number).padStart(2, "0")}</div>
                  <div className="text-sm font-medium mt-1">{scene.heading || "Escena sin encabezado"}</div>
                  <p className="text-xs text-[#aeb4c0] mt-2 whitespace-pre-wrap">{scene.action}</p>
                  {scene.visual_direction?.description && <p className="text-xs text-[#858b9a] mt-2">Visual: {scene.visual_direction.description}</p>}
                </div>)}</div>
              </div>
            </article>;
          })}
        </div>
      </section>
    </div>
  </main>;
}
