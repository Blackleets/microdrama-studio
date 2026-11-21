"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, FileImage, FileVideo, FileAudio, FileText, Plus, ShieldCheck, Trash2, ExternalLink, History, Archive } from "lucide-react";

type AssetKind = "Vídeo" | "Imagen" | "Audio" | "Documento";
type Rights = "Pendiente" | "Confirmado" | "Restringido";
type EpisodeOption = { id:string; title:string; number:number };
type SeriesOption = { id:string; title:string; episodes?:EpisodeOption[] };
type Asset = {
 id:string; logicalId:string; seriesId:string; seriesTitle:string; episodeId?:string; episodeTitle?:string;
 title:string; kind:AssetKind; source:string; url:string; rights:Rights; license:string;
 version:string; versionNumber:number; versionStatus:"Actual"|"Archivada"; notes:string; createdAt:string;
 width?:number; height?:number; fps?:number; durationSeconds?:number; codec?:string; audioTracks?:number; subtitleTracks?:number; checksum?:string;
};
const KEY="microdrama-assets-v1";
const kinds:AssetKind[]=["Vídeo","Imagen","Audio","Documento"];
const iconFor=(kind:AssetKind)=>kind==="Vídeo"?FileVideo:kind==="Audio"?FileAudio:kind==="Documento"?FileText:FileImage;
const asNumber=(value:string)=>value.trim()===""?undefined:Number(value);

