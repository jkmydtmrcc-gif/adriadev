"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useArtikliData, useUpdateArtiklMutation } from "@/hooks/useArtikliData";
import { getPdvStope } from "@/lib/pdv-kalkulator";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const jmjOptions = ["kom", "kg", "l", "m", "m²", "m³", "sati", "dan", "usluga"];

export default function UrediArtiklPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { artikli } = useArtikliData();
  const updateArtikl = useUpdateArtiklMutation();
  const artikl = artikli.find((a) => a.id === id);
  const pdvStope = getPdvStope();

  const [naziv, setNaziv] = useState("");
  const [opis, setOpis] = useState("");
  const [jedinica_mjere, setJedinicaMjere] = useState("kom");
  const [cijena, setCijena] = useState("");
  const [pdv_stopa, setPdvStopa] = useState(25);
  const [konto, setKonto] = useState("");

  useEffect(() => {
    if (artikl) {
      setNaziv(artikl.naziv ?? "");
      setOpis(artikl.opis ?? "");
      setJedinicaMjere(artikl.jedinica_mjere ?? "kom");
      setCijena(String(artikl.cijena ?? ""));
      setPdvStopa(Number(artikl.pdv_stopa) ?? 25);
      setKonto(artikl.konto ?? "");
    }
  }, [artikl]);

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
    try {
      await updateArtikl.mutateAsync({
        id,
        naziv: naziv.trim(),
        opis: opis.trim() || undefined,
        jedinica_mjere,
        cijena: c,
        pdv_stopa,
        konto: konto.trim() || undefined,
      });
      toast.success("Artikl spremljen.");
      router.push(`/artikli/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška pri spremanju.");
    }
  };

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
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/artikli/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Uredi artikl</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Podaci artikla</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="naziv">Naziv *</Label>
              <Input id="naziv" value={naziv} onChange={(e) => setNaziv(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="opis">Opis</Label>
              <Input id="opis" value={opis} onChange={(e) => setOpis(e.target.value)} />
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
                <Input id="konto" value={konto} onChange={(e) => setKonto(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={updateArtikl.isPending}>Spremi</Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/artikli/${id}`}>Odustani</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
