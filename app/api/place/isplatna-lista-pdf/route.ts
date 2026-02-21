import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import React from "react";

/** Latin-1 safe string for PDF/headers (hr diacritics → ASCII) */
function toLatin1(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/ć/g, "c")
    .replace(/Ć/g, "C")
    .replace(/č/g, "c")
    .replace(/Č/g, "C")
    .replace(/š/g, "s")
    .replace(/Š/g, "S")
    .replace(/ž/g, "z")
    .replace(/Ž/g, "Z");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placa_id = searchParams.get("placa_id");
  if (!placa_id) {
    return NextResponse.json({ error: "placa_id je obavezan" }, { status: 400 });
  }
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Isplatna lista zahtijeva SUPABASE_SERVICE_ROLE_KEY u .env.local (Supabase Dashboard → Settings → API → service_role)" },
      { status: 503 }
    );
  }
  const { data: placa, error: eP } = await supabase.from("place").select("*").eq("id", placa_id).single();
  if (eP || !placa) return NextResponse.json({ error: "Obračun nije pronađen" }, { status: 404 });
  const { data: radnik } = await supabase
    .from("radnici")
    .select("ime, prezime, oib, iban, opcina_placanja_poreza")
    .eq("id", placa.radnik_id)
    .single();
  const { data: company } = await supabase
    .from("companies")
    .select("naziv, oib, adresa, grad")
    .eq("id", placa.company_id)
    .single();

  const firma = {
    naziv: company?.naziv ?? "",
    oib: company?.oib ?? undefined,
    adresa: company?.adresa ?? undefined,
    grad: company?.grad ?? undefined,
  };
  const radnikData = {
    ime: radnik?.ime ?? "",
    prezime: radnik?.prezime ?? "",
    oib: radnik?.oib ?? undefined,
    iban: radnik?.iban ?? undefined,
    opcina: radnik?.opcina_placanja_poreza ?? undefined,
  };
  const obracun = {
    period_od: placa.period_od ?? "",
    period_do: placa.period_do ?? "",
    bruto: Number(placa.bruto) || 0,
    doprinosi_iz_place: Number(placa.doprinosi_iz_place) || 0,
    dohodak: Number(placa.dohodak) || 0,
    osobni_odbitak: Number(placa.osobni_odbitak) || 0,
    porezna_osnovica: Number(placa.porezna_osnovica) || 0,
    porez_i_prirez: Number(placa.porez_i_prirez) || 0,
    neto: Number(placa.neto) || 0,
    doprinosi_na_placu: Number(placa.doprinosi_na_placu) || 0,
    ukupni_trosak: Number(placa.ukupni_trosak) || 0,
  };

  const data = {
    companyNaziv: toLatin1(firma.naziv),
    radnikIme: toLatin1(radnikData.ime),
    radnikPrezime: toLatin1(radnikData.prezime),
    radnikOib: radnikData.oib ?? "",
    periodOd: obracun.period_od,
    periodDo: obracun.period_do,
    bruto: obracun.bruto,
    doprinosiIz: obracun.doprinosi_iz_place,
    dohodak: obracun.dohodak,
    osobniOdbitak: obracun.osobni_odbitak,
    porezPrirez: obracun.porez_i_prirez,
    neto: obracun.neto,
  };

  try {
    const ReactPDF = await import("@react-pdf/renderer");
    const { IsplatnaListaDocument } = await import("@/components/place/IsplatnaListaPDF");
    const buffer = await ReactPDF.renderToBuffer(
      React.createElement(IsplatnaListaDocument, { data })
    );
    const filename = `isplatna-lista-${toLatin1(radnik?.prezime ?? "radnik")}-${placa.period_od}.pdf`;
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("PDF error:", message);
    return NextResponse.json(
      { error: "Greška pri generiranju PDF-a", detail: process.env.NODE_ENV === "development" ? message : undefined },
      { status: 500 }
    );
  }
}
