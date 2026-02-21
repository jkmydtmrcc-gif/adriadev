/**
 * Automatsko knjiženje temeljnica – server/API.
 * Svaka temeljnica: SUM(duguje) MORA = SUM(potrazuje). Inače throw + rollback.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { generirajBrojTemeljnice } from "@/lib/broj-racuna";

const NAZIVI: Record<string, string> = {
  "1000": "Žiro račun",
  "1200": "Potraživanja od kupaca",
  "2200": "Obveze prema dobavljačima",
  "2400": "Obveze za PDV 25%",
  "2401": "Obveze za PDV 13%",
  "2402": "Obveze za PDV 5%",
  "1600": "Pretporez (PDV)",
  "7500": "Prihodi od prodaje",
  "4100": "Troškovi bruto plaća",
  "4102": "Doprinosi na plaću",
  "2110": "Obveze za neto plaće",
  "2120": "Obveze za doprinose iz plaće",
  "2130": "Obveze za porez i prirez",
  "2121": "Obveze za doprinose na plaću",
  "4300": "Amortizacija",
  "0290": "Ispravak vrijednosti",
  "8000": "Dobit/Gubitak",
  "9120": "Zadržana dobit",
  "9130": "Preneseni gubitak",
};

export interface StavkaRow {
  konto: string;
  naziv_konta?: string;
  duguje: number;
  potrazuje: number;
  partner_id?: string;
  opis?: string;
}

export function validateStavke(stavke: StavkaRow[]): void {
  const duguje = stavke.reduce((a, s) => a + s.duguje, 0);
  const potrazuje = stavke.reduce((a, s) => a + s.potrazuje, 0);
  const d = Math.round(duguje * 100) / 100;
  const p = Math.round(potrazuje * 100) / 100;
  if (Math.abs(d - p) > 0.02) {
    throw new Error(`Knjiženje nije u balansu! Duguje: ${d}, Potražuje: ${p}`);
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function insertTemeljnica(
  supabase: SupabaseClient,
  companyId: string,
  datum: string,
  opis: string,
  dokument_tip: string,
  dokument_id: string,
  stavke: StavkaRow[]
): Promise<string> {
  validateStavke(stavke);
  const { data: list } = await supabase.from("temeljnice").select("broj_temeljnice").eq("company_id", companyId);
  const broj = generirajBrojTemeljnice(list ?? [], new Date(datum).getFullYear());
  const { data: t, error: e1 } = await supabase
    .from("temeljnice")
    .insert({
      company_id: companyId,
      broj_temeljnice: broj,
      datum,
      opis,
      dokument_tip,
      dokument_id,
      status: "knjizena",
    })
    .select("id")
    .single();
  if (e1) throw e1;
  const rows = stavke.map((s) => ({
    temeljnica_id: t.id,
    konto: s.konto,
    naziv_konta: s.naziv_konta ?? NAZIVI[s.konto] ?? s.konto,
    duguje: round2(s.duguje),
    potrazuje: round2(s.potrazuje),
    partner_id: s.partner_id ?? null,
    opis: s.opis ?? null,
  }));
  const { error: e2 } = await supabase.from("temeljnice_stavke").insert(rows);
  if (e2) throw e2;
  return t.id;
}

/** Generičko kreiranje temeljnice (zatvaranje godine, amortizacija). dokument_id može biti null. */
export async function kreiraj_temeljnicu_sa_stavkama(
  supabase: SupabaseClient,
  companyId: string,
  datum: string,
  opis: string,
  dokument_tip: string,
  dokument_id: string | null,
  stavke: StavkaRow[]
): Promise<string> {
  validateStavke(stavke);
  const { data: list } = await supabase.from("temeljnice").select("broj_temeljnice").eq("company_id", companyId);
  const broj = generirajBrojTemeljnice(list ?? [], new Date(datum).getFullYear());
  const { data: t, error: e1 } = await supabase
    .from("temeljnice")
    .insert({
      company_id: companyId,
      broj_temeljnice: broj,
      datum,
      opis,
      dokument_tip,
      dokument_id,
      status: "knjizena",
    })
    .select("id")
    .single();
  if (e1) throw e1;
  const rows = stavke.map((s) => ({
    temeljnica_id: t.id,
    konto: s.konto,
    naziv_konta: s.naziv_konta ?? NAZIVI[s.konto] ?? s.konto,
    duguje: round2(s.duguje),
    potrazuje: round2(s.potrazuje),
    partner_id: s.partner_id ?? null,
    opis: s.opis ?? null,
  }));
  const { error: e2 } = await supabase.from("temeljnice_stavke").insert(rows);
  if (e2) throw e2;
  return t.id;
}

