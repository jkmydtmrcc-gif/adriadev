"use client";

import { useCompany } from "@/contexts/CompanyContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileStack, Upload, Download, Trash2, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const KATEGORIJE = [
  { value: "racun", label: "Račun" },
  { value: "ulazni_racun", label: "Ulazni račun" },
  { value: "ugovor", label: "Ugovor" },
  { value: "putni_nalog", label: "Putni nalog" },
  { value: "place", label: "Plaće" },
  { value: "pdv", label: "PDV" },
  { value: "gfi", label: "GFI" },
  { value: "ostalo", label: "Ostalo" },
];

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DokumentiPage() {
  const { companyId, useSupabase } = useCompany();
  const [kategorija, setKategorija] = useState<string>("");
  const [tag, setTag] = useState("");
  const queryClient = useQueryClient();

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["dokumenti", companyId, kategorija || null, tag || null],
    queryFn: async () => {
      const params = new URLSearchParams({ company_id: companyId! });
      if (kategorija) params.set("kategorija", kategorija);
      if (tag) params.set("tag", tag);
      const res = await fetch(`/api/dokumenti/list?${params}`);
      if (!res.ok) throw new Error("Greška u učitavanju");
      return res.json();
    },
    enabled: !!companyId && !!useSupabase,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/dokumenti/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || res.statusText);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dokumenti", companyId] });
      toast.success("Dokument učitan.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dokumenti/delete?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Greška pri brisanju");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dokumenti", companyId] });
      toast.success("Dokument obrisan.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const shareMutation = useMutation({
    mutationFn: async ({ id, enable }: { id: string; enable: boolean }) => {
      const res = await fetch("/api/dokumenti/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enable }),
      });
      if (!res.ok) throw new Error("Greška");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.link) {
        navigator.clipboard.writeText(data.link);
        toast.success("Link za dijeljenje kopiran u međuspremnik.");
      } else {
        toast.success("Dijeljenje ukinuto.");
      }
      queryClient.invalidateQueries({ queryKey: ["dokumenti", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !companyId) return;
      const formData = new FormData();
      formData.set("file", file);
      formData.set("company_id", companyId);
      formData.set("naziv", file.name);
      formData.set("kategorija", kategorija || "ostalo");
      uploadMutation.mutate(formData);
      e.target.value = "";
    },
    [companyId, kategorija, uploadMutation]
  );

  const totalBytes = list.reduce((acc: number, d: { velicina?: number }) => acc + (d.velicina || 0), 0);

  if (!useSupabase) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Dokumentni centar</h1>
        <p className="text-slate-500">Dokumentni centar zahtijeva Supabase i odabranu tvrtku.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Dokumentni centar</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileStack className="h-5 w-5" />
            Upload i filteri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Kategorija</Label>
              <Select value={kategorija || "sve"} onValueChange={(v) => setKategorija(v === "sve" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Sve" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sve">Sve</SelectItem>
                  {KATEGORIJE.map((k) => (
                    <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label>Tag</Label>
              <Input placeholder="Tag" value={tag} onChange={(e) => setTag(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Label className="cursor-pointer rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm hover:bg-slate-100">
              <Upload className="mr-2 inline h-4 w-4" />
              Odaberi datoteku
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploadMutation.isPending || !companyId} />
            </Label>
            {uploadMutation.isPending && <Loader2 className="h-5 w-5 animate-spin text-slate-500" />}
          </div>
          <p className="text-xs text-slate-500">
            Korišteno: {formatBytes(totalBytes)} (PDF, slike, Word, Excel, CSV, XML, tekst).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dokumenti</CardTitle>
        </CardHeader>
        <CardContent>
          {!companyId ? (
            <p className="text-slate-500">Odaberite tvrtku.</p>
          ) : isLoading ? (
            <p className="text-slate-500">Učitavanje…</p>
          ) : list.length === 0 ? (
            <p className="text-slate-500">Nema dokumenata. Učitajte datoteku iznad.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Naziv</th>
                    <th className="pb-3 font-medium">Kategorija</th>
                    <th className="pb-3 font-medium">Veličina</th>
                    <th className="pb-3 font-medium">Datum</th>
                    <th className="pb-3 font-medium">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((d: { id: string; naziv: string; kategorija: string | null; velicina: number | null; created_at: string }) => (
                    <tr key={d.id} className="border-b border-slate-100">
                      <td className="py-3 font-medium">{d.naziv}</td>
                      <td className="py-3">{KATEGORIJE.find((k) => k.value === d.kategorija)?.label ?? d.kategorija ?? "—"}</td>
                      <td className="py-3">{d.velicina != null ? formatBytes(d.velicina) : "—"}</td>
                      <td className="py-3">{d.created_at ? new Date(d.created_at).toLocaleDateString("hr-HR") : "—"}</td>
                      <td className="py-3 flex gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/api/dokumenti/download?id=${d.id}`} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareMutation.mutate({ id: d.id, enable: true })}
                          disabled={shareMutation.isPending}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(d.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
