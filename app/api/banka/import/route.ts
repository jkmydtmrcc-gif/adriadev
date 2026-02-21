import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { parseMT940 } from "@/lib/banka/mt940-parser";
import { parseCAMT053 } from "@/lib/banka/camt-parser";
import { matchTransaction } from "@/lib/banka/matcher";
import type { BankTransaction } from "@/lib/banka/types";

function detectFormat(
  content: string,
  filename: string
): "mt940" | "camt053" | "csv" | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".sta") || lower.endsWith(".mt940") || content.includes(":20:")) return "mt940";
  if (lower.endsWith(".xml") && content.includes("BkToCstmrStmt") || content.includes("Ntry")) return "camt053";
  if (lower.endsWith(".csv")) return "csv";
  if (content.includes(":61:")) return "mt940";
  return null;
}

function parseTransactions(content: string, format: string): BankTransaction[] {
  if (format === "mt940") return parseMT940(content);
  if (format === "camt053") return parseCAMT053(content);
  if (format === "csv") {
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    const out: BankTransaction[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/;|,/);
      if (parts.length < 3) continue;
      const datum = parts[0]?.trim().slice(0, 10) ?? new Date().toISOString().slice(0, 10);
      const iznos = parseFloat(parts[1]?.replace(",", ".") ?? "0");
      const tip = (parts[2]?.toLowerCase() ?? "").includes("prihod") ? "prihod" : "rashod";
      const iznosSigned = tip === "prihod" ? Math.abs(iznos) : -Math.abs(iznos);
      out.push({ datum, tip, iznos: iznosSigned, opis: parts[3]?.trim() });
    }
    return out;
  }
  return [];
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const company_id = formData.get("company_id") as string | null;
    if (!file || !company_id) {
      return NextResponse.json(
        { error: "file i company_id su obavezni" },
        { status: 400 }
      );
    }
    const content = await file.text();
    const format = detectFormat(content, file.name);
    if (!format) {
      return NextResponse.json(
        { error: "Nepoznat format. Koristite MT940, CAMT.053 XML ili CSV." },
        { status: 400 }
      );
    }
    const transactions = parseTransactions(content, format === "camt053" ? "camt053" : format);
    if (transactions.length === 0) {
      return NextResponse.json(
        { error: "Nema transakcija u datoteci" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const uvezenoIznos = transactions.reduce((a, t) => a + t.iznos, 0);

    const { data: izvod, error: eIzvod } = await supabase
      .from("bankovni_izvodi")
      .insert({
        company_id,
        format,
        filename: file.name,
        broj_transakcija: transactions.length,
        uvezeno_iznos: Math.round(uvezenoIznos * 100) / 100,
      })
      .select("id")
      .single();
    if (eIzvod || !izvod) {
      return NextResponse.json({ error: eIzvod?.message ?? "Greška pri kreiranju izvoda" }, { status: 500 });
    }

    let automatskiUskladeno = 0;
    let trebaPregled = 0;
    let neuskladeno = 0;

    for (const tx of transactions) {
      const match = await matchTransaction(tx, company_id, supabase);
      const status =
        match.confidence >= 90 ? "usklađeno" : match.confidence >= 40 ? "djelomično" : "neusklađeno";
      if (match.confidence >= 90) automatskiUskladeno++;
      else if (match.confidence >= 40) trebaPregled++;
      else neuskladeno++;

      const payload = {
        company_id,
        izvod_id: izvod.id,
        datum: tx.datum,
        iznos: Math.abs(tx.iznos),
        tip: tx.tip,
        opis: tx.opis ?? null,
        match_confidence: match.confidence,
        match_tip: match.tip,
        status,
        racun_id: match.tip === "racun" ? match.id : null,
        ulazni_racun_id: match.tip === "ulazni_racun" ? match.id : null,
        kategorizirano: match.confidence >= 90,
      };
      await supabase.from("bankovni_promet").insert(payload);
    }

    return NextResponse.json({
      uvezeno: transactions.length,
      automatski_uskladeno: automatskiUskladeno,
      treba_pregled: trebaPregled,
      neuskladeno,
      izvod_id: izvod.id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Greška pri uvozu";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
