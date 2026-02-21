import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function nextDate(from: Date, frekvencija: string, dan: number): string {
  const d = new Date(from);
  if (frekvencija === "tjedni") {
    d.setDate(d.getDate() + 7);
  } else if (frekvencija === "kvartalni") {
    d.setMonth(d.getMonth() + 3);
    d.setDate(Math.min(dan, 28));
  } else if (frekvencija === "godisnji") {
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(Math.min(dan, 28));
  } else {
    d.setMonth(d.getMonth() + 1);
    d.setDate(Math.min(dan, 28));
  }
  return formatDate(d);
}

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Service client nije konfiguriran" }, { status: 500 });
  }
  const today = formatDate(new Date());
  const { data: items } = await supabase
    .from("ponavljajuci_racuni")
    .select("*")
    .eq("aktivno", true)
    .eq("sljedeci_datum", today);
  let created = 0;
  for (const r of items ?? []) {
    const stavke = (r.stavke as Array<{ naziv: string; kolicina: number; cijena_bez_pdv: number; pdv_stopa: number }>) ?? [];
    let ukupnoBezPdv = 0;
    let ukupnoPdv = 0;
    for (const s of stavke) {
      const red = (s.kolicina ?? 0) * (s.cijena_bez_pdv ?? 0);
      ukupnoBezPdv += red;
      ukupnoPdv += red * ((s.pdv_stopa ?? 25) / 100);
    }
    const ukupnoSPdv = ukupnoBezPdv + ukupnoPdv;
    const { data: racun, error: eR } = await supabase
      .from("racuni")
      .insert({
        company_id: r.company_id,
        kontakt_id: r.kontakt_id,
        broj_racuna: `PON-${today}-${r.id.slice(0, 8)}`,
        datum_izdavanja: today,
        datum_valute: today,
        status: "izdan",
        ukupno_bez_pdv: Math.round(ukupnoBezPdv * 100) / 100,
        ukupno_pdv: Math.round(ukupnoPdv * 100) / 100,
        ukupno_s_pdv: Math.round(ukupnoSPdv * 100) / 100,
      })
      .select("id")
      .single();
    if (eR || !racun) continue;
    for (const s of stavke) {
      await supabase.from("racuni_stavke").insert({
        racun_id: racun.id,
        naziv: s.naziv ?? "Stavka",
        kolicina: s.kolicina ?? 1,
        cijena_bez_pdv: s.cijena_bez_pdv ?? 0,
        pdv_stopa: s.pdv_stopa ?? 25,
        redosljed: 0,
      });
    }
    const dan = r.dan_kreiranja ?? 1;
    const sljedeci = nextDate(new Date(today), r.frekvencija ?? "mjesecni", dan);
    await supabase.from("ponavljajuci_racuni").update({ sljedeci_datum: sljedeci }).eq("id", r.id);
    created++;
  }
  return NextResponse.json({ ok: true, created });
}
