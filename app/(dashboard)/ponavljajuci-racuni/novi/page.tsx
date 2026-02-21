"use client";

import { useCompany } from "@/contexts/CompanyContext";
import { useKontaktiData } from "@/hooks/useKontaktiData";
import { getClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Stavka = { naziv: string; kolicina: number; cijena_bez_pdv: number; pdv_stopa: number };

function firstSljedeciDatum(dan: number, frekvencija: string): string {
  const d = new Date();
  const day = Math.min(dan, 28);
  if (frekvencija === "tjedni") {
    return d.toISOString().slice(0, 10);
  }
  d.setDate(day);
  if (d <= new Date()) {
    if (frekvencija === "mjesecni") d.setMonth(d.getMonth() + 1);
    else if (frekvencija === "kvartalni") d.setMonth(d.getMonth() + 3);
    else if (frekvencija === "godisnji") d.setFullYear(d.getFullYear() + 1);
  }
  return d.toISOString().slice(0, 10);
}

export default function NoviPonavljajuciRacunPage() {
  const router = useRouter();
  const { companyId, useSupabase } = useCompany();
  const { kontakti } = useKontaktiData();
  const [naziv, setNaziv] = useState("");
  const [kontaktId, setKontaktId] = useState("");
  const [frekvencija, setFrekvencija] = useState<"tjedni" | "mjesecni" | "kvartalni" | "godisnji">("mjesecni");
  const [danKreiranja, setDanKreiranja] = useState(1);
  const [autoSlanje, setAutoSlanje] = useState(false);
  const [stavke, setStavke] = useState<Stavka[]>([{ naziv: "", kolicina: 1, cijena_bez_pdv: 0, pdv_stopa: 25 }]);
  const [submitting, setSubmitting] = useState(false);

  const ukupnoSPdv = stavke.reduce((acc, s) => {
    const red = s.kolicina * s.cijena_bez_pdv;
    const pdv = red * (s.pdv_stopa / 100);
    return acc + red + pdv;
  }, 0);

  const addStavka = () => {
    setStavke((prev) => [...prev, { naziv: "", kolicina: 1, cijena_bez_pdv: 0, pdv_stopa: 25 }]);
  };

  const updateStavka = (i: number, part: Partial<Stavka>) => {
    setStavke((prev) => prev.map((s, j) => (j === i ? { ...s, ...part } : s)));
  };

  const removeStavka = (i: number) => {
    if (stavke.length <= 1) return;
    setStavke((prev) => prev.filter((_, j) => j !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !useSupabase) {
      toast.error("Odaberite tvrtku i koristite Supabase.");
      return;
    }
    if (!naziv.trim()) {
      toast.error("Naziv je obavezan.");
      return;
    }
    if (!kontaktId) {
      toast.error("Odaberite kupca (kontakt).");
      return;
    }
    const sljedeci = firstSljedeciDatum(danKreiranja, frekvencija);
    setSubmitting(true);
    try {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije dostupan");
      const { data, error } = await supabase
        .from("ponavljajuci_racuni")
        .insert({
          company_id: companyId,
          kontakt_id: kontaktId,
          naziv: naziv.trim(),
          frekvencija,
          dan_kreiranja: Math.min(28, Math.max(1, danKreiranja)),
          sljedeci_datum: sljedeci,
          aktivno: true,
          auto_slanje: autoSlanje,
          stavke,
          ukupno_s_pdv: Math.round(ukupnoSPdv * 100) / 100,
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Ponavljajući račun spremljen.");
      router.push("/ponavljajuci-racuni");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Greška pri spremanju.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!useSupabase) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Novi ponavljajući račun</h1>
        <p className="text-slate-500">Ponavljajući računi zahtijevaju Supabase.</p>
        <Button asChild className="mt-4"><Link href="/ponavljajuci-racuni">Natrag</Link></Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Novi ponavljajući račun</h1>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Osnovno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Naziv *</Label>
              <Input value={naziv} onChange={(e) => setNaziv(e.target.value)} placeholder="npr. Mjesečna pretplata" />
            </div>
            <div>
              <Label>Kupac (kontakt) *</Label>
              <Select value={kontaktId} onValueChange={setKontaktId}>
                <SelectTrigger><SelectValue placeholder="Odaberi kontakt" /></SelectTrigger>
                <SelectContent>
                  {kontakti.map((k) => (
                    <SelectItem key={k.id} value={k.id}>{k.naziv ?? k.ime ?? "—"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frekvencija</Label>
                <Select value={frekvencija} onValueChange={(v) => setFrekvencija(v as typeof frekvencija)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tjedni">Tjedni</SelectItem>
                    <SelectItem value="mjesecni">Mjesečni</SelectItem>
                    <SelectItem value="kvartalni">Kvartalni</SelectItem>
                    <SelectItem value="godisnji">Godišnji</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {frekvencija !== "tjedni" && (
                <div>
                  <Label>Dan kreiranja (1–28)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={danKreiranja}
                    onChange={(e) => setDanKreiranja(Number(e.target.value) || 1)}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto_slanje"
                checked={autoSlanje}
                onChange={(e) => setAutoSlanje(e.target.checked)}
              />
              <Label htmlFor="auto_slanje">Auto-slanje (email) kad se kreira račun</Label>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Stavke</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stavke.map((s, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2 rounded border border-slate-200 p-2">
                <Input
                  className="flex-1 min-w-[120px]"
                  placeholder="Naziv stavke"
                  value={s.naziv}
                  onChange={(e) => updateStavka(i, { naziv: e.target.value })}
                />
                <Input
                  type="number"
                  min={0}
                  step={1}
                  className="w-20"
                  value={s.kolicina}
                  onChange={(e) => updateStavka(i, { kolicina: Number(e.target.value) || 0 })}
                />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  className="w-24"
                  value={s.cijena_bez_pdv}
                  onChange={(e) => updateStavka(i, { cijena_bez_pdv: Number(e.target.value) || 0 })}
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  className="w-16"
                  value={s.pdv_stopa}
                  onChange={(e) => updateStavka(i, { pdv_stopa: Number(e.target.value) || 0 })}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeStavka(i)} disabled={stavke.length <= 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addStavka} className="gap-1">
              <Plus className="h-4 w-4" /> Dodaj stavku
            </Button>
            <p className="text-sm text-slate-600">Ukupno s PDV-om: {ukupnoSPdv.toFixed(2)} €</p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Spremanje…" : "Spremi"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/ponavljajuci-racuni">Odustani</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
