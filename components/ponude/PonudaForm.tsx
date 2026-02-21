"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StavkeEditor, type StavkaRow } from "@/components/racuni/StavkeEditor";
import { useCompany } from "@/contexts/CompanyContext";
import { usePonudeData, useAddPonudaMutation } from "@/hooks/usePonudeData";
import { useKontaktiData } from "@/hooks/useKontaktiData";
import { useArtikliData } from "@/hooks/useArtikliData";
import { generirajBrojPonude } from "@/lib/broj-racuna";
import { addDays, format } from "date-fns";
import { toast } from "sonner";

export function PonudaForm() {
  const router = useRouter();
  const { companyId } = useCompany();
  const { ponude } = usePonudeData();
  const { kontakti } = useKontaktiData();
  const { artikli } = useArtikliData();
  const addPonuda = useAddPonudaMutation();
  const kupci = kontakti.filter((k) => k.tip === "kupac" || k.tip === "oboje");

  const [broj_ponude, setBrojPonude] = useState("");
  const [kontakt_id, setKontaktId] = useState("");
  const [datum, setDatum] = useState(format(new Date(), "yyyy-MM-dd"));
  const [datum_valjanosti, setDatumValjanosti] = useState(format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const [napomena, setNapomena] = useState("");
  const [uvjeti_placanja, setUvjetiPlacanja] = useState("");
  const [stavke, setStavke] = useState<StavkaRow[]>(() => [
    { id: crypto.randomUUID?.() ?? "1", naziv: "", kolicina: 1, jedinica_mjere: "kom", cijena_bez_pdv: 0, pdv_stopa: 25 },
  ]);

  useEffect(() => {
    setBrojPonude(generirajBrojPonude(ponude, new Date().getFullYear()));
  }, [ponude]);

  const ukupno = (() => {
    let bez = 0, pdv = 0;
    stavke.forEach((s) => {
      bez += s.kolicina * s.cijena_bez_pdv;
      pdv += s.kolicina * s.cijena_bez_pdv * (s.pdv_stopa / 100);
    });
    return {
      ukupno_bez_pdv: Math.round(bez * 100) / 100,
      ukupno_pdv: Math.round(pdv * 100) / 100,
      ukupno_s_pdv: Math.round((bez + pdv) * 100) / 100,
    };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kontakt_id) {
      toast.error("Odaberi kupca.");
      return;
    }
    const validStavke = stavke.filter((s) => s.naziv.trim());
    if (validStavke.length === 0) {
      toast.error("Dodaj barem jednu stavku.");
      return;
    }
    const payload = {
      ponuda: {
        company_id: companyId!,
        kontakt_id,
        broj_ponude,
        datum,
        datum_valjanosti: datum_valjanosti || undefined,
        status: "draft" as const,
        napomena: napomena || undefined,
        uvjeti_placanja: uvjeti_placanja || undefined,
        ukupno_bez_pdv: ukupno.ukupno_bez_pdv,
        ukupno_pdv: ukupno.ukupno_pdv,
        ukupno_s_pdv: ukupno.ukupno_s_pdv,
        valuta: "EUR",
      },
      stavke: validStavke.map((s, i) => ({
        artikl_id: s.artikl_id,
        naziv: s.naziv,
        opis: s.opis,
        kolicina: s.kolicina,
        jedinica_mjere: s.jedinica_mjere,
        cijena_bez_pdv: s.cijena_bez_pdv,
        pdv_stopa: s.pdv_stopa,
        pdv_iznos: Math.round(s.kolicina * s.cijena_bez_pdv * (s.pdv_stopa / 100) * 100) / 100,
        ukupno: Math.round(s.kolicina * s.cijena_bez_pdv * (1 + s.pdv_stopa / 100) * 100) / 100,
        redosljed: i,
      })),
    };
    try {
      const created = await addPonuda.mutateAsync(payload);
      toast.success("Ponuda spremljena.");
      router.push(`/ponude/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška.");
    }
  };

  const selectedKontakt = kupci.find((k) => k.id === kontakt_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Osnovni podaci</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Kupac</Label>
              <select
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={kontakt_id}
                onChange={(e) => setKontaktId(e.target.value)}
                required
              >
                <option value="">— Odaberi kupca —</option>
                {kupci.map((k) => (
                  <option key={k.id} value={k.id}>{k.naziv}</option>
                ))}
              </select>
              {selectedKontakt && (
                <p className="mt-1 text-xs text-slate-500">
                  {selectedKontakt.adresa}, {selectedKontakt.grad} {selectedKontakt.postanski_broj}
                  {selectedKontakt.oib && ` • OIB: ${selectedKontakt.oib}`}
                </p>
              )}
            </div>
            <div>
              <Label>Broj ponude</Label>
              <Input value={broj_ponude} onChange={(e) => setBrojPonude(e.target.value)} placeholder="P-2024-001" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Datum ponude</Label>
              <Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
            </div>
            <div>
              <Label>Valjana do</Label>
              <Input type="date" value={datum_valjanosti} onChange={(e) => setDatumValjanosti(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Uvjeti plaćanja</Label>
            <Input value={uvjeti_placanja} onChange={(e) => setUvjetiPlacanja(e.target.value)} placeholder="npr. 15 dana od prijema" />
          </div>
          <div>
            <Label>Napomena</Label>
            <Input value={napomena} onChange={(e) => setNapomena(e.target.value)} placeholder="Opcionalno" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <StavkeEditor stavke={stavke} artikli={artikli} onChange={setStavke} />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between border-t pt-6">
        <div className="text-sm text-slate-600">
          Ukupno bez PDV: <strong>{ukupno.ukupno_bez_pdv.toFixed(2)} €</strong> •
          PDV: <strong>{ukupno.ukupno_pdv.toFixed(2)} €</strong> •
          Ukupno s PDV: <strong>{ukupno.ukupno_s_pdv.toFixed(2)} €</strong>
        </div>
        <Button type="submit" disabled={addPonuda.isPending}>Spremi ponudu</Button>
      </div>
    </form>
  );
}
