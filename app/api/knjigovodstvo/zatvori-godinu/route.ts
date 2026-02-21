import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { zatvori_godinu, provjeri_uvjete } from "@/lib/accounting/zatvaranje-godine";

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const body = await req.json();
    const { company_id, godina } = body as { company_id: string; godina: number };
    if (!company_id || !godina) {
      return NextResponse.json(
        { error: "company_id i godina su obavezni" },
        { status: 400 }
      );
    }
    const result = await zatvori_godinu(supabase, company_id, godina);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Greška pri zatvaranju";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const company_id = searchParams.get("company_id");
  const godina = searchParams.get("godina");
  if (!company_id || !godina) {
    return NextResponse.json(
      { error: "company_id i godina su obavezni" },
      { status: 400 }
    );
  }
  const supabase = createServerClient();
  const uvjeti = await provjeri_uvjete(supabase, company_id, Number(godina));
  return NextResponse.json(uvjeti);
}
