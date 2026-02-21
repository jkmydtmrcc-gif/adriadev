import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const BUCKET = "dokumenti";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const token = searchParams.get("token"); // za dijeljeni link (samo čitanje)

  if (!id) {
    return NextResponse.json({ error: "id je obavezan" }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Storage nije konfiguriran" }, { status: 503 });
  }

  const { data: doc, error: docError } = await supabase
    .from("dokumenti")
    .select("storage_path, naziv, mime_type, podijeljen_token")
    .eq("id", id)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Dokument nije pronađen" }, { status: 404 });
  }

  if (token) {
    if (doc.podijeljen_token !== token) {
      return NextResponse.json({ error: "Nevažeći link" }, { status: 403 });
    }
  }

  const { data: file, error: fileError } = await supabase.storage.from(BUCKET).download(doc.storage_path);

  if (fileError || !file) {
    return NextResponse.json({ error: "Datoteka nije pronađena" }, { status: 404 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const contentType = doc.mime_type || "application/octet-stream";
  const filename = doc.naziv || "dokument";

  return new NextResponse(buf, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, '\\"')}"`,
    },
  });
}
