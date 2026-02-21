"use client";

import { useMockStore } from "@/lib/mock-db";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRacuniData } from "@/hooks/useRacuniData";
import { useCompany } from "@/contexts/CompanyContext";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { CashFlowChart, getDefaultCashFlowData } from "@/components/dashboard/CashFlowChart";
import { CashFlowForecast } from "@/components/dashboard/CashFlowForecast";
import { RecentInvoices } from "@/components/dashboard/RecentInvoices";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { TaxObligations } from "@/components/dashboard/TaxObligations";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { racuni: racuniList } = useRacuniData();
  const { companyId: currentCompanyId, useSupabase } = useCompany();
  const ulazniRacuni = useSupabase ? [] : useMockStore((s) => s.ulazni_racuni);
  const bankovniPromet = useSupabase ? [] : useMockStore((s) => s.bankovni_promet);

  const racuniFiltered = racuniList;
  const ulazniFiltered = useMemo(
    () => ulazniRacuni.filter((u) => u.company_id === currentCompanyId),
    [ulazniRacuni, currentCompanyId]
  );

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const prihodiMjesec = useMemo(() => {
    return racuniFiltered
      .filter((r) => {
        const d = new Date(r.datum_izdavanja);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .reduce((sum, r) => sum + (r.ukupno_s_pdv ?? 0), 0);
  }, [racuniFiltered, thisMonth, thisYear]);

  const neplaceni = useMemo(() => {
    const n = racuniFiltered.filter(
      (r) =>
        r.status !== "placen" &&
        r.status !== "storniran" &&
        (r.ukupno_s_pdv ?? 0) > (r.placeno ?? 0)
    );
    const iznos = n.reduce(
      (sum, r) => sum + ((r.ukupno_s_pdv ?? 0) - (r.placeno ?? 0)),
      0
    );
    return { iznos, broj: n.length };
  }, [racuniFiltered]);

  const troskoviMjesec = useMemo(() => {
    const izRacuna = ulazniFiltered
      .filter((u) => {
        const d = new Date(u.datum_racuna);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .reduce((sum, u) => sum + (u.ukupno_s_pdv ?? 0), 0);
    const izBanke = bankovniPromet
      .filter((b) => b.company_id === currentCompanyId && b.tip === "rashod")
      .filter((b) => {
        const d = new Date(b.datum);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .reduce((sum, b) => sum + b.iznos, 0);
    return izRacuna + izBanke;
  }, [ulazniFiltered, bankovniPromet, currentCompanyId, thisMonth, thisYear]);

  const pdvObveza = useMemo(() => {
    const izlazniPdv = racuniFiltered
      .filter((r) => {
        const d = new Date(r.datum_izdavanja);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .reduce((sum, r) => sum + (r.ukupno_pdv ?? 0), 0);
    const ulazniPdv = ulazniFiltered
      .filter((u) => {
        const d = new Date(u.datum_racuna);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .reduce((sum, u) => sum + (u.ukupno_pdv ?? 0), 0);
    return Math.max(0, izlazniPdv - ulazniPdv);
  }, [racuniFiltered, ulazniFiltered, thisMonth, thisYear]);

  const nextMonth = new Date(thisYear, thisMonth + 1, 15);

  const { data: cashFlowHistory = [] } = useQuery({
    queryKey: ["cashflow-history", currentCompanyId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/cashflow-history?company_id=${currentCompanyId}`);
      if (!res.ok) return getDefaultCashFlowData();
      const data = await res.json();
      return Array.isArray(data) && data.length > 0 ? data : getDefaultCashFlowData();
    },
    enabled: !!currentCompanyId && !!useSupabase,
  });
  const cashFlowData = useSupabase && currentCompanyId && (cashFlowHistory?.length ?? 0) > 0 ? cashFlowHistory : getDefaultCashFlowData();

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <QuickActions />
      </div>

      <div className="mb-6">
        <StatsCards
          prihodiMjesec={prihodiMjesec}
          prihodiPromjena={prihodiMjesec > 0 ? 15 : 0}
          neplaceniIznos={neplaceni.iznos}
          neplaceniBroj={neplaceni.broj}
          pdvObveza={pdvObveza}
          pdvDospijece={formatDate(nextMonth.toISOString())}
          troskoviMjesec={troskoviMjesec}
          topKategorija="Usluge"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <CashFlowChart data={cashFlowData} />
          <CashFlowForecast />
        </div>
        <div className="space-y-6">
          <TaxObligations />
          <RecentInvoices racuni={racuniFiltered} />
          <AIInsights />
        </div>
      </div>
    </div>
  );
}
