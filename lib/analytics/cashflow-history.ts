/**
 * Povijest prihoda i rashoda po mjesecu (zadnjih 12 mjeseci) iz temeljnica.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const MJESECI = ["Sij", "Velj", "Ožu", "Tra", "Svi", "Lip", "Srpanj", "Kol", "Ruj", "Lis", "Stu", "Pro"];

function addMonths(d: Date, m: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + m);
  return out;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export interface HistoryMonth {
  mjesec: string;
  prihodi: number;
  rashodi: number;
}

export async function getCashFlowHistory(
  supabase: SupabaseClient,
  companyId: string
): Promise<HistoryMonth[]> {
  const now = new Date();
  const result: HistoryMonth[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = addMonths(now, -i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const startStr = `${y}-${String(m).padStart(2, "0")}-01`;
    const endStr = `${y}-${String(m).padStart(2, "0")}-31`;

    const { data: temeljnice } = await supabase
      .from("temeljnice")
      .select("id")
      .eq("company_id", companyId)
      .eq("status", "knjizena")
      .gte("datum", startStr)
      .lte("datum", endStr);

    const ids = (temeljnice ?? []).map((t) => t.id);
    let prihodi = 0,
      rashodi = 0;

    if (ids.length > 0) {
      const { data: stavke } = await supabase
        .from("temeljnice_stavke")
        .select("konto, duguje, potrazuje")
        .in("temeljnica_id", ids);

      for (const s of stavke ?? []) {
        const k = String(s.konto ?? "").charAt(0);
        const duguje = Number(s.duguje ?? 0);
        const potrazuje = Number(s.potrazuje ?? 0);
        if (k === "7") prihodi += potrazuje - duguje;
        if (k === "4" || k === "6") rashodi += duguje - potrazuje;
        if (k === "1") {
          if (duguje > potrazuje) prihodi += duguje - potrazuje;
          else rashodi += potrazuje - duguje;
        }
      }
    }

    result.push({
      mjesec: MJESECI[m - 1],
      prihodi: round2(prihodi),
      rashodi: round2(rashodi),
    });
  }

  return result;
}
