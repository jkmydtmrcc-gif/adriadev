"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useRacunData, useUpdateRacunMutation } from "@/hooks/useRacuniData";
import { useCompany } from "@/contexts/CompanyContext";
import { useKontaktiData } from "@/hooks/useKontaktiData";
import { useTemeljnice, useAddTemeljnica } from "@/hooks/useTemeljnice";
import { buildTemeljnicaFromRacun } from "@/lib/auto-temeljnica";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RacunPdfButtons } from "@/components/racuni/RacunPdfButtons";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Send, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  draft: "Nacrt",
  izdan: "Izdan",
  poslan: "Poslan",
  djelomicno_placen: "Djelomično plaćen",
  placen: "Plaćen",
  storniran: "Storniran",
};

export default function RacunDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { racun, isLoading, refetch } = useRacunData(id);
  const { companyId, companies, useSupabase } = useCompany();
  const { kontakti } = useKontaktiData();
  const updateRacun = useUpdateRacunMutation();
  const temeljniceQuery = useTemeljnice(companyId);
  const addTemeljnica = useAddTemeljnica(companyId);
  const company = companies.find((c) => c.id === racun?.company_id);
  const kontakt = kontakti.find((k) => k.id === racun?.kontakt_id);

  const [tecajnaRazlikaPending, setTecajnaRazlikaPending] = useState(false);

  const handleIzdajRacun = async () => {
    if (!racun || racun.status !== "draft") return;
    try {
      await updateRacun.mutateAsync({ id: racun.id, updates: { status: "izdan" } });
      if (useSupabase && companyId) {
        const list = temeljniceQuery.data ?? [];
        const payload = buildTemeljnicaFromRacun(companyId, { ...racun, status: "izdan" }, list);
        await addTemeljnica.mutateAsync(payload);
      }
      await refetch?.();
      toast.success("Račun je izdan. Temeljnica je automatski kreirana.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Greška.");
    }
  };

  const handleTecajnaRazlika = async () => {
    if (!companyId || !racun?.id) return;
    setTecajnaRazlikaPending(true);
    try {
      const res = await fetch("/api/knjigovodstvo/tecajne-razlike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId, racun_id: racun.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      await refetch?.();
      if (data.knjizeno > 0) toast.success("Tečajna razlika knjižena.");
      else toast.info("Nema tečajne razlike za knjiženje.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Greška.");
    } finally {
      setTecajnaRazlikaPending(false);
    }
  };

  if (isLoading && !racun) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <p className="text-slate-500">Učitavanje...</p>
      </div>
    );
  }

  if (!racun) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Račun nije pronađen.</p>
        <Button asChild className="mt-4">
          <Link href="/racuni">Natrag na listu</Link>
        </Button>
      </div>
    );
  }

  const stavke = racun.stavke ?? [];

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/racuni">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Račun {racun.broj_racuna}
            </h1>
            <p className="text-sm text-slate-500">
              {statusLabels[racun.status] ?? racun.status} • Izdan {formatDate(racun.datum_izdavanja)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {racun.status === "draft" && (
            <Button onClick={handleIzdajRacun} disabled={updateRacun.isPending} className="gap-2">
              <Send className="h-4 w-4" />
              Izdaj račun
            </Button>
          )}
          {company && kontakt && (
            <RacunPdfButtons
              company={company}
              kontakt={kontakt}
              racun={racun}
              stavke={stavke}
            />
          )}
          {racun.valuta && racun.valuta.toUpperCase() !== "EUR" && racun.status === "izdan" && (
            <Button variant="outline" onClick={handleTecajnaRazlika} disabled={tecajnaRazlikaPending} className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Obračunaj tečajnu razliku
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href={`/racuni/uredi/${racun.id}`}>Uredi</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Podaci računa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-slate-500">Kupac:</span> {kontakt?.naziv ?? "—"}</p>
            <p><span className="text-slate-500">Datum valute:</span> {formatDate(racun.datum_valute)}</p>
            <p><span className="text-slate-500">Način plaćanja:</span> {racun.nacin_placanja}</p>
            {racun.napomena && (
              <p><span className="text-slate-500">Napomena:</span> {racun.napomena}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Iznosi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Bez PDV: {formatCurrency(racun.ukupno_bez_pdv ?? 0)} {racun.valuta ?? "EUR"}</p>
            <p>PDV: {formatCurrency(racun.ukupno_pdv ?? 0)} {racun.valuta ?? "EUR"}</p>
            <p className="font-semibold text-lg pt-2">Ukupno s PDV: {formatCurrency(racun.ukupno_s_pdv ?? 0)} {racun.valuta ?? "EUR"}</p>
            {racun.valuta && racun.valuta.toUpperCase() !== "EUR" && racun.iznos_eur != null && (
              <p className="text-slate-600">Iznos u EUR: {formatCurrency(racun.iznos_eur)} (tečaj: {Number(racun.tecaj ?? 0)})</p>
            )}
            {racun.placeno != null && racun.placeno > 0 && (
              <p className="text-green-600">Plaćeno: {formatCurrency(racun.placeno)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Stavke</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Naziv</th>
                <th className="pb-2 font-medium w-24">Količina</th>
                <th className="pb-2 font-medium w-24">JMJ</th>
                <th className="pb-2 font-medium w-28 text-right">Cijena bez PDV</th>
                <th className="pb-2 font-medium w-20">PDV %</th>
                <th className="pb-2 font-medium w-28 text-right">Ukupno</th>
              </tr>
            </thead>
            <tbody>
              {stavke.map((s) => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="py-2">{s.naziv}</td>
                  <td className="py-2">{s.kolicina}</td>
                  <td className="py-2">{s.jedinica_mjere ?? "kom"}</td>
                  <td className="py-2 text-right">{s.cijena_bez_pdv.toFixed(2)} €</td>
                  <td className="py-2">{s.pdv_stopa}%</td>
                  <td className="py-2 text-right font-medium">
                    {formatCurrency(s.ukupno ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
