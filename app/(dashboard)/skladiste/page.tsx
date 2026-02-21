"use client";

import { useCompany } from "@/contexts/CompanyContext";
import { getClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Package } from "lucide-react";

export default function SkladistePage() {
  const { companyId, useSupabase } = useCompany();
  const { data: proizvodi = [], isLoading, isError, error } = useQuery({
    queryKey: ["proizvodi", companyId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase || !companyId) return [];
      const { data, error } = await supabase.from("proizvodi").select("*").eq("company_id", companyId).eq("aktivan", true);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!companyId && !!useSupabase,
  });

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Skladište</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stanje zaliha
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!useSupabase ? (
            <p className="text-slate-500">Skladište zahtijeva Supabase (proizvodi, skladisni_pokreti).</p>
          ) : !companyId ? (
            <p className="text-slate-500">Odaberite tvrtku u gornjem izborniku.</p>
          ) : isError ? (
            <p className="text-red-600">Greška: {(error as Error)?.message ?? "Nije moguće učitati podatke."}</p>
          ) : isLoading ? (
            <p className="text-slate-500">Učitavanje…</p>
          ) : proizvodi.length === 0 ? (
            <p className="text-slate-500">Nema proizvoda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Proizvod</th>
                    <th className="pb-3 font-medium">Na skladištu</th>
                    <th className="pb-3 font-medium">Min.</th>
                    <th className="pb-3 font-medium text-right">Vrijednost</th>
                  </tr>
                </thead>
                <tbody>
                  {(proizvodi as Array<{ id: string; naziv: string; kolicina_na_skladistu?: number; min_kolicina?: number; cijena_nabave?: number }>).map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-3 font-medium">{p.naziv}</td>
                      <td className="py-3">{Number(p.kolicina_na_skladistu ?? 0)}</td>
                      <td className="py-3">{Number(p.min_kolicina ?? 0)}</td>
                      <td className="py-3 text-right">{formatCurrency((p.kolicina_na_skladistu ?? 0) * (p.cijena_nabave ?? 0))}</td>
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
