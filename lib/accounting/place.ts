/**
 * Obračun plaća – HR formula 2025/2026 (doprinosi, porez, prirez).
 */

const PRIREZ: Record<string, number> = {
  Zagreb: 0.1,
  Split: 0.1,
  Rijeka: 0.12,
  Osijek: 0.08,
  Zadar: 0.08,
  Pula: 0.08,
  "Velika Gorica": 0.08,
  "Slavonski Brod": 0.1,
  Karlovac: 0.1,
  Varaždin: 0.06,
  Šibenik: 0.08,
  Sisak: 0.1,
  Vinkovci: 0.08,
  default: 0,
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function getPrirez(opcina: string): number {
  if (!opcina || !opcina.trim()) return PRIREZ.default;
  const key = opcina.trim();
  return PRIREZ[key] ?? PRIREZ.default;
}

export interface PlaceInput {
  bruto: number;
  koeficijent_odbitka: number;
  opcina: string;
  ima_drugi_stup: boolean;
}

export interface PlaceResult {
  bruto: number;
  mio1: number;
  mio2: number;
  doprinosi_iz: number;
  dohodak: number;
  osobni_odbitak: number;
  porezna_osnovica: number;
  porez: number;
  prirez: number;
  neto: number;
  doprinosi_na: number;
  ukupni_trosak: number;
}

export function izracunaj_placu(input: PlaceInput): PlaceResult {
  const { bruto, koeficijent_odbitka, opcina, ima_drugi_stup } = input;
  const k = Math.max(0, Math.min(2, Number(koeficijent_odbitka) || 1));

  const mio1 = round2(bruto * 0.15);
  const mio2 = ima_drugi_stup ? round2(bruto * 0.05) : 0;
  const doprinosi_iz = round2(mio1 + mio2);
  const dohodak = round2(bruto - doprinosi_iz);
  const osobni_odbitak = round2(Math.min(560 * k, dohodak));
  const porezna_osnovica = round2(Math.max(0, dohodak - osobni_odbitak));

  let porez = 0;
  if (porezna_osnovica <= 5000) {
    porez = round2(porezna_osnovica * 0.2);
  } else {
    porez = round2(5000 * 0.2 + (porezna_osnovica - 5000) * 0.3);
  }

  const prirez_stopa = getPrirez(opcina);
  const prirez = round2(porez * prirez_stopa);
  const neto = round2(dohodak - porez - prirez);
  const doprinosi_na = round2(bruto * 0.165);
  const ukupni_trosak = round2(bruto + doprinosi_na);

  return {
    bruto,
    mio1,
    mio2,
    doprinosi_iz,
    dohodak,
    osobni_odbitak,
    porezna_osnovica,
    porez,
    prirez,
    neto,
    doprinosi_na,
    ukupni_trosak,
  };
}
