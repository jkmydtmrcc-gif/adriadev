"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCompany } from "@/contexts/CompanyContext";
import { usePonudaData } from "@/hooks/usePonudeData";
import { useKontaktiData } from "@/hooks/useKontaktiData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PonudaPdfButtons } from "@/components/ponude/PonudaPdfButtons";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

const statusLabels: Record<string, string> = {
  draft: "Nacrt",
  poslana: "Poslana",
  prihvacena: "Prihvaćena",
  odbijena: "Odbijena",
  istekla: "Istekla",
};

export default function PonudaDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { companyId, companies } = useCompany();
  const { ponuda, isLoading } = usePonudaData(id);
  const { kontakti } = useKontaktiData();
  const kontakt = ponuda ? kontakti.find((k) => k.id === ponuda.kontakt_id) : undefined;
  const company = companies.find((c) => c.id === companyId);

  if (isLoading || !id) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Učitavanje…</p>
      </div>
    );
  }

  if (!ponuda) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Ponuda nije pronađena.</p>
        <Button asChild className="mt-4">
          <Link href="/ponude">Natrag</Link>
        </Button>
      </div>
    );
  }

  const stavke = ponuda.stavke ?? [];

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/ponude">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Ponuda {ponuda.broj_ponude}</h1>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-sm">
            {statusLabels[ponuda.status] ?? ponuda.status}
          </span>
        </div>
        {company && kontakt && (
          <PonudaPdfButtons
            company={company}
            kontakt={kontakt}
            ponuda={ponuda}
            stavke={stavke}
          />
        )}
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6 text-sm">
          <p>Kupac: {kontakt?.naziv ?? "—"}</p>
          <p>Datum: {formatDate(ponuda.datum)}</p>
          {ponuda.datum_valjanosti && (
            <p>Valjana do: {formatDate(ponuda.datum_valjanosti)}</p>
          )}
          {ponuda.uvjeti_placanja && <p>Uvjeti plaćanja: {ponuda.uvjeti_placanja}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stavke</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Naziv</th>
                <th className="pb-2 font-medium w-24">Količina</th>
                <th className="pb-2 font-medium w-28 text-right">Cijena</th>
                <th className="pb-2 font-medium w-28 text-right">Ukupno</th>
              </tr>
            </thead>
            <tbody>
              {stavke.map((s) => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="py-2">{s.naziv}</td>
                  <td className="py-2">{s.kolicina}</td>
                  <td className="py-2 text-right">{Number(s.cijena_bez_pdv).toFixed(2)} €</td>
                  <td className="py-2 text-right font-medium">
                    {formatCurrency(s.ukupno ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 border-t pt-4 text-right space-y-1">
            <p>Ukupno bez PDV: {formatCurrency(ponuda.ukupno_bez_pdv ?? 0)}</p>
            <p>PDV: {formatCurrency(ponuda.ukupno_pdv ?? 0)}</p>
            <p className="font-semibold">Ukupno s PDV: {formatCurrency(ponuda.ukupno_s_pdv ?? 0)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
