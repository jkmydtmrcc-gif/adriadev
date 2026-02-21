"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useCompany } from "@/contexts/CompanyContext";
import { usePlace } from "@/hooks/usePlace";
import { useRadnici } from "@/hooks/useRadnici";
import { useMockStore } from "@/lib/mock-db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DollarSign,
  Users,
  Calendar,
  FileText,
  Download,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

const MJESIECI = [
  "siječanj", "veljača", "ožujak", "travanj", "svibanj", "lipanj",
  "srpanj", "kolovoz", "rujan", "listopad", "studeni", "prosinac",
];

function getJOPPDDeadline(dayIsplate: number): { date: Date; label: string } {
  const d = new Date();
  if (d.getDate() < dayIsplate) {
    const deadline = new Date(d.getFullYear(), d.getMonth(), dayIsplate);
    return { date: deadline, label: `${dayIsplate}. ${MJESIECI[d.getMonth()]} ${d.getFullYear()}.` };
  }
  const next = new Date(d.getFullYear(), d.getMonth() + 1, Math.min(dayIsplate, 28));
  return { date: next, label: `${next.getDate()}. ${MJESIECI[next.getMonth()]} ${next.getFullYear()}.` };
}

function daysUntil(d: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function statusBadge(placa: { auto_generirana?: boolean; joppd_poslan?: boolean }, joppdDays: number) {
  if (placa.joppd_poslan) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Isplaćeno</span>;
  }
  if (placa.auto_generirana) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Auto</span>;
  }
  if (joppdDays <= 3 && joppdDays >= 0) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">JOPPD rok</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Obračunato</span>;
}

export default function PlacePage() {
  const { companyId, companies, useSupabase } = useCompany();
  const company = companies.find((c) => c.id === companyId);
  const placeQuery = usePlace(companyId);
  const placeMock = useMockStore((s) => s.getPlace(s.currentCompanyId ?? ""));
  const placeList = useSupabase ? (placeQuery.data ?? []) : placeMock;

  const radniciQuery = useRadnici(companyId);
  const radniciMock = useMockStore((s) => s.getRadnici(s.currentCompanyId ?? ""));
  const radnici = useSupabase ? (radniciQuery.data ?? []) : radniciMock;

  const danIsplate = company?.placa_dan_isplate ?? 15;
  const joppd = getJOPPDDeadline(danIsplate);
  const joppdDays = daysUntil(new Date(joppd.date));

  const thisMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return placeList.filter((p) => {
      const d = new Date(p.period_od);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }, [placeList]);

  const ukupniTrosak = thisMonth.reduce((a, p) => a + (p.ukupni_trosak ?? 0), 0);
  const ukupnoNeto = thisMonth.reduce((a, p) => a + (p.neto ?? 0), 0);
  const brojRadnika = radnici.filter((r) => r.aktivan).length;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Plaće</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/place/radnici" className="gap-2">
              <Users className="h-4 w-4" />
              Radnici
            </Link>
          </Button>
          <Button asChild>
            <Link href="/place/obracun" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Novi obračun
            </Link>
          </Button>
        </div>
      </div>

      {/* Header stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Ukupni trošak ovaj mjesec</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(ukupniTrosak)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Neto za isplatu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(ukupnoNeto)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Broj radnika</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{brojRadnika}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">JOPPD rok</CardTitle>
            <Calendar className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{joppd.label}</p>
            <p className="text-xs text-slate-500">
              {joppdDays < 0 ? "Rok je prošao" : joppdDays === 0 ? "Danas" : `Za ${joppdDays} dana`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Batch actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Skupne akcije</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Funkcija „Isplati sve” bit će dostupna u sljedećem ažuriranju.")}
            className="gap-1"
          >
            <CheckCircle className="h-4 w-4" />
            Isplati sve
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => {
              if (!thisMonth.length) return toast.info("Nema obračuna za ovaj mjesec.");
              thisMonth.forEach((placa) => window.open(`/api/place/isplatna-lista-pdf?placa_id=${placa.id}`, "_blank"));
            }}
          >
            <FileText className="h-4 w-4" />
            Sve isplatne liste PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => companyId && window.open(`/api/place/joppd-xml?company_id=${companyId}&period=${new Date().toISOString().slice(0, 7)}`, "_blank")}
            disabled={!companyId}
          >
            <Download className="h-4 w-4" />
            Generiraj JOPPD za sve
          </Button>
        </CardContent>
      </Card>

      {/* Lista obračuna */}
      <Card>
        <CardHeader>
          <CardTitle>Lista obračuna</CardTitle>
        </CardHeader>
        <CardContent>
          {placeList.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="mb-4">Nema obračuna. Kreirajte obračun ili uključite automatski obračun u postavkama.</p>
              <Button asChild>
                <Link href="/place/obracun">Novi obračun</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Radnik</th>
                    <th className="pb-3 font-medium">Period</th>
                    <th className="pb-3 font-medium text-right">Bruto</th>
                    <th className="pb-3 font-medium text-right">Neto</th>
                    <th className="pb-3 font-medium text-right">Ukupni trošak</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {placeList.map((p) => {
                    const r = radnici.find((x) => x.id === p.radnik_id);
                    const radnikIme = r ? `${r.ime} ${r.prezime}` : "—";
                    return (
                      <tr key={p.id} className="border-b border-slate-100">
                        <td className="py-3 font-medium">{radnikIme}</td>
                        <td className="py-3">{formatDate(p.period_od)} – {formatDate(p.period_do)}</td>
                        <td className="py-3 text-right">{formatCurrency(p.bruto)}</td>
                        <td className="py-3 text-right">{formatCurrency(p.neto ?? 0)}</td>
                        <td className="py-3 text-right">{formatCurrency(p.ukupni_trosak ?? 0)}</td>
                        <td className="py-3">{statusBadge(p, joppdDays)}</td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/place/obracun?p=${p.id}`}>Pregled</Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/api/place/isplatna-lista-pdf?placa_id=${p.id}`, "_blank")}
                            >
                              PDF
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => companyId && window.open(`/api/place/joppd-xml?company_id=${companyId}&period=${p.period_od.slice(0, 7)}`, "_blank")}
                              disabled={!companyId}
                            >
                              JOPPD
                            </Button>
                          </div>
                        </td>
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
