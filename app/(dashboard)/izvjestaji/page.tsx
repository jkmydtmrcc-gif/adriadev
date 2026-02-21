"use client";

import { useMemo } from "react";
import { useRacuniData } from "@/hooks/useRacuniData";
import { useCompany } from "@/contexts/CompanyContext";
import { useUlazniRacuni } from "@/hooks/useUlazniRacuni";
import { useBankovniPromet } from "@/hooks/useBankovniPromet";
import { useMockStore } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MJESECI = ["Sij", "Velj", "Ožu", "Tra", "Svi", "Lip", "Srpanj", "Kol", "Ruj", "Lis", "Stu", "Pro"];

export default function IzvjestajiPage() {
  const { companyId, useSupabase } = useCompany();
  const { racuni } = useRacuniData();
  const ulazniSupabase = useUlazniRacuni(companyId);
  const ulazniMock = useMockStore((s) => s.getUlazniRacuni(s.currentCompanyId ?? ""));
  const ulazni = useSupabase ? (ulazniSupabase.data ?? []) : ulazniMock;
  const bankeSupabase = useBankovniPromet(companyId);
  const bankeMock = useMockStore((s) => s.getBankovniPromet(s.currentCompanyId ?? ""));
  const banke = useSupabase ? (bankeSupabase.data ?? []) : bankeMock;

  const godina = new Date().getFullYear();
  const prihodiPoMjesecu = useMemo(() => {
    const m: Record<number, number> = {};
    for (let i = 0; i < 12; i++) m[i] = 0;
    racuni.forEach((r) => {
      const d = new Date(r.datum_izdavanja);
      if (d.getFullYear() === godina) m[d.getMonth()] += r.ukupno_s_pdv ?? 0;
    });
    banke.filter((b) => b.tip === "prihod").forEach((b) => {
      const d = new Date(b.datum);
      if (d.getFullYear() === godina) m[d.getMonth()] += b.iznos;
    });
    return Array.from({ length: 12 }, (_, i) => ({
      mjesec: MJESECI[i],
      prihodi: Math.round(m[i] * 100) / 100,
    }));
  }, [racuni, banke, godina]);

  const rashodiPoMjesecu = useMemo(() => {
    const m: Record<number, number> = {};
    for (let i = 0; i < 12; i++) m[i] = 0;
    ulazni.forEach((u) => {
      const d = new Date(u.datum_racuna);
      if (d.getFullYear() === godina) m[d.getMonth()] += u.ukupno_s_pdv ?? 0;
    });
    banke.filter((b) => b.tip === "rashod").forEach((b) => {
      const d = new Date(b.datum);
      if (d.getFullYear() === godina) m[d.getMonth()] += b.iznos;
    });
    return Array.from({ length: 12 }, (_, i) => ({
      mjesec: MJESECI[i],
      rashodi: Math.round(m[i] * 100) / 100,
    }));
  }, [ulazni, banke, godina]);

  const ukupnoPrihodi = prihodiPoMjesecu.reduce((a, x) => a + x.prihodi, 0);
  const ukupnoRashodi = rashodiPoMjesecu.reduce((a, x) => a + x.rashodi, 0);
  const kombinirano = prihodiPoMjesecu.map((p, i) => ({
    mjesec: p.mjesec,
    prihodi: p.prihodi,
    rashodi: rashodiPoMjesecu[i].rashodi,
  }));

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Izvještaji</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ukupno prihodi ({godina})</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(ukupnoPrihodi)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ukupno rashodi ({godina})</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(ukupnoRashodi)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Prihodi i rashodi po mjesecima
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kombinirano} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                <XAxis dataKey="mjesec" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="prihodi" name="Prihodi" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rashodi" name="Rashodi" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
