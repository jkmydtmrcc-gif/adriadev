"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateCompany } from "@/hooks/useCompanies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const TIP_FIRME = [
  { value: "obrt", label: "Obrt" },
  { value: "jdoo", label: "j.d.o.o." },
  { value: "doo", label: "d.o.o." },
  { value: "pausalni_obrt", label: "Paušalni obrt" },
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const createCompany = useCreateCompany();
  const [naziv, setNaziv] = useState("");
  const [oib, setOib] = useState("");
  const [grad, setGrad] = useState("");
  const [adresa, setAdresa] = useState("");
  const [iban, setIban] = useState("");
  const [pdvObveznik, setPdvObveznik] = useState(false);
  const [tipFirme, setTipFirme] = useState("doo");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await createCompany.mutateAsync({
        user_id: user.id,
        naziv,
        oib,
        pdv_obveznik: pdvObveznik,
        grad: grad || undefined,
        adresa: adresa || undefined,
        iban: iban || undefined,
        tip_firme: tipFirme as "obrt" | "jdoo" | "doo" | "pausalni_obrt",
      });
      toast.success("Tvrtka je dodana.");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Greška.");
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-slate-500">Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Dodajte tvrtku</CardTitle>
          <p className="text-sm text-slate-500">Korak 1 od 4 – osnovni podaci</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Naziv tvrtke *</Label>
              <Input
                value={naziv}
                onChange={(e) => setNaziv(e.target.value)}
                placeholder="npr. Moja tvrtka d.o.o."
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>OIB *</Label>
              <Input
                value={oib}
                onChange={(e) => setOib(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="11 znamenki"
                maxLength={11}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Tip tvrtke</Label>
              <select
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={tipFirme}
                onChange={(e) => setTipFirme(e.target.value)}
              >
                {TIP_FIRME.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Adresa</Label>
              <Input value={adresa} onChange={(e) => setAdresa(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Grad</Label>
              <Input value={grad} onChange={(e) => setGrad(e.target.value)} className="mt-1" placeholder="Zagreb" />
            </div>
            <div>
              <Label>IBAN</Label>
              <Input value={iban} onChange={(e) => setIban(e.target.value)} className="mt-1" placeholder="HR..." />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pdv"
                checked={pdvObveznik}
                onChange={(e) => setPdvObveznik(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="pdv">PDV obveznik</Label>
            </div>
            <Button type="submit" className="w-full" disabled={createCompany.isPending}>
              {createCompany.isPending ? "Spremanje..." : "Nastavi"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
