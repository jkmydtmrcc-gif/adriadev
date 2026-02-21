/**
 * Prognoza cash flowa – 6 mjeseci unaprijed (poznate obveze + prosjek).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface KnownObligation {
  datum: string;
  iznos: number;
  tip: string;
}

export interface ForecastMonth {
  mjesec: string;
  prihodi: number;
  rashodi: number;
  neto: number;
  poznate_obveze: KnownObligation[];
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function addMonths(d: Date, m: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + m);
  return out;
}

function formatMonth(d: Date): string {
  return d.toLocaleDateString("hr-HR", { month: "short", year: "numeric" });
}

function isSameMonth(a: string, b: Date): boolean {
  const [y, m] = a.slice(0, 7).split("-").map(Number);
  return b.getFullYear() === y && b.getMonth() + 1 === m;
}

function next20th(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(20);
  return d.toISOString().slice(0, 10);
}

function nthMonthDay(monthOffset: number, day: number): string {
  const d = addMonths(new Date(), monthOffset);
  d.setDate(Math.min(day, 28));
  return d.toISOString().slice(0, 10);
}

export async function generateForecast(
  supabase: SupabaseClient,
  companyId: string
): Promise<ForecastMonth[]> {
  const now = new Date();
  const historyMonths: { prihodi: number; rashodi: number }[] = [];

  for (let i = 6; i >= 1; i--) {
    const start = addMonths(now, -i);
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
    const endStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-31`;
    const { data: temeljnice } = await supabase
      .from("temeljnice")
      .select("id")
      .eq("company_id", companyId)
      .gte("datum", startStr)
      .lte("datum", endStr);
    const ids = (temeljnice ?? []).map((t) => t.id);
    let prihodi = 0,
      rashodi = 0;
    if (ids.length > 0) {
      const { data: stavke } = await supabase
        .from("temeljnice_stavke")
        .select("konto, duguje, potrazuje")
        .in("temeljnica_id", ids);
      for (const s of stavke ?? []) {
        const k = String(s.konto ?? "").charAt(0);
        const d = Number(s.duguje ?? 0);
        const p = Number(s.potrazuje ?? 0);
        if (k === "7") prihodi += p - d;
        if (k === "4" || k === "6") rashodi += d - p;
        if (k === "1" && d > p) prihodi += d - p; // banka inflow
        if (k === "1" && p > d) rashodi += p - d;
      }
    }
    historyMonths.push({ prihodi: round2(prihodi), rashodi: round2(rashodi) });
  }

  const avgPrihodi = historyMonths.length ? historyMonths.reduce((a, h) => a + h.prihodi, 0) / historyMonths.length : 0;
  const avgRashodi = historyMonths.length ? historyMonths.reduce((a, h) => a + h.rashodi, 0) / historyMonths.length : 0;

  const known: KnownObligation[] = [];

  const { data: pdvStavke } = await supabase
    .from("temeljnice_stavke")
    .select("temeljnica_id, potrazuje")
    .eq("konto", "2400");
  const pdvSum = (pdvStavke ?? []).reduce((a, s) => a + Number(s.potrazuje ?? 0), 0);
  if (pdvSum > 0) known.push({ datum: next20th(), iznos: -pdvSum, tip: "PDV" });

  const { data: ponavljajuci } = await supabase
    .from("ponavljajuci_racuni")
    .select("sljedeci_datum, ukupno_s_pdv")
    .eq("company_id", companyId)
    .eq("aktivno", true)
    .not("sljedeci_datum", "is", null);
  for (const r of ponavljajuci ?? []) {
    if (r.sljedeci_datum && r.ukupno_s_pdv)
      known.push({ datum: r.sljedeci_datum, iznos: Number(r.ukupno_s_pdv), tip: "Ponavljajući račun" });
  }

  const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const { data: placeList } = await supabase.from("place").select("ukupni_trosak").eq("company_id", companyId).gte("period_od", thisMonthStart).lte("period_od", thisMonthStart.slice(0, 7) + "-31");
  const placeTotal = (placeList ?? []).reduce((a, p) => a + Number(p.ukupni_trosak ?? 0), 0);
  if (placeTotal > 0) {
    for (let m = 0; m < 6; m++) known.push({ datum: nthMonthDay(m, 15), iznos: -placeTotal, tip: "Plaće" });
  }

  const forecast: ForecastMonth[] = [];
  for (let month = 0; month < 6; month++) {
    const monthDate = addMonths(now, month);
    const monthKnown = known.filter((k) => isSameMonth(k.datum, monthDate));
    const knownIncome = round2(monthKnown.filter((k) => k.iznos > 0).reduce((a, k) => a + k.iznos, 0));
    const knownExpense = round2(monthKnown.filter((k) => k.iznos < 0).reduce((a, k) => a + Math.abs(k.iznos), 0));
    const prihodi = knownIncome || round2(avgPrihodi);
    const rashodi = knownExpense || round2(avgRashodi);
    forecast.push({
      mjesec: formatMonth(monthDate),
      prihodi,
      rashodi,
      neto: round2(prihodi - rashodi),
      poznate_obveze: monthKnown,
    });
  }
  return forecast;
}
