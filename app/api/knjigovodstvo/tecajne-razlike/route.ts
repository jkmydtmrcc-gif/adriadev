import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { knjizi_tecajnu_razliku_racun, knjizi_tecajne_razlike_period } from "@/lib/accounting/tecajne-razlike";

export async function POST(req: Request) {
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service client nije konfiguriran" }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const company_id = body.company_id as string | undefined;
  const racun_id = body.racun_id as string | undefined;
  const datum = (body.datum as string) || new Date().toISOString().slice(0, 10);

  if (!company_id) {
    return NextResponse.json({ error: "company_id je obavezan" }, { status: 400 });
  }

  try {
    if (racun_id) {
      const temeljnicaId = await knjizi_tecajnu_razliku_racun(supabase, company_id, racun_id, datum);
      return NextResponse.json({
        ok: true,
        knjizeno: temeljnicaId ? 1 : 0,
        temeljnice: temeljnicaId ? [temeljnicaId] : [],
      });
    }
    const result = await knjizi_tecajne_razlike_period(supabase, company_id, datum);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Greška pri knjiženju";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
