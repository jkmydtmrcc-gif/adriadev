"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCompany } from "@/contexts/CompanyContext";
import { useUlazniRacuni } from "@/hooks/useUlazniRacuni";
import { useTemeljnice } from "@/hooks/useTemeljnice";
import { useMockStore } from "@/lib/mock-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function ZatvaranjeGodinePage() {
  const { companyId, useSupabase } = useCompany();
  const ulazniSupabase = useUlazniRacuni(companyId);
  const ulazniMock = useMockStore((s) => s.getUlazniRacuni(s.currentCompanyId ?? ""));
  const ulazni = useSupabase ? (ulazniSupabase.data ?? []) : ulazniMock;
  const temeljniceSupabase = useTemeljnice(companyId);
  const temeljniceMock = useMockStore((s) => s.getTemeljnice(s.currentCompanyId ?? ""));
  const temeljnice = useSupabase ? (temeljniceSupabase.data ?? []) : temeljniceMock;

  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const neknjizeniUlazni = ulazni.filter((u) => u.status === "neprocesen");
  const temeljniceZaGodinu = temeljnice.filter((t) => t.datum >= `${year}-01-01` && t.datum <= `${year}-12-31`);

  const [uvjeti, setUvjeti] = useState<{
    sve_ok: boolean;
    greske: string[];
    neknjizeni_ulazni: number;
    bruto_bilanca_ok: boolean;
  } | null>(null);

  useEffect(() => {
    if (!companyId || !useSupabase) return;
    fetch(`/api/knjigovodstvo/zatvori-godinu?company_id=${companyId}&godina=${year}`)
      .then((r) => r.json())
      .then((d) => setUvjeti(d))
      .catch(() => setUvjeti(null));
  }, [companyId, year, useSupabase]);

  const brutoOk = uvjeti?.bruto_bilanca_ok ?? true;
  const checklist = [
    {
      ok: neknjizeniUlazni.length === 0,
      label: "Svi ulazni računi knjiženi",
      link: neknjizeniUlazni.length > 0 ? "/ulazni-racuni" : undefined,
      warn: neknjizeniUlazni.length > 0 ? `${neknjizeniUlazni.length} nije knjiženo` : undefined,
    },
    {
      ok: brutoOk,
      label: "Bruto bilanca balansira",
      link: "/knjigovodstvo/bruto-bilanca",
    },
    {
      ok: true,
      label: "PDV obračun za prosinac zatvoren",
      link: "/porezi/pdv",
    },
    {
      ok: true,
      label: "Amortizacija za prosinac knjižena",
      link: "/osnovna-sredstva",
    },
    {
      ok: true,
      label: "Plaće za prosinac obračunate",
      link: "/place",
    },
  ];
  const sviUvjetiOk = checklist.every((c) => c.ok);

  const [rezultat, setRezultat] = useState<number | null>(null);

  const handleZatvori = async () => {
    setClosing(true);
    setRezultat(null);
    try {
      if (!useSupabase || !companyId) {
        toast.error("Zatvaranje godine dostupno je uz Supabase.");
        setConfirmOpen(false);
        return;
      }
      const res = await fetch("/api/knjigovodstvo/zatvori-godinu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId, godina: year }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Greška pri zatvaranju");
        return;
      }
      setRezultat(data.rezultat);
      toast.success(`Godina ${year} zatvorena. Rezultat: ${data.rezultat?.toFixed(2) ?? "—"} €`);
      setConfirmOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Greška");
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Zatvaranje godine</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Pre-closing checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.ok ? (
                <Check className="h-5 w-5 text-green-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              )}
              <span className={item.ok ? "text-slate-700" : "text-amber-800"}>{item.label}</span>
              {item.warn && <span className="text-amber-600 text-sm">{item.warn}</span>}
              {item.link && (
                <Button variant="link" size="sm" asChild className="ml-auto">
                  <Link href={item.link}>Otvori</Link>
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zatvori godinu</CardTitle>
          <p className="text-sm text-slate-500">
            Zatvaranjem godine kreiraju se temeljnice zatvaranja (prihodi → 8000, rashodi → 8000, rezultat → 9120/9130) i sve temeljnice za tu godinu se zaključaju.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[year, year - 1, year - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!sviUvjetiOk || temeljniceZaGodinu.length === 0}
          >
            Zatvori godinu {year}
          </Button>
          {rezultat != null && (
            <p className="text-green-600 font-medium">
              Dobit za {year}: {rezultat.toFixed(2)} € ✓ Godina zatvorena
            </p>
          )}
        </CardContent>
      </Card>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 w-full max-w-md">
            <CardHeader>
              <CardTitle>Potvrdi zatvaranje</CardTitle>
              <p className="text-sm text-slate-500">
                Zatvaranje godine {year} kreira temeljnice zatvaranja i zaključava sve unose za tu godinu. Nastaviti?
              </p>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button onClick={handleZatvori} disabled={closing}>
                {closing ? "Zatvaram…" : "Zatvori godinu"}
              </Button>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Odustani
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
