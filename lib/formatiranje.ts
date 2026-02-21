import { formatCurrency, formatDate } from "./utils";

export { formatCurrency, formatDate, formatNumber } from "./utils";

export function formatOIB(oib: string): string {
  if (!oib) return "";
  return oib.replace(/\s/g, "").slice(0, 11);
}

export function formatIBAN(iban: string): string {
  if (!iban) return "";
  return iban.replace(/\s/g, "").toUpperCase().slice(0, 21);
}

export function formatBrojRacuna(broj: string): string {
  return broj.trim();
}

export function prikazIznosa(iznos: number, valuta = "EUR"): string {
  return formatCurrency(iznos, valuta);
}

export function prikazDatuma(datum: string): string {
  return formatDate(datum);
}
