"use client";

import { useState } from "react";
import Link from "next/link";
import { useCompany } from "@/contexts/CompanyContext";
import { useRadnici } from "@/hooks/useRadnici";
import { getClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const DNEVNICE_DOMACE = { puna: 13, pola: 6.5 };
const DNEVNICE_INOZEMNO: Record<string, number> = {
  Austrija: 58, Njemačka: 58, Italija: 58, Francuska: 58, Španjolska: 55,
  Slovenija: 45, Mađarska: 45, Češka: 45, "Bosna i Hercegovina": 35, Srbija: 35, "Crna Gora": 35,
  default_EU: 50, default_ostalo: 35,
};

export default function NoviPutniNalogPage() {
  const { companyId, useSupabase } = useCompany();
  const { data: radnici = [] } = useRadnici(companyId);
  const [step, setStep] = useState(1);
  const [radnikId, setRadnikId] = useState("");
  const [datumPolaska, setDatumPolaska] = useState(new Date().toISOString().slice(0, 10));
  const [datumPovratka, setDatumPovratka] = useState(new Date().toISOString().slice(0, 10));
  const [odrediste, setOdrediste] = useState("");
  const [svrha, setSvrha] = useState("");
  const [drzava, setDrzava] = useState("HR");
  const [prijevoz, setPrijevoz] = useState<"sluzbeni" | "privatni" | "javni">("privatni");
  const [ukupnoKm, setUkupnoKm] = useState("");
  const [brojDnevnica, setBrojDnevnica] = useState("");
  const [dnevnicaPoDanu, setDnevnicaPoDanu] = useState("");
  const [saving, setSaving] = useState(false);

  const iznosKm = (parseFloat(ukupnoKm.replace(",", ".")) || 0) * 0.3;
  const dnevnicaLookup = drzava === "HR" ? DNEVNICE_DOMACE.puna : (DNEVNICE_INOZEMNO[drzava] ?? DNEVNICE_INOZEMNO.default_EU);
  const dnevnicaIznos = dnevnicaPoDanu !== "" ? (parseFloat(dnevnicaPoDanu.replace(",", ".")) || 0) : dnevnicaLookup;
  const ukupnoDnevnice = (parseFloat(brojDnevnica.replace(",", ".")) || 0) * dnevnicaIznos;
  const ukupnoZaIsplatu = iznosKm + ukupnoDnevnice;

  const handleSave = async () => {
    if (!companyId || !useSupabase || !radnikId || !odrediste.trim() || !svrha.trim()) {
      toast.error("Ispunite obavezna polja (radnik, odredište, svrha).");
      return;
    }
    setSaving(true);
    try {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      const year = new Date().getFullYear();
      const { data: existing } = await supabase.from("putni_nalozi").select("broj_naloga").eq("company_id", companyId);
      const thisYear = (existing ?? []).filter((r: { broj_naloga?: string }) => String(r.broj_naloga ?? "").startsWith(String(year)));
      const redni = thisYear.length + 1;
      const broj_naloga = `PN-${new Date().getFullYear()}-${String(redni).padStart(3, "0")}`;
      const { error } = await supabase.from("putni_nalozi").insert({
        company_id: companyId,
        radnik_id: radnikId,
        broj_naloga,
        datum_polaska: datumPolaska,
        datum_povratka: datumPovratka,
        svrha: svrha.trim(),
        odrediste: odrediste.trim(),
        drzava,
        tip: drzava === "HR" ? "domace" : "inozemno",
        prijevoz,
        ukupno_km: parseFloat(ukupnoKm.replace(",", ".")) || null,
        iznos_km: iznosKm || 0,
        broj_dnevnica: parseFloat(brojDnevnica.replace(",", ".")) || 0,
        iznos_dnevnice: dnevnicaIznos,
        ukupno_dnevnice: ukupnoDnevnice,
        ukupno_za_isplatu: ukupnoZaIsplatu,
        status: "nacrt",
      });
      if (error) throw error;
      toast.success("Putni nalog kreiran.");
      window.location.href = "/putni-nalozi";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Greška");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/putni-nalozi"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Novi putni nalog</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Korak {step} od 3</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <Label>Radnik</Label>
                <select className="w-full rounded-md border px-3 py-2 mt-1" value={radnikId} onChange={(e) => setRadnikId(e.target.value)}>
                  <option value="">— Odaberi —</option>
                  {radnici.filter((r) => r.aktivan).map((r) => (
                    <option key={r.id} value={r.id}>{r.ime} {r.prezime}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Datum polaska</Label><Input type="date" value={datumPolaska} onChange={(e) => setDatumPolaska(e.target.value)} /></div>
                <div><Label>Datum povratka</Label><Input type="date" value={datumPovratka} onChange={(e) => setDatumPovratka(e.target.value)} /></div>
              </div>
              <div><Label>Odredište</Label><Input value={odrediste} onChange={(e) => setOdrediste(e.target.value)} placeholder="npr. Zagreb" /></div>
              <div><Label>Svrha</Label><Input value={svrha} onChange={(e) => setSvrha(e.target.value)} placeholder="Svrha putovanja" /></div>
              <div><Label>Država</Label><select className="w-full rounded-md border px-3 py-2 mt-1" value={drzava} onChange={(e) => setDrzava(e.target.value)}>
                <option value="HR">Hrvatska</option>
                <option value="AT">Austrija</option>
                <option value="DE">Njemačka</option>
                <option value="SI">Slovenija</option>
              </select></div>
              <Button onClick={() => setStep(2)}>Dalje</Button>
            </>
          )}
          {step === 2 && (
            <>
              <div><Label>Vrsta prijevoza</Label><select className="w-full rounded-md border px-3 py-2 mt-1" value={prijevoz} onChange={(e) => setPrijevoz(e.target.value as any)}>
                <option value="sluzbeni">Službeni</option>
                <option value="privatni">Privatni</option>
                <option value="javni">Javni</option>
              </select></div>
              {prijevoz === "privatni" && (
                <div><Label>Ukupno km</Label><Input type="number" step="0.01" value={ukupnoKm} onChange={(e) => setUkupnoKm(e.target.value)} /> <span className="text-sm text-slate-500">Iznos km (0,30 €): {iznosKm.toFixed(2)} €</span></div>
              )}
              <div>
                <Label>Dnevnica (€ po danu)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={dnevnicaPoDanu}
                  onChange={(e) => setDnevnicaPoDanu(e.target.value)}
                  placeholder={`Prema državi: ${dnevnicaLookup} €`}
                />
                <p className="text-xs text-slate-500 mt-1">Ako ostavite prazno, koristi se iznos prema državi ({drzava === "HR" ? "domaće " : ""}{dnevnicaLookup} €). Možete upisati drugi iznos.</p>
              </div>
              <div><Label>Broj dnevnica</Label><Input type="number" step="0.5" value={brojDnevnica} onChange={(e) => setBrojDnevnica(e.target.value)} /> <span className="text-sm text-slate-500">Ukupno dnevnice: {ukupnoDnevnice.toFixed(2)} €</span></div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>Natrag</Button>
                <Button onClick={() => setStep(3)}>Dalje</Button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <p className="text-sm text-slate-600">Ukupno za isplatu: <strong>{ukupnoZaIsplatu.toFixed(2)} €</strong></p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>Natrag</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? "Spremanje…" : "Kreiraj nalog"}</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
