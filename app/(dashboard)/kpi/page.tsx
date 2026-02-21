"use client";

import { useCompany } from "@/contexts/CompanyContext";
import { getClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

async function getKPIs(companyId: string) {
  const supabase = getClient();
  if (!supabase) return null;
  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  const startStr = start.toISOString().slice(0, 10);
  const end = new Date().toISOString().slice(0, 10);
  const { data: temeljnice } = await supabase.from("temeljnice").select("id").eq("company_id", companyId).gte("datum", startStr).lte("datum", end);
  const ids = (temeljnice ?? []).map((t) => t.id);
  if (ids.length === 0) return { neto_profit: 0, ebitda: 0, dso: 0 };
  const { data: stavke } = await supabase.from("temeljnice_stavke").select("konto, duguje, potrazuje").in("temeljnica_id", ids);
  let prihodi = 0, rashodi = 0, amort = 0, potrazivanja = 0;
  for (const s of stavke ?? []) {
    const d = Number(s.duguje ?? 0);
    const p = Number(s.potrazuje ?? 0);
    const k = String(s.konto ?? "").charAt(0);
    if (k === "7") prihodi += p - d;
    if (k === "4" || k === "6") rashodi += d - p;
    if (String(s.konto).startsWith("4300")) amort += d - p;
    if (String(s.konto).startsWith("1200")) potrazivanja += d - p;
  }
  const neto_profit = prihodi - rashodi;
  const ebitda = neto_profit + amort;
  const dso = prihodi > 0 ? (potrazivanja / prihodi) * 30 : 0;
  return { neto_profit, ebitda, dso };
}

export default function KPIPage() {
  const { companyId, useSupabase } = useCompany();
  const { data: kpis, isLoading } = useQuery({
    queryKey: ["kpi", companyId],
    queryFn: () => getKPIs(companyId!),
    enabled: !!companyId && useSupabase,
  });

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">KPI dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Neto profit</CardTitle>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis ? formatCurrency(kpis.neto_profit) : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">EBITDA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis ? formatCurrency(kpis.ebitda) : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">DSO (dana)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis != null ? kpis.dso.toFixed(1) : "—"}</p>
            <p className="text-xs text-slate-500">Prosječna naplata</p>
          </CardContent>
        </Card>
      </div>
      {!useSupabase && <p className="mt-4 text-slate-500">KPI zahtijeva Supabase i knjižene temeljnice.</p>}
      {isLoading && <p className="mt-4 text-slate-500">Učitavanje…</p>}
    </div>
  );
}
