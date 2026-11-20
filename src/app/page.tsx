"use client";

import { useState } from "react";
import {
  Activity, ArrowUpRight, Bell, BookOpen, CheckCircle2, ChevronDown,
  Clapperboard, Coins, Film, FolderKanban, Gauge, Layers3, Plus,
  Search, Settings2, Sparkles, WandSparkles, Users, Video, Workflow,
} from "lucide-react";

const nav = [
  { label: "Command Center", icon: Gauge },
  { label: "Series", icon: Clapperboard },
  { label: "Story Engine", icon: Sparkles },
  { label: "Script Room", icon: BookOpen },
  { label: "Character Studio", icon: Users },
  { label: "Storyboard", icon: Layers3 },
  { label: "AI Production", icon: WandSparkles },
  { label: "Post Production", icon: Film },
  { label: "Distribution", icon: Video },
  { label: "Revenue Intelligence", icon: Coins },
];

const projects = [
  { title: "La Heredera Oculta", genre: "Drama · Romance", episodes: "08 / 20 episodios", status: "En producción", progress: 42, art: "linear-gradient(135deg,#4b1c34,#d28a70 55%,#17131e)" },
  { title: "Contrato de Venganza", genre: "Thriller · Suspense", episodes: "12 / 24 episodios", status: "En revisión", progress: 68, art: "linear-gradient(135deg,#101e34,#4d7192 55%,#151b27)" },
  { title: "Un Amor Imposible", genre: "Romance · Juvenil", episodes: "03 / 16 episodios", status: "Desarrollo", progress: 18, art: "linear-gradient(135deg,#513a20,#d4a86b 55%,#20202a)" },
];

