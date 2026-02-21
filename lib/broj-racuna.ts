/**
 * Generira sljedeći broj računa u formatu GODINA-REDNI (npr. 2024-001).
 * U produkciji se uzima max(broj_racuna) iz baze za company_id i godinu.
 */
export function generirajBrojRacuna(
  postojecaRacuni: Array<{ broj_racuna: string }>,
  godina?: number
): string {
  const g = godina ?? new Date().getFullYear();
  const prefix = `${g}-`;
  const istiGodina = postojecaRacuni.filter((r) =>
    r.broj_racuna.startsWith(prefix)
  );
  const redni = istiGodina.length + 1;
  return `${prefix}${String(redni).padStart(3, "0")}`;
}

export function generirajBrojPonude(
  postojecaPonude: Array<{ broj_ponude: string }>,
  godina?: number
): string {
  const g = godina ?? new Date().getFullYear();
  const prefix = `P-${g}-`;
  const isti = postojecaPonude.filter((r) => r.broj_ponude.startsWith(prefix));
  const redni = isti.length + 1;
  return `${prefix}${String(redni).padStart(3, "0")}`;
}

export function generirajBrojTemeljnice(
  postojecaTemeljnice: Array<{ broj_temeljnice: string }>,
  godina?: number
): string {
  const g = godina ?? new Date().getFullYear();
  const prefix = `T-${g}-`;
  const isti = postojecaTemeljnice.filter((t) => t.broj_temeljnice.startsWith(prefix));
  const redni = isti.length + 1;
  return `${prefix}${String(redni).padStart(4, "0")}`;
}
