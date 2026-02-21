"use client";

import { useState } from "react";
import Link from "next/link";
import { useCompany } from "@/contexts/CompanyContext";
import { useRadnici, useAddRadnik } from "@/hooks/useRadnici";
import { useMockStore } from "@/lib/mock-db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Plus, User } from "lucide-react";
import { toast } from "sonner";

const VrstaUgovoraOptions = [
  { value: "neodredjeno", label: "Na neodređeno" },
  { value: "odredjeno", label: "Na određeno" },
  { value: "student", label: "Student" },
  { value: "ugovor_o_djelu", label: "Ugovor o djelu" },
];

export default function RadniciPage() {
  const { companyId, useSupabase } = useCompany();
  const fromSupabase = useRadnici(companyId);
  const fromMock = useMockStore((s) => s.getRadnici(s.currentCompanyId ?? ""));
  const addSupabase = useAddRadnik(companyId);
  const addMock = useMockStore((s) => s.addRadnik);
  const list = useSupabase ? (fromSupabase.data ?? []) : fromMock;

  const [showForm, setShowForm] = useState(false);
  const [ime, setIme] = useState("");
  const [prezime, setPrezime] = useState("");
  const [oib, setOib] = useState("");
  const [bruto, setBruto] = useState("");
  const [grad, setGrad] = useState("");
  const [iban, setIban] = useState("");
  const [opcina, setOpcina] = useState("");
  const [koeficijent, setKoeficijent] = useState("1");
  const [imaDrugiStup, setImaDrugiStup] = useState(false);
  const [datumKrajaUgovora, setDatumKrajaUgovora] = useState("");
  const [vrstaUgovora, setVrstaUgovora] = useState<string>("neodredjeno");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ime.trim() || !prezime.trim() || !oib.trim()) {
      toast.error("Ime, prezime i OIB su obavezni.");
      return;
    }
    const payload = {
      company_id: companyId!,
      ime: ime.trim(),
      prezime: prezime.trim(),
      oib: oib.replace(/\D/g, "").slice(0, 11),
      bruto_placa: bruto ? parseFloat(bruto.replace(",", ".")) : undefined,
      grad: grad || undefined,
      iban: iban || undefined,
      opcina_placanja_poreza: opcina || undefined,
      koeficijent_osobnog_odbitka: koeficijent ? parseFloat(koeficijent.replace(",", ".")) : 1,
      ima_drugi_mirovinki_stup: imaDrugiStup,
      datum_kraja_ugovora: datumKrajaUgovora || undefined,
      vrsta_ugovora: vrstaUgovora as "neodredjeno" | "odredjeno" | "student" | "ugovor_o_djelu",
      aktivan: true,
    };
    try {
      if (useSupabase) {
        await addSupabase.mutateAsync(payload);
        toast.success("Radnik dodan.");
      } else {
        addMock(payload);
        toast.success("Radnik dodan.");
      }
      setShowForm(false);
      setIme("");
      setPrezime("");
      setOib("");
      setBruto("");
      setGrad("");
      setIban("");
      setOpcina("");
      setKoeficijent("1");
      setImaDrugiStup(false);
      setDatumKrajaUgovora("");
      setVrstaUgovora("neodredjeno");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška.");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/place">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Radnici</h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novi radnik
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Novi radnik</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Ime *</Label>
                <Input value={ime} onChange={(e) => setIme(e.target.value)} required />
              </div>
              <div>
                <Label>Prezime *</Label>
                <Input value={prezime} onChange={(e) => setPrezime(e.target.value)} required />
              </div>
              <div>
                <Label>OIB *</Label>
                <Input value={oib} onChange={(e) => setOib(e.target.value.replace(/\D/g, "").slice(0, 11))} maxLength={11} required />
              </div>
              <div>
                <Label>Bruto plaća (EUR)</Label>
                <Input type="number" step="0.01" value={bruto} onChange={(e) => setBruto(e.target.value)} />
              </div>
              <div>
                <Label>Grad</Label>
                <Input value={grad} onChange={(e) => setGrad(e.target.value)} />
              </div>
              <div>
                <Label>IBAN</Label>
                <Input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="HR..." />
              </div>
              <div>
                <Label>Općina plaćanja poreza</Label>
                <Input value={opcina} onChange={(e) => setOpcina(e.target.value)} placeholder="npr. Zagreb" />
              </div>
              <div>
                <Label>Koeficijent osobnog odbitka</Label>
                <Input type="number" step="0.01" min="0" max="2" value={koeficijent} onChange={(e) => setKoeficijent(e.target.value)} />
              </div>
              <div>
                <Label>Vrsta ugovora</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={vrstaUgovora}
                  onChange={(e) => setVrstaUgovora(e.target.value)}
                >
                  {VrstaUgovoraOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Datum kraja ugovora</Label>
                <Input type="date" value={datumKrajaUgovora} onChange={(e) => setDatumKrajaUgovora(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="drugi_stup"
                  checked={imaDrugiStup}
                  onChange={(e) => setImaDrugiStup(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <Label htmlFor="drugi_stup">Ima drugi mirovinski stup</Label>
              </div>
              <div className="flex items-end gap-2 sm:col-span-2">
                <Button type="submit" disabled={addSupabase.isPending && useSupabase}>Spremi</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Odustani</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista radnika</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">Nema radnika. Dodajte prvog radnika.</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>Novi radnik</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Ime i prezime</th>
                    <th className="pb-3 font-medium">OIB</th>
                    <th className="pb-3 font-medium text-right">Bruto</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100">
                      <td className="py-3 font-medium">{r.ime} {r.prezime}</td>
                      <td className="py-3">{r.oib}</td>
                      <td className="py-3 text-right">{r.bruto_placa != null ? formatCurrency(r.bruto_placa) : "—"}</td>
                      <td className="py-3">
                        <span className={"rounded px-2 py-0.5 text-xs " + (r.aktivan ? "bg-green-100 text-green-700" : "bg-slate-100")}>
                          {r.aktivan ? "Aktivan" : "Neaktivan"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
