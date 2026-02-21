"use client";

import Link from "next/link";
import { useMockStore } from "@/lib/mock-db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Plus, Package } from "lucide-react";

export default function ArtikliPage() {
  const currentCompanyId = useMockStore((s) => s.currentCompanyId);
  const artikli = useMockStore((s) =>
    s.artikli.filter((a) => a.company_id === currentCompanyId)
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Artikli</h1>
        <Button asChild>
          <Link href="/artikli/novi" className="gap-2">
            <Plus className="h-4 w-4" />
            Novi artikl
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Artikli i usluge</CardTitle>
        </CardHeader>
        <CardContent>
          {artikli.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">Nema artikala.</p>
              <Button asChild className="mt-4">
                <Link href="/artikli/novi">Dodaj prvi artikl</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Naziv</th>
                    <th className="pb-3 font-medium">Jedinica</th>
                    <th className="pb-3 font-medium text-right">Cijena</th>
                    <th className="pb-3 font-medium">PDV %</th>
                  </tr>
                </thead>
                <tbody>
                  {artikli.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100">
                      <td className="py-3 font-medium">
                        <Link href={`/artikli/${a.id}`} className="text-primary hover:underline">
                          {a.naziv}
                        </Link>
                      </td>
                      <td className="py-3">{a.jedinica_mjere}</td>
                      <td className="py-3 text-right">{formatCurrency(a.cijena)}</td>
                      <td className="py-3">{a.pdv_stopa}%</td>
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
