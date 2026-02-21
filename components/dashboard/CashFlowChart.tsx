"use client";

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

const mjeseci = [
  "Sij", "Velj", "Ožu", "Tra", "Svi", "Lip", "Srpanj", "Kol", "Ruj", "Lis", "Stu", "Pro",
];

interface CashFlowChartProps {
  data: { mjesec: string; prihodi: number; rashodi: number }[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prihodi vs. rashodi (zadnjih 12 mjeseci)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis
                dataKey="mjesec"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
              <Legend />
              <Bar dataKey="prihodi" name="Prihodi" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rashodi" name="Rashodi" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function getDefaultCashFlowData(): { mjesec: string; prihodi: number; rashodi: number }[] {
  const d = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const m = new Date(d.getFullYear(), d.getMonth() - 11 + i, 1);
    return {
      mjesec: mjeseci[m.getMonth()],
      prihodi: Math.round(5000 + Math.random() * 8000),
      rashodi: Math.round(3000 + Math.random() * 5000),
    };
  });
}
