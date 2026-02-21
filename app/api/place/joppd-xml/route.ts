import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generirajJOPPDXml } from "@/lib/joppd/xml";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const company_id = searchParams.get("company_id");
  const period = searchParams.get("period"); // YYYY-MM
  if (!company_id || !period || !/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json({ error: "company_id i period (YYYY-MM) su obavezni" }, { status: 400 });
  }
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "JOPPD zahtijeva SUPABASE_SERVICE_ROLE_KEY u .env.local (Supabase Dashboard → Settings → API → service_role)" },
      { status: 503 }
    );
  }
  const [year, month] = period.split("-");
  const start = `${period}-01`;
  const end = `${year}-${month}-${new Date(Number(year), Number(month), 0).getDate()}`;

  const { data: company, error: companyError } = await supabase.from("companies").select("oib, naziv, adresa, grad").eq("id", company_id).single();
  if (companyError || !company) {
    return NextResponse.json({ error: "Tvrtka nije pronađena" }, { status: 404 });
  }

  const { data: placeList } = await supabase
    .from("place")
    .select("*")
    .eq("company_id", company_id)
    .gte("period_od", start)
    .lte("period_do", end);
  const { data: radnici } = await supabase.from("radnici").select("id, oib, ime, prezime").in("id", (placeList ?? []).map((p) => p.radnik_id));

  const radnikMap = new Map((radnici ?? []).map((r) => [r.id, r]));
  const redovi = (placeList ?? []).map((p) => {
    const r = radnikMap.get(p.radnik_id);
    return {
      oib: r?.oib ?? "",
      ime: r?.ime ?? "",
      prezime: r?.prezime ?? "",
      bruto: Number(p.bruto),
      doprinosi_iz: Number(p.doprinosi_iz_place ?? 0),
      dohodak: Number(p.dohodak ?? 0),
      osobni_odbitak: Number(p.osobni_odbitak ?? 0),
      porez_prirez: Number(p.porez_i_prirez ?? 0),
      neto: Number(p.neto ?? 0),
      doprinosi_na: Number(p.doprinosi_na_placu ?? 0),
    };
  });

  const adresa = [company.adresa, company.grad].filter(Boolean).join(", ") || "—";
  const xml = generirajJOPPDXml({
    oibObveznika: company.oib ?? "",
    nazivObveznika: company.naziv ?? "",
    adresaObveznika: adresa,
    period,
    redovi,
  });

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Disposition": `attachment; filename="JOPPD-${period}.xml"`,
    },
  });
}
