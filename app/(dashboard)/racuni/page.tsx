"use client";

import Link from "next/link";
import { useRacuniData } from "@/hooks/useRacuniData";
import { useKontaktiData } from "@/hooks/useKontaktiData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, FileText } from "lucide-react";

const statusLabels: Record<string, string> = {
  draft: "Nacrt",
  izdan: "Izdan",
  poslan: "Poslan",
  djelomicno_placen: "Djelomično plaćen",
  placen: "Plaćen",
  storniran: "Storniran",
};

export default function RacuniPage() {
  const { racuni } = useRacuniData();
  const { kontakti } = useKontaktiData();
  const getKontakt = (id: string) => kontakti.find((k) => k.id === id)?.naziv ?? "—";

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Računi</h1>
        <Button asChild>
          <Link href="/racuni/novi" className="gap-2">
            <Plus className="h-4 w-4" />
            Novi račun
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista računa</CardTitle>
        </CardHeader>
        <CardContent>
          {racuni.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">Nema računa.</p>
              <Button asChild className="mt-4">
                <Link href="/racuni/novi">Kreiraj prvi račun</Link>
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
                    <th className="pb-3 font-medium">Valuta</th>
                    <th className="pb-3 font-medium text-right">Iznos</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {racuni
                    .sort(
                      (a, b) =>
                        new Date(b.datum_izdavanja).getTime() -
                        new Date(a.datum_izdavanja).getTime()
                    )
                    .map((r) => (
                      <tr key={r.id} className="border-b border-slate-100">
                        <td className="py-3 font-medium">{r.broj_racuna}</td>
                        <td className="py-3">{getKontakt(r.kontakt_id)}</td>
                        <td className="py-3">{formatDate(r.datum_izdavanja)}</td>
                        <td className="py-3">{r.valuta}</td>
                        <td className="py-3 text-right font-medium">
                          {formatCurrency(r.ukupno_s_pdv ?? 0)}
                        </td>
                        <td className="py-3">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                            {statusLabels[r.status] ?? r.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/racuni/${r.id}`}
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
