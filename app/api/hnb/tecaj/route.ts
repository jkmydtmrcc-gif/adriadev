import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/** GET ?valuta=USD&datum=2025-02-19 — vraća tečaj (1 jedinica valute = tecaj EUR). Za EUR vraća 1. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const valuta = (searchParams.get("valuta") || "EUR").toUpperCase();
  const datum = searchParams.get("datum") || new Date().toISOString().slice(0, 10);

  if (valuta === "EUR") {
    return NextResponse.json({ valuta: "EUR", tecaj: 1, datum });
  }

  const supabase = createServerClient();
  const { data: row, error } = await supabase
    .from("tecajevi")
    .select("tecaj")
    .eq("valuta", valuta)
    .eq("datum", datum)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const valutaTecaj = row?.tecaj != null ? Number(row.tecaj) : null;
  if (valutaTecaj == null) return NextResponse.json({ valuta, tecaj: null, datum });

  const { data: eurRow } = await supabase
    .from("tecajevi")
    .select("tecaj")
    .eq("valuta", "EUR")
    .eq("datum", datum)
    .maybeSingle();
  const eurTecaj = eurRow?.tecaj != null ? Number(eurRow.tecaj) : null;
  const tecajEur = eurTecaj && eurTecaj > 0 ? valutaTecaj / eurTecaj : valutaTecaj;
  return NextResponse.json({ valuta, tecaj: Math.round(tecajEur * 1000000) / 1000000, datum });
}
