/**
 * Knjiženje tečajnih razlika na potraživanjima (1200) – prihod 7680, rashod 4680.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { kreiraj_temeljnicu_sa_stavkama, type StavkaRow } from "@/lib/accounting/auto-temeljnice";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Dohvati tečaj (1 valuta = X EUR) za datum iz tablice tecajevi. Za EUR vraća 1. */
async function getTecajEur(
  supabase: SupabaseClient,
  valuta: string,
  datum: string
): Promise<number> {
  if (valuta === "EUR") return 1;
  const { data: row } = await supabase
    .from("tecajevi")
    .select("tecaj")
    .eq("valuta", valuta)
    .eq("datum", datum)
    .maybeSingle();
  const valutaTecaj = row?.tecaj != null ? Number(row.tecaj) : null;
  if (valutaTecaj == null) return 0;
  const { data: eurRow } = await supabase
    .from("tecajevi")
    .select("tecaj")
    .eq("valuta", "EUR")
    .eq("datum", datum)
    .maybeSingle();
  const eurTecaj = eurRow?.tecaj != null ? Number(eurRow.tecaj) : null;
  return eurTecaj && eurTecaj > 0 ? valutaTecaj / eurTecaj : valutaTecaj;
}

/**
 * Obračunaj tečajnu razliku za jedan izlazni račun u stranoj valuti i knjiži temeljnicu.
 * Račun mora imati valuta !== EUR, tecaj, ukupno_s_pdv (u stranoj valuti), iznos_eur (knjigovodstvena vrijednost u EUR).
 * datum_obracuna = dan za koji se uzima novi tečaj (npr. danas).
 */
export async function knjizi_tecajnu_razliku_racun(
  supabase: SupabaseClient,
  companyId: string,
  racun_id: string,
  datum_obracuna: string
): Promise<string | null> {
  const { data: racun, error: er } = await supabase
    .from("racuni")
    .select("id, broj_racuna, valuta, tecaj, ukupno_s_pdv, iznos_eur, datum_izdavanja, kontakt_id")
    .eq("id", racun_id)
    .single();
  if (er || !racun) throw new Error("Račun nije pronađen");
  const valuta = (racun.valuta || "EUR").toUpperCase();
  if (valuta === "EUR") return null;

  const iznosStrana = round2(Number(racun.ukupno_s_pdv ?? 0));
  if (iznosStrana <= 0) return null;

  const tecajKnjizeni = Number(racun.tecaj ?? 0) || 1;
  const iznosEurKnjizeno = Number(racun.iznos_eur ?? iznosStrana * tecajKnjizeni);
  const tecajDanas = await getTecajEur(supabase, valuta, datum_obracuna);
  if (tecajDanas <= 0) throw new Error(`Nema tečaja za ${valuta} na ${datum_obracuna}`);

  const iznosEurDanas = round2(iznosStrana * tecajDanas);
  const diff = round2(iznosEurDanas - iznosEurKnjizeno);
  if (Math.abs(diff) < 0.01) return null;

  const stavke: StavkaRow[] = [];
  if (diff > 0) {
    stavke.push(
      { konto: "1200", naziv_konta: "Potraživanja od kupaca", duguje: diff, potrazuje: 0, partner_id: racun.kontakt_id },
      { konto: "7680", naziv_konta: "Ostali financijski prihodi (tečajna razlika)", duguje: 0, potrazuje: diff }
    );
  } else {
    stavke.push(
      { konto: "4680", naziv_konta: "Ostali financijski rashodi (tečajna razlika)", duguje: Math.abs(diff), potrazuje: 0 },
      { konto: "1200", naziv_konta: "Potraživanja od kupaca", duguje: 0, potrazuje: Math.abs(diff), partner_id: racun.kontakt_id }
    );
  }

  const temeljnicaId = await kreiraj_temeljnicu_sa_stavkama(
    supabase,
    companyId,
    datum_obracuna,
    `Tečajna razlika - račun ${racun.broj_racuna} (${valuta})`,
    "racun",
    racun_id,
    stavke
  );

  await supabase.from("racuni").update({ tecaj: tecajDanas, iznos_eur: iznosEurDanas }).eq("id", racun_id);
  return temeljnicaId;
}

/**
 * Obračunaj tečajne razlike za sve neplaćene račune u stranoj valuti za tvrtku (period / danas).
 */
export async function knjizi_tecajne_razlike_period(
  supabase: SupabaseClient,
  companyId: string,
  datum_obracuna: string
): Promise<{ knjizeno: number; temeljnice: string[] }> {
  const { data: racuni } = await supabase
    .from("racuni")
    .select("id, valuta")
    .eq("company_id", companyId)
    .eq("status", "izdan");
  const ids = (racuni ?? []).filter((r) => r.valuta && r.valuta.toUpperCase() !== "EUR").map((r) => r.id);
  const temeljnice: string[] = [];
  for (const id of ids) {
    try {
      const t = await knjizi_tecajnu_razliku_racun(supabase, companyId, id, datum_obracuna);
      if (t) temeljnice.push(t);
    } catch {
      // skip single failure
    }
  }
  return { knjizeno: temeljnice.length, temeljnice };
}
