"use client";

import { useCompany } from "@/contexts/CompanyContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ForecastMonth {
  mjesec: string;
  prihodi: number;
  rashodi: number;
  neto: number;
  poznate_obveze: { datum: string; iznos: number; tip: string }[];
}

export function CashFlowForecast() {
  const { companyId, useSupabase } = useCompany();
  const { data: forecast = [], isLoading } = useQuery({
    queryKey: ["cashflow-forecast", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/cashflow-forecast?company_id=${companyId}`);
      if (!res.ok) throw new Error("Greška");
      return res.json() as Promise<ForecastMonth[]>;
    },
    enabled: !!companyId && !!useSupabase,
  });

  const firstMonthObveze = forecast[0]?.poznate_obveze ?? [];
  const obvezeText = firstMonthObveze
    .filter((o) => o.iznos < 0)
    .map((o) => `${o.tip} ${formatCurrency(Math.abs(o.iznos))} (${o.datum.slice(8, 10)}.${o.datum.slice(5, 7)}.)`)
    .join(", ");

  if (!useSupabase) return null;
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Prognoza cash flowa</CardTitle></CardHeader>
        <CardContent><p className="text-slate-500">Učitavanje…</p></CardContent>
      </Card>
    );
  }
  if (forecast.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Prognoza cash flowa</CardTitle></CardHeader>
        <CardContent><p className="text-slate-500">Nema podataka za prognozu.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prognoza cash flowa (6 mjeseci)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis dataKey="mjesec" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
              <Legend />
              <Bar dataKey="prihodi" name="Prihodi" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rashodi" name="Rashodi" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {obvezeText && (
          <p className="mt-3 text-xs text-slate-600">
            Poznate obveze ovaj mjesec: {obvezeText}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
