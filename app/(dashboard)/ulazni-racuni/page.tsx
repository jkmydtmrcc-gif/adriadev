"use client";

import { useState, useRef, useMemo } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useUlazniRacuni, useAddUlazniRacun, useUpdateUlazniRacun } from "@/hooks/useUlazniRacuni";
import { useKontaktiData, useCreateKontaktMutation } from "@/hooks/useKontaktiData";
import { useTemeljnice, useAddTemeljnica } from "@/hooks/useTemeljnice";
import { useMockStore } from "@/lib/mock-db";
import { buildTemeljnicaFromUlazniRacun } from "@/lib/auto-temeljnica";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Camera,
  Upload,
  Loader2,
  Check,
  Pencil,
  Inbox,
  BookOpen,
  ChevronDown,
  Search,
  FileText,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_MB = 10;
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

const statusLabels: Record<string, string> = {
  neprocesen: "Neprocesen",
  knjizen: "Knjižen",
  placen: "Plaćen",
};

export type AIScanResult = {
  naziv_dobavljaca?: string | null;
  oib_dobavljaca?: string | null;
  pdv_id_dobavljaca?: string | null;
  broj_racuna?: string | null;
  datum_racuna?: string | null;
  datum_valute?: string | null;
  datum_isporuke?: string | null;
  ukupno_bez_pdv?: number | null;
  pdv_iznos?: number | null;
  pdv_stopa?: number | null;
  ukupno_s_pdv?: number | null;
  iban_dobavljaca?: string | null;
  model_placanja?: string | null;
  poziv_na_broj?: string | null;
  kategorija?: string | null;
  konto?: string | null;
  opis?: string | null;
};

