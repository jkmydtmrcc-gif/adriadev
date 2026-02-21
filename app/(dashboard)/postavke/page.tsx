"use client";

import { useState, useEffect } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useMockStore } from "@/lib/mock-db";
import { hasSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Settings, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function PostavkePage() {
  const { companies, companyId } = useCompany();
  const company = companies.find((c) => c.id === companyId);
  const updateMock = useMockStore((s) => s.updateCompany);
  const resetToSeed = useMockStore((s) => s.resetToSeed);
  const useSupabase = hasSupabase();

  const [naziv, setNaziv] = useState(company?.naziv ?? "");
  const [oib, setOib] = useState(company?.oib ?? "");
  const [adresa, setAdresa] = useState(company?.adresa ?? "");
  const [grad, setGrad] = useState(company?.grad ?? "");
  const [iban, setIban] = useState(company?.iban ?? "");
  useEffect(() => {
    if (company) {
      setNaziv(company.naziv);
      setOib(company.oib ?? "");
      setAdresa(company.adresa ?? "");
      setGrad(company.grad ?? "");
      setIban(company.iban ?? "");
    }
  }, [company]);

  const handleSave = () => {
    if (!companyId) return;
    if (!naziv.trim() || !oib.trim()) {
      toast.error("Naziv i OIB su obavezni.");
      return;
    }
    updateMock(companyId, { naziv: naziv.trim(), oib: oib.trim(), adresa: adresa || undefined, grad: grad || undefined, iban: iban || undefined });
    toast.success("Postavke spremljene.");
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Postavke</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Podaci tvrtke
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {useSupabase && (
            <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-600">
              U Supabase modu podatke tvrtke možete mijenjati u Supabase Dashboardu (tablica companies) ili dodati formu za ažuriranje.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Naziv tvrtke</Label>
              <Input value={naziv} onChange={(e) => setNaziv(e.target.value)} disabled={useSupabase} />
            </div>
            <div>
              <Label>OIB</Label>
              <Input value={oib} onChange={(e) => setOib(e.target.value.replace(/\D/g, "").slice(0, 11))} disabled={useSupabase} />
            </div>
            <div>
              <Label>Adresa</Label>
              <Input value={adresa} onChange={(e) => setAdresa(e.target.value)} disabled={useSupabase} />
            </div>
            <div>
              <Label>Grad</Label>
              <Input value={grad} onChange={(e) => setGrad(e.target.value)} disabled={useSupabase} />
            </div>
            <div>
              <Label>IBAN</Label>
              <Input value={iban} onChange={(e) => setIban(e.target.value)} disabled={useSupabase} />
            </div>
          </div>
          {!useSupabase && (
            <Button onClick={handleSave}>Spremi promjene</Button>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Plaće
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-600">
            Automatski obračun plaća, dan obračuna i dan isplate za JOPPD.
          </p>
          <Button variant="outline" asChild>
            <Link href="/postavke/place">Postavke plaća</Link>
          </Button>
        </CardContent>
      </Card>

      {!useSupabase && (
        <Card>
          <CardHeader>
            <CardTitle>Reset podataka</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-600">
              Vrati sve na početno stanje (demo tvrtka, 2 kontakta, 2 artikla). Svi računi, temeljnice i ostali podaci bit će obrisani.
            </p>
            <Button variant="outline" onClick={() => { resetToSeed(); window.location.href = "/dashboard"; }}>
              Reset na početne podatke
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
