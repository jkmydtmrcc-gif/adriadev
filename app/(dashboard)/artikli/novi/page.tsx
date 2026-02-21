"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompany } from "@/contexts/CompanyContext";
import { useCreateArtiklMutation } from "@/hooks/useArtikliData";
import { getPdvStope } from "@/lib/pdv-kalkulator";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const jmjOptions = ["kom", "kg", "l", "m", "m²", "m³", "sati", "dan", "usluga"];

export default function NoviArtiklPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const createArtikl = useCreateArtiklMutation();
  const pdvStope = getPdvStope();

  const [naziv, setNaziv] = useState("");
  const [opis, setOpis] = useState("");
  const [jedinica_mjere, setJedinicaMjere] = useState("kom");
  const [cijena, setCijena] = useState("");
  const [pdv_stopa, setPdvStopa] = useState(25);
  const [konto, setKonto] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naziv.trim()) {
      toast.error("Naziv je obavezan.");
      return;
    }
    const c = parseFloat(cijena.replace(",", "."));
    if (isNaN(c) || c < 0) {
      toast.error("Unesite valjanu cijenu.");
      return;
    }
    if (!companyId) {
      toast.error("Nije odabrana tvrtka.");
      return;
    }
    try {
      const created = await createArtikl.mutateAsync({
        company_id: companyId,
        naziv: naziv.trim(),
        opis: opis.trim() || undefined,
        jedinica_mjere: jedinica_mjere,
        cijena: c,
        pdv_stopa: pdv_stopa,
        konto: konto.trim() || undefined,
      });
      toast.success("Artikl dodan.");
      router.push(`/artikli/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška pri spremanju.");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/artikli">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Novi artikl / usluga</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Podaci artikla</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="naziv">Naziv *</Label>
              <Input
                id="naziv"
                value={naziv}
                onChange={(e) => setNaziv(e.target.value)}
                placeholder="Naziv artikla ili usluge"
                required
              />
            </div>
            <div>
              <Label htmlFor="opis">Opis</Label>
              <Input
                id="opis"
                value={opis}
                onChange={(e) => setOpis(e.target.value)}
                placeholder="Opcionalno"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Jedinica mjere</Label>
                <select
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={jedinica_mjere}
                  onChange={(e) => setJedinicaMjere(e.target.value)}
                >
                  {jmjOptions.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="cijena">Cijena (bez PDV) *</Label>
                <Input
                  id="cijena"
                  type="text"
                  inputMode="decimal"
                  value={cijena}
                  onChange={(e) => setCijena(e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>PDV stopa (%)</Label>
                <select
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={pdv_stopa}
                  onChange={(e) => setPdvStopa(Number(e.target.value))}
                >
                  {pdvStope.map((s) => (
                    <option key={s} value={s}>{s}%</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="konto">Konto</Label>
                <Input
                  id="konto"
                  value={konto}
                  onChange={(e) => setKonto(e.target.value)}
                  placeholder="npr. 600"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={createArtikl.isPending}>Spremi artikl</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/artikli">Odustani</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
