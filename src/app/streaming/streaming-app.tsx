"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Play, Plus, Check, ChevronRight, X, Clapperboard, Sparkles, Flame, Bookmark, Subtitles, Film } from "lucide-react";

type Show = {id:string;title:string;tagline:string;genre:string;episodes:number;minutes:string;badge:string;colors:string[];symbol:string;artwork?:string;description:string;cast:string[];episodeTitles:string[];episodeMedia?:Array<{fileId:string;title:string;mimeType?:string}|undefined>;episodeSubtitleMedia?:Array<{fileId:string;format?:string;language?:string}|undefined>};
const shows:Show[]=[
{id:"last-promise",title:"La última promesa",tagline:"El pasado siempre encuentra la forma de volver.",genre:"Romance · Suspense",episodes:5,minutes:"1–2 min",badge:"SERIE DEMO",colors:["#5a293f","#d49a76","#171522"],symbol:"PROMESA",artwork:"/posters/last-promise.svg",description:"Clara regresa a la casa familiar y encuentra una fotografía imposible: alguien la fotografió ayer en un lugar cerrado desde hace diez años. Adrián sabe más de lo que está dispuesto a contar.",cast:["Clara Méndez","Adrián Vega"],episodeTitles:["El regreso","La fotografía","Una promesa rota","La tercera persona","02:17"]},
{id:"heredera",title:"La heredera oculta",tagline:"Su apellido vale millones. Su identidad, una mentira.",genre:"Drama · Poder",episodes:5,minutes:"1–3 min",badge:"CATÁLOGO DEMO",colors:["#263c49","#c4a06d","#101b27"],symbol:"HEREDERA",artwork:"/posters/heredera-oculta.svg",description:"Una camarera descubre que es la única heredera de un imperio hotelero. Pero alguien lleva años ocupando su lugar y no piensa renunciar.",cast:["Valeria Cruz","Mateo Salvatierra"],episodeTitles:["La invitación","El testamento","La otra hija","La cena","El precio"]},
{id:"cero-grados",title:"Cero grados",tagline:"En esta ciudad, amar puede ser una sentencia.",genre:"Thriller · Acción",episodes:5,minutes:"1–2 min",badge:"SERIE DEMO",colors:["#253d48","#7eb0b5","#0b1720"],symbol:"CERO",artwork:"/posters/cero-grados.svg",description:"Una analista recibe un mensaje de voz de alguien que oficialmente murió hace tres años. Tiene 24 horas para descubrir quién está usando su identidad.",cast:["Eva Ríos","Nicolás Ferrer"],episodeTitles:["La llamada","Sin señal","El archivo","Punto ciego","Última conexión"]},
{id:"domingo-rojo",title:"Domingo rojo",tagline:"Una familia perfecta. Un secreto en cada habitación.",genre:"Drama familiar",episodes:5,minutes:"1–2 min",badge:"CATÁLOGO DEMO",colors:["#69422e","#d59c70","#211716"],symbol:"DOMINGO",artwork:"/posters/domingo-rojo.svg",description:"Cada domingo, la familia Ortega se reúne para comer. Esta vez, alguien ha dejado una carta sobre la mesa que cambiará sus vidas.",cast:["Inés Ortega","Tomás Ortega"],episodeTitles:["La mesa","La carta","El invitado","La deuda","Nadie se va"]}
];
type Tab="Para ti"|"Tendencias"|"Romance"|"Suspense"|"Mi lista";
export default function StreamingApp(){
 const [tab,setTab]=useState<Tab>("Para ti");
 const [query,setQuery]=useState("");
 const [favorites,setFavorites]=useState<string[]>([]);
 const [publishedShows,setPublishedShows]=useState<Show[]>([]);
 const [selected,setSelected]=useState<Show | null>(null);
 const [playing,setPlaying]=useState(false);
 const [episode,setEpisode]=useState(0);
 const [autoNextCountdown,setAutoNextCountdown]=useState<number|null>(null);
 const [autoPlayNext,setAutoPlayNext]=useState(false);
 const [hydrated,setHydrated]=useState(false);
 const [playerUrl,setPlayerUrl]=useState("");
 const [playerError,setPlayerError]=useState("");
 const [subtitleError,setSubtitleError]=useState("");
 const [subtitleUrl,setSubtitleUrl]=useState("");
 const [subtitleLanguage,setSubtitleLanguage]=useState("es");
 const [watchProgress,setWatchProgress]=useState<Record<string,{episode:number;time:number;duration:number;updatedAt:string}>>({});
 useEffect(()=>{try{setFavorites(JSON.parse(localStorage.getItem("microdrama-watchlist-v1")||"[]"));setWatchProgress(JSON.parse(localStorage.getItem("microdrama-watch-progress-v1")||"{}"));const local=JSON.parse(localStorage.getItem("microdrama-studio-local-v1")||"[]") as Array<{id:string;title:string;logline?:string;genre?:string;status:string;episodes:Array<{id:string;title:string;status:string}>}>;const assets=JSON.parse(localStorage.getItem("microdrama-assets-v1")||"[]") as Array<{id:string;seriesId:string;episodeId?:string;kind:string;fileId?:string;fileName?:string;mimeType?:string;versionStatus?:string;assetRole?:string;subtitleBurnedIn?:boolean;subtitleFormat?:string;subtitleLanguage?:string;subtitleValidation?:string;subtitleCueCount?:number}>;setPublishedShows(local.filter(s=>s.status==="Publicado"&&s.episodes.length>0&&s.episodes.every(e=>e.status==="Aprobado")).map((s,i)=>({id:"studio-"+s.id,title:s.title,tagline:s.logline||"Una nueva historia original.",genre:s.genre||"Drama",episodes:s.episodes.length,minutes:"1–2 min",badge:"NUEVA · STUDIO",colors:[["#35413a","#c0bd82","#101b19"],["#4b3548","#c5a0b0","#19131d"],["#314052","#9db9c0","#111923"]][i%3],symbol:s.title.toUpperCase().slice(0,16),description:s.logline||"Serie original creada en MicroDrama Studio.",cast:["Reparto por definir"],episodeTitles:s.episodes.map(e=>e.title),episodeMedia:s.episodes.map(ep=>{const asset=assets.find(a=>a.seriesId===s.id&&a.episodeId===ep.id&&a.kind==="Vídeo"&&(a.assetRole==="Máster de episodio"||!a.assetRole)&&a.versionStatus!=="Archivada"&&!!a.fileId);return asset?.fileId?{fileId:asset.fileId,title:asset.fileName||"Máster de episodio",mimeType:asset.mimeType}:undefined;}),episodeSubtitleMedia:s.episodes.map(ep=>{const master=assets.find(a=>a.seriesId===s.id&&a.episodeId===ep.id&&a.kind==="Vídeo"&&(a.assetRole==="Máster de episodio"||!a.assetRole)&&a.versionStatus!=="Archivada"&&!!a.fileId);if(master?.subtitleBurnedIn)return undefined;const asset=assets.find(a=>a.seriesId===s.id&&a.episodeId===ep.id&&a.kind==="Documento"&&a.versionStatus!=="Archivada"&&a.subtitleValidation==="Válido"&&(a.subtitleCueCount||0)>0&&!!a.fileId);return asset?.fileId?{fileId:asset.fileId,format:asset.subtitleFormat,language:asset.subtitleLanguage}:undefined;})})));}catch{}setHydrated(true)},[]);
 useEffect(()=>{if(!hydrated)return;try{localStorage.setItem("microdrama-watchlist-v1",JSON.stringify(favorites));}catch{setPlayerError("No se pudo guardar tu lista en este navegador.");}},[favorites,hydrated]);
 useEffect(()=>{if(!hydrated)return;try{localStorage.setItem("microdrama-watch-progress-v1",JSON.stringify(watchProgress));}catch{/* Playback must remain available if optional progress storage is full. */}},[watchProgress,hydrated]);
 useEffect(()=>{
  let cancelled=false;
  let objectUrl="";
  let subtitleObjectUrl="";
  let db:IDBDatabase|null=null;
  async function load(){
   setPlayerUrl("");
   setPlayerError("");
   setSubtitleError("");
   setSubtitleUrl("");
   const media=selected?.episodeMedia?.[episode];
   const subtitle=selected?.episodeSubtitleMedia?.[episode];
   if(!playing||!selected)return;
   const fileId=media?.fileId;
   if(!fileId){setPlayerError("Este episodio todavía no tiene un máster de vídeo local disponible.");return;}
   try{
    db=await new Promise<IDBDatabase>((resolve,reject)=>{
     const request=indexedDB.open("microdrama-media-v1",1);
     request.onsuccess=()=>resolve(request.result);
     request.onerror=()=>reject(request.error);
     request.onblocked=()=>reject(new Error("El almacenamiento multimedia está bloqueado por otra pestaña."));
    });
    db.onversionchange=()=>db?.close();
    const getFile=(id:string)=>new Promise<File|null>((resolve,reject)=>{
     if(!db){reject(new Error("La base de datos local no está disponible."));return;}
     const request=db.transaction("files","readonly").objectStore("files").get(id);
     request.onsuccess=()=>resolve(request.result?.file??null);
     request.onerror=()=>reject(request.error);
    });
    const file=await getFile(fileId);
    if(!file)throw new Error("No se encontró el archivo local");
    objectUrl=URL.createObjectURL(file);
    if(cancelled){URL.revokeObjectURL(objectUrl);objectUrl="";return;}
    setPlayerUrl(objectUrl);
    if(subtitle?.fileId){
     try{
      const subtitleFile=await getFile(subtitle.fileId);
      if(subtitleFile){
       let text=await subtitleFile.text();
       text=text.replace(/^\uFEFF/,"").replace(/(\d{2}:)?\d{2}:\d{2},(\d{3})/g,match=>match.replace(",","."));
       if(!text.trimStart().startsWith("WEBVTT"))text="WEBVTT\n\n"+text;
       subtitleObjectUrl=URL.createObjectURL(new Blob([text],{type:"text/vtt"}));
       if(!cancelled){setSubtitleUrl(subtitleObjectUrl);setSubtitleLanguage(subtitle.language||"es");}
       else{URL.revokeObjectURL(subtitleObjectUrl);subtitleObjectUrl="";}
      }
     }catch{if(!cancelled)setSubtitleError("El vídeo está disponible, pero no se pudieron cargar sus subtítulos.");}
    }
   }catch{
    if(!cancelled)setPlayerError("El archivo no está disponible en el almacenamiento local de este navegador.");
   }finally{
    db?.close();
    db=null;
   }
  }
  void load();
  return()=>{
   cancelled=true;
   if(objectUrl)URL.revokeObjectURL(objectUrl);
   if(subtitleObjectUrl)URL.revokeObjectURL(subtitleObjectUrl);
   db?.close();
  };
 },[selected,episode,playing]);
 useEffect(()=>{if(autoNextCountdown===null)return;const timer=window.setTimeout(()=>setAutoNextCountdown(current=>current===null?null:current<=1?0:current-1),1000);return()=>window.clearTimeout(timer);},[autoNextCountdown]);
 useEffect(()=>{if(autoNextCountdown!==0)return;setAutoNextCountdown(null);setAutoPlayNext(true);setEpisode(current=>Math.min(current+1,(selected?.episodeTitles.length||1)-1));},[autoNextCountdown,selected]);
 useEffect(()=>{if(!selected)return;const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape"){setSelected(null);setPlaying(false);}};window.addEventListener("keydown",onKeyDown);return()=>window.removeEventListener("keydown",onKeyDown);},[selected]);
 const catalogShows=useMemo(()=>[...publishedShows,...shows.filter(s=>!publishedShows.some(p=>p.id==="studio-"+s.id))],[publishedShows]);
 const filtered=useMemo(()=>catalogShows.filter(s=>(tab==="Mi lista"?favorites.includes(s.id):tab==="Romance"?s.genre.toLowerCase().includes("romance"):tab==="Suspense"?s.genre.toLowerCase().includes("suspense")||s.genre.toLowerCase().includes("thriller"):true)&&(!query||s.title.toLowerCase().includes(query.toLowerCase())||s.genre.toLowerCase().includes(query.toLowerCase()))),[tab,query,favorites,catalogShows]);
 function toggleFavorite(id:string){setFavorites(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);}
 const continueWatching=useMemo(()=>Object.entries(watchProgress).map(([id,progress])=>({show:catalogShows.find(item=>item.id===id),progress})).filter((item):item is {show:Show;progress:{episode:number;time:number;duration:number;updatedAt:string}}=>!!item.show&&item.progress.duration>0&&item.progress.time>0&&item.progress.time<item.progress.duration-8).sort((a,b)=>b.progress.updatedAt.localeCompare(a.progress.updatedAt)),[watchProgress,catalogShows]);
 const hero=shows[0];
 return <main className="stream-shell min-h-screen bg-[#080a0e] text-white">
  <header className="stream-nav">
   <Link href="/streaming" className="stream-brand"><span className="stream-brand-mark"><Clapperboard size={19}/></span><span>MICRO<span>DRAMA</span><small>STORIES THAT PULL YOU IN</small></span></Link>
   <nav className="hidden md:flex items-center gap-7 text-[12px] text-[#a7adba]"><button onClick={()=>setTab("Para ti")} className={tab==="Para ti"?"text-white":"hover:text-white"}>Descubrir</button><button onClick={()=>setTab("Tendencias")} className={tab==="Tendencias"?"text-white":"hover:text-white"}>Tendencias</button><button onClick={()=>setTab("Mi lista")} className={tab==="Mi lista"?"text-white":"hover:text-white"}>Mi lista</button></nav>
   <div className="flex items-center gap-3"><label className="stream-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar series"/></label><Link href="/studio" className="stream-studio-link">Studio <ChevronRight size={13}/></Link></div>
  </header>
  <nav className="stream-mobile-nav" aria-label="Navegación principal">
   <button onClick={()=>setTab("Para ti")} className={tab==="Para ti"?"active":""}><Clapperboard size={17}/><span>Descubrir</span></button>
   <button onClick={()=>setTab("Tendencias")} className={tab==="Tendencias"?"active":""}><Flame size={17}/><span>Tendencias</span></button>
   <button onClick={()=>setTab("Romance")} className={tab==="Romance"?"active":""}><Film size={17}/><span>Romance</span></button>
   <button onClick={()=>setTab("Mi lista")} className={tab==="Mi lista"?"active":""}><Bookmark size={17}/><span>Mi lista</span></button>
  </nav>
  <section className="stream-hero" style={{backgroundImage:"linear-gradient(90deg,#090b10 0%,#090b10ed 33%,#090b1066 68%,#090b1040 100%),linear-gradient(0deg,#080a0e 0%,transparent 40%),radial-gradient(ellipse at 75% 38%,#a65e795c 0%,transparent 42%),linear-gradient(120deg,#281b2a,#68414c 48%,#171d29),url(/posters/last-promise.svg)"}}>
   <div className="stream-hero-art"><div className="hero-orbit"></div><div className="hero-silhouette hero-one"></div><div className="hero-silhouette hero-two"></div><div className="hero-film-grain"></div><div className="hero-title-mark">LA ÚLTIMA<br/><i>PROMESA</i></div></div>
   <div className="stream-hero-copy"><div className="stream-eyebrow"><Flame size={13}/> DESTACADA · {hero.badge}</div><h1>La última<br/><em>promesa.</em></h1><p className="stream-tagline">{hero.tagline}</p><div className="stream-meta"><span>{hero.genre}</span><i></i><span>{hero.episodes} episodios</span><i></i><span>1–2 min</span></div><p className="stream-description">{hero.description}</p><div className="flex flex-wrap gap-3 mt-6"><button className="stream-play-btn" onClick={()=>{setSelected(hero);setEpisode(0);setPlaying(true)}}><Play size={16} fill="currentColor"/> Ver episodio 1</button><button className="stream-list-btn" onClick={()=>toggleFavorite(hero.id)}>{favorites.includes(hero.id)?<Check size={16}/>:<Plus size={16}/>} {favorites.includes(hero.id)?"En mi lista":"Mi lista"}</button></div></div>
   <div className="stream-hero-count"><span>01</span> / 04</div>
  </section>
  <div className="stream-content">
   <div className="stream-tabs">{(["Para ti","Tendencias","Romance","Suspense","Mi lista"] as Tab[]).map(t=><button key={t} onClick={()=>setTab(t)} className={tab===t?"active":""}>{t}</button>)}</div>
   {!query&&tab!=="Mi lista"&&continueWatching.length>0&&<section className="stream-section"><div className="stream-section-head"><div><div className="stream-eyebrow">TU SESIÓN</div><h2>Continuar viendo</h2></div><span>{continueWatching.length} en curso</span></div><div className="stream-grid">{continueWatching.map(({show,progress})=><article key={show.id} className="show-card"><button className="show-poster" aria-label={"Continuar viendo "+show.title} onClick={()=>{setSelected(show);setEpisode(Math.min(progress.episode,show.episodeTitles.length-1));setPlaying(true)}} style={{backgroundImage:`linear-gradient(0deg,${show.colors[2]}cc,transparent 55%),radial-gradient(ellipse at 70% 25%,${show.colors[1]}55,transparent 45%),${show.artwork?`url(${show.artwork}),`:""}linear-gradient(145deg,${show.colors[0]},${show.colors[2]})`}}><span className="poster-kicker">CONTINUAR · EP {String(progress.episode+1).padStart(2,"0")}</span><span className="poster-word">{show.symbol}</span><span className="poster-bottom">{Math.round(progress.time/progress.duration*100)}% VISTO</span><span className="poster-play"><Play size={18} fill="currentColor"/></span><span className="absolute bottom-0 left-0 right-0 h-1 bg-white/20"><span className="block h-full bg-[#d6ff63]" style={{width:`${Math.min(100,progress.time/progress.duration*100)}%`}}/></span></button><div className="show-card-info"><div><h3>{show.title}</h3><p>{show.episodeTitles[progress.episode]||"Episodio"} · {Math.max(1,Math.ceil((progress.duration-progress.time)/60))} min restantes aprox.</p></div></div></article>)}</div></section>}
   <section className="stream-section"><div className="stream-section-head"><div><div className="stream-eyebrow">SELECCIÓN EDITORIAL</div><h2>{tab==="Mi lista"?"Tu lista":tab==="Para ti"?"Historias para devorar":"Explora "+tab.toLowerCase()}</h2></div><span>{filtered.length} series <ChevronRight size={14}/></span></div>
    {filtered.length===0?<div className="stream-empty"><Bookmark size={24}/><h3>{tab==="Mi lista"?"Todavía no has guardado series":"No encontramos resultados"}</h3><p>{tab==="Mi lista"?"Añade títulos a tu lista para verlos aquí.":"Prueba con otro título o género."}</p></div>:<div className="stream-grid">{filtered.map((s,i)=><article key={s.id} className="show-card"><button className="show-poster" onClick={()=>{setSelected(s);setPlaying(false);setEpisode(0)}} style={{backgroundImage:`linear-gradient(0deg,${s.colors[2]}cc,transparent 55%),radial-gradient(ellipse at 70% 25%,${s.colors[1]}55,transparent 45%),${s.artwork?`url(${s.artwork}),`:""}linear-gradient(145deg,${s.colors[0]},${s.colors[2]})`}}><div className="poster-shape"></div><span className="poster-kicker">{s.badge}</span><span className="poster-word">{s.symbol}</span><span className="poster-index">0{i+1}</span><span className="poster-bottom">MICRODRAMA ORIGINAL</span><span className="poster-play"><Play size={18} fill="currentColor"/></span></button><div className="show-card-info"><div><h3>{s.title}</h3><p>{s.genre} · {s.episodes} episodios</p></div><button aria-label="Añadir a mi lista" onClick={()=>toggleFavorite(s.id)} className={favorites.includes(s.id)?"saved":""}>{favorites.includes(s.id)?<Check size={17}/>:<Plus size={17}/>}</button></div></article>)}</div>}
   </section>
   <section className="stream-bottom-banner"><div><span className="stream-eyebrow"><Sparkles size={12}/> CREADO EN MICRODRAMA STUDIO</span><h2>De una idea a una serie.<br/><em>Tu universo empieza aquí.</em></h2><p>Un espacio privado para escribir, diseñar y producir historias verticales.</p><Link href="/studio" className="stream-play-btn">Entrar al Studio <ChevronRight size={15}/></Link></div><div className="banner-graphic"><div className="banner-frame"><Film size={50}/><span>9:16</span></div><div className="banner-ring"></div></div></section>
   <footer className="stream-footer"><span>© 2026 MICRODRAMA</span><span>UNA NUEVA FORMA DE CONTAR HISTORIAS</span><span>CATÁLOGO DE DEMOSTRACIÓN · REPRODUCCIÓN LOCAL DISPONIBLE</span></footer>
  </div>
  {selected&&<div className="stream-modal-backdrop" onClick={()=>{setSelected(null);setPlaying(false);setAutoNextCountdown(null);setAutoPlayNext(false)}}><div className={playing?"stream-player-modal":"stream-detail-modal"} role="dialog" aria-modal="true" aria-label={selected.title} onClick={e=>e.stopPropagation()}><button className="stream-close" onClick={()=>{setSelected(null);setPlaying(false);setAutoNextCountdown(null);setAutoPlayNext(false)}}><X size={20}/></button>{playing?<><div className="vertical-player">{playerUrl&&!playerError?<video className="player-art w-full h-full object-contain bg-black" src={playerUrl} controls playsInline preload="metadata" autoPlay={autoPlayNext} onPlay={()=>{setAutoPlayNext(false);setAutoNextCountdown(null);}} onLoadedMetadata={event=>{const saved=watchProgress[selected.id];if(saved&&saved.episode===episode&&saved.time>5&&saved.time<event.currentTarget.duration-8)event.currentTarget.currentTime=saved.time;}} onTimeUpdate={event=>{const video=event.currentTarget;const checkpoint=Math.floor(video.currentTime/5)*5;if(checkpoint<5||!Number.isFinite(video.duration)||video.duration<=0)return;setWatchProgress(previous=>{const saved=previous[selected.id];if(saved?.episode===episode&&saved.time===checkpoint)return previous;return {...previous,[selected.id]:{episode,time:checkpoint,duration:video.duration,updatedAt:new Date().toISOString()}};});}} onEnded={()=>{setWatchProgress(previous=>{const next={...previous};delete next[selected.id];return next;});if(episode<selected.episodeTitles.length-1)setAutoNextCountdown(8);}} onError={()=>setPlayerError("El navegador no pudo decodificar este archivo de vídeo. Comprueba el formato del máster.")}>{subtitleUrl&&<track kind="subtitles" src={subtitleUrl} srcLang={subtitleLanguage} label={subtitleLanguage.toUpperCase()} default/>}</video>:<div className="player-art" style={{backgroundImage:`radial-gradient(ellipse at 55% 25%,${selected.colors[1]}88,transparent 40%),linear-gradient(145deg,${selected.colors[0]},${selected.colors[2]})`}}><div className="player-title">{selected.symbol}</div><div className="player-preview-label">{playerError||"VÍDEO NO CONECTADO"}<br/><small>{playerError?"Vista local no disponible":"Vista previa de producción"}</small></div><div className="player-controls"><span>EPISODIO {String(episode+1).padStart(2,"0")}</span><span>ARCHIVO LOCAL</span></div></div>}</div><div className="player-side"><div className="stream-eyebrow">REPRODUCTOR VERTICAL · 9:16</div><h2>{selected.title}</h2><p className="text-xs text-[#8d95a3] mt-2">Los másteres aprobados se reproducen desde el almacenamiento local de este navegador. La distribución pública requiere hosting y CDN.</p><h3 className="text-xs font-semibold mt-7 mb-3">EPISODIOS</h3><div className="flex items-center justify-between gap-3 mb-3"><span data-testid="player-episode-position" className="text-[10px] tracking-[.12em] text-[#a7adba]">EPISODIO {episode+1} DE {selected.episodeTitles.length}</span><div className="flex gap-2"><button type="button" data-testid="player-previous-episode" aria-label="Episodio anterior" disabled={episode===0} onClick={()=>{setAutoNextCountdown(null);setAutoPlayNext(false);setEpisode(current=>Math.max(0,current-1));}} className="rounded-full border border-white/15 px-3 py-2 text-[10px] text-white disabled:opacity-35 disabled:cursor-not-allowed">Anterior</button><button type="button" data-testid="player-next-episode" aria-label="Siguiente episodio" disabled={episode>=selected.episodeTitles.length-1} onClick={()=>{setAutoNextCountdown(null);setAutoPlayNext(false);setEpisode(current=>Math.min(selected.episodeTitles.length-1,current+1));}} className="rounded-full border border-white/15 px-3 py-2 text-[10px] text-white disabled:opacity-35 disabled:cursor-not-allowed">Siguiente</button></div></div><div className="episode-list">{selected.episodeTitles.map((ep,i)=><button key={ep} onClick={()=>{setAutoNextCountdown(null);setAutoPlayNext(false);setEpisode(i);}} className={episode===i?"current":""}><span>{String(i+1).padStart(2,"0")}</span><span>{ep}</span><span>{i===0?"GRATIS":"PREMIUM · DEMO"}</span></button>)}</div><button onClick={()=>toggleFavorite(selected.id)} className="stream-list-btn mt-5 w-full justify-center">{favorites.includes(selected.id)?<Check size={15}/>:<Plus size={15}/>} {favorites.includes(selected.id)?"En mi lista":"Añadir a mi lista"}</button>{autoNextCountdown!==null&&<div data-testid="player-auto-next-countdown" role="status" aria-live="polite" className="mt-4 rounded-xl border border-[#d6ff63]/30 bg-[#d6ff63]/[.07] p-4"><div className="text-[10px] tracking-[.14em] text-[#d6ff63]">SIGUIENTE EPISODIO</div><p className="mt-2 text-sm text-white">El siguiente episodio comienza en <strong data-testid="player-auto-next-seconds">{autoNextCountdown}</strong> s</p><div className="mt-3 flex gap-2"><button type="button" onClick={()=>{setAutoNextCountdown(null);setAutoPlayNext(true);setEpisode(current=>Math.min(current+1,selected.episodeTitles.length-1));}} className="rounded-full bg-[#d6ff63] px-4 py-2 text-xs font-semibold text-[#10130a]">Reproducir ahora</button><button type="button" data-testid="player-auto-next-cancel" onClick={()=>setAutoNextCountdown(null)} className="rounded-full border border-white/20 px-4 py-2 text-xs text-white">Cancelar</button></div></div>}
<div className="player-note"><Subtitles size={14}/> Los subtítulos locales validados se muestran cuando están vinculados. El doblaje multilingüe aún no está integrado.</div>{subtitleError&&<p className="mt-2 text-[10px] text-amber-300">{subtitleError}</p>}</div></>:<><div className="detail-art" style={{backgroundImage:`linear-gradient(0deg,${selected.colors[2]}cc,transparent 55%),radial-gradient(ellipse at 70% 25%,${selected.colors[1]}55,transparent 45%),${selected.artwork?`url(${selected.artwork}),`:""}linear-gradient(145deg,${selected.colors[0]},${selected.colors[2]})`}}><span>{selected.symbol}</span></div><div className="detail-copy"><div className="stream-eyebrow">{selected.badge} · {selected.genre}</div><h2>{selected.title}</h2><p>{selected.description}</p><div className="stream-meta"><span>{selected.episodes} episodios</span><i></i><span>{selected.minutes}</span><i></i><span>Vertical 9:16</span></div><div className="flex gap-3 mt-6"><button className="stream-play-btn" onClick={()=>{setPlaying(true);setEpisode(0)}}><Play size={15} fill="currentColor"/> Ver episodio 1</button><button className="stream-list-btn" onClick={()=>toggleFavorite(selected.id)}>{favorites.includes(selected.id)?<Check size={15}/>:<Plus size={15}/>} Mi lista</button></div><div className="text-[10px] text-[#707988] mt-5">Reparto: {selected.cast.join(" · ")}</div><div className="mt-7"><div className="flex items-center justify-between mb-3"><h3 className="text-[10px] tracking-[.16em] text-[#d6ff63]">CAPÍTULOS</h3><span className="text-[9px] text-[#788292]">{selected.episodeTitles.length} episodios</span></div><div className="detail-episode-list">{selected.episodeTitles.map((ep,i)=><button key={ep} onClick={()=>{setEpisode(i);setPlaying(true)}}><span>{String(i+1).padStart(2,"0")}</span><span>{ep}</span><Play size={13}/></button>)}</div></div></div></>}</div></div>}
 </main>
}
