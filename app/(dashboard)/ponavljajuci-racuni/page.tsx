"use client";

import { useCompany } from "@/contexts/CompanyContext";
import { getClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Repeat } from "lucide-react";
import Link from "next/link";

export default function PonavljajuciRacuniPage() {
  const { companyId, useSupabase } = useCompany();
  const { data: list = [], isLoading } = useQuery({
    queryKey: ["ponavljajuci_racuni", companyId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase || !companyId) return [];
      const { data, error } = await supabase
        .from("ponavljajuci_racuni")
        .select("id, naziv, frekvencija, sljedeci_datum, aktivno, auto_slanje, ukupno_s_pdv")
        .eq("company_id", companyId)
        .order("sljedeci_datum");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!companyId && !!useSupabase,
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Ponavljajući računi</h1>
        <Button asChild className="gap-2">
          <Link href="/ponavljajuci-racuni/novi">Novi</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Lista
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!useSupabase ? (
            <p className="text-slate-500">Ponavljajući računi zahtijevaju Supabase.</p>
          ) : isLoading ? (
            <p className="text-slate-500">Učitavanje…</p>
          ) : list.length === 0 ? (
            <p className="text-slate-500">Nema ponavljajućih računa. Cron u 7:00 kreira račun kad je sljedeci_datum = danas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Naziv</th>
                    <th className="pb-3 font-medium">Frekvencija</th>
                    <th className="pb-3 font-medium">Sljedeći datum</th>
                    <th className="pb-3 font-medium">Auto-slanje</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r: { id: string; naziv: string; frekvencija: string; sljedeci_datum: string | null; aktivno: boolean; auto_slanje: boolean }) => (
                    <tr key={r.id} className="border-b border-slate-100">
                      <td className="py-3 font-medium">{r.naziv}</td>
                      <td className="py-3">{r.frekvencija}</td>
                      <td className="py-3">{r.sljedeci_datum ? formatDate(r.sljedeci_datum) : "—"}</td>
                      <td className="py-3">{r.auto_slanje ? "Da" : "Ne"}</td>
                      <td className="py-3"><span className={r.aktivno ? "text-green-600" : "text-slate-500"}>{r.aktivno ? "Aktivan" : "Neaktivan"}</span></td>
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
