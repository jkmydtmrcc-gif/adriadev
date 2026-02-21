"use client";

import Link from "next/link";
import { useMockStore } from "@/lib/mock-db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, FileSpreadsheet } from "lucide-react";

const statusLabels: Record<string, string> = {
  draft: "Nacrt",
  poslana: "Poslana",
  prihvacena: "Prihvaćena",
  odbijena: "Odbijena",
  istekla: "Istekla",
};

export default function PonudePage() {
  const currentCompanyId = useMockStore((s) => s.currentCompanyId);
  const ponude = useMockStore((s) =>
    s.ponude.filter((p) => p.company_id === currentCompanyId)
  );
  const getKontakt = (id: string) =>
    useMockStore.getState().kontakti.find((k) => k.id === id)?.naziv ?? "—";

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Ponude</h1>
        <Button asChild>
          <Link href="/ponude/nova" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova ponuda
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista ponuda</CardTitle>
        </CardHeader>
        <CardContent>
          {ponude.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileSpreadsheet className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">Nema ponuda.</p>
              <Button asChild className="mt-4">
                <Link href="/ponude/nova">Kreiraj prvu ponudu</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Broj</th>
                    <th className="pb-3 font-medium">Kupac</th>
                    <th className="pb-3 font-medium">Datum</th>
                    <th className="pb-3 font-medium text-right">Iznos</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {ponude
                    .sort(
                      (a, b) =>
                        new Date(b.datum).getTime() - new Date(a.datum).getTime()
                    )
                    .map((p) => (
                      <tr key={p.id} className="border-b border-slate-100">
                        <td className="py-3 font-medium">{p.broj_ponude}</td>
                        <td className="py-3">{getKontakt(p.kontakt_id)}</td>
                        <td className="py-3">{formatDate(p.datum)}</td>
                        <td className="py-3 text-right font-medium">
                          {formatCurrency(p.ukupno_s_pdv ?? 0)}
                        </td>
                        <td className="py-3">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                            {statusLabels[p.status] ?? p.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/ponude/${p.id}`}
                            className="text-primary hover:underline"
                          >
                            Otvori
                          </Link>
                        </td>
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
