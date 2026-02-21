import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getCashFlowHistory } from "@/lib/analytics/cashflow-history";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const company_id = searchParams.get("company_id");
  if (!company_id) {
    return NextResponse.json({ error: "company_id je obavezan" }, { status: 400 });
  }
  const supabase = createServerClient();
  const data = await getCashFlowHistory(supabase, company_id);
  return NextResponse.json(data);
}
