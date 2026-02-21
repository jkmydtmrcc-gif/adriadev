import type { BankTransaction } from "./types";

function parseDate(str: string): string {
  if (str.length < 6) return new Date().toISOString().slice(0, 10);
  const yy = parseInt(str.slice(0, 2), 10);
  const mm = parseInt(str.slice(2, 4), 10) - 1;
  const dd = parseInt(str.slice(4, 6), 10);
  const y = yy >= 50 ? 1900 + yy : 2000 + yy;
  const d = new Date(y, mm, dd);
  return d.toISOString().slice(0, 10);
}

function extractIBAN(text: string): string | undefined {
  const m = text.match(/\b([A-Z]{2}\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{0,2})\b/);
  if (m) return m[1].replace(/\s/g, "");
  const m2 = text.match(/\b(HR\d{17})\b/);
  return m2 ? m2[1] : undefined;
}

function extractReference(text: string): string | undefined {
  const m = text.match(/REF[:\s]*([A-Z0-9\-]+)/i);
  if (m) return m[1];
  const m2 = text.match(/(?:POZIV NA BROJ|PNB)[:\s]*([0-9\-]+)/i);
  if (m2) return m2[1];
  const m3 = text.match(/\d{4}[-\/]\d{3,6}/);
  return m3 ? m3[0] : undefined;
}

export function parseMT940(content: string): BankTransaction[] {
  const transactions: BankTransaction[] = [];
  const lines = content.split(/\r?\n/);
  let currentTx: Partial<BankTransaction> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(":61:")) {
      const part = trimmed.slice(4);
      const dateMatch = part.match(/^(\d{6})(\d{4})?(C|D)([\d,]+)/);
      if (dateMatch) {
        currentTx.datum = parseDate(dateMatch[1]);
        currentTx.tip = dateMatch[3] === "C" ? "prihod" : "rashod";
        currentTx.iznos = parseFloat(dateMatch[4].replace(",", "."));
        if (currentTx.tip === "prihod") currentTx.iznos = Math.abs(currentTx.iznos);
        else currentTx.iznos = -Math.abs(currentTx.iznos);
      }
    }
    if (trimmed.startsWith(":86:")) {
      currentTx.opis = trimmed.slice(4).replace(/\s+/g, " ").trim();
      currentTx.iban_partnera = extractIBAN(currentTx.opis ?? "");
      currentTx.poziv_na_broj = extractReference(currentTx.opis ?? "");
      if (currentTx.datum != null && currentTx.tip != null && currentTx.iznos != null) {
        transactions.push({
          datum: currentTx.datum,
          tip: currentTx.tip,
          iznos: currentTx.iznos,
          opis: currentTx.opis,
          iban_partnera: currentTx.iban_partnera,
          poziv_na_broj: currentTx.poziv_na_broj,
        });
      }
      currentTx = {};
    }
  }
  return transactions;
}
