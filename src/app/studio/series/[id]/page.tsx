import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addCharacter, addEpisode, updateSeries } from "./actions";

export default async function SeriesPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  if(!claims?.claims?.sub) redirect("/login");

  const [{data:series},{data:episodes},{data:characters}] = await Promise.all([
    supabase.from("series").select("id,title,logline,genre,status,visual_style").eq("id",id).single(),
    supabase.from("episodes").select("id,episode_number,title,synopsis,status,is_premium,coin_price").eq("series_id",id).order("episode_number"),
    supabase.from("characters").select("id,name,description,continuity_notes").eq("series_id",id).order("created_at"),
  ]);
  if(!series) notFound();

  return <main className="min-h-screen bg-[#090b10]">
    <header className="h-[70px] border-b border-[#252a36] px-5 md:px-8 flex items-center justify-between"><a href="/studio" className="font-bold text-sm tracking-wider">MICRODRAMA <span className="text-[#d6ff63]">/ STUDIO</span></a><a href="/studio" className="text-xs text-[#aeb4c0]">← Biblioteca</a></header>
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-9">
      <div className="text-[10px] tracking-[.25em] text-[#d6ff63] mb-3">SERIES DEVELOPMENT / PROJECT</div>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5"><div><h1 className="text-3xl md:text-4xl font-semibold">{series.title}</h1><p className="text-sm text-[#858b9a] mt-2">{series.logline||"Todavía no hay una premisa definida."}</p><div className="flex gap-2 mt-4"><span className="pill">{series.status}</span><span className="pill">{series.visual_style}</span>{series.genre?.map((g:string)=><span className="pill" key={g}>{g}</span>)}</div></div><span className="text-xs text-[#858b9a]">PROYECTO PRIVADO</span></div>
      <div className="grid lg:grid-cols-2 gap-5 mt-8">
        <section className="rounded-2xl border border-[#252a36] bg-[#11141c] p-5">
          <h2 className="font-semibold">Biblia de la serie</h2><p className="text-xs text-[#858b9a] mt-1">La premisa y las reglas que mantienen coherente el universo.</p>
          <form action={updateSeries} className="mt-5 space-y-3"><input type="hidden" name="seriesId" value={id}/><label className="block text-xs text-[#aeb4c0]">Título<input name="title" required maxLength={90} defaultValue={series.title} className="mt-2 w-full rounded-xl bg-[#090b10] border border-[#303644] px-3 py-3 text-sm outline-none focus:border-[#d6ff63]"/></label><label className="block text-xs text-[#aeb4c0]">Premisa / logline<textarea name="logline" rows={4} maxLength={1000} defaultValue={series.logline??""} className="mt-2 w-full rounded-xl bg-[#090b10] border border-[#303644] px-3 py-3 text-sm outline-none focus:border-[#d6ff63]"/></label><button className="rounded-xl bg-[#d6ff63] text-[#11150a] font-bold px-4 py-3 text-xs">Guardar biblia base</button></form>
        </section>
        <section className="rounded-2xl border border-[#252a36] bg-[#11141c] p-5">
          <div className="flex items-center justify-between"><div><h2 className="font-semibold">Personajes</h2><p className="text-xs text-[#858b9a] mt-1">Ficha de identidad y continuidad.</p></div><span className="pill">{characters?.length??0} perfiles</span></div>
          <form action={addCharacter} className="mt-5 space-y-3"><input type="hidden" name="seriesId" value={id}/><input name="name" required maxLength={80} placeholder="Nombre del personaje" className="w-full rounded-xl bg-[#090b10] border border-[#303644] px-3 py-3 text-sm outline-none focus:border-[#d6ff63]"/><textarea name="description" rows={2} maxLength={1000} placeholder="Descripción, personalidad, apariencia..." className="w-full rounded-xl bg-[#090b10] border border-[#303644] px-3 py-3 text-sm outline-none focus:border-[#d6ff63]"/><button className="rounded-xl border border-[#424a5a] px-4 py-3 text-xs">+ Añadir personaje</button></form>
          <div className="mt-5 space-y-2">{characters?.map(c=><div key={c.id} className="rounded-xl bg-[#0c0f15] border border-[#252a36] p-3"><div className="text-sm font-medium">{c.name}</div><p className="text-xs text-[#858b9a] mt-1">{c.description||"Sin descripción todavía."}</p></div>)}</div>
        </section>
      </div>
      <section className="rounded-2xl border border-[#252a36] bg-[#11141c] p-5 mt-5">
        <div className="flex items-center justify-between"><div><h2 className="font-semibold">Episodios</h2><p className="text-xs text-[#858b9a] mt-1">Orden narrativo y estado de producción.</p></div><span className="pill">{episodes?.length??0} episodios</span></div>
        <form action={addEpisode} className="grid md:grid-cols-[1fr_2fr_auto] gap-3 mt-5"><input type="hidden" name="seriesId" value={id}/><input name="title" required maxLength={100} placeholder="Título del episodio" className="rounded-xl bg-[#090b10] border border-[#303644] px-3 py-3 text-sm outline-none focus:border-[#d6ff63]"/><input name="synopsis" maxLength={1000} placeholder="Sinopsis / gancho final" className="rounded-xl bg-[#090b10] border border-[#303644] px-3 py-3 text-sm outline-none focus:border-[#d6ff63]"/><button className="rounded-xl bg-[#d6ff63] text-[#11150a] font-bold px-4 py-3 text-xs">Añadir episodio</button></form>
        <div className="mt-5 divide-y divide-[#252a36]">{episodes?.map(ep=><div key={ep.id} className="py-3 flex items-center gap-4"><div className="w-9 h-9 rounded-lg bg-[#1b202b] grid place-items-center text-xs text-[#d6ff63]">{String(ep.episode_number).padStart(2,"0")}</div><div className="min-w-0 flex-1"><div className="text-sm font-medium">{ep.title}</div><div className="text-xs text-[#858b9a] mt-1 truncate">{ep.synopsis||"Sinopsis pendiente"}</div></div><span className="pill">{ep.status}</span>{ep.is_premium&&<span className="text-[10px] text-[#d6ff63]">PREMIUM</span>}</div>)}</div>
      </section>
    </div>
  </main>;
}
