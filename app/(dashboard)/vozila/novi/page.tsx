"use client";

import { useCompany } from "@/contexts/CompanyContext";
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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NovoVoziloPage() {
  const router = useRouter();
  const { companyId, useSupabase } = useCompany();
  const [saving, setSaving] = useState(false);
  const [naziv, setNaziv] = useState("");
  const [registracija, setRegistracija] = useState("");
  const [marka, setMarka] = useState("");
  const [model, setModel] = useState("");
  const [godina, setGodina] = useState("");
  const [datumNabave, setDatumNabave] = useState("");
  const [nabavnaVrijednost, setNabavnaVrijednost] = useState("");
  const [poreznoPriznato, setPoreznoPriznato] = useState<50 | 100>(50);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !useSupabase) {
      toast.error("Odaberite tvrtku.");
      return;
    }
    if (!naziv.trim() || !registracija.trim()) {
      toast.error("Naziv i registracija su obavezni.");
      return;
    }
    setSaving(true);
    try {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije dostupan");
      const { error } = await supabase.from("vozila").insert({
        company_id: companyId,
        naziv: naziv.trim(),
        registracija: registracija.trim().toUpperCase(),
        marka: marka.trim() || null,
        model: model.trim() || null,
        godina: godina ? parseInt(godina, 10) : null,
        datum_nabave: datumNabave || null,
        nabavna_vrijednost: nabavnaVrijednost ? parseFloat(nabavnaVrijednost) : null,
        porezno_priznato: poreznoPriznato,
        aktivno: true,
      });
      if (error) throw error;
      toast.success("Vozilo dodano.");
      router.push("/vozila");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška pri spremanju.");
    } finally {
      setSaving(false);
    }
  };

  if (!useSupabase) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Vozila zahtijevaju Supabase.</p>
        <Button asChild className="mt-4"><Link href="/vozila">Natrag</Link></Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vozila"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Novo vozilo</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Podaci vozila</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Naziv *</Label>
                <Input value={naziv} onChange={(e) => setNaziv(e.target.value)} placeholder="npr. Službeni auto" />
              </div>
              <div>
                <Label>Registracija *</Label>
                <Input value={registracija} onChange={(e) => setRegistracija(e.target.value)} placeholder="npr. 5-Z-12345" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Marka</Label>
                <Input value={marka} onChange={(e) => setMarka(e.target.value)} placeholder="npr. VW" />
              </div>
              <div>
                <Label>Model</Label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="npr. Passat" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Godina</Label>
                <Input type="number" min={1990} max={2030} value={godina} onChange={(e) => setGodina(e.target.value)} placeholder="2020" />
              </div>
              <div>
                <Label>Datum nabave</Label>
                <Input type="date" value={datumNabave} onChange={(e) => setDatumNabave(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Nabavna vrijednost (€)</Label>
                <Input type="number" step={0.01} min={0} value={nabavnaVrijednost} onChange={(e) => setNabavnaVrijednost(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Porezno priznato</Label>
                <Select value={String(poreznoPriznato)} onValueChange={(v) => setPoreznoPriznato(v === "100" ? 100 : 50)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="100">100%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}>{saving ? "Spremanje…" : "Spremi"}</Button>
              <Button type="button" variant="outline" asChild><Link href="/vozila">Odustani</Link></Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
