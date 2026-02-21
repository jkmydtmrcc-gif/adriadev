"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompany } from "@/contexts/CompanyContext";
import { useCreateKontaktMutation } from "@/hooks/useKontaktiData";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import type { KontaktTip } from "@/lib/types";

const tipOptions: { value: KontaktTip; label: string }[] = [
  { value: "kupac", label: "Kupac" },
  { value: "dobavljac", label: "Dobavljač" },
  { value: "oboje", label: "Kupac i dobavljač" },
];

export default function NoviKontaktPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const createKontakt = useCreateKontaktMutation();

  const [naziv, setNaziv] = useState("");
  const [oib, setOib] = useState("");
  const [tip, setTip] = useState<KontaktTip>("kupac");
  const [adresa, setAdresa] = useState("");
  const [grad, setGrad] = useState("");
  const [postanski_broj, setPostanskiBroj] = useState("");
  const [drzava, setDrzava] = useState("HR");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [iban, setIban] = useState("");
  const [napomena, setNapomena] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naziv.trim()) {
      toast.error("Naziv je obavezan.");
      return;
    }
    if (!companyId) {
      toast.error("Nije odabrana tvrtka.");
      return;
    }
    try {
      const created = await createKontakt.mutateAsync({
        company_id: companyId,
        naziv: naziv.trim(),
        oib: oib.trim() || undefined,
        tip,
        adresa: adresa.trim() || undefined,
        grad: grad.trim() || undefined,
        postanski_broj: postanski_broj.trim() || undefined,
        drzava: drzava.trim() || undefined,
        email: email.trim() || undefined,
        telefon: telefon.trim() || undefined,
        iban: iban.trim() || undefined,
        napomena: napomena.trim() || undefined,
      });
      toast.success("Kontakt dodan.");
      router.push(`/kontakti/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška pri spremanju.");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/kontakti">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Novi kontakt</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Podaci kontakta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="naziv">Naziv *</Label>
                <Input
                  id="naziv"
                  value={naziv}
                  onChange={(e) => setNaziv(e.target.value)}
                  placeholder="Naziv tvrtke ili osobe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="oib">OIB</Label>
                <Input
                  id="oib"
                  value={oib}
                  onChange={(e) => setOib(e.target.value)}
                  placeholder="OIB (11 znamenki)"
                  maxLength={11}
                />
              </div>
              <div>
                <Label>Tip</Label>
                <select
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={tip}
                  onChange={(e) => setTip(e.target.value as KontaktTip)}
                >
                  {tipOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="adresa">Adresa</Label>
              <Input
                id="adresa"
                value={adresa}
                onChange={(e) => setAdresa(e.target.value)}
                placeholder="Ulica i broj"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="postanski_broj">Poštanski broj</Label>
                <Input
                  id="postanski_broj"
                  value={postanski_broj}
                  onChange={(e) => setPostanskiBroj(e.target.value)}
                  placeholder="10000"
                />
              </div>
              <div>
                <Label htmlFor="grad">Grad</Label>
                <Input
                  id="grad"
                  value={grad}
                  onChange={(e) => setGrad(e.target.value)}
                  placeholder="Zagreb"
                />
              </div>
              <div>
                <Label htmlFor="drzava">Država</Label>
                <Input
                  id="drzava"
                  value={drzava}
                  onChange={(e) => setDrzava(e.target.value)}
                  placeholder="HR"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kontakt@primjer.hr"
                />
              </div>
              <div>
                <Label htmlFor="telefon">Telefon</Label>
                <Input
                  id="telefon"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  placeholder="+385 1 234 5678"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="HR12 3456 7890 1234 5678 9"
              />
            </div>

            <div>
              <Label htmlFor="napomena">Napomena</Label>
              <Input
                id="napomena"
                value={napomena}
                onChange={(e) => setNapomena(e.target.value)}
                placeholder="Opcionalno"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={createKontakt.isPending}>
                Spremi kontakt
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/kontakti">Odustani</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
