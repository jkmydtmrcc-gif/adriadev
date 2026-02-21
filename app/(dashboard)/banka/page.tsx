"use client";

import { useState, useCallback } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useBankovniPromet, useAddBankovniPromet } from "@/hooks/useBankovniPromet";
import { useTemeljnice, useAddTemeljnica } from "@/hooks/useTemeljnice";
import { useQueryClient } from "@tanstack/react-query";
import { useMockStore } from "@/lib/mock-db";
import { buildTemeljnicaFromUplata } from "@/lib/auto-temeljnica";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Banknote, Upload, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function BankaPage() {
  const queryClient = useQueryClient();
  const { companyId, useSupabase } = useCompany();
  const fromSupabase = useBankovniPromet(companyId);
  const fromMock = useMockStore((s) => s.getBankovniPromet(s.currentCompanyId ?? ""));
  const addSupabase = useAddBankovniPromet(companyId);
  const addMock = useMockStore((s) => s.addBankovniPromet);
  const temeljniceQuery = useTemeljnice(companyId);
  const addTemeljnicaMutation = useAddTemeljnica(companyId);
  const list = useSupabase ? (fromSupabase.data ?? []) : fromMock;

  const [showForm, setShowForm] = useState(false);
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [iznos, setIznos] = useState("");
  const [tip, setTip] = useState<"prihod" | "rashod">("prihod");
  const [opis, setOpis] = useState("");
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const stats = {
    uvezeno: list.length,
    uskladjeno: list.filter((b) => b.status === "usklađeno").length,
    trebaPregled: list.filter((b) => b.status === "djelomično").length,
    neuskladjeno: list.filter((b) => (b.status ?? "neusklađeno") === "neusklađeno").length,
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(iznos.replace(",", ".")) || 0;
    if (val <= 0) {
      toast.error("Unesite iznos.");
      return;
    }
    const payload = {
      company_id: companyId!,
      datum,
      iznos: val,
      tip,
      opis: opis || undefined,
      kategorizirano: false,
    };
    try {
      if (useSupabase) {
        const created = await addSupabase.mutateAsync(payload);
        if (tip === "prihod" && companyId) {
          const temList = temeljniceQuery.data ?? [];
          const tPayload = buildTemeljnicaFromUplata(companyId, created, temList);
          await addTemeljnicaMutation.mutateAsync(tPayload);
        }
        toast.success("Promet dodan." + (tip === "prihod" ? " Temeljnica kreirana." : ""));
      } else {
        addMock(payload);
        toast.success("Promet dodan.");
      }
      setShowForm(false);
      setIznos("");
      setOpis("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška.");
    }
  };

  const handleFileImport = useCallback(
    async (file: File) => {
      if (!companyId || !useSupabase) return;
      setImporting(true);
      try {
        const form = new FormData();
        form.set("file", file);
        form.set("company_id", companyId);
        const res = await fetch("/api/banka/import", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Greška pri uvozu");
        queryClient.invalidateQueries({ queryKey: ["bankovni_promet", companyId] });
        toast.success(
          `Uvezeno: ${data.uvezeno}. Automatski usklađeno: ${data.automatski_uskladeno}, treba pregled: ${data.treba_pregled}`
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Greška pri uvozu");
      } finally {
        setImporting(false);
      }
    },
    [companyId, useSupabase, queryClient]
  );

  const handleConfirmMatch = async (prometId: string) => {
    if (!companyId || !useSupabase) return;
    try {
      const res = await fetch("/api/banka/uskladi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promet_id: prometId, company_id: companyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Greška");
      queryClient.invalidateQueries({ queryKey: ["bankovni_promet", companyId] });
      toast.success("Usklađeno. Temeljnica kreirana.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Greška");
    }
  };

  const rowBg = (b: (typeof list)[0]) => {
    const status = b.status ?? "neusklađeno";
    const conf = b.match_confidence ?? 0;
    if (status === "usklađeno" || conf >= 80) return "bg-green-50";
    if (conf >= 40 && conf < 80) return "bg-amber-50";
    if (b.tip === "rashod") return "bg-slate-50";
    return "";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Bankovni promet</h1>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Dodaj promet
        </Button>
      </div>

      {useSupabase && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Uvoz izvoda (MT940 / CAMT.053 / CSV)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver ? "border-primary bg-primary/5" : "border-slate-200"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFileImport(f);
                }}
              >
                <input
                  type="file"
                  accept=".sta,.mt940,.xml,.csv,text/plain,application/xml"
                  className="hidden"
                  id="banka-upload"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileImport(f);
                    e.target.value = "";
                  }}
                />
                <label htmlFor="banka-upload" className="cursor-pointer">
                  <p className="text-slate-600 mb-2">
                    Povucite datoteku ovdje ili kliknite za odabir
                  </p>
                  <Button type="button" variant="outline" disabled={importing} asChild>
                    <span>
                      {importing ? "Uvoz…" : "Odaberi datoteku"}
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Uvezene transakcije</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.uvezeno}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Automatski usklađeno</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{stats.uskladjeno}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Treba pregled</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600">{stats.trebaPregled}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Neusklađeno</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-600">{stats.neuskladjeno}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novi promet</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Datum</Label>
                <Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
              </div>
              <div>
                <Label>Tip</Label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={tip}
                  onChange={(e) => setTip(e.target.value as "prihod" | "rashod")}
                >
                  <option value="prihod">Prihod</option>
                  <option value="rashod">Rashod</option>
                </select>
              </div>
              <div>
                <Label>Iznos (EUR)</Label>
                <Input type="number" step="0.01" value={iznos} onChange={(e) => setIznos(e.target.value)} required />
              </div>
              <div>
                <Label>Opis</Label>
                <Input value={opis} onChange={(e) => setOpis(e.target.value)} placeholder="Opis" />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={addSupabase.isPending && useSupabase}>Spremi</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Odustani</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Promet</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Banknote className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">Nema unosa. Dodaj promet ili uvezi izvod.</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>Dodaj promet</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Datum</th>
                    <th className="pb-3 font-medium">Opis</th>
                    <th className="pb-3 font-medium">Tip</th>
                    <th className="pb-3 font-medium text-right">Iznos</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((b) => (
                    <tr key={b.id} className={`border-b border-slate-100 ${rowBg(b)}`}>
                      <td className="py-3">{formatDate(b.datum)}</td>
                      <td className="py-3 max-w-[200px] truncate">{b.opis ?? "—"}</td>
                      <td className="py-3">
                        <span className={b.tip === "prihod" ? "text-green-600" : "text-red-600"}>
                          {b.tip === "prihod" ? "Prihod" : "Rashod"}
                        </span>
                      </td>
                      <td className={`py-3 text-right font-medium ${b.tip === "prihod" ? "text-green-600" : "text-red-600"}`}>
                        {b.tip === "prihod" ? "+" : "-"} {formatCurrency(b.iznos)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            (b.status ?? "neusklađeno") === "usklađeno"
                              ? "bg-green-100 text-green-700"
                              : (b.status ?? "") === "djelomično"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {(b.status ?? "neusklađeno") === "usklađeno"
                            ? "Usklađeno"
                            : (b.status ?? "") === "djelomično"
                            ? `Prijedlog ${b.match_confidence ?? 0}%`
                            : "Neusklađeno"}
                        </span>
                      </td>
                      <td className="py-3">
                        {(b.status ?? "neusklađeno") !== "usklađeno" &&
                          b.racun_id &&
                          b.tip === "prihod" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConfirmMatch(b.id)}
                              className="gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Potvrdi usklađivanje
                            </Button>
                          )}
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
