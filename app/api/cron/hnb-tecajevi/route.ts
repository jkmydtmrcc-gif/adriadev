import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const HNB_URL = "https://api.hnb.hr/tecajnica/v1";
const VALUTE = ["EUR", "USD", "GBP", "CHF", "CZK", "HUF", "PLN", "SEK"];

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Service client nije konfiguriran" }, { status: 500 });
  }
  const today = new Date().toISOString().slice(0, 10);
  let saved = 0;
  for (const valuta of VALUTE) {
    try {
      const res = await fetch(`${HNB_URL}?valuta=${valuta}`);
      const data = await res.json();
      const tecaj = parseFloat((Array.isArray(data) ? data[0]?.srednji_tecaj : data?.srednji_tecaj)?.replace(",", ".") ?? "1");
      await supabase.from("tecajevi").upsert({ valuta, datum: today, tecaj }, { onConflict: "valuta,datum" });
      saved++;
    } catch {
      // skip
    }
  }
  return NextResponse.json({ ok: true, saved });
}
