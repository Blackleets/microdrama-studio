"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, FileImage, FileVideo, FileAudio, FileText, Plus, ShieldCheck, Trash2, ExternalLink } from "lucide-react";

type AssetKind = "Vídeo" | "Imagen" | "Audio" | "Documento";
type Rights = "Pendiente" | "Confirmado" | "Restringido";
type Asset = { id:string; seriesId:string; seriesTitle:string; title:string; kind:AssetKind; source:string; url:string; rights:Rights; license:string; version:string; notes:string; createdAt:string };
const KEY = "microdrama-assets-v1";
const kinds:AssetKind[]=["Vídeo","Imagen","Audio","Documento"];
const iconFor = (kind:AssetKind) => kind==="Vídeo"?FileVideo:kind==="Audio"?FileAudio:kind==="Documento"?FileText:FileImage;

export default function AssetRegistry(){
 const [assets,setAssets]=useState<Asset[]>([]);
 const [series,setSeries]=useState<{id:string;title:string}[]>([]);
 const [seriesId,setSeriesId]=useState("");
 const [ready,setReady]=useState(false);
 const [title,setTitle]=useState("");
 const [kind,setKind]=useState<AssetKind>("Vídeo");
 const [source,setSource]=useState("Generado por IA");
 const [url,setUrl]=useState("");
 const [rights,setRights]=useState<Rights>("Pendiente");
 const [license,setLicense]=useState("");
 const [version,setVersion]=useState("v1");
 const [notes,setNotes]=useState("");
 const [filter,setFilter]=useState<"Todos"|Rights>("Todos");
 const [notice,setNotice]=useState("Registro local · No se han subido archivos");
 useEffect(()=>{try{setAssets(JSON.parse(localStorage.getItem(KEY)||"[]") as Asset[]);const stored=JSON.parse(localStorage.getItem("microdrama-studio-local-v1")||"[]") as {id:string;title:string}[];setSeries(stored);if(stored[0])setSeriesId(stored[0].id);}catch{setAssets([]);setSeries([])}setReady(true)},[]);
 useEffect(()=>{if(ready)localStorage.setItem(KEY,JSON.stringify(assets))},[assets,ready]);
 const visible=useMemo(()=>assets.filter(a=>filter==="Todos"||a.rights===filter),[assets,filter]);
 const confirmed=assets.filter(a=>a.rights==="Confirmado").length;
 function addAsset(){
  if(title.trim().length<2)return;
  const selectedSeries=series.find(s=>s.id===seriesId);if(!selectedSeries)return;\n  const item:Asset={id:crypto.randomUUID(),seriesId:selectedSeries.id,seriesTitle:selectedSeries.title,title:title.trim(),kind,source,url:url.trim(),rights,license:license.trim(),version:version.trim()||"v1",notes:notes.trim(),createdAt:new Date().toISOString()};
  setAssets(p=>[item,...p]);setTitle("");setUrl("");setLicense("");setVersion("v1");setNotes("");setRights("Pendiente");setNotice("Activo registrado en este navegador.");
 }
 function cycleRights(id:string){setAssets(p=>p.map(a=>a.id===id?{...a,rights:a.rights==="Pendiente"?"Confirmado":a.rights==="Confirmado"?"Restringido":"Pendiente"}:a));}
 if(!ready)return <main className="min-h-screen bg-[#090b10] text-white grid place-items-center">Cargando registro…</main>;
 return <main className="min-h-screen bg-[#090b10] text-[#f4f5f8]">
  <header className="h-[68px] border-b border-[#252a36] px-5 md:px-8 flex items-center justify-between">
   <Link href="/studio" className="flex items-center gap-2 text-xs text-[#aeb7c6] hover:text-white"><ArrowLeft size={15}/> Volver al Studio</Link>
   <div className="text-xs tracking-[.16em] font-semibold">MICRODRAMA <span className="text-[#d6ff63]">/ ASSET REGISTRY</span></div>
   <span className="text-[10px] text-[#d6ff63] border border-[#d6ff63]/25 rounded-full px-3 py-1.5">LOCAL</span>
  </header>
  <div className="max-w-[1400px] mx-auto p-5 md:p-9">
   <div className="mb-8"><div className="text-[9px] tracking-[.28em] text-[#d6ff63] mb-3">PRODUCTION CONTROL / RIGHTS & VERSIONS</div><h1 className="text-3xl md:text-[40px] font-semibold tracking-[-.04em]">Media Asset Registry<span className="text-[#d6ff63]">.</span></h1><p className="text-sm text-[#818a9a] mt-2 max-w-2xl">Inventario de vídeos, imágenes, audio y documentos. Registra procedencia, licencia, versión y estado de derechos antes de distribuir.</p></div>
   <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
    <div className="rounded-xl border border-[#252a36] bg-[#10141c] p-4"><div className="text-[10px] text-[#7d8797]">Activos registrados</div><div className="text-2xl font-semibold mt-3">{assets.length}</div></div>
    <div className="rounded-xl border border-[#252a36] bg-[#10141c] p-4"><div className="text-[10px] text-[#7d8797]">Derechos confirmados</div><div className="text-2xl font-semibold mt-3">{confirmed}</div></div>
    <div className="rounded-xl border border-[#252a36] bg-[#10141c] p-4"><div className="text-[10px] text-[#7d8797]">Pendientes</div><div className="text-2xl font-semibold mt-3">{assets.filter(a=>a.rights==="Pendiente").length}</div></div>
    <div className="rounded-xl border border-[#252a36] bg-[#10141c] p-4"><div className="text-[10px] text-[#7d8797]">Restringidos</div><div className="text-2xl font-semibold mt-3">{assets.filter(a=>a.rights==="Restringido").length}</div></div>
   </div>
   <div className="grid xl:grid-cols-[.82fr_1.18fr] gap-5">
    <section className="rounded-2xl border border-[#252a36] bg-[#10141c] p-5 md:p-6">
     <h2 className="font-semibold">Registrar nuevo activo</h2><p className="text-[11px] text-[#7d8797] mt-1 mb-5">Metadatos y trazabilidad. No realiza cargas de archivos.</p>
     <div className="space-y-4">
      <label className="block text-xs text-[#aeb7c6]">Serie asociada<select value={seriesId} onChange={e=>setSeriesId(e.target.value)} className="mt-2 w-full rounded-lg border border-[#303644] bg-[#090c12] px-3 py-3 text-xs"><option value="">Selecciona una serie</option>{series.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label>\n      <label className="block text-xs text-[#aeb7c6]">Nombre del activo<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={100} placeholder="Ej. EP01_MASTER_9x16" className="mt-2 w-full rounded-lg border border-[#303644] bg-[#090c12] px-3 py-3 text-sm outline-none focus:border-[#d6ff63]/60"/></label>
      <div className="grid grid-cols-2 gap-3"><label className="text-xs text-[#aeb7c6]">Tipo<select value={kind} onChange={e=>setKind(e.target.value as AssetKind)} className="mt-2 w-full rounded-lg border border-[#303644] bg-[#090c12] px-3 py-3 text-xs">{kinds.map(k=><option key={k}>{k}</option>)}</select></label><label className="text-xs text-[#aeb7c6]">Versión<input value={version} onChange={e=>setVersion(e.target.value)} placeholder="v1" className="mt-2 w-full rounded-lg border border-[#303644] bg-[#090c12] px-3 py-3 text-xs"/></label></div>
      <label className="block text-xs text-[#aeb7c6]">Procedencia<select value={source} onChange={e=>setSource(e.target.value)} className="mt-2 w-full rounded-lg border border-[#303644] bg-[#090c12] px-3 py-3 text-xs"><option>Generado por IA</option><option>Grabación propia</option><option>Proveedor externo</option><option>Stock / licencia</option><option>Cliente / talento</option></select></label>
      <label className="block text-xs text-[#aeb7c6]">URL del archivo (opcional)<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…" className="mt-2 w-full rounded-lg border border-[#303644] bg-[#090c12] px-3 py-3 text-xs"/></label>
      <label className="block text-xs text-[#aeb7c6]">Licencia / titularidad<input value={license} onChange={e=>setLicense(e.target.value)} placeholder="Ej. Licencia comercial del proveedor" className="mt-2 w-full rounded-lg border border-[#303644] bg-[#090c12] px-3 py-3 text-xs"/></label>
      <label className="block text-xs text-[#aeb7c6]">Estado de derechos<select value={rights} onChange={e=>setRights(e.target.value as Rights)} className="mt-2 w-full rounded-lg border border-[#303644] bg-[#090c12] px-3 py-3 text-xs"><option>Pendiente</option><option>Confirmado</option><option>Restringido</option></select></label>
      <label className="block text-xs text-[#aeb7c6]">Notas<textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Permisos, restricciones territoriales, consentimiento, fuente…" className="mt-2 w-full rounded-lg border border-[#303644] bg-[#090c12] px-3 py-3 text-xs outline-none"/></label>
      <button onClick={addAsset} disabled={title.trim().length<2||!seriesId} className="w-full rounded-lg bg-[#d6ff63] text-[#10140a] py-3 text-xs font-bold flex justify-center items-center gap-2 disabled:opacity-40"><Plus size={15}/> Registrar activo</button>
     </div>
    </section>
    <section className="rounded-2xl border border-[#252a36] bg-[#10141c] p-5 md:p-6">
     <div className="flex flex-wrap items-center justify-between gap-3 mb-5"><div><h2 className="font-semibold">Inventario de producción</h2><p className="text-[11px] text-[#7d8797] mt-1">Control de procedencia y autorización.</p></div><select value={filter} onChange={e=>setFilter(e.target.value as "Todos"|Rights)} className="rounded-lg border border-[#303644] bg-[#090c12] px-3 py-2 text-xs"><option>Todos</option><option>Pendiente</option><option>Confirmado</option><option>Restringido</option></select></div>
     {visible.length===0?<div className="rounded-xl border border-dashed border-[#303644] p-10 text-center"><FileImage size={25} className="mx-auto text-[#778293]"/><p className="text-sm mt-3">No hay activos en esta vista.</p><p className="text-[11px] text-[#778293] mt-1">Registra el primer recurso de tu producción.</p></div>:<div className="space-y-3">{visible.map(a=>{const Icon=iconFor(a.kind);return <article key={a.id} className="rounded-xl border border-[#2a3040] bg-[#0b0e14] p-4"><div className="flex items-start gap-3"><div className="w-10 h-10 shrink-0 rounded-lg bg-[#d6ff63]/10 text-[#d6ff63] grid place-items-center"><Icon size={18}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{a.title}</h3><span className="text-[9px] rounded-full px-2 py-1 border border-[#303644] text-[#aab3c2]">{a.kind} · {a.version}</span></div><p className="text-[11px] text-[#8c96a7] mt-1">{a.seriesTitle||"Sin serie asociada"} · {a.source} · {a.license||"Licencia no documentada"}</p>{a.notes&&<p className="text-[11px] text-[#717c8d] mt-2">{a.notes}</p>}{a.url&&<a href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#d6ff63] mt-2">Abrir archivo <ExternalLink size={11}/></a>}</div><div className="flex flex-col items-end gap-2"><span className={a.rights==="Confirmado"?"text-[9px] text-[#d6ff63]":"text-[9px] text-[#e2b36d]"}>{a.rights.toUpperCase()}</span><button onClick={()=>cycleRights(a.id)} title="Cambiar estado de derechos" className="text-[10px] text-[#9da7b6] hover:text-white">Cambiar estado</button><button onClick={()=>{if(confirm("¿Eliminar este registro?"))setAssets(p=>p.filter(x=>x.id!==a.id))}} aria-label="Eliminar activo" className="text-[#697486] hover:text-red-300"><Trash2 size={14}/></button></div></div></article>})}</div>}
     <div className="mt-5 rounded-xl border border-[#d6ff63]/20 bg-[#d6ff63]/[.04] p-4"><div className="flex items-center gap-2 text-xs text-[#d6ff63]"><ShieldCheck size={15}/> Regla de publicación</div><p className="text-[11px] text-[#aab39e] leading-relaxed mt-2">Un activo con derechos pendientes o restringidos no debe incorporarse a un máster público. La confirmación aquí es un registro interno, no una verificación legal automática.</p></div>
    </section>
   </div>
   <div className="mt-6 flex items-center gap-2 text-[10px] text-[#697486]"><Check size={12} className="text-[#d6ff63]"/>{notice} · Los datos permanecen en este navegador.</div>
  </div>
 </main>
}
