"use client";

import { useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useOsnovnaSredstva, useAddOsnovnoSredstvo } from "@/hooks/useOsnovnaSredstva";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Building2, Plus, Play } from "lucide-react";
import { toast } from "sonner";

const MJESIECI = ["siječanj", "veljača", "ožujak", "travanj", "svibanj", "lipanj", "srpanj", "kolovoz", "rujan", "listopad", "studeni", "prosinac"];

function godisnjaAmortizacija(nabavna: number, stopa: number): number {
  return Math.round((nabavna * (stopa / 100)) * 100) / 100;
}

function mjesecnaAmortizacija(godisnja: number): number {
  return Math.round((godisnja / 12) * 100) / 100;
}

export default function OsnovnaSredstvaPage() {
  const { companyId, useSupabase } = useCompany();
  const { data: list = [], isLoading } = useOsnovnaSredstva(companyId);
  const addMutation = useAddOsnovnoSredstvo(companyId);

  const [showForm, setShowForm] = useState(false);
  const [naziv, setNaziv] = useState("");
  const [datumNabave, setDatumNabave] = useState(new Date().toISOString().slice(0, 10));
  const [nabavna, setNabavna] = useState("");
  const [stopa, setStopa] = useState("20");
  const [konto, setKonto] = useState("0280");
  const [opis, setOpis] = useState("");
  const [amortPeriod, setAmortPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [amortModalOpen, setAmortModalOpen] = useState(false);
  const [amortRunning, setAmortRunning] = useState(false);

  const aktivna = list.filter((s) => s.aktivno);
  const ukupnaVrijednost = aktivna.reduce((a, s) => a + Number(s.ostatna_vrijednost ?? s.nabavna_vrijednost), 0);
  const ukupnaAmortizacijaYTD = aktivna.reduce((a, s) => {
    const g = godisnjaAmortizacija(Number(s.nabavna_vrijednost), Number(s.stopa_amortizacije));
    return a + g;
  }, 0);

  const mjesecnaUkupno = aktivna.reduce((a, s) => {
    const g = godisnjaAmortizacija(Number(s.nabavna_vrijednost), Number(s.stopa_amortizacije));
    return a + mjesecnaAmortizacija(g);
  }, 0);

  const amortPeriodLabel = (() => {
    const [y, m] = amortPeriod.split("-").map(Number);
    return `${MJESIECI[m - 1]} ${y}.`;
  })();

  const handlePokreniAmortizaciju = async () => {
    if (!companyId) return;
    setAmortRunning(true);
    try {
      const res = await fetch("/api/osnovna-sredstva/amortizacija", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId, period: amortPeriod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Greška");
      toast.success(`Amortizacija za ${amortPeriodLabel} knjižena ✓ Ukupno: ${data.ukupno?.toFixed(2) ?? "0"} €`);
      setAmortModalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Greška");
    } finally {
      setAmortRunning(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(nabavna.replace(",", "."));
    if (!naziv.trim() || isNaN(v) || v <= 0) {
      toast.error("Naziv i nabavna vrijednost su obavezni.");
      return;
    }
    if (!companyId) return;
    try {
      await addMutation.mutateAsync({
        company_id: companyId,
        naziv: naziv.trim(),
        opis: opis.trim() || undefined,
        datum_nabave: datumNabave,
        nabavna_vrijednost: v,
        ostatna_vrijednost: v,
        stopa_amortizacije: parseFloat(stopa) || 20,
        metoda: "linearna",
        konto_sredstva: konto.trim() || "0280",
        konto_amortizacije: "4300",
        konto_ispravka: "0290",
        aktivno: true,
      });
      toast.success("Osnovno sredstvo dodano.");
      setShowForm(false);
      setNaziv("");
      setNabavna("");
      setOpis("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Greška.");
    }
  };

  if (!useSupabase) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Osnovna sredstva</h1>
        <Card>
          <CardContent className="py-6">
            <p className="text-slate-600">
              Osnovna sredstva zahtijevaju Supabase bazu. Dodajte migraciju 002_osnovna_sredstva.sql u Supabase i koristite povezanu bazu.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Osnovna sredstva</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setAmortModalOpen(true)}
            disabled={aktivna.length === 0}
          >
            <Play className="h-4 w-4" />
            Pokreni amortizaciju za [{amortPeriodLabel}]
          </Button>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo sredstvo
          </Button>
        </div>
      </div>

      {amortModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 w-full max-w-md">
            <CardHeader>
              <CardTitle>Potvrdi amortizaciju</CardTitle>
              <p className="text-sm text-slate-500">
                Za period <strong>{amortPeriodLabel}</strong>: {aktivna.length} sredstava, ukupno mjesečno {formatCurrency(mjesecnaUkupno)}. Kreirat će se temeljnice za svako sredstvo.
              </p>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button onClick={handlePokreniAmortizaciju} disabled={amortRunning}>
                {amortRunning ? "Knjiženje…" : "Pokreni amortizaciju"}
              </Button>
              <Button variant="outline" onClick={() => setAmortModalOpen(false)}>
                Odustani
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ukupna vrijednost imovine</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(ukupnaVrijednost)}</p>
            <p className="text-sm text-slate-500">Ostatak vrijednosti aktivnih sredstava</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ukupna amortizacija (godišnja)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(ukupnaAmortizacijaYTD)}</p>
            <p className="text-sm text-slate-500">Zbroj godišnjih iznosa po aktivnim sredstvima</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Dodaj osnovno sredstvo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <Label>Naziv *</Label>
                <Input value={naziv} onChange={(e) => setNaziv(e.target.value)} required />
              </div>
              <div>
                <Label>Datum nabave *</Label>
                <Input type="date" value={datumNabave} onChange={(e) => setDatumNabave(e.target.value)} />
              </div>
              <div>
                <Label>Nabavna vrijednost (€) *</Label>
                <Input type="number" step="0.01" value={nabavna} onChange={(e) => setNabavna(e.target.value)} required />
              </div>
              <div>
                <Label>Stopa amortizacije (%)</Label>
                <Input value={stopa} onChange={(e) => setStopa(e.target.value)} placeholder="20" />
              </div>
              <div>
                <Label>Konto sredstva</Label>
                <Input value={konto} onChange={(e) => setKonto(e.target.value)} placeholder="0280" />
              </div>
              <div className="sm:col-span-2">
                <Label>Opis</Label>
                <Input value={opis} onChange={(e) => setOpis(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={addMutation.isPending}>Spremi</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Odustani</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista osnovnih sredstava</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-slate-500">Učitavanje…</p>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">Nema osnovnih sredstava.</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>Dodaj prvo</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Naziv</th>
                    <th className="pb-3 font-medium">Datum nabave</th>
                    <th className="pb-3 font-medium text-right">Nabavna</th>
                    <th className="pb-3 font-medium text-right">Ostatak</th>
                    <th className="pb-3 font-medium">Stopa</th>
                    <th className="pb-3 font-medium text-right">God. amort.</th>
                    <th className="pb-3 font-medium text-right">Mj. amort.</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => {
                    const g = godisnjaAmortizacija(Number(s.nabavna_vrijednost), Number(s.stopa_amortizacije));
                    const m = mjesecnaAmortizacija(g);
                    return (
                      <tr key={s.id} className="border-b border-slate-100">
                        <td className="py-3 font-medium">{s.naziv}</td>
                        <td className="py-3">{formatDate(s.datum_nabave)}</td>
                        <td className="py-3 text-right">{formatCurrency(s.nabavna_vrijednost)}</td>
                        <td className="py-3 text-right">{formatCurrency(s.ostatna_vrijednost)}</td>
                        <td className="py-3">{s.stopa_amortizacije}%</td>
                        <td className="py-3 text-right">{formatCurrency(g)}</td>
                        <td className="py-3 text-right">{formatCurrency(m)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
