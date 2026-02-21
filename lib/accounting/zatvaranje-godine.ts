/**
 * Zatvaranje godine: prihodi (7) → 8000, rashodi (4,6) → 8000, rezultat → 9120/9130.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { kreiraj_temeljnicu_sa_stavkama, type StavkaRow } from "./auto-temeljnice";

const NAZIVI: Record<string, string> = {
  "8000": "Financijski rezultat",
  "9120": "Zadržana dobit",
  "9130": "Preneseni gubitak",
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

interface KontoSaldo {
  konto: string;
  naziv: string;
  saldo: number;
}

async function getSumByRazred(
  supabase: SupabaseClient,
  companyId: string,
  razred: string,
  godina: number,
  naziviKonta: Record<string, string>
): Promise<{ konti: KontoSaldo[]; total: number }> {
  const start = `${godina}-01-01`;
  const end = `${godina}-12-31`;
  const { data: temeljnice } = await supabase
    .from("temeljnice")
    .select("id")
    .eq("company_id", companyId)
    .gte("datum", start)
    .lte("datum", end);
  const ids = (temeljnice ?? []).map((t) => t.id);
  if (ids.length === 0) return { konti: [], total: 0 };

  const { data: stavke } = await supabase
    .from("temeljnice_stavke")
    .select("konto, naziv_konta, duguje, potrazuje")
    .in("temeljnica_id", ids);

  const prefixList = razred.split("").filter((c) => c >= "0" && c <= "9");
  const byKonto: Record<string, { duguje: number; potrazuje: number }> = {};
  for (const s of stavke ?? []) {
    const first = s.konto?.charAt(0) ?? "";
    if (!prefixList.includes(first)) continue;
    if (!byKonto[s.konto]) byKonto[s.konto] = { duguje: 0, potrazuje: 0 };
    byKonto[s.konto].duguje += Number(s.duguje ?? 0);
    byKonto[s.konto].potrazuje += Number(s.potrazuje ?? 0);
  }

  const isPrihodi = razred === "7";
  const konti: KontoSaldo[] = [];
  let total = 0;
  for (const [konto, v] of Object.entries(byKonto)) {
    const saldo = isPrihodi
      ? round2(v.potrazuje - v.duguje)
      : round2(v.duguje - v.potrazuje);
    if (Math.abs(saldo) < 0.01) continue;
    konti.push({
      konto,
      naziv: naziviKonta[konto] ?? konto,
      saldo,
    });
    total += saldo;
  }
  total = round2(total);
  return { konti, total };
}

export interface UvjetiZatvaranja {
  sve_ok: boolean;
  greske: string[];
  neknjizeni_ulazni: number;
  bruto_bilanca_ok: boolean;
}

export async function provjeri_uvjete(
  supabase: SupabaseClient,
  companyId: string,
  godina: number
): Promise<UvjetiZatvaranja> {
  const greske: string[] = [];
  const { data: ulazni } = await supabase
    .from("ulazni_racuni")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "neprocesen");
  const neknjizeni = ulazni?.length ?? 0;
  if (neknjizeni > 0) greske.push(`${neknjizeni} neknjiženih ulaznih računa`);

  const { data: stavke } = await supabase
    .from("temeljnice")
    .select("id")
    .eq("company_id", companyId)
    .gte("datum", `${godina}-01-01`)
    .lte("datum", `${godina}-12-31`);
  const tIds = (stavke ?? []).map((t) => t.id);
  let brutoDuguje = 0;
  let brutoPotrazuje = 0;
  if (tIds.length > 0) {
    const { data: s } = await supabase
      .from("temeljnice_stavke")
      .select("duguje, potrazuje")
      .in("temeljnica_id", tIds);
    for (const row of s ?? []) {
      brutoDuguje += Number(row.duguje ?? 0);
      brutoPotrazuje += Number(row.potrazuje ?? 0);
    }
  }
  const bruto_bilanca_ok = Math.abs(round2(brutoDuguje - brutoPotrazuje)) < 0.02;
  if (!bruto_bilanca_ok) greske.push("Bruto bilanca ne balansira");

  return {
    sve_ok: greske.length === 0,
    greske,
    neknjizeni_ulazni: neknjizeni,
    bruto_bilanca_ok,
  };
}

export async function zatvori_godinu(
  supabase: SupabaseClient,
  companyId: string,
  godina: number
): Promise<{ rezultat: number; zatvoreno: boolean }> {
  const uvjeti = await provjeri_uvjete(supabase, companyId, godina);
  if (!uvjeti.sve_ok) {
    throw new Error(`Nije moguće zatvoriti: ${uvjeti.greske.join(", ")}`);
  }

  const datum = `${godina}-12-31`;

  const prihodi = await getSumByRazred(supabase, companyId, "7", godina, NAZIVI);
  if (prihodi.total > 0) {
    const stavke: StavkaRow[] = [
      ...prihodi.konti.map((k) => ({
        konto: k.konto,
        naziv: k.naziv,
        duguje: k.saldo,
        potrazuje: 0,
      })),
      { konto: "8000", naziv: NAZIVI["8000"], duguje: 0, potrazuje: prihodi.total },
    ];
    await kreiraj_temeljnicu_sa_stavkama(
      supabase,
      companyId,
      datum,
      `Zatvaranje prihoda ${godina}`,
      "zatvaranje_godine",
      null,
      stavke
    );
  }

  const rashodi = await getSumByRazred(supabase, companyId, "46", godina, NAZIVI);
  if (rashodi.total !== 0) {
    const stavke: StavkaRow[] = [
      { konto: "8000", naziv: NAZIVI["8000"], duguje: rashodi.total, potrazuje: 0 },
      ...rashodi.konti.map((k) => ({
        konto: k.konto,
        naziv: k.naziv,
        duguje: 0,
        potrazuje: k.saldo,
      })),
    ];
    await kreiraj_temeljnicu_sa_stavkama(
      supabase,
      companyId,
      datum,
      `Zatvaranje rashoda ${godina}`,
      "zatvaranje_godine",
      null,
      stavke
    );
  }

  const rezultat = round2(prihodi.total - rashodi.total);
  if (rezultat >= 0) {
    const stavke: StavkaRow[] = [
      { konto: "8000", naziv: NAZIVI["8000"], duguje: rezultat, potrazuje: 0 },
      { konto: "9120", naziv: NAZIVI["9120"], duguje: 0, potrazuje: rezultat },
    ];
    await kreiraj_temeljnicu_sa_stavkama(
      supabase,
      companyId,
      datum,
      `Prenos rezultata ${godina}`,
      "zatvaranje_godine",
      null,
      stavke
    );
  } else {
    const stavke: StavkaRow[] = [
      { konto: "9130", naziv: NAZIVI["9130"], duguje: Math.abs(rezultat), potrazuje: 0 },
      { konto: "8000", naziv: NAZIVI["8000"], duguje: 0, potrazuje: Math.abs(rezultat) },
    ];
    await kreiraj_temeljnicu_sa_stavkama(
      supabase,
      companyId,
      datum,
      `Prenos rezultata (gubitak) ${godina}`,
      "zatvaranje_godine",
      null,
      stavke
    );
  }

  await supabase
    .from("temeljnice")
    .update({ zakljucano: true })
    .eq("company_id", companyId)
    .gte("datum", `${godina}-01-01`)
    .lte("datum", `${godina}-12-31`);

  return { rezultat, zatvoreno: true };
}
