"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useArtikliData } from "@/hooks/useArtikliData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Pencil } from "lucide-react";

export default function ArtiklDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { artikli } = useArtikliData();
  const artikl = artikli.find((a) => a.id === id);

  if (!artikl) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Artikl nije pronađen.</p>
        <Button asChild className="mt-4">
          <Link href="/artikli">Natrag</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/artikli">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">{artikl.naziv}</h1>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/artikli/${id}/uredi`} className="gap-2">
            <Pencil className="h-4 w-4" />
            Uredi
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Podaci artikla</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-slate-500">Jedinica mjere:</span> {artikl.jedinica_mjere}</p>
          <p><span className="text-slate-500">Cijena (bez PDV):</span> {formatCurrency(artikl.cijena)}</p>
          <p><span className="text-slate-500">PDV stopa:</span> {artikl.pdv_stopa}%</p>
          {artikl.konto && <p><span className="text-slate-500">Konto:</span> {artikl.konto}</p>}
          {artikl.opis && <p><span className="text-slate-500">Opis:</span> {artikl.opis}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
