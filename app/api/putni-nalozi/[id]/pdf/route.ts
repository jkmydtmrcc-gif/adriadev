import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import React from "react";

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

const PRIJEVOZ_LABEL: Record<string, string> = {
  sluzbeni: "Sluzbeni",
  privatni: "Privatni",
  javni: "Javni",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "PDF zahtijeva Supabase (SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 503 }
    );
  }
  const { data: nalog, error: eN } = await supabase
    .from("putni_nalozi")
    .select("*")
    .eq("id", id)
    .single();
  if (eN || !nalog) {
    return NextResponse.json({ error: "Putni nalog nije pronađen" }, { status: 404 });
  }
  const { data: radnik } = await supabase
    .from("radnici")
    .select("ime, prezime")
    .eq("id", nalog.radnik_id)
    .single();
  const { data: company } = await supabase
    .from("companies")
    .select("naziv")
    .eq("id", nalog.company_id)
    .single();

  const data = {
    companyNaziv: toLatin1(company?.naziv ?? ""),
    brojNaloga: nalog.broj_naloga ?? "",
    radnikIme: toLatin1(radnik?.ime ?? ""),
    radnikPrezime: toLatin1(radnik?.prezime ?? ""),
    datumPolaska: nalog.datum_polaska ?? "",
    datumPovratka: nalog.datum_povratka ?? "",
    odrediste: toLatin1(nalog.odrediste ?? ""),
    svrha: toLatin1(nalog.svrha ?? ""),
    drzava: nalog.drzava ?? "",
    tip: nalog.tip === "domace" ? "domace" : "inozemno",
    prijevoz: PRIJEVOZ_LABEL[nalog.prijevoz ?? ""] ?? nalog.prijevoz ?? "",
    ukupnoKm: Number(nalog.ukupno_km) || 0,
    iznosKm: Number(nalog.iznos_km) || 0,
    brojDnevnica: Number(nalog.broj_dnevnica) || 0,
    iznosDnevnice: Number(nalog.iznos_dnevnice) || 0,
    ukupnoDnevnice: Number(nalog.ukupno_dnevnice) || 0,
    ukupnoZaIsplatu: Number(nalog.ukupno_za_isplatu) || 0,
  };

  try {
    const ReactPDF = await import("@react-pdf/renderer");
    const { PutniNalogPDF } = await import("@/lib/pdf/putni-nalog");
    const buffer = await ReactPDF.renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(PutniNalogPDF, { data }) as any
    );
    const filename = `putni-nalog-${toLatin1(nalog.broj_naloga ?? id)}.pdf`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Putni nalog PDF error:", message);
    return NextResponse.json(
      { error: "Greška pri generiranju PDF-a", detail: process.env.NODE_ENV === "development" ? message : undefined },
      { status: 500 }
    );
  }
}
