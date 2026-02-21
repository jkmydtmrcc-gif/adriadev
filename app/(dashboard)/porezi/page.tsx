"use client";

import { useMemo } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useRacuniData } from "@/hooks/useRacuniData";
import { useUlazniRacuni } from "@/hooks/useUlazniRacuni";
import { useMockStore } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Receipt } from "lucide-react";

export default function PoreziPage() {
  const { companyId, useSupabase } = useCompany();
  const { racuni } = useRacuniData();
  const ulazniSupabase = useUlazniRacuni(companyId);
  const ulazniMock = useMockStore((s) => s.getUlazniRacuni(s.currentCompanyId ?? ""));
  const ulazni = useSupabase ? (ulazniSupabase.data ?? []) : ulazniMock;

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();

  const { izlazniPdv, ulazniPdv, obveza } = useMemo(() => {
    let iz = 0;
    let ul = 0;
    racuni
      .filter((r) => {
        const d = new Date(r.datum_izdavanja);
        return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
      })
      .forEach((r) => { iz += r.ukupno_pdv ?? 0; });
    ulazni
      .filter((u) => {
        const d = new Date(u.datum_racuna);
        return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
      })
      .forEach((u) => { ul += u.ukupno_pdv ?? 0; });
    return {
      izlazniPdv: Math.round(iz * 100) / 100,
      ulazniPdv: Math.round(ul * 100) / 100,
      obveza: Math.round(Math.max(0, iz - ul) * 100) / 100,
    };
  }, [racuni, ulazni, thisYear, thisMonth]);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">PDV</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Pregled PDV-a (tekući mjesec)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Izlazni PDV (na računima)</p>
              <p className="text-xl font-semibold">{formatCurrency(izlazniPdv)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Ulazni PDV (odbitak)</p>
              <p className="text-xl font-semibold text-green-600">{formatCurrency(ulazniPdv)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">PDV za uplatu</p>
              <p className="text-xl font-semibold">{formatCurrency(obveza)}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Prijava PDV-a: do 20. u mjesecu za prethodni mjesec. Export za ePorezna bit će dostupan u sljedećem ažuriranju.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
