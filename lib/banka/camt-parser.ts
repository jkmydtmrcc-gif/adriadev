import type { BankTransaction } from "./types";

function tagContent(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : undefined;
}

export function parseCAMT053(xmlContent: string): BankTransaction[] {
  const transactions: BankTransaction[] = [];
  const ntryBlocks = xmlContent.split(/<Ntry>/i).slice(1);
  const today = new Date().toISOString().slice(0, 10);

  for (const block of ntryBlocks) {
    const amt = tagContent(block, "Amt");
    const cdtDbt = tagContent(block, "CdtDbtInd");
    const dt = tagContent(block, "Dt") ?? today;
    const amount = amt ? parseFloat(amt.replace(",", ".")) : 0;
    const isCredit = (cdtDbt ?? "").toUpperCase() === "CRDT";
    const iznos = isCredit ? amount : -amount;
    const ustrd = tagContent(block, "Ustrd");
    const ref = tagContent(block, "Ref");
    const ibanMatch = block.match(/<IBAN>([^<]+)<\/IBAN>/i);
    const iban_partnera = ibanMatch ? ibanMatch[1].trim() : undefined;
    const datum = dt.length >= 10 ? dt.slice(0, 10) : today;

    transactions.push({
      datum,
      tip: isCredit ? "prihod" : "rashod",
      iznos,
      opis: ustrd || undefined,
      iban_partnera,
      poziv_na_broj: ref,
    });
  }
  return transactions;
}