export default function UlazniRacuniPage() {
  const { companyId, useSupabase } = useCompany();
  const fromSupabase = useUlazniRacuni(companyId);
  const fromMock = useMockStore((s) => s.getUlazniRacuni(s.currentCompanyId ?? ""));
  const addSupabase = useAddUlazniRacun(companyId);
  const addMock = useMockStore((s) => s.addUlazniRacun);
  const updateSupabase = useUpdateUlazniRacun(companyId);
  const updateMock = useMockStore((s) => s.updateUlazniRacun);
  const { kontakti } = useKontaktiData();
  const createKontakt = useCreateKontaktMutation();
  const temeljniceQuery = useTemeljnice(companyId);
  const addTemeljnica = useAddTemeljnica(companyId);
  const list = useSupabase ? (fromSupabase.data ?? []) : fromMock;

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [aiResult, setAiResult] = useState<AIScanResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filterPeriod, setFilterPeriod] = useState<"all" | "month" | "quarter">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterKategorija, setFilterKategorija] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filteredList = useMemo(() => {
    let r = [...list];
    const now = new Date();
    if (filterPeriod === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      r = r.filter((u) => u.datum_racuna >= start && u.datum_racuna <= end);
    } else if (filterPeriod === "quarter") {
      const q = Math.floor(now.getMonth() / 3) + 1;
      const start = new Date(now.getFullYear(), (q - 1) * 3, 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), q * 3, 0).toISOString().slice(0, 10);
      r = r.filter((u) => u.datum_racuna >= start && u.datum_racuna <= end);
    }
    if (filterStatus !== "all") r = r.filter((u) => u.status === filterStatus);
    if (filterKategorija !== "all") r = r.filter((u) => (u.kategorija || u.ai_kategorija) === filterKategorija);
    if (search.trim()) {
      const s = search.toLowerCase();
      r = r.filter(
        (u) =>
          (u.opis?.toLowerCase().includes(s) ||
            u.broj_racuna_dobavljaca?.toLowerCase().includes(s) ||
            (kontakti.find((k) => k.id === u.kontakt_id)?.naziv?.toLowerCase().includes(s)))
      );
    }
    return r;
  }, [list, filterPeriod, filterStatus, filterKategorija, search, kontakti]);

  const summary = useMemo(() => {
    const ukupno = filteredList.reduce((a, u) => a + Number(u.ukupno_s_pdv ?? 0), 0);
    const pdv = filteredList.reduce((a, u) => a + Number(u.ukupno_pdv ?? 0), 0);
    return {
      ukupnoTroskova: ukupno,
      odbijeniPdv: pdv,
      netoTrosak: ukupno - pdv,
    };
  }, [filteredList]);

  const kategorijeOptions = useMemo(() => {
    const set = new Set<string>();
    list.forEach((u) => {
      const k = u.kategorija || u.ai_kategorija;
      if (k) set.add(k);
    });
    return Array.from(set).sort();
  }, [list]);

  const handleFile = async (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Max ${MAX_FILE_MB} MB`);
      return;
    }
    const ok = ACCEPT.split(",").some((t) => t.trim() === f.type);
    if (!ok && f.type !== "application/pdf") {
      toast.error("Podržano: JPG, PNG, PDF");
      return;
    }
    setFile(f);
    setAiError(null);
    setAiResult(null);
    setScanning(true);
    try {
      const form = new FormData();
      form.append("file", f);
      const res = await fetch("/api/ulazni-racuni/ai-scan", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Greška");
      if (!json.success) throw new Error(json.error || "AI nije uspio");
      setAiResult(json.data as AIScanResult);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Nije moguće očitati račun automatski");
      setShowManual(true);
      setManualOpen(true);
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!companyId || !aiResult) return;
    const ukupnoSPdv = Number(aiResult.ukupno_s_pdv ?? 0);
    if (ukupnoSPdv <= 0) {
      toast.error("Ukupno s PDV mora biti > 0");
      return;
    }
    const datumRacuna = aiResult.datum_racuna || new Date().toISOString().slice(0, 10);
    let kontaktId: string | undefined;
    const existing = kontakti.find(
      (k) =>
        (k.oib && aiResult.oib_dobavljaca && k.oib === String(aiResult.oib_dobavljaca).replace(/\D/g, "").slice(0, 11)) ||
        (aiResult.naziv_dobavljaca && k.naziv?.toLowerCase() === String(aiResult.naziv_dobavljaca).toLowerCase())
    );
    if (existing) {
      kontaktId = existing.id;
    } else if (aiResult.naziv_dobavljaca) {
      try {
        const created = await createKontakt.mutateAsync({
          company_id: companyId,
          naziv: String(aiResult.naziv_dobavljaca),
          oib: aiResult.oib_dobavljaca ? String(aiResult.oib_dobavljaca).replace(/\D/g, "").slice(0, 11) : undefined,
          tip: "dobavljac",
          iban: aiResult.iban_dobavljaca || undefined,
        });
        kontaktId = created.id;
      } catch (_) {}
    }
    const payload = {
      company_id: companyId,
      kontakt_id: kontaktId,
      broj_racuna_dobavljaca: aiResult.broj_racuna || undefined,
      datum_racuna: datumRacuna,
      datum_valute: aiResult.datum_valute || undefined,
      opis: aiResult.opis || aiResult.naziv_dobavljaca || undefined,
      ukupno_bez_pdv: aiResult.ukupno_bez_pdv ?? undefined,
      ukupno_pdv: aiResult.pdv_iznos ?? undefined,
      ukupno_s_pdv: ukupnoSPdv,
      pdv_odbiten: true,
      status: "knjizen" as const,
      konto_troska: (aiResult.konto || "4290").toString().trim(),
      kategorija: aiResult.kategorija || undefined,
      ai_kategorija: aiResult.kategorija || undefined,
      ai_konto: aiResult.konto || undefined,
    };
    try {
      let created;
      if (useSupabase) {
        created = await addSupabase.mutateAsync(payload);
        const temList = temeljniceQuery.data ?? [];
        const tPayload = buildTemeljnicaFromUlazniRacun(companyId, created, temList);
        await addTemeljnica.mutateAsync(tPayload);
      } else {
        created = addMock(payload);
        updateMock(created.id, { status: "knjizen" });
      }
      toast.success("Ulazni račun spremljen. Temeljnica kreirana.");
      setAiResult(null);
      setFile(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Greška pri spremanju.");
    }
  };

  const handleKnjizi = async (u: (typeof list)[0]) => {
    if (u.status !== "neprocesen") return;
    try {
      if (useSupabase) {
        const updated = await updateSupabase.mutateAsync({ id: u.id, status: "knjizen" });
        if (companyId) {
          const temList = temeljniceQuery.data ?? [];
          const payload = buildTemeljnicaFromUlazniRacun(companyId, updated, temList);
          await addTemeljnica.mutateAsync(payload);
        }
        toast.success("Ulazni račun knjižen. Temeljnica kreirana.");
      } else {
        updateMock(u.id, { status: "knjizen" });
        toast.success("Ulazni račun knjižen.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Greška.");
    }
  };

  const getDobavljacNaziv = (u: (typeof list)[0]) => {
    if (u.kontakt_id) {
      const k = kontakti.find((x) => x.id === u.kontakt_id);
      if (k) return k.naziv;
    }
    return u.opis ?? "—";
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Ulazni računi</h1>

      {/* Hero - AI Scan Zone */}
      <Card className="border-2 border-dashed border-blue-200 bg-[#EFF6FF] overflow-hidden">
        <CardContent className="p-0">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            capture="environment"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={`p-8 sm:p-12 text-center transition-colors ${dragActive ? "bg-blue-100" : ""}`}
          >
            {scanning ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="text-slate-700 font-medium">AI analizira račun…</p>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-2">📷</div>
                <p className="text-lg font-semibold text-slate-800 mb-1">
                  Fotografiraj ili povuci račun
                </p>
                <p className="text-sm text-slate-600 mb-4">
                  Podržano: JPG, PNG, PDF • Max {MAX_FILE_MB} MB
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white border-blue-300"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Fotografiraj
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white border-blue-300"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Odaberi datoteku
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Error */}
      {aiError && !aiResult && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-700 font-medium">{aiError}</p>
            <p className="text-sm text-red-600 mt-1">Unesite podatke ručno ispod.</p>
          </CardContent>
        </Card>
      )}

      {/* AI Confirmation card */}
      {aiResult && !scanning && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Check className="h-5 w-5" />
              AI je analizirao račun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <p><span className="text-slate-500">Dobavljač:</span> {aiResult.naziv_dobavljaca ?? "—"}</p>
              <p><span className="text-slate-500">OIB:</span> {aiResult.oib_dobavljaca ?? "—"}</p>
              <p><span className="text-slate-500">Broj računa:</span> {aiResult.broj_racuna ?? "—"}</p>
              <p><span className="text-slate-500">Datum:</span> {aiResult.datum_racuna ?? "—"}</p>
              <p><span className="text-slate-500">Datum valute:</span> {aiResult.datum_valute ?? "—"}</p>
            </div>
            <hr />
            <div className="flex flex-wrap gap-4">
              <p><span className="text-slate-500">Bez PDV:</span> {formatCurrency(Number(aiResult.ukupno_bez_pdv ?? 0))}</p>
              <p><span className="text-slate-500">PDV ({aiResult.pdv_stopa ?? 25}%):</span> {formatCurrency(Number(aiResult.pdv_iznos ?? 0))}</p>
              <p className="font-bold">Ukupno: {formatCurrency(Number(aiResult.ukupno_s_pdv ?? 0))}</p>
            </div>
            <hr />
            <p><span className="text-slate-500">Kategorija:</span> {aiResult.kategorija ?? "—"}</p>
            <p><span className="text-slate-500">Konto:</span> {aiResult.konto ?? "4290"}</p>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleConfirmSave} disabled={addSupabase.isPending && useSupabase} className="gap-2">
                <Check className="h-4 w-4" />
                Potvrdi i spremi
              </Button>
              <Button variant="outline" onClick={() => { setAiResult(null); setShowManual(true); setManualOpen(true); }} className="gap-2">
                <Pencil className="h-4 w-4" />
                Ispravi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual entry - collapsible */}
      <Card>
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 rounded-t-lg"
          onClick={() => setManualOpen(!manualOpen)}
        >
          <span className="font-medium flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Ručni unos
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${manualOpen ? "rotate-180" : ""}`} />
        </button>
        {manualOpen && (
          <CardContent className="pt-0 border-t">
            <ManualForm
              companyId={companyId!}
              useSupabase={useSupabase}
              addSupabase={addSupabase}
              addMock={addMock}
              onSuccess={() => { setManualOpen(false); setShowManual(false); }}
            />
          </CardContent>
        )}
      </Card>

      {/* List + filters */}
      <Card>
        <CardHeader>
          <CardTitle>Lista ulaznih računa</CardTitle>
          <div className="flex flex-wrap gap-3 pt-2">
            <select
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as "all" | "month" | "quarter")}
            >
              <option value="all">Svi periodi</option>
              <option value="month">Ovaj mjesec</option>
              <option value="quarter">Ovaj kvartal</option>
            </select>
            <select
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Svi statusi</option>
              {Object.entries(statusLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            {kategorijeOptions.length > 0 && (
              <select
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                value={filterKategorija}
                onChange={(e) => setFilterKategorija(e.target.value)}
              >
                <option value="all">Sve kategorije</option>
                {kategorijeOptions.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            )}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Pretraži dobavljača..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-4 text-sm border-b pb-4">
            <span><strong>Ukupni troškovi:</strong> {formatCurrency(summary.ukupnoTroskova)}</span>
            <span><strong>Odbijeni PDV:</strong> {formatCurrency(summary.odbijeniPdv)}</span>
            <span><strong>Neto trošak:</strong> {formatCurrency(summary.netoTrosak)}</span>
          </div>
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">Nema ulaznih računa.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Dobavljač</th>
                    <th className="pb-3 font-medium">Br. računa</th>
                    <th className="pb-3 font-medium">Datum</th>
                    <th className="pb-3 font-medium text-right">Iznos</th>
                    <th className="pb-3 font-medium text-right">PDV</th>
                    <th className="pb-3 font-medium">Kategorija</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100">
                      <td className="py-3">{getDobavljacNaziv(u)}</td>
                      <td className="py-3">{u.broj_racuna_dobavljaca ?? "—"}</td>
                      <td className="py-3">{formatDate(u.datum_racuna)}</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(u.ukupno_s_pdv)}</td>
                      <td className="py-3 text-right text-slate-600">{formatCurrency(u.ukupno_pdv ?? 0)}</td>
                      <td className="py-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                          {(u.kategorija || u.ai_kategorija) ?? "—"}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{statusLabels[u.status]}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          {u.status === "neprocesen" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleKnjizi(u)}
                              disabled={useSupabase ? updateSupabase.isPending : false}
                            >
                              <BookOpen className="h-3 w-3" />
                              Knjiži
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`/knjigovodstvo/temeljnice?dokument=${u.id}`} title="Knjiženja">
                              <FileText className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
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

function ManualForm({
  companyId,
  useSupabase,
  addSupabase,
  addMock,
  onSuccess,
}: {
  companyId: string;
  useSupabase: boolean;
  addSupabase: ReturnType<typeof useAddUlazniRacun>;
  addMock: (r: Omit<import("@/lib/types").UlazniRacun, "id" | "created_at">) => import("@/lib/types").UlazniRacun;
  onSuccess: () => void;
}) {
  const [broj, setBroj] = useState("");
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [opis, setOpis] = useState("");
  const [ukupno, setUkupno] = useState("");
  const [ukupnoPdv, setUkupnoPdv] = useState("");
  const [konto, setKonto] = useState("4290");
  const [kategorija, setKategorija] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const iznos = parseFloat(ukupno.replace(",", ".")) || 0;
    const pdv = parseFloat(ukupnoPdv.replace(",", ".")) || 0;
    if (iznos <= 0) {
      toast.error("Unesite iznos.");
      return;
    }
    const payload = {
      company_id: companyId,
      broj_racuna_dobavljaca: broj || undefined,
      datum_racuna: datum,
      opis: opis || undefined,
      ukupno_s_pdv: iznos,
      ukupno_pdv: pdv || undefined,
      ukupno_bez_pdv: pdv ? iznos - pdv : undefined,
      pdv_odbiten: true,
      status: "neprocesen" as const,
      konto_troska: konto || undefined,
      kategorija: kategorija || undefined,
    };
    try {
      if (useSupabase) {
        await addSupabase.mutateAsync(payload);
      } else {
        addMock(payload);
      }
      toast.success("Ulazni račun dodan.");
      setBroj("");
      setOpis("");
      setUkupno("");
      setUkupnoPdv("");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4">
      <div>
        <Label>Broj računa dobavljača</Label>
        <Input value={broj} onChange={(e) => setBroj(e.target.value)} placeholder="npr. 1/2024" />
      </div>
      <div>
        <Label>Datum računa</Label>
        <Input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
      </div>
      <div>
        <Label>Opis / Dobavljač</Label>
        <Input value={opis} onChange={(e) => setOpis(e.target.value)} placeholder="Naziv dobavljača" />
      </div>
      <div>
        <Label>Ukupno s PDV (€)</Label>
        <Input type="number" step="0.01" value={ukupno} onChange={(e) => setUkupno(e.target.value)} required />
      </div>
      <div>
        <Label>PDV iznos (€)</Label>
        <Input type="number" step="0.01" value={ukupnoPdv} onChange={(e) => setUkupnoPdv(e.target.value)} />
      </div>
      <div>
        <Label>Konto troška</Label>
        <Input value={konto} onChange={(e) => setKonto(e.target.value)} placeholder="4290" />
      </div>
      <div>
        <Label>Kategorija</Label>
        <Input value={kategorija} onChange={(e) => setKategorija(e.target.value)} placeholder="Opcionalno" />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" disabled={addSupabase.isPending && useSupabase}>Spremi</Button>
        <Button type="button" variant="outline" onClick={onSuccess}>Odustani</Button>
      </div>
    </form>
  );
}
