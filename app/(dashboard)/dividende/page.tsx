"use client";

import { useState, useMemo } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { getClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "lucide-react";
import { toast } from "sonner";

const PRIREZ_ZAGREB = 0.1;
const POREZ_DIVIDENDA = 0.1;

export default function DividendePage() {
  const { companyId, useSupabase } = useCompany();
  const [iznosDividende, setIznosDividende] = useState("");

  const { data: saldo9120 } = useQuery({
    queryKey: ["saldo_9120", companyId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase || !companyId) return 0;
      const { data: t } = await supabase.from("temeljnice").select("id").eq("company_id", companyId);
      const ids = (t ?? []).map((x) => x.id);
      if (ids.length === 0) return 0;
      const { data: s } = await supabase.from("temeljnice_stavke").select("duguje, potrazuje").in("temeljnica_id", ids).eq("konto", "9120");
      let sum = 0;
      for (const r of s ?? []) sum += Number(r.duguje ?? 0) - Number(r.potrazuje ?? 0);
      return sum;
    },
    enabled: !!companyId && useSupabase,
  });

  const dobitTekuca = saldo9120 ?? 0;
  const zadrzanaPrethodnih = 0;
  const raspolozivo = dobitTekuca + zadrzanaPrethodnih;
  const bruto = parseFloat(iznosDividende.replace(",", ".")) || 0;
  const porez = Math.round(bruto * POREZ_DIVIDENDA * 100) / 100;
  const prirez = Math.round(porez * PRIREZ_ZAGREB * 100) / 100;
  const netoIsplata = Math.round((bruto - porez - prirez) * 100) / 100;

  const handleGenerirajNalog = () => {
    if (bruto <= 0 || bruto > raspolozivo) {
      toast.error("Iznos dividende mora biti između 0 i raspoložive dobiti.");
      return;
    }
    toast.info("Generiranje naloga za isplatu: D 9120, P 2150 (neto), P 2160 (porez+prirez). JOPPD šifra 0091. Implementirajte API za kreiranje temeljnice.");
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Dividende</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Simulator isplate dividende
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Dobit tekuće godine (9120):</span>
              <span className="font-medium">{formatCurrency(dobitTekuca)}</span>
            </div>
            <div className="flex justify-between">
              <span>Zadržana dobit prethodnih:</span>
              <span className="font-medium">{formatCurrency(zadrzanaPrethodnih)}</span>
            </div>
            <hr />
            <div className="flex justify-between font-medium">
              <span>Raspoloživo za dividendu:</span>
              <span>{formatCurrency(raspolozivo)}</span>
            </div>
          </div>
          <div>
            <Label>Upiši iznos dividende (€)</Label>
            <Input type="number" step="0.01" value={iznosDividende} onChange={(e) => setIznosDividende(e.target.value)} className="mt-1" />
          </div>
          {bruto > 0 && (
            <>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Porez na dividendu (10%):</span>
                  <span>{formatCurrency(porez)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prirez (Zagreb 10%):</span>
                  <span>{formatCurrency(prirez)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-medium text-green-600">
                  <span>Neto isplata vlasniku:</span>
                  <span>{formatCurrency(netoIsplata)}</span>
                </div>
              </div>
              <Button onClick={handleGenerirajNalog} className="w-full mt-4">
                Generiraj nalog za isplatu
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
