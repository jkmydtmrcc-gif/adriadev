"use client";

import { useMemo, useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useTemeljnice, useTemeljniceStavke } from "@/hooks/useTemeljnice";
import { useMockStore } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Receipt, FileDown, FileCode } from "lucide-react";

const KONTA_IZLAZNI = ["2400", "2401", "2402"];
const KONTO_ULAZNI = "1600";

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function formatDateCroatian(d: Date): string {
  return d.toLocaleDateString("hr-HR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function PdvPage() {
  const { companyId, useSupabase, companies } = useCompany();
  const fromSupabaseT = useTemeljnice(companyId);
  const fromSupabaseS = useTemeljniceStavke(companyId);
  const temeljniceMock = useMockStore((s) => s.getTemeljnice(s.currentCompanyId ?? ""));
  const stavkeMock = useMockStore((s) => s.temeljnice_stavke);

  const temeljnice = useSupabase ? (fromSupabaseT.data ?? []) : temeljniceMock;
  const stavke = useSupabase ? (fromSupabaseS.data ?? []) : stavkeMock;

  const company = companies.find((c) => c.id === companyId);
  const pdvObveznik = company?.pdv_obveznik ?? false;

  const [mode, setMode] = useState<"monthly" | "quarterly">("monthly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [quarter, setQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);

  const { periodOd, periodDo, periodLabel } = useMemo(() => {
    if (mode === "monthly") {
      const od = new Date(year, month, 1);
      const do_ = new Date(year, month + 1, 0);
      return {
        periodOd: od.toISOString().slice(0, 10),
        periodDo: do_.toISOString().slice(0, 10),
        periodLabel: `${od.toLocaleDateString("hr-HR", { month: "long" })} ${year}.`,
      };
    }
    const startMonth = (quarter - 1) * 3;
    const od = new Date(year, startMonth, 1);
    const do_ = new Date(year, startMonth + 3, 0);
    return {
      periodOd: od.toISOString().slice(0, 10),
      periodDo: do_.toISOString().slice(0, 10),
      periodLabel: `${quarter}. kvartal ${year}.`,
    };
  }, [mode, year, month, quarter]);

  const temeljnicaById = useMemo(() => {
    const map: Record<string, { datum: string }> = {};
    temeljnice.forEach((t) => {
      map[t.id] = { datum: t.datum };
    });
    return map;
  }, [temeljnice]);

  const pdv = useMemo(() => {
    let izlazni25 = 0,
      izlazni13 = 0,
      izlazni5 = 0,
      ulazni = 0;
    stavke.forEach((s) => {
      const t = temeljnicaById[s.temeljnica_id];
      if (!t || t.datum < periodOd || t.datum > periodDo) return;
      const duguje = Number(s.duguje);
      const potrazuje = Number(s.potrazuje);
      if (s.konto === KONTO_ULAZNI) ulazni += duguje;
      if (s.konto === "2400") izlazni25 += potrazuje;
      if (s.konto === "2401") izlazni13 += potrazuje;
      if (s.konto === "2402") izlazni5 += potrazuje;
    });
    const izlazniUkupno = izlazni25 + izlazni13 + izlazni5;
    const zaUplatu = Math.max(0, izlazniUkupno - ulazni);
    const povrat = izlazniUkupno < ulazni ? ulazni - izlazniUkupno : 0;
    const rokPlacanja = addDays(new Date(periodDo), 20);
    return {
      izlazni25: Math.round(izlazni25 * 100) / 100,
      izlazni13: Math.round(izlazni13 * 100) / 100,
      izlazni5: Math.round(izlazni5 * 100) / 100,
      izlazniUkupno: Math.round(izlazniUkupno * 100) / 100,
      ulazni: Math.round(ulazni * 100) / 100,
      zaUplatu: Math.round(zaUplatu * 100) / 100,
      povrat: Math.round(povrat * 100) / 100,
      rokPlacanja,
    };
  }, [stavke, temeljnicaById, periodOd, periodDo]);

  const handleExportXml = () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<PdvObracun xmlns="http://www.apis-it.hr/fin/2012/types/f73">
  <Period>${periodOd.slice(0, 7).replace("-", "")}</Period>
  <IzlazniPdv>${pdv.izlazniUkupno.toFixed(2)}</IzlazniPdv>
  <UlazniPdv>${pdv.ulazni.toFixed(2)}</UlazniPdv>
  <PdvZaUplatu>${pdv.zaUplatu.toFixed(2)}</PdvZaUplatu>
</PdvObracun>`;
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PDV-${periodOd.slice(0, 7)}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!pdvObveznik) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">PDV obračun</h1>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-6">
            <p className="text-amber-800">
              Tvrtka nije evidentirana kao PDV obveznik. Za PDV obračun uključite PDV obveznika u postavkama tvrtke.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">PDV obračun</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            PDV obračun – {periodLabel}
          </CardTitle>
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                className={`px-3 py-1.5 text-sm font-medium ${mode === "monthly" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
                onClick={() => setMode("monthly")}
              >
                Mjesečno
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-sm font-medium ${mode === "quarterly" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
                onClick={() => setMode("quarterly")}
              >
                Kvartalno
              </button>
            </div>
            {mode === "monthly" && (
              <>
                <select
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {new Date(2000, i).toLocaleDateString("hr-HR", { month: "long" })}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {[year, year - 1, year - 2].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </>
            )}
            {mode === "quarterly" && (
              <>
                <select
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                  value={quarter}
                  onChange={(e) => setQuarter(Number(e.target.value))}
                >
                  {[1, 2, 3, 4].map((q) => (
                    <option key={q} value={q}>{q}. kvartal</option>
                  ))}
                </select>
                <select
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {[year, year - 1, year - 2].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Izlazni PDV (naplaćeni):</span>
              <span className="font-semibold">{formatCurrency(pdv.izlazniUkupno)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Ulazni PDV (pretporez):</span>
              <span className="font-semibold">-{formatCurrency(pdv.ulazni)}</span>
            </div>
            <hr />
            <div className="flex justify-between text-lg font-bold">
              <span>PDV za uplatu:</span>
              <span>{formatCurrency(pdv.zaUplatu)}</span>
            </div>
            <p className="text-sm text-slate-500">
              Rok plaćanja: <strong>{formatDateCroatian(pdv.rokPlacanja)}</strong>
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Breakdown po stopama:</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>PDV 25%: {formatCurrency(pdv.izlazni25)}</span>
              <span>PDV 13%: {formatCurrency(pdv.izlazni13)}</span>
              <span>PDV 5%: {formatCurrency(pdv.izlazni5)}</span>
            </div>
          </div>

          {pdv.povrat > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-green-800 font-medium">
                Imate pravo na povrat PDV-a: {formatCurrency(pdv.povrat)}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <FileDown className="h-4 w-4" />
              Generiraj PDF
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportXml}>
              <FileCode className="h-4 w-4" />
              Preuzmi XML za e-Porezna
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
