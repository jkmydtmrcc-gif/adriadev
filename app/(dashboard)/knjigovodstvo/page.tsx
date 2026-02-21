"use client";

import { useMemo } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useTemeljnice, useTemeljniceStavke } from "@/hooks/useTemeljnice";
import { useMockStore } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BookMarked } from "lucide-react";

export default function GlavnaKnjigaPage() {
  const { companyId, useSupabase } = useCompany();
  const fromSupabase = useTemeljnice(companyId);
  const fromMock = useMockStore((s) => s.getTemeljnice(s.currentCompanyId ?? ""));
  const temeljnice = useSupabase ? (fromSupabase.data ?? []) : fromMock;
  const stavkeSupabase = useTemeljniceStavke(companyId);
  const temeljniceStavke = useSupabase ? (stavkeSupabase.data ?? []) : useMockStore((s) => s.temeljnice_stavke);

  const stavkeByTemeljnica = useMemo(() => {
    const map: Record<string, { konto: string; duguje: number; potrazuje: number; datum: string; broj: string }[]> = {};
    temeljnice.forEach((t) => {
      const stavke = temeljniceStavke.filter((s) => s.temeljnica_id === t.id);
      map[t.id] = stavke.map((s) => ({
        konto: s.konto,
        duguje: Number(s.duguje),
        potrazuje: Number(s.potrazuje),
        datum: t.datum,
        broj: t.broj_temeljnice,
      }));
    });
    return map;
  }, [temeljnice, temeljniceStavke]);

  const sveStavke = useMemo(() => {
    const out: { broj: string; datum: string; konto: string; duguje: number; potrazuje: number }[] = [];
    temeljnice.forEach((t) => {
      const stavke = temeljniceStavke.filter((s) => s.temeljnica_id === t.id);
      stavke.forEach((s) => {
        out.push({
          broj: t.broj_temeljnice,
          datum: t.datum,
          konto: s.konto,
          duguje: Number(s.duguje),
          potrazuje: Number(s.potrazuje),
        });
      });
    });
    return out.sort((a, b) => a.datum.localeCompare(b.datum) || a.broj.localeCompare(b.broj));
  }, [temeljnice, temeljniceStavke]);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Glavna knjiga</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookMarked className="h-5 w-5" />
            Pregled knjiženja po datumima
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sveStavke.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookMarked className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">Nema knjiženih stavki. Unesite temeljnice u izborniku Temeljnice.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Datum</th>
                    <th className="pb-3 font-medium">Broj temeljnice</th>
                    <th className="pb-3 font-medium">Konto</th>
                    <th className="pb-3 font-medium text-right">Duguje</th>
                    <th className="pb-3 font-medium text-right">Potražuje</th>
                  </tr>
                </thead>
                <tbody>
                  {sveStavke.map((s, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2">{formatDate(s.datum)}</td>
                      <td className="py-2">{s.broj}</td>
                      <td className="py-2">{s.konto}</td>
                      <td className="py-2 text-right">{s.duguje ? formatCurrency(s.duguje) : "—"}</td>
                      <td className="py-2 text-right">{s.potrazuje ? formatCurrency(s.potrazuje) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
