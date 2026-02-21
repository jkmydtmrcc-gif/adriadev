"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StavkeEditor, type StavkaRow } from "./StavkeEditor";
import { useCompany } from "@/contexts/CompanyContext";
import { useRacuniData, useCreateRacunMutation } from "@/hooks/useRacuniData";
import { useKontaktiData } from "@/hooks/useKontaktiData";
import { useArtikliData } from "@/hooks/useArtikliData";
import { useTemeljnice, useAddTemeljnica } from "@/hooks/useTemeljnice";
import { generirajBrojRacuna } from "@/lib/broj-racuna";
import { buildTemeljnicaFromRacun } from "@/lib/auto-temeljnica";
import { addDays, format } from "date-fns";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const VALUTE = [
  { value: "EUR", label: "EUR" },
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
  { value: "CHF", label: "CHF" },
];

const NACIN_PLACANJA = [
  { value: "transakcijski_racun", label: "Transakcijski račun" },
  { value: "gotovina", label: "Gotovina" },
  { value: "kartica", label: "Kartica" },
  { value: "ostalo", label: "Ostalo" },
];

export function RacunForm() {
  const router = useRouter();
  const { companyId: currentCompanyId, useSupabase } = useCompany();
  const { racuni } = useRacuniData();
  const { kontakti } = useKontaktiData();
  const { artikli } = useArtikliData();
  const createRacun = useCreateRacunMutation();
  const temeljniceQuery = useTemeljnice(currentCompanyId);
  const addTemeljnica = useAddTemeljnica(currentCompanyId);
  const kupci = kontakti.filter((k) => k.tip === "kupac" || k.tip === "oboje");

  const [broj_racuna, setBrojRacuna] = useState("");
  const [kontakt_id, setKontaktId] = useState("");
  const [datum_izdavanja, setDatumIzdavanja] = useState(format(new Date(), "yyyy-MM-dd"));
  const [datum_valute, setDatumValute] = useState(
    format(addDays(new Date(), 15), "yyyy-MM-dd")
  );
  const [datum_isporuke, setDatumIsporuke] = useState("");
  const [nacin_placanja, setNacinPlacanja] = useState("transakcijski_racun");
  const [napomena, setNapomena] = useState("");
  const [valuta, setValuta] = useState("EUR");
  const [spremiIzdaj, setSpremiIzdaj] = useState(false);
  const [stavke, setStavke] = useState<StavkaRow[]>(() => [
    {
      id: crypto.randomUUID?.() ?? "1",
      naziv: "",
      kolicina: 1,
      jedinica_mjere: "kom",
      cijena_bez_pdv: 0,
      pdv_stopa: 25,
    },
  ]);

  const { data: tecajData } = useQuery({
    queryKey: ["hnb-tecaj", valuta, datum_izdavanja],
    queryFn: async () => {
      const res = await fetch(`/api/hnb/tecaj?valuta=${valuta}&datum=${datum_izdavanja}`);
      const j = await res.json();
      return j as { tecaj: number | null };
    },
    enabled: valuta !== "EUR",
  });
  const tecaj = valuta === "EUR" ? 1 : (tecajData?.tecaj ?? null);

  useEffect(() => {
    const broj = generirajBrojRacuna(racuni, new Date().getFullYear());
    setBrojRacuna(broj);
  }, [racuni]);

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

    const status = spremiIzdaj ? ("izdan" as const) : ("draft" as const);
    const tecajNum = valuta === "EUR" ? 1 : (tecaj ?? 1);
    const iznosEur = valuta === "EUR" ? ukupno.ukupno_s_pdv : ukupno.ukupno_s_pdv * tecajNum;
    const racunPayload = {
      company_id: currentCompanyId!,
      kontakt_id,
      broj_racuna,
      datum_izdavanja,
      datum_valute,
      datum_isporuke: datum_isporuke || undefined,
      status,
      tip: "racun" as const,
      nacin_placanja,
      napomena: napomena || undefined,
      ukupno_bez_pdv: ukupno.ukupno_bez_pdv,
      ukupno_pdv: ukupno.ukupno_pdv,
      ukupno_s_pdv: ukupno.ukupno_s_pdv,
      placeno: 0,
      valuta,
      tecaj: tecajNum,
      iznos_eur: Math.round(iznosEur * 100) / 100,
    };
    const stavkePayload = validStavke.map((s, i) => ({
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
    }));
    const created = await createRacun.mutateAsync({ racun: racunPayload, stavke: stavkePayload });
    if (useSupabase && status === "izdan" && currentCompanyId) {
      const list = temeljniceQuery.data ?? [];
      const payload = buildTemeljnicaFromRacun(currentCompanyId, created, list);
      await addTemeljnica.mutateAsync(payload);
    }
    toast.success(status === "izdan" ? "Račun je izdan. Temeljnica kreirana." : "Račun je spremljen.");
    router.push(`/racuni/${created.id}`);
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
                  <option key={k.id} value={k.id}>
                    {k.naziv}
                  </option>
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
              <Label>Broj računa</Label>
              <Input
                value={broj_racuna}
                onChange={(e) => setBrojRacuna(e.target.value)}
                placeholder="2024-001"
              />
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
              <Label>Datum isporuke (opcionalno)</Label>
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
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Napomena</Label>
              <Input
                value={napomena}
                onChange={(e) => setNapomena(e.target.value)}
                placeholder="Opcionalno"
              />
            </div>
            <div>
              <Label>Valuta</Label>
              <select
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={valuta}
                onChange={(e) => setValuta(e.target.value)}
              >
                {VALUTE.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
              {valuta !== "EUR" && (
                <p className="mt-1 text-xs text-slate-500">
                  Tečaj ({datum_izdavanja}): {tecaj != null ? `1 ${valuta} = ${tecaj.toFixed(4)} EUR` : "Učitavanje…"}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <StavkeEditor
            stavke={stavke}
            artikli={artikli}
            onChange={setStavke}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <div className="flex flex-col gap-2">
          <div className="text-sm text-slate-600">
            Ukupno bez PDV: <strong>{ukupno.ukupno_bez_pdv.toFixed(2)} {valuta}</strong> •
            PDV: <strong>{ukupno.ukupno_pdv.toFixed(2)} {valuta}</strong> •
            Ukupno s PDV: <strong>{ukupno.ukupno_s_pdv.toFixed(2)} {valuta}</strong>
            {valuta !== "EUR" && tecaj != null && (
              <> • Iznos u EUR: <strong>{(ukupno.ukupno_s_pdv * tecaj).toFixed(2)} €</strong></>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={spremiIzdaj}
              onChange={(e) => setSpremiIzdaj(e.target.checked)}
              className="rounded border-slate-300"
            />
            Spremi i izdaj račun (automatski kreira temeljnicu)
          </label>
        </div>
        <Button type="submit" disabled={createRacun.isPending}>
          {spremiIzdaj ? "Spremi i izdaj" : "Spremi kao nacrt"}
        </Button>
      </div>
    </form>
  );
}
