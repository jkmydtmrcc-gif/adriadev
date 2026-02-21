import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { knjizi_amortizaciju } from "@/lib/accounting/amortizacija";

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const body = await req.json();
    const { company_id, period } = body as { company_id: string; period: string };
    if (!company_id || !period || !/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json(
        { error: "company_id i period (YYYY-MM) su obavezni" },
        { status: 400 }
      );
    }
    const result = await knjizi_amortizaciju(supabase, company_id, period);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Greška pri knjiženju";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
