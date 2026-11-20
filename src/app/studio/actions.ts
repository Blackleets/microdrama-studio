"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createSeries(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const genre = String(formData.get("genre") ?? "Drama").trim();
  const logline = String(formData.get("logline") ?? "").trim();
  if (title.length < 2 || title.length > 90) redirect("/studio?error=title");

  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const ownerId = claims?.claims?.sub;
  if (claimsError || !ownerId) redirect("/login");

  const { data, error } = await supabase.from("series").insert({
    owner_id: ownerId,
    title,
    logline: logline || null,
    genre: [genre],
    visual_style: "mixed",
    status: "development",
  }).select("id").single();

  if (error || !data) redirect("/studio?error=save");
  revalidatePath("/studio");
  redirect("/studio?created=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