/** A) Izlazni račun → temeljnica (s PDV po stopama) */
export async function knjizi_izlazni_racun(
  supabase: SupabaseClient,
  companyId: string,
  racun_id: string
): Promise<string> {
  const { data: racun, error: er } = await supabase.from("racuni").select("*").eq("id", racun_id).single();
  if (er || !racun) throw new Error("Račun nije pronađen");
  const { data: racunStavke } = await supabase.from("racuni_stavke").select("*").eq("racun_id", racun_id).order("redosljed");
  const stavkeList = (racunStavke ?? []) as Array<{ pdv_stopa: number; cijena_bez_pdv: number; kolicina: number }>;
  const pdvByStopa: Record<number, number> = {};
  let ukupnoBezPdv = 0;
  stavkeList.forEach((s) => {
    const osnovica = round2(Number(s.cijena_bez_pdv) * Number(s.kolicina));
    ukupnoBezPdv += osnovica;
    const stopa = Number(s.pdv_stopa) || 25;
    pdvByStopa[stopa] = (pdvByStopa[stopa] ?? 0) + round2(osnovica * (stopa / 100));
  });
  ukupnoBezPdv = round2(ukupnoBezPdv);
  const ukupnoPdv = Number(racun.ukupno_pdv) ?? Object.values(pdvByStopa).reduce((a, b) => a + b, 0);
  const ukupnoSPdv = Number(racun.ukupno_s_pdv) ?? ukupnoBezPdv + ukupnoPdv;

  const stavke: StavkaRow[] = [
    { konto: "1200", naziv_konta: NAZIVI["1200"], duguje: ukupnoSPdv, potrazuje: 0, partner_id: racun.kontakt_id },
    { konto: "7500", naziv_konta: NAZIVI["7500"], duguje: 0, potrazuje: ukupnoBezPdv },
  ];
  if (pdvByStopa[25] > 0) stavke.push({ konto: "2400", naziv_konta: NAZIVI["2400"], duguje: 0, potrazuje: round2(pdvByStopa[25]) });
  if (pdvByStopa[13] > 0) stavke.push({ konto: "2401", naziv_konta: NAZIVI["2401"], duguje: 0, potrazuje: round2(pdvByStopa[13]) });
  if (pdvByStopa[5] > 0) stavke.push({ konto: "2402", naziv_konta: NAZIVI["2402"], duguje: 0, potrazuje: round2(pdvByStopa[5]) });
  if (pdvByStopa[0] !== 0 && (pdvByStopa[0] ?? 0) > 0) {
    const rest = ukupnoPdv - (pdvByStopa[25] ?? 0) - (pdvByStopa[13] ?? 0) - (pdvByStopa[5] ?? 0);
    if (rest > 0) stavke.push({ konto: "2400", naziv_konta: NAZIVI["2400"], duguje: 0, potrazuje: round2(rest) });
  }
  if (stavke.filter((s) => s.konto.startsWith("24")).length === 0 && ukupnoPdv > 0) {
    stavke.push({ konto: "2400", naziv_konta: NAZIVI["2400"], duguje: 0, potrazuje: round2(ukupnoPdv) });
  }

  return insertTemeljnica(
    supabase,
    companyId,
    racun.datum_izdavanja,
    `Račun br. ${racun.broj_racuna}`,
    "racun",
    racun_id,
    stavke
  );
}

/** B) Uplata kupca (bankovni promet prihod) → temeljnica */
export async function knjizi_uplatu_kupca(
  supabase: SupabaseClient,
  companyId: string,
  promet_id: string
): Promise<string> {
  const { data: promet, error: er } = await supabase.from("bankovni_promet").select("*").eq("id", promet_id).single();
  if (er || !promet) throw new Error("Promet nije pronađen");
  if (promet.tip !== "prihod") throw new Error("Samo prihod se knjiži kao uplata kupca");
  const iznos = round2(Number(promet.iznos));
  const partner_id = promet.racun_id
    ? ((await supabase.from("racuni").select("kontakt_id").eq("id", promet.racun_id).single()).data?.kontakt_id as string | undefined)
    : undefined;
  const stavke: StavkaRow[] = [
    { konto: "1000", naziv_konta: NAZIVI["1000"], duguje: iznos, potrazuje: 0 },
    { konto: "1200", naziv_konta: NAZIVI["1200"], duguje: 0, potrazuje: iznos, partner_id },
  ];
  return insertTemeljnica(
    supabase,
    companyId,
    promet.datum,
    promet.opis ? `Uplata: ${promet.opis}` : "Uplata (potraživanja)",
    "bankovni_promet",
    promet_id,
    stavke
  );
}

/** C) Plaćanje dobavljaču → temeljnica */
export async function knjizi_placanje_dobavljacu(
  supabase: SupabaseClient,
  companyId: string,
  promet_id: string
): Promise<string> {
  const { data: promet, error: er } = await supabase.from("bankovni_promet").select("*").eq("id", promet_id).single();
  if (er || !promet) throw new Error("Promet nije pronađen");
  const iznos = round2(Number(promet.iznos));
  const partner_id = promet.ulazni_racun_id
    ? ((await supabase.from("ulazni_racuni").select("kontakt_id").eq("id", promet.ulazni_racun_id).single()).data?.kontakt_id as string | undefined)
    : undefined;
  const stavke: StavkaRow[] = [
    { konto: "2200", naziv_konta: NAZIVI["2200"], duguje: iznos, potrazuje: 0, partner_id },
    { konto: "1000", naziv_konta: NAZIVI["1000"], duguje: 0, potrazuje: iznos },
  ];
  return insertTemeljnica(
    supabase,
    companyId,
    promet.datum,
    promet.opis ? `Plaćanje: ${promet.opis}` : "Plaćanje dobavljaču",
    "bankovni_promet",
    promet_id,
    stavke
  );
}

