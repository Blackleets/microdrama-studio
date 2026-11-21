"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, FileImage, FileVideo, FileAudio, FileText, Plus, ShieldCheck, Trash2, ExternalLink, History, Archive } from "lucide-react";

type AssetKind = "Vídeo" | "Imagen" | "Audio" | "Documento";
type AssetRole = "Máster de episodio" | "Clip de escena" | "Tráiler" | "Referencia";
type Rights = "Pendiente" | "Confirmado" | "Restringido";
type EpisodeOption = { id:string; title:string; number:number };
type SeriesOption = { id:string; title:string; episodes?:EpisodeOption[] };
type SubtitleReport={format:"SRT"|"VTT";cueCount:number;durationSeconds:number;errors:string[];language:string};
type Asset = { fileId?:string; fileName?:string; fileSize?:number; mimeType?:string; subtitleFormat?:"SRT"|"VTT";subtitleCueCount?:number;subtitleDurationSeconds?:number;subtitleLanguage?:string;audioLanguage?:string;subtitleValidation?:"Válido"|"Con errores";

 id:string; logicalId:string; seriesId:string; seriesTitle:string; episodeId?:string; episodeTitle?:string;
 title:string; kind:AssetKind; assetRole?:AssetRole; source:string; url:string; rights:Rights; license:string;
 version:string; versionNumber:number; versionStatus:"Actual"|"Archivada"; notes:string; createdAt:string;
 width?:number; height?:number; fps?:number; durationSeconds?:number; codec?:string; audioTracks?:number; subtitleTracks?:number; checksum?:string;
};
const KEY="microdrama-assets-v1";
const kinds:AssetKind[]=["Vídeo","Imagen","Audio","Documento"];
const iconFor=(kind:AssetKind)=>kind==="Vídeo"?FileVideo:kind==="Audio"?FileAudio:kind==="Documento"?FileText:FileImage;
const asNumber=(value:string)=>value.trim()===""?undefined:Number(value);
function parseSubtitleFile(text:string,name:string):Omit<SubtitleReport,"language">{
 const format=name.toLowerCase().endsWith(".vtt")?"VTT":"SRT";
 const errors:string[]=[];
 const normalized=text.replace(/^\uFEFF/,"").replace(/\r/g,"").trim();
 if(format==="VTT"&&!normalized.startsWith("WEBVTT"))errors.push("Falta la cabecera WEBVTT.");
 const blocks=normalized.split(/\n\s*\n/).filter(Boolean);
 const timePattern=/(\d{2}:)?\d{2}:\d{2}[.,]\d{3}\s+-->\s+(\d{2}:)?\d{2}:\d{2}[.,]\d{3}/;
 const timestamp=(value:string)=>{const v=value.trim().replace(",",".");const parts=v.split(":");const sec=Number(parts.pop());const min=Number(parts.pop());const hour=parts.length?Number(parts.pop()):0;return hour*3600+min*60+sec;};
 let cueCount=0;let previousStart=-1;let previousEnd=-1;let maxEnd=0;
 for(const block of blocks){
  if(format==="VTT"&&/^(WEBVTT|NOTE|STYLE|REGION)(\s|$)/.test(block))continue;
  const lines=block.split("\n").map(x=>x.trim()).filter(Boolean);
  const index=lines.findIndex(line=>timePattern.test(line));
  if(index<0)continue;
  cueCount++;
  const times=lines[index].split("-->");
  const start=timestamp(times[0]);const end=timestamp(times[1].split(/\s+/)[0]);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)errors.push("Cue "+cueCount+": intervalo de tiempo inválido.");
  if(start<previousStart)errors.push("Cue "+cueCount+": los tiempos no están ordenados.");
  if(start>=previousStart)previousStart=start;
  if(start<previousEnd)errors.push("Cue "+cueCount+": se solapa con el cue anterior.");
  if(end>previousEnd)previousEnd=end;
  if(Number.isFinite(end))maxEnd=Math.max(maxEnd,end);
  if(!lines.slice(index+1).join(" ").trim())errors.push("Cue "+cueCount+": texto vacío.");
 }
 if(cueCount===0)errors.push("No se encontraron bloques de subtítulos con marcas de tiempo.");
 return {format,cueCount,durationSeconds:Number(maxEnd.toFixed(3)),errors};
}
const DB_NAME="microdrama-media-v1";
function openMediaDB():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains("files"))request.result.createObjectStore("files",{keyPath:"id"});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function saveMediaFile(id:string,file:File){const db=await openMediaDB();await new Promise<void>((resolve,reject)=>{const tx=db.transaction("files","readwrite");tx.objectStore("files").put({id,file});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});db.close();}
async function getMediaFile(id:string):Promise<File|null>{const db=await openMediaDB();const result=await new Promise<File|null>((resolve,reject)=>{const request=db.transaction("files","readonly").objectStore("files").get(id);request.onsuccess=()=>resolve(request.result?.file??null);request.onerror=()=>reject(request.error);});db.close();return result;}
async function removeMediaFile(id:string){const db=await openMediaDB();await new Promise<void>((resolve,reject)=>{const tx=db.transaction("files","readwrite");tx.objectStore("files").delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();}
async function sha256File(file:File):Promise<string|undefined>{try{const digest=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());return Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,"0")).join("");}catch{return undefined;}}
async function probeMediaMetadata(file:File,kind:AssetKind):Promise<{width?:number;height?:number;durationSeconds?:number}>{
 const src=URL.createObjectURL(file);
 try{
  if(kind==="Vídeo"||kind==="Audio"){
   return await new Promise((resolve,reject)=>{const media=document.createElement(kind==="Vídeo"?"video":"audio");media.preload="metadata";media.onloadedmetadata=()=>{const data={...(kind==="Vídeo"?{width:(media as HTMLVideoElement).videoWidth,height:(media as HTMLVideoElement).videoHeight}:{}),...(Number.isFinite(media.duration)?{durationSeconds:Number(media.duration.toFixed(2))}:{})};media.removeAttribute("src");media.load();resolve(data);};media.onerror=()=>reject(new Error("No se pudieron leer los metadatos del archivo"));media.src=src;});
  }
  if(kind==="Imagen"){
   return await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve({width:image.naturalWidth,height:image.naturalHeight});image.onerror=()=>reject(new Error("No se pudieron leer las dimensiones de la imagen"));image.src=src;});
  }
  return {};
 }finally{URL.revokeObjectURL(src);}
}

