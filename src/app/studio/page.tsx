import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudioDashboard from "./studio-dashboard";

export default async function StudioPage() {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims?.sub) redirect("/login");

  const { data: series, error: seriesError } = await supabase
    .from("series")
    .select("id,title,logline,genre,status,visual_style,created_at")
    .order("updated_at", { ascending: false });

  return <StudioDashboard initialSeries={seriesError ? [] : series ?? []} email={String(claims.claims.email ?? "")} />;
}
