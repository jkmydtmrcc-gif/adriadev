"use client";

import { useState, useEffect } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { getClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import { hasSupabase } from "@/lib/supabase/client";

const MJESIECI = [
  "siječanj", "veljača", "ožujak", "travanj", "svibanj", "lipanj",
  "srpanj", "kolovoz", "rujan", "listopad", "studeni", "prosinac",
];

function nextRunDate(day: number): string {
  const d = new Date();
  if (d.getDate() < day) {
    return `${day}. ${MJESIECI[d.getMonth()]} ${d.getFullYear()}.`;
  }
  const next = new Date(d.getFullYear(), d.getMonth() + 1, Math.min(day, 28));
  return `${next.getDate()}. ${MJESIECI[next.getMonth()]} ${next.getFullYear()}.`;
}

export default function PostavkePlacePage() {
  const { companyId, companies } = useCompany();
  const company = companies.find((c) => c.id === companyId);
  const queryClient = useQueryClient();
  const useSupabase = hasSupabase();

  const [placaAuto, setPlacaAuto] = useState(company?.placa_auto ?? false);
  const [danObracuna, setDanObracuna] = useState(company?.placa_dan_obracuna ?? 1);
  const [danIsplate, setDanIsplate] = useState(company?.placa_dan_isplate ?? 15);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setPlacaAuto(company.placa_auto ?? false);
      setDanObracuna(company.placa_dan_obracuna ?? 1);
      setDanIsplate(company.placa_dan_isplate ?? 15);
    }
  }, [company]);

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      if (useSupabase) {
        const supabase = getClient();
        if (!supabase) {
          toast.error("Supabase nije konfiguriran.");
          return;
        }
        const { error } = await supabase
          .from("companies")
          .update({
            placa_auto: placaAuto,
            placa_dan_obracuna: Math.min(28, Math.max(1, danObracuna)),
            placa_dan_isplate: Math.min(28, Math.max(1, danIsplate)),
          })
          .eq("id", companyId);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["companies"] });
        toast.success("Postavke plaća spremljene.");
      } else {
        toast.info("U Supabase modu postavke se spremaju u bazu.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Greška pri spremanju.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Postavke plaća</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Automatski obračun plaća
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Automatski obračun</Label>
              <p className="text-sm text-slate-500">Uključi automatski mjesečni obračun plaća</p>
            </div>
            <Switch
              checked={placaAuto}
              onCheckedChange={setPlacaAuto}
              disabled={!useSupabase}
            />
          </div>

          <div className="space-y-2">
            <Label>Dan obračuna u mjesecu (1–28)</Label>
            <input
              type="number"
              min={1}
              max={28}
              value={danObracuna}
              onChange={(e) => setDanObracuna(Number(e.target.value) || 1)}
              className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={!useSupabase}
            />
            <p className="text-sm text-slate-500">
              Svaki mjesec na ovaj dan sustav automatski obračunava plaće.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Dan isplate (za JOPPD rok)</Label>
            <input
              type="number"
              min={1}
              max={28}
              value={danIsplate}
              onChange={(e) => setDanIsplate(Number(e.target.value) || 15)}
              className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={!useSupabase}
            />
          </div>

          {useSupabase && (
            <>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <strong>Sljedeći automatski obračun:</strong> {nextRunDate(danObracuna)}
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Spremanje…" : "Spremi postavke"}
              </Button>
            </>
          )}
          {!useSupabase && (
            <p className="text-sm text-slate-500">
              Za automatski obračun koristite Supabase i postavite cron job na /api/cron/auto-place.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
