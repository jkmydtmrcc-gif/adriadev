const PDV_STOPE = [0, 5, 13, 25] as const;

export function izracunajPdv(cijenaBezPdv: number, pdvStopa: number): number {
  return Math.round((cijenaBezPdv * (pdvStopa / 100)) * 100) / 100;
}

export function izracunajUkupnoStavke(
  kolicina: number,
  cijenaBezPdv: number,
  pdvStopa: number
): { pdv_iznos: number; ukupno: number } {
  const osnovica = Math.round(kolicina * cijenaBezPdv * 100) / 100;
  const pdv_iznos = izracunajPdv(osnovica, pdvStopa);
  const ukupno = Math.round((osnovica + pdv_iznos) * 100) / 100;
  return { pdv_iznos, ukupno };
}

export function getPdvStope(): number[] {
  return [...PDV_STOPE];
}

export function izracunajSažetakStavki(
  stavke: Array<{ kolicina: number; cijena_bez_pdv: number; pdv_stopa: number }>
): {
  ukupno_bez_pdv: number;
  pdv_po_stopama: Record<number, number>;
  ukupno_pdv: number;
  ukupno_s_pdv: number;
} {
  let ukupno_bez_pdv = 0;
  const pdv_po_stopama: Record<number, number> = {};

  for (const s of stavke) {
    const osnovica = Math.round(s.kolicina * s.cijena_bez_pdv * 100) / 100;
    ukupno_bez_pdv += osnovica;
    const pdv = izracunajPdv(osnovica, s.pdv_stopa);
    pdv_po_stopama[s.pdv_stopa] = (pdv_po_stopama[s.pdv_stopa] ?? 0) + pdv;
  }

  ukupno_bez_pdv = Math.round(ukupno_bez_pdv * 100) / 100;
  const ukupno_pdv = Math.round(
    Object.values(pdv_po_stopama).reduce((a, b) => a + b, 0) * 100
  ) / 100;
  const ukupno_s_pdv = Math.round((ukupno_bez_pdv + ukupno_pdv) * 100) / 100;

  return {
    ukupno_bez_pdv,
    pdv_po_stopama,
    ukupno_pdv,
    ukupno_s_pdv,
  };
}
