/**
 * Mjesečna amortizacija osnovnih sredstava → temeljnica (4300 duguje, 0290 potražuje).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { kreiraj_temeljnicu_sa_stavkama, type StavkaRow } from "./auto-temeljnice";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function lastDayOfPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const last = new Date(y, m, 0);
  const mm = String(last.getMonth() + 1).padStart(2, "0");
  const dd = String(last.getDate()).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

export async function knjizi_amortizaciju(
  supabase: SupabaseClient,
  companyId: string,
  period: string
): Promise<{ ukupno: number; broj_sredstava: number }> {
  const { data: existing } = await supabase
    .from("temeljnice")
    .select("id")
    .eq("company_id", companyId)
    .eq("dokument_tip", "auto_amortizacija")
    .like("opis", `%${period}%`)
    .limit(1);
  if (existing && existing.length > 0) {
    throw new Error(`Amortizacija za ${period} već je knjižena`);
  }

  const { data: sredstva } = await supabase
    .from("osnovna_sredstva")
    .select("*")
    .eq("company_id", companyId)
    .eq("aktivno", true);

  let ukupno = 0;
  const datum = lastDayOfPeriod(period);

  for (const s of sredstva ?? []) {
    const nabavna = Number(s.nabavna_vrijednost ?? 0);
    const stopa = Number(s.stopa_amortizacije ?? 20);
    const godisnja = round2(nabavna * (stopa / 100));
    const mjesecna = round2(godisnja / 12);
    if (mjesecna <= 0) continue;

    const kontoAmort = s.konto_amortizacije ?? "4300";
    const kontoIspravka = s.konto_ispravka ?? "0290";
    const naziv = String(s.naziv ?? "Sredstvo");

    const stavke: StavkaRow[] = [
      {
        konto: kontoAmort,
        naziv: `Amortizacija ${naziv}`,
        duguje: mjesecna,
        potrazuje: 0,
      },
      {
        konto: kontoIspravka,
        naziv: `Ispravak vrijednosti ${naziv}`,
        duguje: 0,
        potrazuje: mjesecna,
      },
    ];

    await kreiraj_temeljnicu_sa_stavkama(
      supabase,
      companyId,
      datum,
      `Amortizacija - ${naziv} - ${period}`,
      "auto_amortizacija",
      s.id,
      stavke
    );
    ukupno += mjesecna;
  }

  return {
    ukupno: round2(ukupno),
    broj_sredstava: sredstva?.length ?? 0,
  };
}
