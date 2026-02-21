"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useCompany } from "@/contexts/CompanyContext";
import { useTemeljnice, useAddTemeljnica, useTemeljniceStavke } from "@/hooks/useTemeljnice";
import { useMockStore } from "@/lib/mock-db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { dokumentLabel, kontrolniZbroj, statusTemeljnicaLabel } from "@/lib/auto-temeljnica";
import { Plus, BookOpen, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Temeljnica, TemeljnicaStavka } from "@/lib/types";

function getDokumentLink(dokument_tip?: string | null, dokument_id?: string | null) {
  if (!dokument_id) return null;
  switch (dokument_tip) {
    case "racun": return `/racuni/${dokument_id}`;
    case "ulazni_racun": return "/ulazni-racuni";
    case "bankovni_promet": return "/banka";
    case "placa": return "/place";
    default: return null;
  }
}

export default function TemeljnicePage() {
  const { companyId, useSupabase } = useCompany();
  const fromSupabase = useTemeljnice(companyId);
  const supabaseStavke = useTemeljniceStavke(companyId);
  const fromMock = useMockStore((s) => s.getTemeljnice(s.currentCompanyId ?? ""));
  const mockStavke = useMockStore((s) => s.temeljnice_stavke);
  const addSupabase = useAddTemeljnica(companyId);
  const addMock = useMockStore((s) => s.addTemeljnica);
  const rawList = useSupabase ? (fromSupabase.data ?? []) : fromMock;
  const allStavke = useSupabase ? (supabaseStavke.data ?? []) : mockStavke;
  const list = useMemo((): (Temeljnica & { stavke: TemeljnicaStavka[] })[] => {
    return rawList.map((t) => ({
      ...t,
      stavke: allStavke.filter((s) => s.temeljnica_id === t.id),
    }));
  }, [rawList, allStavke]);

  const [showForm, setShowForm] = useState(false);
  const [broj, setBroj] = useState("");
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [opis, setOpis] = useState("");
  const [stavke, setStavke] = useState<{ konto: string; duguje: string; potrazuje: string }[]>([
    { konto: "", duguje: "0", potrazuje: "0" },
    { konto: "", duguje: "0", potrazuje: "0" },
  ]);

  const addStavka = () => setStavke((s) => [...s, { konto: "", duguje: "0", potrazuje: "0" }]);
  const removeStavka = (i: number) => setStavke((s) => s.filter((_, idx) => idx !== i));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const rows = stavke
      .filter((s) => s.konto.trim())
      .map((s) => ({
        konto: s.konto.trim(),
        duguje: parseFloat(s.duguje.replace(",", ".")) || 0,
        potrazuje: parseFloat(s.potrazuje.replace(",", ".")) || 0,
      }));
    if (rows.length < 2) {
      toast.error("Dodajte barem 2 stavke (duguje/potražuje).");
      return;
    }
    const sumD = rows.reduce((a, r) => a + r.duguje, 0);
    const sumP = rows.reduce((a, r) => a + r.potrazuje, 0);
    if (Math.abs(sumD - sumP) > 0.01) {
      toast.error("Zbroj duguje mora biti jednak zbroju potražuje.");
      return;
    }
    const brojVal = broj || `T-${datum}-${list.length + 1}`;
    const payload = {
      temeljnica: {
        company_id: companyId!,
        broj_temeljnice: brojVal,
        datum,
        opis: opis || undefined,
        status: "draft" as const,
        dokument_tip: undefined,
        dokument_id: undefined,
      },
      stavke: rows.map((r) => ({ konto: r.konto, naziv_konta: r.konto, duguje: r.duguje, potrazuje: r.potrazuje })),
    };
    try {
      if (useSupabase) {
        await addSupabase.mutateAsync(payload);
        toast.success("Temeljnica spremljena.");
      } else {
        addMock(payload.temeljnica, payload.stavke);
        toast.success("Temeljnica spremljena.");
      }
      setShowForm(false);
      setStavke([{ konto: "", duguje: "0", potrazuje: "0" }, { konto: "", duguje: "0", potrazuje: "0" }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška.");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Temeljnice</h1>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova temeljnica
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ručna temeljnica</CardTitle>
            <p className="text-sm text-slate-500">
              Samo za posebne unose: amortizacija, ispravci vrijednosti, revalorizacija. Standardni dokumenti (računi, ulazni, uplate, plaće) knjiže se automatski.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Broj temeljnice</Label>
                  <Input value={broj} onChange={(e) => setBroj(e.target.value)} placeholder="T-2024-001" />
                </div>
                <div>
                  <Label>Datum</Label>
                  <Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
                </div>
                <div>
                  <Label>Opis</Label>
                  <Input value={opis} onChange={(e) => setOpis(e.target.value)} />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Stavke (konto, duguje, potražuje)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addStavka}>+ Stavka</Button>
                </div>
                <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                  {stavke.map((s, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <Input
                        className="w-24"
                        placeholder="Konto"
                        value={s.konto}
                        onChange={(e) => setStavke((prev) => prev.map((x, j) => (j === i ? { ...x, konto: e.target.value } : x)))}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        className="w-28"
                        placeholder="Duguje"
                        value={s.duguje}
                        onChange={(e) => setStavke((prev) => prev.map((x, j) => (j === i ? { ...x, duguje: e.target.value } : x)))}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        className="w-28"
                        placeholder="Potražuje"
                        value={s.potrazuje}
                        onChange={(e) => setStavke((prev) => prev.map((x, j) => (j === i ? { ...x, potrazuje: e.target.value } : x)))}
                      />
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeStavka(i)}>✕</Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={addSupabase.isPending && useSupabase}>Spremi temeljnicu</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Odustani</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista temeljnica</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">Nema temeljnica.</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>Nova temeljnica</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Broj</th>
                    <th className="pb-3 font-medium">Datum</th>
                    <th className="pb-3 font-medium">Opis</th>
                    <th className="pb-3 font-medium">Iz dokumenta</th>
                    <th className="pb-3 font-medium">Duguje / Potražuje</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((t) => {
                    const zbroj = kontrolniZbroj(t.stavke ?? []);
                    const docLink = getDokumentLink(t.dokument_tip, t.dokument_id);
                    const statusLabel = statusTemeljnicaLabel(t.status, t.dokument_tip);
                    return (
                      <tr key={t.id} className="border-b border-slate-100 align-top">
                        <td className="py-3 font-medium">{t.broj_temeljnice}</td>
                        <td className="py-3">{formatDate(t.datum)}</td>
                        <td className="py-3">{t.opis ?? "—"}</td>
                        <td className="py-3">
                          {docLink ? (
                            <Link href={docLink} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                              {dokumentLabel(t.dokument_tip)}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="space-y-0.5">
                            {(t.stavke ?? []).slice(0, 3).map((s) => (
                              <div key={s.id} className="text-xs">
                                {s.konto} {s.naziv_konta && `(${s.naziv_konta})`}: D {formatCurrency(s.duguje)} / P {formatCurrency(s.potrazuje)}
                              </div>
                            ))}
                            {(t.stavke?.length ?? 0) > 3 && (
                              <div className="text-xs text-slate-500">+{(t.stavke?.length ?? 0) - 3} stavke</div>
                            )}
                            <div className={!zbroj.uBalansu ? "font-medium text-red-600" : "text-slate-500"}>
                              Σ D {formatCurrency(zbroj.duguje)} = P {formatCurrency(zbroj.potrazuje)}
                              {!zbroj.uBalansu && " ⚠ Nije u balansu"}
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded px-2 py-0.5 text-xs ${
                              statusLabel === "Stornirana"
                                ? "bg-red-100 text-red-700"
                                : statusLabel === "Auto-knjižena"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
