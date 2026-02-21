"use client";

import { useMemo } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useTemeljnice, useTemeljniceStavke } from "@/hooks/useTemeljnice";
import { useMockStore } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Scale } from "lucide-react";

export default function BrutoBilancaPage() {
  const { companyId, useSupabase } = useCompany();
  const fromSupabase = useTemeljnice(companyId);
  const fromMock = useMockStore((s) => s.getTemeljnice(s.currentCompanyId ?? ""));
  const temeljnice = useSupabase ? (fromSupabase.data ?? []) : fromMock;
  const stavkeSupabase = useTemeljniceStavke(companyId);
  const temeljniceStavke = useSupabase ? (stavkeSupabase.data ?? []) : useMockStore((s) => s.temeljnice_stavke);

  const poKontu = useMemo(() => {
    const map: Record<string, { duguje: number; potrazuje: number }> = {};
    temeljnice.forEach((t) => {
      temeljniceStavke
        .filter((s) => s.temeljnica_id === t.id)
        .forEach((s) => {
          const k = s.konto;
          if (!map[k]) map[k] = { duguje: 0, potrazuje: 0 };
          map[k].duguje += Number(s.duguje);
          map[k].potrazuje += Number(s.potrazuje);
        });
    });
    return Object.entries(map).map(([konto, v]) => ({ konto, ...v }));
  }, [temeljnice, temeljniceStavke]);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Bruto bilanca</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Salda po kontu
          </CardTitle>
        </CardHeader>
        <CardContent>
          {poKontu.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Scale className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">Nema knjiženja. Unesite temeljnice.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Konto</th>
                    <th className="pb-3 font-medium text-right">Duguje</th>
                    <th className="pb-3 font-medium text-right">Potrazuje</th>
                    <th className="pb-3 font-medium text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {poKontu.map((r) => {
                    const saldo = r.duguje - r.potrazuje;
                    return (
                      <tr key={r.konto} className="border-b border-slate-100">
                        <td className="py-2 font-medium">{r.konto}</td>
                        <td className="py-2 text-right">{formatCurrency(r.duguje)}</td>
                        <td className="py-2 text-right">{formatCurrency(r.potrazuje)}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(saldo)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
