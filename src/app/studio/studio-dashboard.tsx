"use client";

import { useState } from "react";
import { signOut } from "./actions";
import { createSeries } from "./actions";
import { ArrowUpRight, Clapperboard, Plus, Search, Sparkles, LogOut, Film, Clock3, Layers3 } from "lucide-react";

type SeriesItem = { id:string; title:string; logline:string|null; genre:string[]; status:string; visual_style:string; created_at:string };

export default function StudioDashboard({initialSeries,email}:{initialSeries:SeriesItem[];email:string}) {
  const [open,setOpen] = useState(false);
  const [search,setSearch] = useState("");
  const [items] = useState(initialSeries);
  const filtered = items.filter(item => item.title.toLowerCase().includes(search.toLowerCase()));
  return <main className="min-h-screen bg-[#090b10]">
    <header className="h-[72px] border-b border-[#252a36] px-5 md:px-8 flex items-center justify-between">
      <a href="/" className="flex items-center gap-3"><span className="w-9 h-9 rounded-xl bg-[#d6ff63] text-black grid place-items-center"><Clapperboard size={18}/></span><span className="font-bold text-sm tracking-wider">MICRODRAMA <span className="text-[#d6ff63]">/ STUDIO</span></span></a>
      <div className="flex items-center gap-3"><span className="hidden sm:block text-xs text-[#858b9a]">{email}</span><form action={signOut}><button className="flex items-center gap-2 rounded-lg border border-[#303644] px-3 py-2 text-xs text-[#aeb4c0]"><LogOut size={14}/> Salir</button></form></div>
    </header>
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-9">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"><div><div className="text-[10px] tracking-[.25em] text-[#d6ff63] mb-3">PRIVATE PRODUCTION OS</div><h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Command Center<span className="text-[#d6ff63]">.</span></h1><p className="text-sm text-[#858b9a] mt-2">Tu catálogo y estado real de producción.</p></div><button onClick={()=>setOpen(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[#d6ff63] px-5 py-3 text-sm font-bold text-[#11150a]"><Plus size={16}/> Nueva serie</button></div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <Metric icon={<Clapperboard size={16}/>} label="Series" value={String(items.length).padStart(2,"0")}/>
        <Metric icon={<Film size={16}/>} label="Episodios" value="—"/>
        <Metric icon={<Clock3 size={16}/>} label="En producción" value="—"/>
      </div>
      <section className="rounded-2xl border border-[#252a36] bg-[#11141c] p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5"><div><h2 className="font-semibold">Biblioteca de series</h2><p className="text-xs text-[#858b9a] mt-1">Datos guardados en tu base de datos.</p></div><label className="flex items-center gap-2 rounded-lg border border-[#303644] px-3 py-2 text-xs text-[#858b9a]"><Search size={14}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="bg-transparent outline-none w-32"/></label></div>
        {filtered.length===0?<div className="py-16 text-center"><div className="w-12 h-12 mx-auto rounded-2xl bg-[#1b202b] grid place-items-center text-[#d6ff63]"><Layers3 size={21}/></div><h3 className="font-semibold mt-4">{items.length===0?"Todavía no hay series":"No hay coincidencias"}</h3><p className="text-xs text-[#858b9a] mt-2">{items.length===0?"Crea tu primer proyecto narrativo para empezar.":"Prueba con otro título."}</p></div>:<div className="grid md:grid-cols-2 gap-3">{filtered.map(item=><article key={item.id} className="rounded-xl border border-[#2b3140] bg-[#0c0f15] p-4"><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] text-[#d6ff63] tracking-wider">{(item.genre??[]).join(" · ")||"SIN GÉNERO"}</span><h3 className="font-semibold mt-2">{item.title}</h3><p className="text-xs text-[#858b9a] mt-2">{item.logline||"Añade una premisa para definir el universo."}</p></div><span className="pill text-[#aeb4c0]">{item.status}</span></div><div className="flex justify-between items-center mt-5 pt-3 border-t border-[#252a36] text-[10px] text-[#858b9a]"><span>Estilo: {item.visual_style}</span><a href={`/studio/series/${item.id}`} className="text-[#d6ff63] flex items-center gap-1">Abrir <ArrowUpRight size={12}/></a></div></article>)}</div>}
      </section>
      <div className="mt-6 rounded-xl border border-[#d6ff63]/20 bg-[#d6ff63]/[.05] p-4 flex gap-3 text-xs text-[#c9d7a7]"><Sparkles size={16} className="shrink-0 text-[#d6ff63]"/> Producción híbrida activada: la IA prepara materiales y tú decides qué se aprueba y publica.</div>
    </div>
    {open&&<div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm grid place-items-center p-4"><div className="w-full max-w-md rounded-2xl border border-[#303644] bg-[#141822] p-6"><div className="flex justify-between items-center"><h2 className="text-lg font-semibold">Crear nueva serie</h2><button onClick={()=>setOpen(false)} className="text-xl text-[#858b9a]">×</button></div><p className="text-xs text-[#858b9a] mt-2">El proyecto quedará guardado en Supabase.</p><form action={createSeries} className="mt-6 space-y-4"><label className="block text-xs text-[#aeb4c0]">Título<input name="title" required minLength={2} maxLength={90} placeholder="La última promesa" className="mt-2 w-full rounded-xl bg-[#090b10] border border-[#303644] px-4 py-3 text-sm outline-none focus:border-[#d6ff63]"/></label><label className="block text-xs text-[#aeb4c0]">Género<select name="genre" className="mt-2 w-full rounded-xl bg-[#090b10] border border-[#303644] px-4 py-3 text-sm"><option>Drama</option><option>Romance</option><option>Thriller</option><option>Comedia</option><option>Fantasía</option><option>Acción</option></select></label><label className="block text-xs text-[#aeb4c0]">Premisa breve<textarea name="logline" rows={3} maxLength={500} placeholder="Una frase que resuma el conflicto central..." className="mt-2 w-full rounded-xl bg-[#090b10] border border-[#303644] px-4 py-3 text-sm outline-none focus:border-[#d6ff63]"/></label><div className="flex gap-2 pt-2"><button type="button" onClick={()=>setOpen(false)} className="flex-1 rounded-xl border border-[#303644] py-3 text-sm">Cancelar</button><button className="flex-1 rounded-xl bg-[#d6ff63] text-[#11150a] font-bold py-3 text-sm">Crear serie</button></div></form></div></div>}
  </main>;
}
function Metric({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="rounded-xl border border-[#252a36] bg-[#11141c] p-4"><div className="flex justify-between text-[#858b9a] text-xs">{label}<span>{icon}</span></div><div className="text-2xl font-semibold mt-4">{value}</div></div>}