/** D) Obračun plaće → temeljnica */
export async function knjizi_placu(
  supabase: SupabaseClient,
  companyId: string,
  placa_id: string
): Promise<string> {
  const { data: placa, error: er } = await supabase.from("place").select("*").eq("id", placa_id).single();
  if (er || !placa) throw new Error("Plaća nije pronađena");
  const bruto = round2(Number(placa.bruto));
  const neto = round2(Number(placa.neto ?? 0));
  const doprinosiIz = round2(Number(placa.doprinosi_iz_place ?? 0));
  const doprinosiNa = round2(Number(placa.doprinosi_na_placu ?? 0));
  const porezPrirez = round2(Number(placa.porez_i_prirez ?? 0));

  const stavke: StavkaRow[] = [
    { konto: "4100", naziv_konta: NAZIVI["4100"], duguje: bruto, potrazuje: 0 },
    { konto: "4102", naziv_konta: "Doprinosi na plaću (zdravstveno 16,5%)", duguje: doprinosiNa, potrazuje: 0 },
    { konto: "2110", naziv_konta: NAZIVI["2110"], duguje: 0, potrazuje: neto },
    { konto: "2120", naziv_konta: "Obveze za doprinose iz plaće (MIO)", duguje: 0, potrazuje: doprinosiIz },
    { konto: "2130", naziv_konta: "Obveze za porez i prirez", duguje: 0, potrazuje: porezPrirez },
    { konto: "2121", naziv_konta: "Obveze za doprinose na plaću (zdravstveno)", duguje: 0, potrazuje: doprinosiNa },
  ];

  let sumDuguje = stavke.reduce((s, r) => s + r.duguje, 0);
  let sumPotrazuje = stavke.reduce((s, r) => s + r.potrazuje, 0);
  const diff = round2(sumDuguje - sumPotrazuje);
  if (Math.abs(diff) > 0.02) {
    throw new Error(`Temeljnica nije u balansu! D:${sumDuguje} P:${sumPotrazuje}`);
  }
  if (Math.abs(diff) > 0.001) {
    const idx2130 = stavke.findIndex((s) => s.konto === "2130");
    if (idx2130 >= 0) {
      stavke[idx2130] = { ...stavke[idx2130], potrazuje: round2(stavke[idx2130].potrazuje + diff) };
      sumPotrazuje = stavke.reduce((s, r) => s + r.potrazuje, 0);
    }
  }

  return insertTemeljnica(
    supabase,
    companyId,
    placa.period_do,
    `Plaća ${placa.period_od} - ${placa.period_do}`,
    "placa",
    placa_id,
    stavke
  );
}

/** Storno: kreira obrnutu temeljnicu, označi izvornu kao stornirana */
export async function storno_temeljnica(
  supabase: SupabaseClient,
  companyId: string,
  temeljnica_id: string
): Promise<string> {
  const { data: orig, error: e0 } = await supabase.from("temeljnice").select("*").eq("id", temeljnica_id).single();
  if (e0 || !orig) throw new Error("Temeljnica nije pronađena");
  const { data: origStavke } = await supabase.from("temeljnice_stavke").select("*").eq("temeljnica_id", temeljnica_id);
  const reverse: StavkaRow[] = (origStavke ?? []).map((s: { konto: string; naziv_konta?: string; duguje: number; potrazuje: number; partner_id?: string }) => ({
    konto: s.konto,
    naziv_konta: s.naziv_konta,
    duguje: Number(s.potrazuje),
    potrazuje: Number(s.duguje),
    partner_id: s.partner_id,
  }));
  validateStavke(reverse);
  const { data: list } = await supabase.from("temeljnice").select("broj_temeljnice").eq("company_id", companyId);
  const broj = generirajBrojTemeljnice(list ?? [], new Date(orig.datum).getFullYear());
  const { data: t, error: e1 } = await supabase
    .from("temeljnice")
    .insert({
      company_id: companyId,
      broj_temeljnice: `ST-${broj}`,
      datum: orig.datum,
      opis: `Storno: ${orig.opis ?? orig.broj_temeljnice}`,
      dokument_tip: "storno",
      dokument_id: temeljnica_id,
      status: "knjizena",
    })
    .select("id")
    .single();
  if (e1) throw e1;
  const rows = reverse.map((s) => ({
    temeljnica_id: t.id,
    konto: s.konto,
    naziv_konta: s.naziv_konta ?? NAZIVI[s.konto] ?? s.konto,
    duguje: round2(s.duguje),
    potrazuje: round2(s.potrazuje),
    partner_id: s.partner_id ?? null,
  }));
  const { error: e2 } = await supabase.from("temeljnice_stavke").insert(rows);
  if (e2) throw e2;
  await supabase.from("temeljnice").update({ status: "stornirana" }).eq("id", temeljnica_id);
  return t.id;
}
