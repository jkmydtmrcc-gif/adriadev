"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StavkeEditor, type StavkaRow } from "./StavkeEditor";
import { useMockStore } from "@/lib/mock-db";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Racun } from "@/lib/types";

const NACIN_PLACANJA = [
  { value: "transakcijski_racun", label: "Transakcijski račun" },
  { value: "gotovina", label: "Gotovina" },
  { value: "kartica", label: "Kartica" },
  { value: "ostalo", label: "Ostalo" },
];

export function RacunFormEdit({ racun: initial }: { racun: Racun }) {
  const router = useRouter();
  const currentCompanyId = useMockStore((s) => s.currentCompanyId)!;
  const kontakti = useMockStore((s) =>
    s.kontakti.filter(
      (k) => k.company_id === currentCompanyId && (k.tip === "kupac" || k.tip === "oboje")
    )
  );
  const artikli = useMockStore((s) => s.getArtikli(currentCompanyId));
  const updateRacun = useMockStore((s) => s.updateRacun);
  const setRacunStavke = useMockStore((s) => s.setRacunStavke);

  const [kontakt_id, setKontaktId] = useState(initial.kontakt_id);
  const [datum_izdavanja, setDatumIzdavanja] = useState(initial.datum_izdavanja);
  const [datum_valute, setDatumValute] = useState(initial.datum_valute);
  const [datum_isporuke, setDatumIsporuke] = useState(initial.datum_isporuke ?? "");
  const [nacin_placanja, setNacinPlacanja] = useState(initial.nacin_placanja);
  const [napomena, setNapomena] = useState(initial.napomena ?? "");
  const [stavke, setStavke] = useState<StavkaRow[]>(() =>
    (initial.stavke ?? []).map((s) => ({
      id: s.id,
      artikl_id: s.artikl_id,
      naziv: s.naziv,
      opis: s.opis,
      kolicina: s.kolicina,
      jedinica_mjere: s.jedinica_mjere ?? "kom",
      cijena_bez_pdv: s.cijena_bez_pdv,
      pdv_stopa: s.pdv_stopa,
      pdv_iznos: s.pdv_iznos,
      ukupno: s.ukupno,
    }))
  );

  useEffect(() => {
    if (stavke.length === 0 && (initial.stavke?.length ?? 0) > 0) {
      setStavke(
        (initial.stavke ?? []).map((s) => ({
          id: s.id,
          artikl_id: s.artikl_id,
          naziv: s.naziv,
          opis: s.opis,
          kolicina: s.kolicina,
          jedinica_mjere: s.jedinica_mjere ?? "kom",
          cijena_bez_pdv: s.cijena_bez_pdv,
          pdv_stopa: s.pdv_stopa,
          pdv_iznos: s.pdv_iznos,
          ukupno: s.ukupno,
        }))
      );
    }
  }, [initial.stavke]);

  const ukupno = (() => {
    let bez = 0,
      pdv = 0;
    stavke.forEach((s) => {
      const osn = s.kolicina * s.cijena_bez_pdv;
      bez += osn;
      pdv += osn * (s.pdv_stopa / 100);
    });
    return {
      ukupno_bez_pdv: Math.round(bez * 100) / 100,
      ukupno_pdv: Math.round(pdv * 100) / 100,
      ukupno_s_pdv: Math.round((bez + pdv) * 100) / 100,
    };
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validStavke = stavke.filter((s) => s.naziv.trim());
    if (validStavke.length === 0) {
      toast.error("Dodaj barem jednu stavku.");
      return;
    }
    updateRacun(initial.id, {
      kontakt_id,
      datum_izdavanja,
      datum_valute,
      datum_isporuke: datum_isporuke || undefined,
      nacin_placanja,
      napomena: napomena || undefined,
      ukupno_bez_pdv: ukupno.ukupno_bez_pdv,
      ukupno_pdv: ukupno.ukupno_pdv,
      ukupno_s_pdv: ukupno.ukupno_s_pdv,
    });
    setRacunStavke(
      initial.id,
      validStavke.map((s, i) => ({
        artikl_id: s.artikl_id,
        naziv: s.naziv,
        opis: s.opis,
        kolicina: s.kolicina,
        jedinica_mjere: s.jedinica_mjere,
        cijena_bez_pdv: s.cijena_bez_pdv,
        pdv_stopa: s.pdv_stopa,
        pdv_iznos: Math.round(s.kolicina * s.cijena_bez_pdv * (s.pdv_stopa / 100) * 100) / 100,
        ukupno: Math.round(s.kolicina * s.cijena_bez_pdv * (1 + s.pdv_stopa / 100) * 100) / 100,
        konto_prihoda: "7500",
        redosljed: i,
      }))
    );
    toast.success("Račun je ažuriran.");
    router.push(`/racuni/${initial.id}`);
  };

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
              >
                {kontakti.map((k) => (
                  <option key={k.id} value={k.id}>{k.naziv}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Broj računa</Label>
              <Input value={initial.broj_racuna} disabled className="bg-slate-50" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Datum izdavanja</Label>
              <Input
                type="date"
                value={datum_izdavanja}
                onChange={(e) => setDatumIzdavanja(e.target.value)}
              />
            </div>
            <div>
              <Label>Datum valute</Label>
              <Input
                type="date"
                value={datum_valute}
                onChange={(e) => setDatumValute(e.target.value)}
              />
            </div>
            <div>
              <Label>Datum isporuke</Label>
              <Input
                type="date"
                value={datum_isporuke}
                onChange={(e) => setDatumIsporuke(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Način plaćanja</Label>
              <select
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={nacin_placanja}
                onChange={(e) => setNacinPlacanja(e.target.value)}
              >
                {NACIN_PLACANJA.map((n) => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Napomena</Label>
              <Input value={napomena} onChange={(e) => setNapomena(e.target.value)} />
            </div>
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
          Ukupno s PDV: <strong>{ukupno.ukupno_s_pdv.toFixed(2)} €</strong>
        </div>
        <Button type="submit">Spremi promjene</Button>
      </div>
    </form>
  );
}
