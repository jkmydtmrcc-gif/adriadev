"use client";

import { useCompany } from "@/contexts/CompanyContext";
import { getClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Car, Plus } from "lucide-react";
import Link from "next/link";

export default function VozilaPage() {
  const { companyId, useSupabase } = useCompany();
  const { data: list = [], isLoading, isError, error } = useQuery({
    queryKey: ["vozila", companyId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase || !companyId) return [];
      const { data, error } = await supabase.from("vozila").select("*").eq("company_id", companyId).order("naziv");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!companyId && !!useSupabase,
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Evidencija vozila</h1>
        <Button asChild>
          <Link href="/vozila/novi" className="gap-2">
            <Plus className="h-4 w-4" />
            Dodaj vozilo
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vozila
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!useSupabase ? (
            <p className="text-slate-500">Vozila zahtijevaju Supabase.</p>
          ) : !companyId ? (
            <p className="text-slate-500">Odaberite tvrtku u gornjem izborniku.</p>
          ) : isError ? (
            <p className="text-red-600">Greška: {(error as Error)?.message ?? "Nije moguće učitati podatke."}</p>
          ) : isLoading ? (
            <p className="text-slate-500">Učitavanje…</p>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-slate-500">Nema evidentiranih vozila.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Naziv / Registracija</th>
                    <th className="pb-3 font-medium">Marka / Model</th>
                    <th className="pb-3 font-medium text-right">Nabavna</th>
                    <th className="pb-3 font-medium">Porezno priznato</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((v: { id: string; naziv: string; registracija: string; marka?: string; model?: string; nabavna_vrijednost?: number; porezno_priznato: number; aktivno: boolean }) => (
                    <tr key={v.id} className="border-b border-slate-100">
                      <td className="py-3 font-medium">
                        <Link href={`/vozila/${v.id}`} className="text-primary hover:underline">{v.naziv} ({v.registracija})</Link>
                      </td>
                      <td className="py-3">{[v.marka, v.model].filter(Boolean).join(" ") || "—"}</td>
                      <td className="py-3 text-right">{v.nabavna_vrijednost != null ? formatCurrency(v.nabavna_vrijednost) : "—"}</td>
                      <td className="py-3">{v.porezno_priznato}%</td>
                      <td className="py-3"><span className={v.aktivno ? "text-green-600" : "text-slate-500"}>{v.aktivno ? "Aktivno" : "Neaktivno"}</span></td>
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
