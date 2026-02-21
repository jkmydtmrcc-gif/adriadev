import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { knjizi_uplatu_kupca } from "@/lib/accounting/auto-temeljnice";

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const body = await req.json();
    const { promet_id, company_id } = body as { promet_id: string; company_id: string };
    if (!promet_id || !company_id) {
      return NextResponse.json(
        { error: "promet_id i company_id su obavezni" },
        { status: 400 }
      );
    }
    const { data: promet, error: eP } = await supabase
      .from("bankovni_promet")
      .select("*")
      .eq("id", promet_id)
      .eq("company_id", company_id)
      .single();
    if (eP || !promet) {
      return NextResponse.json({ error: "Promet nije pronađen" }, { status: 404 });
    }
    if (promet.tip !== "prihod") {
      return NextResponse.json(
        { error: "Samo prihod se može uskladiti s računom (uplata kupca)" },
        { status: 400 }
      );
    }
    if (promet.status === "usklađeno") {
      return NextResponse.json({ error: "Već usklađeno" }, { status: 400 });
    }
    if (!promet.racun_id) {
      return NextResponse.json(
        { error: "Nema povezanog računa za usklađivanje" },
        { status: 400 }
      );
    }
    await knjizi_uplatu_kupca(supabase, company_id, promet_id);
    await supabase
      .from("bankovni_promet")
      .update({ status: "usklađeno", kategorizirano: true })
      .eq("id", promet_id);
    const { error: eR } = await supabase
      .from("racuni")
      .update({
        status: "placen",
        placeno: promet.iznos,
      })
      .eq("id", promet.racun_id);
    if (eR) {
      return NextResponse.json({ error: "Račun nije ažuriran: " + eR.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Greška";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
