"use client";

import Link from "next/link";
import { useCompany } from "@/contexts/CompanyContext";
import { getClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MapPin, Plus, FileDown } from "lucide-react";

export default function PutniNaloziPage() {
  const { companyId, useSupabase } = useCompany();
  const { data: list = [], isLoading, isError, error } = useQuery({
    queryKey: ["putni_nalozi", companyId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase || !companyId) return [];
      const { data, error } = await supabase
        .from("putni_nalozi")
        .select("*")
        .eq("company_id", companyId)
        .order("datum_polaska", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!companyId && !!useSupabase,
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Putni nalozi</h1>
        <Button asChild className="gap-2">
          <Link href="/putni-nalozi/novi">
            <Plus className="h-4 w-4" />
            Novi putni nalog
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Lista putnih naloga
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!useSupabase ? (
            <p className="text-slate-500">Putni nalozi zahtijevaju Supabase.</p>
          ) : !companyId ? (
            <p className="text-slate-500">Odaberite tvrtku u gornjem izborniku.</p>
          ) : isError ? (
            <p className="text-red-600">Greška: {(error as Error)?.message ?? "Nije moguće učitati podatke."}</p>
          ) : isLoading ? (
            <p className="text-slate-500">Učitavanje…</p>
          ) : list.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p>Nema putnih naloga.</p>
              <Button asChild className="mt-4">
                <Link href="/putni-nalozi/novi">Kreiraj prvi putni nalog</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Broj</th>
                    <th className="pb-3 font-medium">Odredište</th>
                    <th className="pb-3 font-medium">Polazak – Povratak</th>
                    <th className="pb-3 font-medium text-right">Za isplatu</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p: { id: string; broj_naloga: string; datum_polaska: string; datum_povratka: string; odrediste: string; ukupno_za_isplatu?: number; status: string }) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-3 font-medium">{p.broj_naloga}</td>
                      <td className="py-3">{p.odrediste}</td>
                      <td className="py-3">{formatDate(p.datum_polaska)} – {formatDate(p.datum_povratka)}</td>
                      <td className="py-3 text-right">{formatCurrency(p.ukupno_za_isplatu ?? 0)}</td>
                      <td className="py-3"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{p.status}</span></td>
                      <td className="py-3">
                        <Button variant="ghost" size="icon" asChild title="Otvori PDF za ispis">
                          <a href={`/api/putni-nalozi/${p.id}/pdf`} target="_blank" rel="noopener noreferrer">
                            <FileDown className="h-4 w-4" />
                          </a>
                        </Button>
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
