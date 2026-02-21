"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useCompany } from "@/contexts/CompanyContext";
import { useRadnici } from "@/hooks/useRadnici";
import { usePlace, useAddPlaca } from "@/hooks/usePlace";
import { useTemeljnice, useAddTemeljnica } from "@/hooks/useTemeljnice";
import { useMockStore } from "@/lib/mock-db";
import { buildTemeljnicaFromPlaca } from "@/lib/auto-temeljnica";
import { izracunaj_placu } from "@/lib/accounting/place";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function ObracunPlacePage() {
  const { companyId, useSupabase } = useCompany();
  const radniciSupabase = useRadnici(companyId);
  const radniciMock = useMockStore((s) => s.getRadnici(s.currentCompanyId ?? ""));
  const radnici = useSupabase ? (radniciSupabase.data ?? []) : radniciMock;

  const placeSupabase = usePlace(companyId);
  const placeMock = useMockStore((s) => s.getPlace(s.currentCompanyId ?? ""));
  const placeList = useSupabase ? (placeSupabase.data ?? []) : placeMock;

  const addSupabase = useAddPlaca(companyId);
  const addMock = useMockStore((s) => s.addPlaca);
  const temeljniceQuery = useTemeljnice(companyId);
  const addTemeljnica = useAddTemeljnica(companyId);

  const [periodOd, setPeriodOd] = useState("");
  const [periodDo, setPeriodDo] = useState("");
  const [selectedRadnikId, setSelectedRadnikId] = useState("");
  const [bruto, setBruto] = useState("");

  const radnik = radnici.find((r) => r.id === selectedRadnikId);
  const brutoVal = parseFloat(String(bruto).replace(",", ".")) || 0;

  const obracun = useMemo(() => {
    if (brutoVal <= 0) return null;
    return izracunaj_placu({
      bruto: brutoVal,
      koeficijent_odbitka: radnik ? Number(radnik.koeficijent_osobnog_odbitka ?? 1) : 1,
      opcina: radnik?.opcina_placanja_poreza ?? "",
      ima_drugi_stup: Boolean(radnik?.ima_drugi_mirovinki_stup),
    });
  }, [brutoVal, radnik]);

  const doprinosiIz = obracun?.doprinosi_iz ?? 0;
  const dohodak = obracun?.dohodak ?? 0;
  const osobni = obracun?.osobni_odbitak ?? 0;
  const poreznaOsnovica = obracun?.porezna_osnovica ?? 0;
  const porez = obracun ? obracun.porez + obracun.prirez : 0;
  const neto = obracun?.neto ?? 0;
  const doprinosiNa = obracun?.doprinosi_na ?? 0;
  const ukupniTrosak = obracun?.ukupni_trosak ?? 0;

  const handleSpremi = async () => {
    if (!selectedRadnikId || !periodOd || !periodDo || brutoVal <= 0 || !obracun) {
      toast.error("Odaberite radnika, period i unesite bruto.");
      return;
    }
    const payload = {
      company_id: companyId!,
      radnik_id: selectedRadnikId,
      period_od: periodOd,
      period_do: periodDo,
      bruto: brutoVal,
      doprinosi_iz_place: obracun.doprinosi_iz,
      dohodak: obracun.dohodak,
      osobni_odbitak: obracun.osobni_odbitak,
      porezna_osnovica: obracun.porezna_osnovica,
      porez_i_prirez: obracun.porez + obracun.prirez,
      neto: obracun.neto,
      doprinosi_na_placu: obracun.doprinosi_na,
      ukupni_trosak: obracun.ukupni_trosak,
      joppd_poslan: false,
    };
    try {
      if (useSupabase) {
        const created = await addSupabase.mutateAsync(payload);
        if (companyId) {
          const temList = temeljniceQuery.data ?? [];
          const tPayload = buildTemeljnicaFromPlaca(companyId, created, temList);
          await addTemeljnica.mutateAsync(tPayload);
        }
        toast.success("Obračun spremljen. Temeljnica kreirana.");
      } else {
        addMock(payload);
        toast.success("Obračun spremljen.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška.");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/place">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Obračun plaća</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Novi obračun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Radnik</Label>
              <select
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={selectedRadnikId}
                onChange={(e) => {
                  setSelectedRadnikId(e.target.value);
                  const r = radnici.find((x) => x.id === e.target.value);
                  if (r?.bruto_placa) setBruto(String(r.bruto_placa));
                }}
              >
                <option value="">— Odaberi radnika —</option>
                {radnici.map((r) => (
                  <option key={r.id} value={r.id}>{r.ime} {r.prezime}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Period od</Label>
                <Input type="date" value={periodOd} onChange={(e) => setPeriodOd(e.target.value)} />
              </div>
              <div>
                <Label>Period do</Label>
                <Input type="date" value={periodDo} onChange={(e) => setPeriodDo(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Bruto (EUR)</Label>
              <Input type="number" step="0.01" value={bruto} onChange={(e) => setBruto(e.target.value)} />
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-sm">
              <p>Dohodak (bruto - doprinosi): {formatCurrency(dohodak)}</p>
              <p>Osobni odbitak: {formatCurrency(osobni)}</p>
              <p>Porez i prirez: {formatCurrency(porez)}</p>
              <p className="font-semibold text-green-600 pt-2">Neto: {formatCurrency(neto)}</p>
              <p className="pt-2">Ukupni trošak poslodavca: {formatCurrency(ukupniTrosak)}</p>
            </div>
            <Button onClick={handleSpremi} disabled={addSupabase.isPending && useSupabase}>Spremi obračun</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Povijest obračuna</CardTitle>
          </CardHeader>
          <CardContent>
            {placeList.length === 0 ? (
              <p className="text-slate-500 text-sm">Nema spremljenih obračuna.</p>
            ) : (
              <ul className="space-y-2">
                {placeList.slice(0, 15).map((p) => {
                  const r = radnici.find((x) => x.id === p.radnik_id);
                  return (
                    <li key={p.id} className="flex justify-between rounded border border-slate-100 p-2 text-sm">
                      <span>{r ? `${r.ime} ${r.prezime}` : "—"} • {formatDate(p.period_od)} – {formatDate(p.period_do)}</span>
                      <span className="font-medium">{formatCurrency(p.neto ?? 0)} neto</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