export default function AssetRegistry(){
 const [assets,setAssets]=useState<Asset[]>([]);
 const [series,setSeries]=useState<SeriesOption[]>([]);
 const [seriesId,setSeriesId]=useState("");
 const [episodeId,setEpisodeId]=useState("");
 const [ready,setReady]=useState(false);
 const [title,setTitle]=useState("");
 const [kind,setKind]=useState<AssetKind>("Vídeo");
 const [source,setSource]=useState("Generado por IA");
 const [url,setUrl]=useState("");
 const [rights,setRights]=useState<Rights>("Pendiente");
 const [license,setLicense]=useState("");
 const [version,setVersion]=useState("v1");
 const [notes,setNotes]=useState("");
 const [width,setWidth]=useState("");
 const [height,setHeight]=useState("");
 const [fps,setFps]=useState("");
 const [duration,setDuration]=useState("");
 const [codec,setCodec]=useState("");
 const [audioTracks,setAudioTracks]=useState("");
 const [subtitleTracks,setSubtitleTracks]=useState("");
 const [checksum,setChecksum]=useState("");
 const [filter,setFilter]=useState<"Todos"|"Actuales"|"Archivados"|Rights>("Todos");
 const [notice,setNotice]=useState("Registro local · No se han subido archivos");
 const [expanded,setExpanded]=useState<string|null>(null);

 useEffect(()=>{
  try{
   const raw=JSON.parse(localStorage.getItem(KEY)||"[]") as Partial<Asset>[];
   setAssets(raw.map(a=>({...a,logicalId:a.logicalId||a.id||crypto.randomUUID(),versionNumber:a.versionNumber||Number((a.version||"v1").replace(/[^0-9]/g,""))||1,versionStatus:a.versionStatus||"Actual"})) as Asset[]);
   const stored=JSON.parse(localStorage.getItem("microdrama-studio-local-v1")||"[]") as SeriesOption[];
   setSeries(stored);if(stored[0])setSeriesId(stored[0].id);
  }catch{setAssets([]);setSeries([])}
  setReady(true);
 },[]);
 useEffect(()=>{if(ready)localStorage.setItem(KEY,JSON.stringify(assets))},[assets,ready]);
 const selectedSeries=series.find(s=>s.id===seriesId);
 const episodes=selectedSeries?.episodes||[];
 const visible=useMemo(()=>assets.filter(a=>{
  if(filter==="Todos")return true;
  if(filter==="Actuales")return a.versionStatus==="Actual";
  if(filter==="Archivados")return a.versionStatus==="Archivada";
  return a.rights===filter;
 }),[assets,filter]);
 const currentAssets=assets.filter(a=>a.versionStatus==="Actual");
 const confirmed=currentAssets.filter(a=>a.rights==="Confirmado").length;
 const groups=useMemo(()=>visible.reduce<Record<string,Asset[]>>((acc,a)=>{(acc[a.logicalId]??=[]).push(a);return acc},{}),[visible]);

 function addAsset(){
  if(title.trim().length<2||!selectedSeries)return;
  const episode=episodes.find(e=>e.id===episodeId);
  const numericVersion=Number(version.replace(/[^0-9]/g,""))||1;
  const item:Asset={
   id:crypto.randomUUID(),logicalId:crypto.randomUUID(),seriesId:selectedSeries.id,seriesTitle:selectedSeries.title,
   ...(episode?{episodeId:episode.id,episodeTitle:"EP"+String(episode.number).padStart(2,"0")+" · "+episode.title}:{}),
   title:title.trim(),kind,source,url:url.trim(),rights,license:license.trim(),version:version.trim()||"v1",
   versionNumber:numericVersion,versionStatus:"Actual",notes:notes.trim(),createdAt:new Date().toISOString(),
   width:asNumber(width),height:asNumber(height),fps:asNumber(fps),durationSeconds:asNumber(duration),codec:codec.trim()||undefined,
   audioTracks:asNumber(audioTracks),subtitleTracks:asNumber(subtitleTracks),checksum:checksum.trim()||undefined
  };
  setAssets(p=>[item,...p]);setTitle("");setUrl("");setLicense("");setVersion("v1");setNotes("");
  setWidth("");setHeight("");setFps("");setDuration("");setCodec("");setAudioTracks("");setSubtitleTracks("");setChecksum("");
  setRights("Pendiente");setEpisodeId("");setNotice("Activo y metadatos técnicos registrados en este navegador.");
 }
 function addVersion(asset:Asset){
  const nextNumber=Math.max(0,...assets.filter(a=>a.logicalId===asset.logicalId).map(a=>a.versionNumber))+1;
  const next:Asset={...asset,id:crypto.randomUUID(),version:"v"+nextNumber,versionNumber:nextNumber,versionStatus:"Actual",createdAt:new Date().toISOString(),rights:"Pendiente",notes:"Nueva versión basada en "+asset.version+" · Revisar derechos y QA."};
  setAssets(p=>p.map(a=>a.logicalId===asset.logicalId?{...a,versionStatus:"Archivada" as const}:a).concat(next));
  setExpanded(asset.logicalId);setNotice("Nueva versión creada. La versión anterior quedó archivada.");
 }
 function cycleRights(id:string){setAssets(p=>p.map(a=>a.id===id?{...a,rights:a.rights==="Pendiente"?"Confirmado":a.rights==="Confirmado"?"Restringido":"Pendiente"}:a));}
 function deleteAsset(asset:Asset){if(confirm("¿Eliminar esta versión del registro?"))setAssets(p=>p.filter(a=>a.id!==asset.id));}
 if(!ready)return <main className="min-h-screen bg-[#090b10] text-white grid place-items-center">Cargando registro…</main>;
 return <main className="min-h-screen bg-[#090b10] text-[#f4f5f8]">
  <header className="h-[68px] border-b border-[#252a36] px-5 md:px-8 flex items-center justify-between">
   <Link href="/studio" className="flex items-center gap-2 text-xs text-[#aeb7c6] hover:text-white"><ArrowLeft size={15}/> Volver al Studio</Link>
   <div className="text-xs tracking-[.16em] font-semibold">MICRODRAMA <span className="text-[#d6ff63]">/ ASSET REGISTRY</span></div>
   <span className="text-[10px] text-[#d6ff63] border border-[#d6ff63]/25 rounded-full px-3 py-1.5">LOCAL</span>
  </header>
  <div className="max-w-[1500px] mx-auto p-5 md:p-9">
   <div className="mb-8"><div className="text-[9px] tracking-[.28em] text-[#d6ff63] mb-3">PRODUCTION CONTROL / MASTER ASSETS</div><h1 className="text-3xl md:text-[40px] font-semibold tracking-[-.04em]">Media Asset Registry<span className="text-[#d6ff63]">.</span></h1><p className="text-sm text-[#818a9a] mt-2 max-w-2xl">Trazabilidad por serie y episodio, historial de versiones y ficha técnica del máster audiovisual.</p></div>
   <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
    <Metric label="Versiones registradas" value={assets.length}/><Metric label="Másteres actuales" value={currentAssets.length}/><Metric label="Derechos confirmados" value={confirmed}/><Metric label="Pendientes de derechos" value={currentAssets.filter(a=>a.rights!=="Confirmado").length}/>
   </div>
   <div className="grid xl:grid-cols-[.88fr_1.12fr] gap-5">
    <section className="rounded-2xl border border-[#252a36] bg-[#10141c] p-5 md:p-6">
     <h2 className="font-semibold">Registrar máster / activo</h2><p className="text-[11px] text-[#7d8797] mt-1 mb-5">Registra metadatos y localización. No carga ni inspecciona archivos.</p>
     <div className="space-y-4">
      <Field label="Serie asociada"><select value={seriesId} onChange={e=>{setSeriesId(e.target.value);setEpisodeId("")}} className="control"><option value="">Selecciona una serie</option>{series.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></Field>
      <Field label="Episodio (opcional)"><select value={episodeId} onChange={e=>setEpisodeId(e.target.value)} className="control"><option value="">Activo general de la serie</option>{episodes.map(e=><option key={e.id} value={e.id}>EP{String(e.number).padStart(2,"0")} · {e.title}</option>)}</select></Field>
      <Field label="Nombre del activo"><input value={title} onChange={e=>setTitle(e.target.value)} maxLength={100} placeholder="EP01_MASTER_FINAL" className="control"/></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Tipo"><select value={kind} onChange={e=>setKind(e.target.value as AssetKind)} className="control">{kinds.map(k=><option key={k}>{k}</option>)}</select></Field><Field label="Versión inicial"><input value={version} onChange={e=>setVersion(e.target.value)} placeholder="v1" className="control"/></Field></div>
      <Field label="Procedencia"><select value={source} onChange={e=>setSource(e.target.value)} className="control"><option>Generado por IA</option><option>Grabación propia</option><option>Proveedor externo</option><option>Stock / licencia</option><option>Cliente / talento</option></select></Field>
      <Field label="URL del archivo"><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://… o ruta del almacenamiento" className="control"/></Field>
      <Field label="Licencia / titularidad"><input value={license} onChange={e=>setLicense(e.target.value)} placeholder="Licencia comercial, cesión, consentimiento…" className="control"/></Field>
      <Field label="Estado de derechos"><select value={rights} onChange={e=>setRights(e.target.value as Rights)} className="control"><option>Pendiente</option><option>Confirmado</option><option>Restringido</option></select></Field>
      <div className="border-t border-[#252a36] pt-4"><div className="text-[10px] tracking-[.18em] text-[#d6ff63] mb-3">TECHNICAL MASTER DATA</div>
       <div className="grid grid-cols-2 gap-3"><Field label="Ancho (px)"><input type="number" min="1" value={width} onChange={e=>setWidth(e.target.value)} placeholder="1080" className="control"/></Field><Field label="Alto (px)"><input type="number" min="1" value={height} onChange={e=>setHeight(e.target.value)} placeholder="1920" className="control"/></Field><Field label="FPS"><input type="number" min="1" max="240" value={fps} onChange={e=>setFps(e.target.value)} placeholder="24" className="control"/></Field><Field label="Duración (seg.)"><input type="number" min="0" step="0.1" value={duration} onChange={e=>setDuration(e.target.value)} placeholder="90" className="control"/></Field><Field label="Códec"><input value={codec} onChange={e=>setCodec(e.target.value)} placeholder="H.264 / AAC" className="control"/></Field><Field label="Pistas de audio"><input type="number" min="0" value={audioTracks} onChange={e=>setAudioTracks(e.target.value)} placeholder="1" className="control"/></Field><Field label="Pistas de subtítulos"><input type="number" min="0" value={subtitleTracks} onChange={e=>setSubtitleTracks(e.target.value)} placeholder="1" className="control"/></Field><Field label="Checksum SHA-256"><input value={checksum} onChange={e=>setChecksum(e.target.value)} placeholder="Hash del archivo" className="control"/></Field></div>
      </div>
      <Field label="Notas"><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Restricciones, idiomas, revisión técnica…" className="control"/></Field>
      <button onClick={addAsset} disabled={title.trim().length<2||!seriesId} className="w-full rounded-lg bg-[#d6ff63] text-[#10140a] py-3 text-xs font-bold flex justify-center items-center gap-2 disabled:opacity-40"><Plus size={15}/> Registrar activo</button>
     </div>
    </section>
    <section className="rounded-2xl border border-[#252a36] bg-[#10141c] p-5 md:p-6">
     <div className="flex flex-wrap items-center justify-between gap-3 mb-5"><div><h2 className="font-semibold">Inventario de producción</h2><p className="text-[11px] text-[#7d8797] mt-1">Versiones, episodios, derechos y ficha técnica.</p></div><select value={filter} onChange={e=>setFilter(e.target.value as typeof filter)} className="rounded-lg border border-[#303644] bg-[#090c12] px-3 py-2 text-xs"><option>Todos</option><option>Actuales</option><option>Archivados</option><option>Pendiente</option><option>Confirmado</option><option>Restringido</option></select></div>
     {visible.length===0?<div className="rounded-xl border border-dashed border-[#303644] p-10 text-center"><FileImage size={25} className="mx-auto text-[#778293]"/><p className="text-sm mt-3">No hay activos en esta vista.</p><p className="text-[11px] text-[#778293] mt-1">Registra el primer recurso de tu producción.</p></div>:<div className="space-y-3">{Object.entries(groups).map(([logicalId,versions])=>{const sorted=[...versions].sort((a,b)=>b.versionNumber-a.versionNumber);const latest=sorted[0];const Icon=iconFor(latest.kind);return <article key={logicalId} className="rounded-xl border border-[#2a3040] bg-[#0b0e14] p-4">
      <div className="flex items-start gap-3"><div className="w-10 h-10 shrink-0 rounded-lg bg-[#d6ff63]/10 text-[#d6ff63] grid place-items-center"><Icon size={18}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{latest.title}</h3><span className="text-[9px] rounded-full px-2 py-1 border border-[#303644] text-[#aab3c2]">{latest.kind} · {latest.version}</span><span className="text-[9px] text-[#d6ff63]">{latest.versionStatus.toUpperCase()}</span></div><p className="text-[11px] text-[#8c96a7] mt-1">{latest.seriesTitle} {latest.episodeTitle?"· "+latest.episodeTitle:"· Serie completa"} · {latest.source}</p><p className="text-[10px] text-[#748092] mt-1">{latest.width&&latest.height?latest.width+"×"+latest.height+" px": "Resolución pendiente"}{latest.fps?" · "+latest.fps+" fps":""}{latest.durationSeconds?" · "+latest.durationSeconds+" s":""}{latest.codec?" · "+latest.codec:""}</p><div className="flex flex-wrap items-center gap-3 mt-3"><span className={latest.rights==="Confirmado"?"text-[9px] text-[#d6ff63]":"text-[9px] text-[#e2b36d]"}>{latest.rights.toUpperCase()}</span><button onClick={()=>addVersion(latest)} className="text-[10px] text-[#d6ff63] inline-flex items-center gap-1"><Plus size={11}/> Nueva versión</button><button onClick={()=>setExpanded(expanded===logicalId?null:logicalId)} className="text-[10px] text-[#aab3c2] inline-flex items-center gap-1"><History size={11}/> Historial ({versions.length})</button>{latest.url&&<a href={latest.url} target="_blank" rel="noreferrer" className="text-[10px] text-[#d6ff63] inline-flex items-center gap-1">Abrir archivo <ExternalLink size={11}/></a>}</div></div><div className="flex flex-col items-end gap-2"><button onClick={()=>cycleRights(latest.id)} title="Cambiar estado de derechos" className="text-[10px] text-[#9da7b6] hover:text-white">Cambiar derechos</button><button onClick={()=>deleteAsset(latest)} aria-label="Eliminar versión" className="text-[#697486] hover:text-red-300"><Trash2 size={14}/></button></div></div>
      {expanded===logicalId&&<div className="mt-4 pt-3 border-t border-[#252a36] space-y-2">{sorted.map(v=><div key={v.id} className="flex flex-wrap items-center gap-2 text-[10px] text-[#9aa4b4]"><Archive size={12}/><span className="font-semibold text-white">{v.version}</span><span>{new Date(v.createdAt).toLocaleString("es-ES")}</span><span>{v.versionStatus}</span><span>Derechos: {v.rights}</span><span className="ml-auto">{v.checksum?"SHA-256 registrado":"Sin checksum"}</span><button onClick={()=>cycleRights(v.id)} className="text-[#d6ff63]">Cambiar derechos</button><button onClick={()=>deleteAsset(v)} className="text-red-300">Eliminar</button></div>)}</div>}
     </article>})}</div>}
     <div className="mt-5 rounded-xl border border-[#d6ff63]/20 bg-[#d6ff63]/[.04] p-4"><div className="flex items-center gap-2 text-xs text-[#d6ff63]"><ShieldCheck size={15}/> Regla de publicación</div><p className="text-[11px] text-[#aab39e] leading-relaxed mt-2">Solo se evalúa la versión actual de cada activo. La confirmación de derechos es una declaración interna; el checksum, la resolución y el resto de datos deben ser aportados por el responsable. No hay inspección automática del archivo.</p></div>
    </section>
   </div>
   <div className="mt-6 flex items-center gap-2 text-[10px] text-[#697486]"><Check size={12} className="text-[#d6ff63]"/>{notice} · Los datos permanecen en este navegador.</div>
  </div>
 </main>;
}
function Metric({label,value}:{label:string;value:number}){return <div className="rounded-xl border border-[#252a36] bg-[#10141c] p-4"><div className="text-[10px] text-[#7d8797]">{label}</div><div className="text-2xl font-semibold mt-3">{value}</div></div>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block text-xs text-[#aeb7c6]">{label}{children}</label>}
