"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function ownerClient() {
  const supabase=await createClient();
  const {data,error}=await supabase.auth.getClaims();
  const ownerId=data?.claims?.sub;
  if(error||!ownerId) redirect("/login");
  return {supabase,ownerId};
}

export async function updateSeries(formData:FormData) {
  const id=String(formData.get("seriesId")??"");
  const title=String(formData.get("title")??"").trim();
  const logline=String(formData.get("logline")??"").trim();
  if(!id||title.length<2||title.length>90) redirect("/studio?error=invalid");
  const {supabase}=await ownerClient();
  const {error}=await supabase.from("series").update({title,logline:logline||null,updated_at:new Date().toISOString()}).eq("id",id);
  if(error) redirect(`/studio/series/${id}?error=save`);
  revalidatePath(`/studio/series/${id}`);
  redirect(`/studio/series/${id}?saved=1`);
}

export async function addCharacter(formData:FormData) {
  const seriesId=String(formData.get("seriesId")??"");
  const name=String(formData.get("name")??"").trim();
  const description=String(formData.get("description")??"").trim();
  if(!seriesId||name.length<2||name.length>80) redirect("/studio");
  const {supabase}=await ownerClient();
  const {error}=await supabase.from("characters").insert({series_id:seriesId,name,description:description||null});
  if(error) redirect(`/studio/series/${seriesId}?error=character`);
  revalidatePath(`/studio/series/${seriesId}`);
  redirect(`/studio/series/${seriesId}?character=created`);
}

export async function addEpisode(formData:FormData) {
  const seriesId=String(formData.get("seriesId")??"");
  const title=String(formData.get("title")??"").trim();
  const synopsis=String(formData.get("synopsis")??"").trim();
  if(!seriesId||title.length<2||title.length>100) redirect("/studio");
  const {supabase}=await ownerClient();
  const {data:existing,error:readError}=await supabase.from("episodes").select("episode_number").eq("series_id",seriesId).order("episode_number",{ascending:false}).limit(1);
  if(readError) redirect(`/studio/series/${seriesId}?error=read`);
  const nextNumber=(existing?.[0]?.episode_number??0)+1;
  const {error}=await supabase.from("episodes").insert({series_id:seriesId,episode_number:nextNumber,title,synopsis:synopsis||null,status:"development"});
  if(error) redirect(`/studio/series/${seriesId}?error=episode`);
  revalidatePath(`/studio/series/${seriesId}`);
  redirect(`/studio/series/${seriesId}?episode=created`);
}
