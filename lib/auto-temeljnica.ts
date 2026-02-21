/**
 * Automatsko knjiženje temeljnica – nikad ručno za standardne dokumente.
 * Koristi se pri: izdavanju računa, knjiženju ulaznog računa, uplati (banka), obračunu plaće.
 */

import { generirajBrojTemeljnice } from "./broj-racuna";
import type { Temeljnica, TemeljnicaStavka } from "./types";

const KONTA = {
  ziro: "1000",
  potrazivanja: "1200",
  obveze_dobavljaci: "2200",
  obveze_pdv: "2400",
  obveze_porez_prirez: "2130",
  pretporez: "1600",
  prihodi_prodaja: "7500",
  troskovi_place: "4100",
  obveze_neto_place: "2110",
  obveze_doprinosi: "2120",
} as const;

const NAZIVI_KONTA: Record<string, string> = {
  [KONTA.ziro]: "Žiro račun",
  [KONTA.potrazivanja]: "Potraživanja od kupaca",
  [KONTA.obveze_dobavljaci]: "Obveze prema dobavljačima",
  [KONTA.obveze_pdv]: "Obveze za PDV",
  [KONTA.obveze_porez_prirez]: "Obveze za porez i prirez",
  [KONTA.pretporez]: "Pretporez (PDV)",
  [KONTA.prihodi_prodaja]: "Prihodi od prodaje",
  [KONTA.troskovi_place]: "Troškovi plaća",
  [KONTA.obveze_neto_place]: "Obveze za neto plaće",
  [KONTA.obveze_doprinosi]: "Obveze za doprinose",
};

function stavka(
  konto: string,
  duguje: number,
  potrazuje: number,
  naziv?: string
): Omit<TemeljnicaStavka, "id" | "temeljnica_id"> {
  return {
    konto,
    naziv_konta: naziv ?? NAZIVI_KONTA[konto] ?? konto,
    duguje: Math.round(duguje * 100) / 100,
    potrazuje: Math.round(potrazuje * 100) / 100,
  };
}

export type AutoTemeljnicaPayload = {
  temeljnica: Omit<Temeljnica, "id" | "created_at">;
  stavke: Omit<TemeljnicaStavka, "id" | "temeljnica_id">[];
};

/** 1. Kad se izda račun (izlazni): D 1200, P 7500, P 2400. U stranoj valuti knjiži u EUR (iznos_eur). */
export function buildTemeljnicaFromRacun(
  companyId: string,
  racun: {
    id: string;
    broj_racuna: string;
    datum_izdavanja: string;
    ukupno_bez_pdv?: number | null;
    ukupno_pdv?: number | null;
    ukupno_s_pdv?: number | null;
    valuta?: string | null;
    iznos_eur?: number | null;
  },
  postojecaTemeljnice: Array<{ broj_temeljnice: string }>
): AutoTemeljnicaPayload {
  let ukupnoBezPdv = Number(racun.ukupno_bez_pdv ?? 0);
  let ukupnoPdv = Number(racun.ukupno_pdv ?? 0);
  let ukupnoSPdv = Number(racun.ukupno_s_pdv ?? 0);
  const valuta = (racun.valuta ?? "EUR").toUpperCase();
  const iznosEur = racun.iznos_eur != null ? Number(racun.iznos_eur) : null;
  if (valuta !== "EUR" && iznosEur != null && iznosEur > 0 && ukupnoSPdv > 0) {
    const factor = iznosEur / ukupnoSPdv;
    ukupnoSPdv = Math.round(iznosEur * 100) / 100;
    ukupnoBezPdv = Math.round(ukupnoBezPdv * factor * 100) / 100;
    ukupnoPdv = Math.round((ukupnoSPdv - ukupnoBezPdv) * 100) / 100;
  }
  const broj = generirajBrojTemeljnice(postojecaTemeljnice, new Date(racun.datum_izdavanja).getFullYear());
  return {
    temeljnica: {
      company_id: companyId,
      broj_temeljnice: broj,
      datum: racun.datum_izdavanja,
      opis: `Račun br. ${racun.broj_racuna}`,
      dokument_tip: "racun",
      dokument_id: racun.id,
      status: "knjizena",
    },
    stavke: [
      stavka(KONTA.potrazivanja, ukupnoSPdv, 0),
      stavka(KONTA.prihodi_prodaja, 0, ukupnoBezPdv),
      stavka(KONTA.obveze_pdv, 0, ukupnoPdv),
    ],
  };
}

