"use client";

import { useCompany } from "@/contexts/CompanyContext";
import { usePlace } from "@/hooks/usePlace";
import { useRadnici } from "@/hooks/useRadnici";
import { useMockStore } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ClipboardList } from "lucide-react";

export default function JOPPDPage() {
  const { companyId, useSupabase } = useCompany();
  const placeSupabase = usePlace(companyId);
  const placeMock = useMockStore((s) => s.getPlace(s.currentCompanyId ?? ""));
  const placeList = useSupabase ? (placeSupabase.data ?? []) : placeMock;
  const radniciSupabase = useRadnici(companyId);
  const radniciMock = useMockStore((s) => s.getRadnici(s.currentCompanyId ?? ""));
  const radnici = useSupabase ? (radniciSupabase.data ?? []) : radniciMock;

  const now = new Date();
  const ovajMjesec = placeList.filter((p) => {
    const d = new Date(p.period_od);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">JOPPD</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Obračuni za JOPPD (ovaj mjesec)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-600">
            JOPPD prijava se podnosi do 15. u mjesecu za prethodni mjesec. XML export za ePorezna bit će dostupan u sljedećem ažuriranju.
          </p>
          {ovajMjesec.length === 0 ? (
            <p className="text-slate-500">Nema obračuna za ovaj mjesec. Kreirajte obračun u izborniku Plaće → Obračun plaća.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Radnik</th>
                    <th className="pb-3 font-medium">Period</th>
                    <th className="pb-3 font-medium text-right">Bruto</th>
                    <th className="pb-3 font-medium text-right">Neto</th>
                    <th className="pb-3 font-medium">JOPPD poslan</th>
                  </tr>
                </thead>
                <tbody>
                  {ovajMjesec.map((p) => {
                    const r = radnici.find((x) => x.id === p.radnik_id);
                    return (
                      <tr key={p.id} className="border-b border-slate-100">
                        <td className="py-3">{r ? `${r.ime} ${r.prezime}` : "—"}</td>
                        <td className="py-3">{formatDate(p.period_od)} – {formatDate(p.period_do)}</td>
                        <td className="py-3 text-right">{formatCurrency(p.bruto)}</td>
                        <td className="py-3 text-right">{formatCurrency(p.neto ?? 0)}</td>
                        <td className="py-3">{p.joppd_poslan ? "Da" : "Ne"}</td>
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
