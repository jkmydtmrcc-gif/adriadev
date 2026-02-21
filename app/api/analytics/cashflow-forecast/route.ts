import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateForecast } from "@/lib/analytics/cashflow-forecast";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const company_id = searchParams.get("company_id");
  if (!company_id) {
    return NextResponse.json({ error: "company_id je obavezan" }, { status: 400 });
  }
  const supabase = createServerClient();
  const forecast = await generateForecast(supabase, company_id);
  return NextResponse.json(forecast);
}
