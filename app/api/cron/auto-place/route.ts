import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { izracunaj_placu } from "@/lib/accounting/place";
import { knjizi_placu } from "@/lib/accounting/auto-temeljnice";
import { sendPayrollEmail } from "@/lib/email/payroll";

function firstDayOfMonth(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

function lastDayOfMonth(d: Date): string {
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Service client nije konfiguriran (SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 500 }
    );
  }

  const today = new Date().getDate();
  const periodStart = firstDayOfMonth(new Date());
  const periodEnd = lastDayOfMonth(new Date());

  const { data: firme, error: ef } = await supabase
    .from("companies")
    .select("id, naziv, placa_auto, placa_dan_obracuna, user_id")
    .eq("placa_auto", true)
    .eq("placa_dan_obracuna", today);

  if (ef) {
    return NextResponse.json({ ok: false, error: ef.message }, { status: 500 });
  }

  const processed: string[] = [];
  for (const firma of firme ?? []) {
    const { data: radnici, error: er } = await supabase
      .from("radnici")
      .select("*")
      .eq("company_id", firma.id)
      .eq("aktivan", true);

    if (er) continue;

    let ukupnoNeto = 0;
    let ukupnoTrosak = 0;

    for (const radnik of radnici ?? []) {
      const bruto = Number(radnik.bruto_placa ?? 0);
      if (bruto <= 0) continue;

      const obracun = izracunaj_placu({
        bruto,
        koeficijent_odbitka: Number(radnik.koeficijent_osobnog_odbitka ?? 1),
        opcina: radnik.opcina_placanja_poreza ?? "",
        ima_drugi_stup: Boolean(radnik.ima_drugi_mirovinki_stup),
      });

      const { data: placa, error: ep } = await supabase
        .from("place")
        .insert({
          company_id: firma.id,
          radnik_id: radnik.id,
          period_od: periodStart,
          period_do: periodEnd,
          bruto: obracun.bruto,
          doprinosi_iz_place: obracun.doprinosi_iz,
          dohodak: obracun.dohodak,
          osobni_odbitak: obracun.osobni_odbitak,
          porezna_osnovica: obracun.porezna_osnovica,
          porez_i_prirez: obracun.porez + obracun.prirez,
          neto: obracun.neto,
          doprinosi_na_placu: obracun.doprinosi_na,
          ukupni_trosak: obracun.ukupni_trosak,
          auto_generirana: true,
          joppd_poslan: false,
        })
        .select("id")
        .single();

      if (ep || !placa) continue;

      try {
        await knjizi_placu(supabase, firma.id, placa.id);
      } catch {
        // log ali nastavi
      }

      ukupnoNeto += obracun.neto;
      ukupnoTrosak += obracun.ukupni_trosak;
    }

    processed.push(`${firma.naziv} (${radnici?.length ?? 0} radnika)`);

    let ownerEmail: string | null = null;
    if (firma.user_id) {
      try {
        const { data: { user } } = await supabase.auth.admin.getUserById(firma.user_id);
        ownerEmail = user?.email ?? null;
      } catch {
        // ignore
      }
    }
    if (ownerEmail && (ukupnoNeto > 0 || ukupnoTrosak > 0)) {
      const mjesecStr = new Date().toLocaleDateString("hr-HR", { month: "long", year: "numeric" });
      await sendPayrollEmail({
        to: ownerEmail,
        firmaNaziv: firma.naziv ?? "Tvrtka",
        mjesec: mjesecStr,
        brojRadnika: radnici?.length ?? 0,
        ukupnoNeto,
        ukupnoTrosak,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: processed.length,
    firme: processed,
  });
}