export default function Home() {
  const [active, setActive] = useState("Command Center");
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [seriesName, setSeriesName] = useState("");
  const [created, setCreated] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const visibleProjects = projects.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));

  function createSeries() {
    if (!seriesName.trim()) return;
    setCreated(current => [seriesName.trim(), ...current]);
    setSeriesName("");
    setShowNew(false);
    setNotice("Serie creada en el espacio de trabajo local. La persistencia se conectará con Supabase.");
  }

  return (
    <main className="min-h-screen flex bg-[#090b10]">
      <aside className="hidden lg:flex w-[248px] shrink-0 flex-col border-r border-[#252a36] px-4 py-5">
        <div className="flex items-center gap-3 px-2 mb-9">
          <div className="w-10 h-10 rounded-xl bg-[#d6ff63] text-black grid place-items-center"><Clapperboard size={21}/></div>
          <div><div className="font-bold tracking-tight">MICRODRAMA</div><div className="text-[10px] tracking-[.23em] text-[#9ca3af]">STUDIO / OS</div></div>
        </div>
        <div className="text-[10px] tracking-[.2em] text-[#687080] px-3 mb-3">WORKSPACE</div>
        <nav className="space-y-1">
          {nav.map(({label,icon:Icon})=><button key={label} onClick={()=>setActive(label)} className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition ${active===label?"bg-[#d6ff63] text-[#11150a] font-semibold":"text-[#a4aab7] hover:bg-[#191e29] hover:text-white"}`}><Icon size={17}/>{label}</button>)}
        </nav>
        <div className="mt-auto panel p-4">
          <div className="flex items-center gap-2 text-xs font-semibold"><Activity size={15} className="text-[#d6ff63]"/> Production status</div>
          <p className="text-[11px] text-[#89909f] mt-2 leading-relaxed">Studio inicializado. Los proveedores de IA se activarán al configurar sus credenciales.</p>
          <div className="mt-3 h-1.5 bg-[#292f3b] rounded-full overflow-hidden"><div className="w-[18%] h-full bg-[#d6ff63] rounded-full"/></div>
          <div className="mt-2 flex justify-between text-[10px] text-[#858b9a]"><span>Setup del proyecto</span><span>18%</span></div>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <header className="h-[70px] border-b border-[#252a36] flex items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-9 h-9 rounded-lg bg-[#d6ff63] text-black grid place-items-center"><Clapperboard size={19}/></div>
            <div><div className="text-xs text-[#858b9a]">Production workspace / 01</div><div className="font-semibold text-sm">{active}</div></div>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 rounded-lg border border-[#303644] px-3 py-2 text-xs text-[#aab0bd]"><Search size={14}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar proyectos..." className="w-32 bg-transparent outline-none placeholder:text-[#6f7685]"/></button>
            <button aria-label="Notificaciones" className="w-9 h-9 grid place-items-center rounded-lg border border-[#303644] text-[#aab0bd]"><Bell size={16}/></button>
            <button className="flex items-center gap-2 rounded-lg bg-[#191e29] px-2.5 py-2"><div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d6ff63] to-[#5e7b2d]"/><span className="hidden sm:block text-xs">Owner</span><ChevronDown size={13}/></button>
          </div>
        </header>

        <div className="studio-grid min-h-[calc(100vh-70px)] px-5 md:px-8 py-7 md:py-9">
          <div className="max-w-[1320px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
              <div><div className="text-[10px] tracking-[.24em] text-[#d6ff63] mb-3">YOUR STORY FACTORY</div><h1 className="text-3xl md:text-[38px] font-semibold tracking-[-.04em]">El estudio está listo<span className="text-[#d6ff63]">.</span></h1><p className="text-sm text-[#858b9a] mt-2">Desarrolla, produce y distribuye historias que atrapan desde el primer segundo.</p></div>
              <button onClick={()=>setShowNew(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[#d6ff63] px-5 py-3 text-sm font-bold text-[#11150a] hover:bg-[#e4ff9a] transition"><Plus size={17}/> Nueva serie</button>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
              {[
                ["Series activas","03","FolderKanban","+1 este mes"],
                ["Episodios producidos","23","Film","De 60 planificados"],
                ["Pendientes de revisión","04","CheckCircle2","Requieren aprobación"],
                ["Ingresos estimados","—","Coins","Conecta monetización"],
              ].map(([label,value,icon,foot])=>{const Icon=({FolderKanban,Film,CheckCircle2,Coins} as any)[icon];return <div key={label} className="panel p-4 md:p-5"><div className="flex justify-between items-center text-[#858b9a] text-[11px]"><span>{label}</span><Icon size={15}/></div><div className="text-2xl md:text-3xl font-semibold tracking-tight mt-4">{value}</div><div className="text-[10px] text-[#858b9a] mt-1">{foot}</div></div>})}
            </div>

            <div className="grid xl:grid-cols-[1.55fr_1fr] gap-5 mb-8">
              <div className="panel p-5 md:p-6">
                <div className="flex items-center justify-between mb-5"><div><h2 className="font-semibold">Pipeline de producción</h2><p className="text-xs text-[#858b9a] mt-1">De la idea al estreno. Control en cada etapa.</p></div><span className="pill text-[#d6ff63]">HYBRID WORKFLOW</span></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["Idea & Story","Guion & Biblia","Generación IA","QA & Aprobación"].map((step,i)=><div key={step} className="rounded-xl bg-[#0c0f15] border border-[#252a36] p-3"><div className="flex items-center justify-between"><span className="text-[10px] text-[#858b9a]">0{i+1}</span>{i===0?<CheckCircle2 size={14} className="text-[#d6ff63]"/>:<div className="w-2 h-2 rounded-full bg-[#434b5b]"/>}</div><div className="text-xs font-medium mt-4">{step}</div><div className="text-[10px] text-[#747c8b] mt-1">{i===0?"Listo para iniciar":"Pendiente de configurar"}</div></div>)}
                </div>
                <div className="mt-4 rounded-lg bg-[#d6ff63]/[.07] border border-[#d6ff63]/20 p-3 flex gap-2 text-[11px] text-[#c8d7a3]"><CheckCircle2 size={14} className="shrink-0 text-[#d6ff63]"/> Ningún episodio se publica sin tu aprobación explícita.</div>
              </div>
              <div className="panel p-5 md:p-6">
                <div className="flex items-center justify-between"><div><h2 className="font-semibold">Centro de actividad</h2><p className="text-xs text-[#858b9a] mt-1">Actividad reciente del estudio</p></div><Activity size={17} className="text-[#d6ff63]"/></div>
                <div className="mt-5 space-y-4">
                  {[
                    ["Workspace inicializado","Estructura del estudio preparada","Ahora"],
                    ["Flujo de aprobación definido","Publicación bajo control del owner","Sistema"],
                    ["Motores visuales definidos","Live action + universos animados","Sistema"],
                  ].map(([title,desc,time])=><div key={title} className="flex gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-[#d6ff63] shrink-0"/><div className="min-w-0"><div className="text-xs font-medium">{title}</div><div className="text-[11px] text-[#858b9a] mt-1">{desc}</div></div><span className="ml-auto text-[10px] text-[#697181] whitespace-nowrap">{time}</span></div>)}
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between mb-4"><div><h2 className="text-lg font-semibold">Tus series</h2><p className="text-xs text-[#858b9a] mt-1">Proyectos narrativos en desarrollo</p></div><button onClick={()=>setActive("Series")} className="text-xs text-[#d6ff63] flex items-center gap-1">Ver biblioteca <ArrowUpRight size={13}/></button></div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleProjects.map(p=><div key={p.title} className="panel overflow-hidden"><div className="h-32 relative flex items-end p-4" style={{background:p.art}}><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/><span className="relative pill border-white/30 text-white">{p.genre}</span><span className="absolute right-4 top-4 text-[10px] bg-black/30 rounded-full px-2 py-1">{p.status}</span></div><div className="p-4"><h3 className="font-semibold">{p.title}</h3><div className="text-[11px] text-[#858b9a] mt-1">{p.episodes}</div><div className="mt-4 h-1.5 bg-[#292f3b] rounded-full overflow-hidden"><div className="h-full bg-[#d6ff63] rounded-full" style={{width:p.progress+"%"}}/></div><div className="flex justify-between mt-2 text-[10px] text-[#858b9a]"><span>Progreso del proyecto</span><span>{p.progress}%</span></div></div></div>)}
              {created.map(name=><div key={name} className="panel p-5 flex flex-col justify-between min-h-[220px]"><div><span className="pill text-[#d6ff63]">NUEVA · BORRADOR</span><h3 className="font-semibold mt-5">{name}</h3><p className="text-xs text-[#858b9a] mt-2">Proyecto creado. Completa su biblia narrativa para iniciar la producción.</p></div><div className="text-[10px] text-[#858b9a] mt-6">0 episodios · 0% completado</div></div>)}
              <button onClick={()=>setShowNew(true)} className="rounded-2xl border border-dashed border-[#343a49] min-h-[220px] flex flex-col items-center justify-center gap-3 text-[#858b9a] hover:border-[#d6ff63] hover:text-[#d6ff63] transition"><div className="w-10 h-10 rounded-full border border-current grid place-items-center"><Plus size={19}/></div><span className="text-xs font-medium">Crear nuevo universo</span></button>
            </div>
            <footer className="mt-10 border-t border-[#252a36] pt-5 flex flex-wrap justify-between gap-2 text-[10px] text-[#687080]"><span>MICRODRAMA STUDIO · PRIVATE PRODUCTION OS</span><span>FOUNDATION BUILD 0.1.0</span></footer>
          </div>
        </div>
      </section>

      {showNew&&<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4"><div className="panel w-full max-w-md p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Crear una nueva serie</h2><button onClick={()=>setShowNew(false)} className="text-[#858b9a] text-xl">×</button></div><p className="text-xs text-[#858b9a] mt-2">Abre un nuevo universo narrativo dentro del estudio.</p><label className="block text-xs text-[#aeb4c0] mt-6 mb-2">Nombre provisional</label><input autoFocus value={seriesName} onChange={e=>setSeriesName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createSeries()} placeholder="Ej. La última promesa" className="w-full rounded-xl bg-[#090b10] border border-[#343a49] px-4 py-3 text-sm outline-none focus:border-[#d6ff63]"/><div className="flex gap-2 mt-6"><button onClick={()=>setShowNew(false)} className="flex-1 rounded-xl border border-[#343a49] py-3 text-sm">Cancelar</button><button onClick={createSeries} disabled={!seriesName.trim()} className="flex-1 rounded-xl bg-[#d6ff63] text-[#11150a] font-semibold py-3 text-sm disabled:opacity-40">Crear serie</button></div></div></div>}
      {notice&&<div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-[#d6ff63]/30 bg-[#151923] px-4 py-3 text-xs text-[#d6ff63] shadow-xl">{notice}<button onClick={()=>setNotice("")} className="ml-3 text-white">×</button></div>}
    </main>
  );
}