export default function AssetRegistry(){
 const [assets,setAssets]=useState<Asset[]>([]);
 const [series,setSeries]=useState<SeriesOption[]>([]);
 const [seriesId,setSeriesId]=useState("");
 const [episodeId,setEpisodeId]=useState("");
 const [ready,setReady]=useState(false);
 const [title,setTitle]=useState("");
 const [kind,setKind]=useState<AssetKind>("Vídeo");
 const [assetRole,setAssetRole]=useState<AssetRole>("Máster de episodio");
 const [source,setSource]=useState("Generado por IA");
 const [url,setUrl]=useState("");
 const [selectedFile,setSelectedFile]=useState<File|null>(null);
 const [saving,setSaving]=useState(false);
 const [preview,setPreview]=useState<{asset:Asset;url:string}|null>(null);
 const [previewText,setPreviewText]=useState<string|null>(null);
 const [probing,setProbing]=useState(false);
 const [subtitleReport,setSubtitleReport]=useState<SubtitleReport|null>(null);
 const [subtitleLanguage,setSubtitleLanguage]=useState("es");
 const [audioLanguage,setAudioLanguage]=useState("es");
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
 function invalidateSeriesRelease(targetSeriesId:string){try{localStorage.setItem("microdrama-release-qa-v1:"+targetSeriesId,JSON.stringify([false,false,false]));const stored=JSON.parse(localStorage.getItem("microdrama-studio-local-v1")||"[]") as Array<{id:string;status?:string}>;localStorage.setItem("microdrama-studio-local-v1",JSON.stringify(stored.map(item=>item.id===targetSeriesId&&item.status==="Publicado"?{...item,status:"Desarrollo"}:item)));}catch{setNotice("No se pudo invalidar el QA local. Revisa el almacenamiento del navegador.");}}

 useEffect(()=>{
  try{
   const raw=JSON.parse(localStorage.getItem(KEY)||"[]") as Partial<Asset>[];
   setAssets(raw.map(a=>({...a,logicalId:a.logicalId||a.id||crypto.randomUUID(),versionNumber:a.versionNumber||Number((a.version||"v1").replace(/[^0-9]/g,""))||1,versionStatus:a.versionStatus||"Actual",assetRole:a.assetRole||(a.kind==="Vídeo"?"Máster de episodio":undefined)})) as Asset[]);
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

 async function addAsset(){
  if(title.trim().length<2||!selectedSeries||saving)return;
  if(selectedFile&&selectedFile.size>500*1024*1024){setNotice("El archivo supera el límite local de 500 MB.");return;}
  if(selectedFile){const expected=kind==="Vídeo"?"video/":kind==="Imagen"?"image/":kind==="Audio"?"audio/":"";if(expected&&!selectedFile.type.startsWith(expected)){setNotice("El tipo de archivo no coincide con la categoría seleccionada.");return;}}
  setSaving(true);
  const episode=episodes.find(e=>e.id===episodeId);
  const numericVersion=Number(version.replace(/[^0-9]/g,""))||1;
  const fileId=selectedFile?crypto.randomUUID():undefined;
  try{if(selectedFile&&fileId)await saveMediaFile(fileId,selectedFile);}catch{setSaving(false);setNotice("No se pudo guardar el archivo en el almacenamiento local del navegador.");return;}
  const generatedChecksum=!checksum.trim()&&selectedFile&&selectedFile.size<=50*1024*1024?await sha256File(selectedFile):undefined;
  const finalChecksum=checksum.trim()||generatedChecksum;
  const item:Asset={
   id:crypto.randomUUID(),logicalId:crypto.randomUUID(),...(fileId?{fileId,fileName:selectedFile?.name,fileSize:selectedFile?.size,mimeType:selectedFile?.type}:{}),seriesId:selectedSeries.id,seriesTitle:selectedSeries.title,
   ...(episode?{episodeId:episode.id,episodeTitle:"EP"+String(episode.number).padStart(2,"0")+" · "+episode.title}:{}),
   title:title.trim(),kind,assetRole:kind==="Vídeo"?assetRole:undefined,source,url:url.trim(),rights,license:license.trim(),version:version.trim()||"v1",
   versionNumber:numericVersion,versionStatus:"Actual",notes:notes.trim(),createdAt:new Date().toISOString(),
   width:asNumber(width),height:asNumber(height),fps:asNumber(fps),durationSeconds:asNumber(duration),codec:codec.trim()||undefined,
   audioTracks:asNumber(audioTracks),subtitleTracks:asNumber(subtitleTracks),...(subtitleReport?{subtitleFormat:subtitleReport.format,subtitleCueCount:subtitleReport.cueCount,subtitleDurationSeconds:subtitleReport.durationSeconds,subtitleLanguage:subtitleLanguage.trim()||"und",subtitleValidation:subtitleReport.errors.length?"Con errores" as const:"Válido" as const}:{}),audioLanguage:kind==="Audio"?(audioLanguage.trim()||"und"):undefined,checksum:finalChecksum||undefined
  };
  setAssets(p=>[item,...p]);invalidateSeriesRelease(selectedSeries.id);setTitle("");setUrl("");setSelectedFile(null);setLicense("");setVersion("v1");setNotes("");setSaving(false);
  setWidth("");setHeight("");setFps("");setDuration("");setCodec("");setAudioTracks("");setSubtitleTracks("");setChecksum("");
  setRights("Pendiente");setAssetRole("Máster de episodio");setEpisodeId("");setSubtitleReport(null);setSubtitleLanguage("es");setAudioLanguage("es");setNotice(generatedChecksum?"Activo guardado. SHA-256 calculado automáticamente.":"Activo y metadatos técnicos registrados en este navegador.");
 }
 async function handleFileSelected(file:File|null){
  setSelectedFile(file);setSubtitleReport(null);
  if(!file)return;
  setProbing(true);
  if(kind==="Documento"&&/\.(srt|vtt)$/i.test(file.name)){
   try{const report=parseSubtitleFile(await file.text(),file.name);setSubtitleReport({...report,language:subtitleLanguage});setNotice(report.errors.length?("Subtítulos detectados con "+report.errors.length+" incidencias."):(report.cueCount+" cues de subtítulos validados localmente."));}
   catch{setNotice("No se pudo leer el archivo de subtítulos.");}
   finally{setProbing(false);}
   return;
  }
  try{const metadata=await probeMediaMetadata(file,kind);if(metadata.width)setWidth(String(metadata.width));if(metadata.height)setHeight(String(metadata.height));if(metadata.durationSeconds)setDuration(String(metadata.durationSeconds));setNotice("Metadatos básicos extraídos del archivo seleccionado. FPS y códec deben confirmarse manualmente.");}
  catch{setNotice("Archivo seleccionado. No se pudieron extraer sus metadatos automáticamente.");}
  finally{setProbing(false);}
 }
 function addVersion(asset:Asset){
  const nextNumber=Math.max(0,...assets.filter(a=>a.logicalId===asset.logicalId).map(a=>a.versionNumber))+1;
  const next:Asset={...asset,id:crypto.randomUUID(),version:"v"+nextNumber,versionNumber:nextNumber,versionStatus:"Actual",createdAt:new Date().toISOString(),rights:"Pendiente",fileId:undefined,fileName:undefined,fileSize:undefined,mimeType:undefined,url:"",width:undefined,height:undefined,fps:undefined,durationSeconds:undefined,codec:undefined,audioTracks:undefined,subtitleTracks:undefined,checksum:undefined,subtitleFormat:undefined,subtitleCueCount:undefined,subtitleDurationSeconds:undefined,subtitleLanguage:undefined,audioLanguage:undefined,subtitleValidation:undefined,notes:"Nueva versión basada en "+asset.version+" · Adjuntar el nuevo máster, volver a declarar metadatos y revisar derechos."};
  setAssets(p=>p.map(a=>a.logicalId===asset.logicalId?{...a,versionStatus:"Archivada" as const}:a).concat(next));invalidateSeriesRelease(asset.seriesId);
  setExpanded(asset.logicalId);setNotice("Nueva versión creada. La versión anterior quedó archivada.");
 }
 function cycleRights(id:string){const asset=assets.find(a=>a.id===id);setAssets(p=>p.map(a=>a.id===id?{...a,rights:a.rights==="Pendiente"?"Confirmado":a.rights==="Confirmado"?"Restringido":"Pendiente"}:a));if(asset?.versionStatus==="Actual")invalidateSeriesRelease(asset.seriesId);}
 function restoreVersion(asset:Asset){if(!confirm("¿Restaurar "+asset.version+" como versión actual? Se volverán a revisar sus derechos."))return;setAssets(p=>p.map(a=>a.logicalId===asset.logicalId?{...a,versionStatus:a.id===asset.id?"Actual" as const:"Archivada" as const,rights:a.id===asset.id?"Pendiente" as Rights:a.rights}:a));invalidateSeriesRelease(asset.seriesId);setNotice("Versión restaurada. Debes volver a confirmar derechos y QA.");}
 function deleteAsset(asset:Asset){if(confirm("¿Eliminar esta versión del registro y su archivo local?")){setAssets(p=>p.filter(a=>a.id!==asset.id));if(asset.versionStatus==="Actual")invalidateSeriesRelease(asset.seriesId);if(asset.fileId)void removeMediaFile(asset.fileId);}}
 async function openPreview(asset:Asset){if(!asset.fileId){setNotice("Este activo no tiene un archivo cargado.");return;}try{const file=await getMediaFile(asset.fileId);if(!file){setNotice("No se encontró el archivo en el almacenamiento local.");return;}if(preview)URL.revokeObjectURL(preview.url);setPreviewText(asset.kind==="Documento"&&/\.(srt|vtt)$/i.test(file.name)?await file.text():null);setPreview({asset,url:URL.createObjectURL(file)});}catch{setNotice("No se pudo abrir el archivo local.");}}
 function closePreview(){if(preview)URL.revokeObjectURL(preview.url);setPreview(null);setPreviewText(null);}
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
     <h2 className="font-semibold">Registrar máster / activo</h2><p className="text-[11px] text-[#7d8797] mt-1 mb-5">Carga archivos al almacenamiento privado de este navegador y registra sus metadatos. No se envían a un servidor.</p>
     <div className="space-y-4">
      <Field label="Serie asociada"><select value={seriesId} onChange={e=>{setSeriesId(e.target.value);setEpisodeId("")}} className="control"><option value="">Selecciona una serie</option>{series.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></Field>
      <Field label="Episodio (opcional)"><select value={episodeId} onChange={e=>setEpisodeId(e.target.value)} className="control"><option value="">Activo general de la serie</option>{episodes.map(e=><option key={e.id} value={e.id}>EP{String(e.number).padStart(2,"0")} · {e.title}</option>)}</select></Field>
      <Field label="Nombre del activo"><input value={title} onChange={e=>setTitle(e.target.value)} maxLength={100} placeholder="EP01_MASTER_FINAL" className="control"/></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Tipo"><select value={kind} onChange={e=>setKind(e.target.value as AssetKind)} className="control">{kinds.map(k=><option key={k}>{k}</option>)}</select></Field><Field label="Versión inicial"><input value={version} onChange={e=>setVersion(e.target.value)} placeholder="v1" className="control"/></Field></div>
      {kind==="Vídeo"&&<Field label="Uso del vídeo"><select value={assetRole} onChange={e=>setAssetRole(e.target.value as AssetRole)} className="control"><option>Máster de episodio</option><option>Clip de escena</option><option>Tráiler</option><option>Referencia</option></select></Field>}
      <Field label="Procedencia"><select value={source} onChange={e=>setSource(e.target.value)} className="control"><option>Generado por IA</option><option>Grabación propia</option><option>Proveedor externo</option><option>Stock / licencia</option><option>Cliente / talento</option></select></Field>
      <Field label="Archivo maestro (máx. 500 MB)"><input type="file" accept={kind==="Vídeo"?"video/*":kind==="Imagen"?"image/*":kind==="Audio"?"audio/*":".pdf,.txt,.doc,.docx,.srt,.vtt"} onClick={e=>{e.currentTarget.value="";}} onChange={e=>void handleFileSelected(e.target.files?.[0]??null)} className="control file:mr-3 file:rounded-md file:border-0 file:bg-[#d6ff63] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black"/>{selectedFile&&<span className="block mt-2 text-[10px] text-[#d6ff63]">{selectedFile.name} · {(selectedFile.size/1024/1024).toFixed(1)} MB</span>}{probing&&<span className="block mt-1 text-[10px] text-[#aeb7c6]">Leyendo metadatos básicos…</span>}</Field>
      <Field label="URL externa (opcional)"><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…" className="control"/></Field>
      {kind==="Audio"&&<Field label="Idioma de la pista de audio (ISO 639-1)"><input value={audioLanguage} onChange={e=>setAudioLanguage(e.target.value.toLowerCase().slice(0,2))} placeholder="es" maxLength={2} className="control"/></Field>}
      {kind==="Documento"&&<Field label="Idioma del subtítulo (ISO 639-1)"><input value={subtitleLanguage} onChange={e=>setSubtitleLanguage(e.target.value.toLowerCase().slice(0,2))} placeholder="es" maxLength={2} className="control"/></Field>}
      {subtitleReport&&<div className="rounded-lg border border-[#303644] bg-[#090c12] p-3 text-[10px]"><div className="flex justify-between"><span className="font-semibold text-white">{subtitleReport.format} · {subtitleReport.cueCount} cues · {Math.round(subtitleReport.durationSeconds)}s · {subtitleLanguage.toUpperCase()}</span><span className={subtitleReport.errors.length?"text-amber-300":"text-[#d6ff63]"}>{subtitleReport.errors.length?"REVISAR":"ESTRUCTURA VÁLIDA"}</span></div>{subtitleReport.errors.slice(0,4).map((error,i)=><p key={i} className="text-amber-200 mt-1">{error}</p>)}<p className="text-[#7d8797] mt-2">Validación estructural local; no evalúa sincronización, traducción ni legibilidad visual.</p></div>}
      <Field label="Licencia / titularidad"><input value={license} onChange={e=>setLicense(e.target.value)} placeholder="Licencia comercial, cesión, consentimiento…" className="control"/></Field>
      <Field label="Estado de derechos"><select value={rights} onChange={e=>setRights(e.target.value as Rights)} className="control"><option>Pendiente</option><option>Confirmado</option><option>Restringido</option></select></Field>
      <div className="border-t border-[#252a36] pt-4"><div className="text-[10px] tracking-[.18em] text-[#d6ff63] mb-3">TECHNICAL MASTER DATA</div>
       <div className="grid grid-cols-2 gap-3"><Field label="Ancho (px)"><input type="number" min="1" value={width} onChange={e=>setWidth(e.target.value)} placeholder="1080" className="control"/></Field><Field label="Alto (px)"><input type="number" min="1" value={height} onChange={e=>setHeight(e.target.value)} placeholder="1920" className="control"/></Field><Field label="FPS"><input type="number" min="1" max="240" value={fps} onChange={e=>setFps(e.target.value)} placeholder="24" className="control"/></Field><Field label="Duración (seg.)"><input type="number" min="0" step="0.1" value={duration} onChange={e=>setDuration(e.target.value)} placeholder="90" className="control"/></Field><Field label="Códec"><input value={codec} onChange={e=>setCodec(e.target.value)} placeholder="H.264 / AAC" className="control"/></Field><Field label="Pistas de audio"><input type="number" min="0" value={audioTracks} onChange={e=>setAudioTracks(e.target.value)} placeholder="1" className="control"/></Field><Field label="Pistas de subtítulos"><input type="number" min="0" value={subtitleTracks} onChange={e=>setSubtitleTracks(e.target.value)} placeholder="1" className="control"/></Field><Field label="Checksum SHA-256"><input value={checksum} onChange={e=>setChecksum(e.target.value)} placeholder="Hash del archivo" className="control"/></Field></div>
      </div>
      <Field label="Notas"><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Restricciones, idiomas, revisión técnica…" className="control"/></Field>
      <button onClick={addAsset} disabled={title.trim().length<2||!seriesId||saving||probing} className="w-full rounded-lg bg-[#d6ff63] text-[#10140a] py-3 text-xs font-bold flex justify-center items-center gap-2 disabled:opacity-40"><Plus size={15}/> {saving?"Guardando archivo…":"Registrar activo"}</button>
     </div>
    </section>
    <section className="rounded-2xl border border-[#252a36] bg-[#10141c] p-5 md:p-6">
     <div className="flex flex-wrap items-center justify-between gap-3 mb-5"><div><h2 className="font-semibold">Inventario de producción</h2><p className="text-[11px] text-[#7d8797] mt-1">Versiones, episodios, derechos y ficha técnica.</p></div><select value={filter} onChange={e=>setFilter(e.target.value as typeof filter)} className="rounded-lg border border-[#303644] bg-[#090c12] px-3 py-2 text-xs"><option>Todos</option><option>Actuales</option><option>Archivados</option><option>Pendiente</option><option>Confirmado</option><option>Restringido</option></select></div>
     {visible.length===0?<div className="rounded-xl border border-dashed border-[#303644] p-10 text-center"><FileImage size={25} className="mx-auto text-[#778293]"/><p className="text-sm mt-3">No hay activos en esta vista.</p><p className="text-[11px] text-[#778293] mt-1">Registra el primer recurso de tu producción.</p></div>:<div className="space-y-3">{Object.entries(groups).map(([logicalId,versions])=>{const sorted=[...versions].sort((a,b)=>b.versionNumber-a.versionNumber);const latest=sorted[0];const Icon=iconFor(latest.kind);return <article key={logicalId} className="rounded-xl border border-[#2a3040] bg-[#0b0e14] p-4">
      <div className="flex items-start gap-3"><div className="w-10 h-10 shrink-0 rounded-lg bg-[#d6ff63]/10 text-[#d6ff63] grid place-items-center"><Icon size={18}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{latest.title}</h3><span className="text-[9px] rounded-full px-2 py-1 border border-[#303644] text-[#aab3c2]">{latest.kind}{latest.assetRole?" · "+latest.assetRole:""} · {latest.version}</span><span className="text-[9px] text-[#d6ff63]">{latest.versionStatus.toUpperCase()}</span></div><p className="text-[11px] text-[#8c96a7] mt-1">{latest.seriesTitle} {latest.episodeTitle?"· "+latest.episodeTitle:"· Serie completa"} · {latest.source}</p><p className="text-[10px] text-[#748092] mt-1">{latest.width&&latest.height?latest.width+"×"+latest.height+" px": "Resolución pendiente"}{latest.subtitleCueCount!==undefined?" · "+latest.subtitleCueCount+" cues / "+(latest.subtitleDurationSeconds??0)+"s "+(latest.subtitleLanguage||""):""}{latest.subtitleValidation?" · Subtítulos "+latest.subtitleValidation:""}{latest.fps?" · "+latest.fps+" fps":""}{latest.durationSeconds?" · "+latest.durationSeconds+" s":""}{latest.codec?" · "+latest.codec:""}{latest.audioLanguage?" · Audio "+latest.audioLanguage.toUpperCase():""}{latest.checksum?" · SHA-256 "+latest.checksum.slice(0,12)+"…":""}</p><div className="flex flex-wrap items-center gap-3 mt-3"><span className={latest.rights==="Confirmado"?"text-[9px] text-[#d6ff63]":"text-[9px] text-[#e2b36d]"}>{latest.rights.toUpperCase()}</span><button onClick={()=>addVersion(latest)} className="text-[10px] text-[#d6ff63] inline-flex items-center gap-1"><Plus size={11}/> Nueva versión</button><button onClick={()=>setExpanded(expanded===logicalId?null:logicalId)} className="text-[10px] text-[#aab3c2] inline-flex items-center gap-1"><History size={11}/> Historial ({versions.length})</button>{latest.fileId&&<button onClick={()=>void openPreview(latest)} className="text-[10px] text-[#d6ff63] inline-flex items-center gap-1"><ExternalLink size={11}/> Abrir archivo local</button>}{latest.fileName&&<span className="text-[9px] text-[#8c96a7]">{latest.fileName} · {((latest.fileSize||0)/1024/1024).toFixed(1)} MB</span>}{latest.url&&<a href={latest.url} target="_blank" rel="noreferrer" className="text-[10px] text-[#d6ff63] inline-flex items-center gap-1">Abrir URL <ExternalLink size={11}/></a>}</div></div><div className="flex flex-col items-end gap-2"><button onClick={()=>cycleRights(latest.id)} title="Cambiar estado de derechos" className="text-[10px] text-[#9da7b6] hover:text-white">Cambiar derechos</button><button onClick={()=>deleteAsset(latest)} aria-label="Eliminar versión" className="text-[#697486] hover:text-red-300"><Trash2 size={14}/></button></div></div>
      {expanded===logicalId&&<div className="mt-4 pt-3 border-t border-[#252a36] space-y-2">{sorted.map(v=><div key={v.id} className="flex flex-wrap items-center gap-2 text-[10px] text-[#9aa4b4]"><Archive size={12}/><span className="font-semibold text-white">{v.version}</span><span>{new Date(v.createdAt).toLocaleString("es-ES")}</span><span>{v.versionStatus}</span><span>Derechos: {v.rights}</span>{v.subtitleCueCount!==undefined&&<span>{v.subtitleFormat} · {v.subtitleCueCount} cues · {v.subtitleDurationSeconds??0}s · {v.subtitleLanguage||"und"} · {v.subtitleValidation}</span>}{v.audioLanguage&&<span>Pista de audio · {v.audioLanguage.toUpperCase()}</span>}{v.checksum&&<span>SHA-256 · {v.checksum.slice(0,16)}…</span>}<span className="ml-auto">{v.checksum?"SHA-256 registrado":"Sin checksum"}</span><button onClick={()=>cycleRights(v.id)} className="text-[#d6ff63]">Cambiar derechos</button><button onClick={()=>restoreVersion(v)} disabled={v.versionStatus==="Actual"} className="text-[#d6ff63] disabled:opacity-30">Restaurar</button><button onClick={()=>deleteAsset(v)} className="text-red-300">Eliminar</button></div>)}</div>}
     </article>})}</div>}
     <div className="mt-5 rounded-xl border border-[#d6ff63]/20 bg-[#d6ff63]/[.04] p-4"><div className="flex items-center gap-2 text-xs text-[#d6ff63]"><ShieldCheck size={15}/> Regla de publicación</div><p className="text-[11px] text-[#aab39e] leading-relaxed mt-2">Solo se evalúa la versión actual de cada activo. La confirmación de derechos es una declaración interna; el checksum, la resolución y el resto de datos deben ser aportados por el responsable. No hay inspección automática del archivo.</p></div>
    </section>
   </div>
   <div className="mt-6 flex items-center gap-2 text-[10px] text-[#697486]"><Check size={12} className="text-[#d6ff63]"/>{notice} · Los datos permanecen en este navegador.</div>
  {preview&&<div className="fixed inset-0 z-50 bg-black/90 p-4 md:p-10 flex items-center justify-center" onClick={closePreview}><div className="w-full max-w-4xl max-h-full rounded-2xl border border-[#343b49] bg-[#10141c] p-4 overflow-auto" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between mb-4"><div><div className="text-sm font-semibold">{preview.asset.title}</div><div className="text-[10px] text-[#8993a3]">{preview.asset.fileName}</div></div><button onClick={closePreview} className="text-xs text-[#d6ff63]">Cerrar</button></div>{preview.asset.kind==="Vídeo"?<video src={preview.url} controls playsInline className="max-h-[75vh] w-full bg-black rounded-lg"/>:preview.asset.kind==="Audio"?<audio src={preview.url} controls className="w-full"/>:preview.asset.kind==="Imagen"?<img src={preview.url} alt={preview.asset.title} className="max-h-[75vh] mx-auto object-contain"/>:(previewText!==null?<div><pre className="max-h-[65vh] overflow-auto whitespace-pre-wrap rounded-lg bg-black/40 p-4 text-xs leading-6 text-[#cbd3df]">{previewText}</pre><a href={preview.url} download={preview.asset.fileName} className="mt-3 inline-block text-xs text-[#d6ff63]">Descargar subtítulos originales</a></div>:<a href={preview.url} download={preview.asset.fileName} className="text-sm text-[#d6ff63]">Descargar documento</a>)}</div></div>}
  </div>
 </main>;
}
function Metric({label,value}:{label:string;value:number}){return <div className="rounded-xl border border-[#252a36] bg-[#10141c] p-4"><div className="text-[10px] text-[#7d8797]">{label}</div><div className="text-2xl font-semibold mt-3">{value}</div></div>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block text-xs text-[#aeb7c6]">{label}{children}</label>}
