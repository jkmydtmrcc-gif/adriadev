import type { SupabaseClient } from "@supabase/supabase-js";
import type { BankTransaction } from "./types";
import type { MatchResult } from "./types";

function ninetyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().slice(0, 10);
}

export async function matchTransaction(
  tx: BankTransaction,
  companyId: string,
  supabase: SupabaseClient
): Promise<MatchResult> {
  const absIznos = Math.abs(tx.iznos);

  if (tx.poziv_na_broj) {
    const { data: racun } = await supabase
      .from("racuni")
      .select("id")
      .eq("company_id", companyId)
      .ilike("broj_racuna", `%${tx.poziv_na_broj}%`)
      .in("status", ["poslan", "djelomicno_placen", "izdan"])
      .maybeSingle();
    if (racun) return { tip: "racun", id: racun.id, confidence: 100 };
  }

  if (tx.iban_partnera && absIznos > 0) {
    const { data: kontakt } = await supabase
      .from("kontakti")
      .select("id")
      .eq("company_id", companyId)
      .ilike("iban", `%${tx.iban_partnera.replace(/\s/g, "")}%`)
      .maybeSingle();
    if (kontakt) {
      const { data: racun } = await supabase
        .from("racuni")
        .select("id")
        .eq("company_id", companyId)
        .eq("kontakt_id", kontakt.id)
        .gte("ukupno_s_pdv", absIznos - 0.02)
        .lte("ukupno_s_pdv", absIznos + 0.02)
        .in("status", ["poslan", "djelomicno_placen", "izdan"])
        .maybeSingle();
      if (racun) return { tip: "racun", id: racun.id, confidence: 90 };
    }
  }

  if (absIznos > 0) {
    const { data: racun } = await supabase
      .from("racuni")
      .select("id")
      .eq("company_id", companyId)
      .gte("ukupno_s_pdv", absIznos - 0.02)
      .lte("ukupno_s_pdv", absIznos + 0.02)
      .in("status", ["poslan", "djelomicno_placen", "izdan"])
      .gte("datum_izdavanja", ninetyDaysAgo())
      .maybeSingle();
    if (racun) return { tip: "racun", id: racun.id, confidence: 60 };
  }

  return { tip: null, id: null, confidence: 0 };
}
