import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const company_id = searchParams.get("company_id");
  const kategorija = searchParams.get("kategorija");
  const tag = searchParams.get("tag");

  if (!company_id) {
    return NextResponse.json({ error: "company_id je obavezan" }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Storage nije konfiguriran" }, { status: 503 });
  }
  let q = supabase
    .from("dokumenti")
    .select("id, naziv, kategorija, tags, storage_path, velicina, mime_type, dokument_tip, dokument_id, podijeljen_token, created_at")
    .eq("company_id", company_id)
    .order("created_at", { ascending: false });

  if (kategorija) q = q.eq("kategorija", kategorija);
  if (tag) q = q.contains("tags", [tag]);

  const { data, error } = await q;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
