"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useKontaktiData } from "@/hooks/useKontaktiData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil } from "lucide-react";

const tipLabels: Record<string, string> = {
  kupac: "Kupac",
  dobavljac: "Dobavljač",
  oboje: "Kupac i dobavljač",
};

export default function KontaktDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { kontakti } = useKontaktiData();
  const kontakt = kontakti.find((k) => k.id === id);

  if (!kontakt) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Kontakt nije pronađen.</p>
        <Button asChild className="mt-4">
          <Link href="/kontakti">Natrag</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/kontakti">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">{kontakt.naziv}</h1>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/kontakti/${id}/uredi`} className="gap-2">
            <Pencil className="h-4 w-4" />
            Uredi
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Podaci kontakta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-slate-500">Tip:</span> {tipLabels[kontakt.tip] ?? kontakt.tip}</p>
          {kontakt.oib && <p><span className="text-slate-500">OIB:</span> {kontakt.oib}</p>}
          {kontakt.adresa && <p><span className="text-slate-500">Adresa:</span> {kontakt.adresa}</p>}
          {kontakt.grad && <p><span className="text-slate-500">Grad:</span> {kontakt.grad} {kontakt.postanski_broj}</p>}
          {kontakt.email && <p><span className="text-slate-500">Email:</span> {kontakt.email}</p>}
          {kontakt.telefon && <p><span className="text-slate-500">Telefon:</span> {kontakt.telefon}</p>}
          {kontakt.iban && <p><span className="text-slate-500">IBAN:</span> {kontakt.iban}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
