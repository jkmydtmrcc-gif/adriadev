import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = body.id as string | undefined;
  const enable = body.enable !== false;

  if (!id) {
    return NextResponse.json({ error: "id je obavezan" }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Storage nije konfiguriran" }, { status: 503 });
  }

  const token = enable ? crypto.randomUUID().replace(/-/g, "") : null;
  const { error } = await supabase.from("dokumenti").update({ podijeljen_token: token }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const link = token
    ? `${process.env.NEXT_PUBLIC_APP_URL || req.url.split("/api")[0]}/api/dokumenti/download?id=${id}&token=${token}`
    : null;
  return NextResponse.json({ podijeljen_token: token, link });
}
