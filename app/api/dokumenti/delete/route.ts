import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const BUCKET = "dokumenti";

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id je obavezan" }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Storage nije konfiguriran" }, { status: 503 });
  }

  const { data: doc, error: docError } = await supabase.from("dokumenti").select("storage_path").eq("id", id).single();
  if (docError || !doc) {
    return NextResponse.json({ error: "Dokument nije pronađen" }, { status: 404 });
  }

  await supabase.storage.from(BUCKET).remove([doc.storage_path]);
  const { error: delError } = await supabase.from("dokumenti").delete().eq("id", id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