/** 2. Kad se unese/knjiži ulazni račun: D 4XXX, D 1600, P 2200. Ukupno s PDV = izvor istine da bude u balansu. */
export function buildTemeljnicaFromUlazniRacun(
  companyId: string,
  ulazni: {
    id: string;
    broj_racuna_dobavljaca?: string | null;
    datum_racuna: string;
    ukupno_bez_pdv?: number | null;
    ukupno_pdv?: number | null;
    ukupno_s_pdv?: number | null;
    konto_troska?: string | null;
    ai_konto?: string | null;
  },
  postojecaTemeljnice: Array<{ broj_temeljnice: string }>
): AutoTemeljnicaPayload {
  const kontoTroska = (ulazni.konto_troska || ulazni.ai_konto || "4290").trim();
  const ukupnoBezPdv = Number(ulazni.ukupno_bez_pdv ?? 0);
  const ukupnoPdv = Number(ulazni.ukupno_pdv ?? 0);
  let ukupnoSPdv = Number(ulazni.ukupno_s_pdv ?? 0);
  if (ukupnoSPdv <= 0 && (ukupnoBezPdv > 0 || ukupnoPdv > 0)) {
    ukupnoSPdv = Math.round((ukupnoBezPdv + ukupnoPdv) * 100) / 100;
  }
  const total = ukupnoSPdv;
  const troskovniIznos = Math.round((total - ukupnoPdv) * 100) / 100;
  const pdvIznos = Math.round(ukupnoPdv * 100) / 100;
  const broj = generirajBrojTemeljnice(postojecaTemeljnice, new Date(ulazni.datum_racuna).getFullYear());
  return {
    temeljnica: {
      company_id: companyId,
      broj_temeljnice: broj,
      datum: ulazni.datum_racuna,
      opis: `Ulazni račun ${ulazni.broj_racuna_dobavljaca ?? ulazni.id}`,
      dokument_tip: "ulazni_racun",
      dokument_id: ulazni.id,
      status: "knjizena",
    },
    stavke: [
      stavka(kontoTroska, troskovniIznos, 0),
      stavka(KONTA.pretporez, pdvIznos, 0),
      stavka(KONTA.obveze_dobavljaci, 0, total),
    ],
  };
}

/** 3. Kad se evidentira uplata (bankovni promet prihod): D 1000, P 1200 */
export function buildTemeljnicaFromUplata(
  companyId: string,
  promet: {
    id: string;
    datum: string;
    iznos: number;
    opis?: string | null;
    racun_id?: string | null;
  },
  postojecaTemeljnice: Array<{ broj_temeljnice: string }>
): AutoTemeljnicaPayload {
  const iznos = Number(promet.iznos);
  const broj = generirajBrojTemeljnice(postojecaTemeljnice, new Date(promet.datum).getFullYear());
  return {
    temeljnica: {
      company_id: companyId,
      broj_temeljnice: broj,
      datum: promet.datum,
      opis: promet.opis ? `Uplata: ${promet.opis}` : "Uplata (potraživanja)",
      dokument_tip: "bankovni_promet",
      dokument_id: promet.id,
      status: "knjizena",
    },
    stavke: [
      stavka(KONTA.ziro, iznos, 0),
      stavka(KONTA.potrazivanja, 0, iznos),
    ],
  };
}

/** 4. Kad se obračuna plaća: D 4100, P 2110, P 2120, P 2130 (bruto = neto + doprinosi_iz + porez_i_prirez) */
export function buildTemeljnicaFromPlaca(
  companyId: string,
  placa: {
    id: string;
    period_od: string;
    period_do: string;
    bruto: number;
    neto?: number | null;
    doprinosi_iz_place?: number | null;
    doprinosi_na_placu?: number | null;
    porez_i_prirez?: number | null;
  },
  postojecaTemeljnice: Array<{ broj_temeljnice: string }>
): AutoTemeljnicaPayload {
  const bruto = Number(placa.bruto);
  const neto = Number(placa.neto ?? 0);
  const doprinosiIz = Number(placa.doprinosi_iz_place ?? 0);
  const porezPrirez = Number(placa.porez_i_prirez ?? 0);
  const porezPrirezIzracunat = Math.round((bruto - neto - doprinosiIz) * 100) / 100;
  const porezZaKnjizenje = porezPrirez > 0 ? porezPrirez : Math.max(0, porezPrirezIzracunat);
  const datum = placa.period_do;
  const broj = generirajBrojTemeljnice(postojecaTemeljnice, new Date(datum).getFullYear());
  return {
    temeljnica: {
      company_id: companyId,
      broj_temeljnice: broj,
      datum,
      opis: `Plaća ${placa.period_od} - ${placa.period_do}`,
      dokument_tip: "placa",
      dokument_id: placa.id,
      status: "knjizena",
    },
    stavke: [
      stavka(KONTA.troskovi_place, bruto, 0),
      stavka(KONTA.obveze_neto_place, 0, neto),
      stavka(KONTA.obveze_doprinosi, 0, doprinosiIz),
      stavka(KONTA.obveze_porez_prirez, 0, porezZaKnjizenje),
    ],
  };
}

export function kontrolniZbroj(stavke: { duguje: number; potrazuje: number }[]): { duguje: number; potrazuje: number; uBalansu: boolean } {
  const duguje = stavke.reduce((a, s) => a + s.duguje, 0);
  const potrazuje = stavke.reduce((a, s) => a + s.potrazuje, 0);
  return {
    duguje: Math.round(duguje * 100) / 100,
    potrazuje: Math.round(potrazuje * 100) / 100,
    uBalansu: Math.abs(duguje - potrazuje) < 0.02,
  };
}

export function dokumentLabel(dokument_tip?: string | null): string {
  switch (dokument_tip) {
    case "racun": return "Račun";
    case "ulazni_racun": return "Ulazni račun";
    case "bankovni_promet": return "Uplata";
    case "placa": return "Plaća";
    default: return "Ručna";
  }
}

export function statusTemeljnicaLabel(
  status: string,
  dokument_tip?: string | null
): "Auto-knjižena" | "Ručna" | "Stornirana" {
  if (status === "stornirana") return "Stornirana";
  if (status === "knjizena" && dokument_tip) return "Auto-knjižena";
  return "Ručna";
}
