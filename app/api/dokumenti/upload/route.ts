import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const BUCKET = "dokumenti";

export async function POST(req: Request) {
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Storage nije konfiguriran (SUPABASE_SERVICE_ROLE_KEY)" }, { status: 503 });
  }
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const company_id = formData.get("company_id") as string | null;
  const naziv = (formData.get("naziv") as string) || file?.name || "Dokument";
  const kategorija = (formData.get("kategorija") as string) || "ostalo";
  const tagsStr = formData.get("tags") as string | null;
  const tags = tagsStr ? (JSON.parse(tagsStr) as string[]) : [];

  if (!file || !company_id) {
    return NextResponse.json({ error: "file i company_id su obavezni" }, { status: 400 });
  }

  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const path = `${company_id}/${crypto.randomUUID()}${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type || undefined,
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: row, error: insertError } = await supabase
    .from("dokumenti")
    .insert({
      company_id,
      naziv,
      kategorija,
      tags,
      storage_path: path,
      velicina: file.size,
      mime_type: file.type || null,
    })
    .select("id, naziv, kategorija, storage_path, velicina, created_at")
    .single();

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(row);
}
