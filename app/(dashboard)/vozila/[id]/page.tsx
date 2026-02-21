"use client";

import { useCompany } from "@/contexts/CompanyContext";
import { useUlazniRacuni } from "@/hooks/useUlazniRacuni";
import { getClient } from "@/lib/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Link2, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function VoziloDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { companyId, useSupabase } = useCompany();
  const queryClient = useQueryClient();
  const { data: ulazniRacuni = [] } = useUlazniRacuni(companyId);

  const { data: vozilo, isLoading } = useQuery({
    queryKey: ["vozilo", id],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase) return null;
      const { data, error } = await supabase.from("vozila").select("*").eq("id", id).single();
      if (error || !data) return null;
      return data;
    },
    enabled: !!id && !!useSupabase,
  });

  const { data: troskovi = [], isLoading: loadingTroskovi } = useQuery({
    queryKey: ["vozila_troskovi", id],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("vozila_troskovi")
        .select("*")
        .eq("vozilo_id", id)
        .order("datum", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id && !!useSupabase,
  });

  const [linkModal, setLinkModal] = useState<{ trošakId: string; ulazni_racun_id: string; porezno_priznato: number } | null>(null);
  const [newTrošak, setNewTrošak] = useState({ datum: new Date().toISOString().slice(0, 10), tip: "", iznos: "", opis: "" });

  const addTrošakMutation = useMutation({
    mutationFn: async (payload: { datum: string; tip: string; iznos: number; opis: string }) => {
      const supabase = getClient();
      if (!supabase || !companyId) throw new Error("Supabase nije dostupan");
      const { error } = await supabase.from("vozila_troskovi").insert({
        vozilo_id: id,
        company_id: companyId,
        datum: payload.datum,
        tip: payload.tip || null,
        iznos: payload.iznos,
        opis: payload.opis || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vozila_troskovi", id] });
      setNewTrošak({ datum: new Date().toISOString().slice(0, 10), tip: "", iznos: "", opis: "" });
      toast.success("Trošak dodan.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateTrošakMutation = useMutation({
    mutationFn: async ({
      trošakId,
      ulazni_racun_id,
      porezno_priznato,
    }: {
      trošakId: string;
      ulazni_racun_id: string | null;
      porezno_priznato: number;
    }) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije dostupan");
      const { error } = await supabase
        .from("vozila_troskovi")
        .update({ ulazni_racun_id: ulazni_racun_id || null, porezno_priznato })
        .eq("id", trošakId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vozila_troskovi", id] });
      setLinkModal(null);
      toast.success("Trošak povezan s ulaznim računom.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const getUlazniRacunLabel = (ulazniId: string | null) => {
    if (!ulazniId) return "—";
    const r = ulazniRacuni.find((u) => u.id === ulazniId);
    return r ? `${r.broj_racuna ?? r.id.slice(0, 8)} (${formatDate(r.datum_racuna)})` : ulazniId.slice(0, 8);
  };

  if (!useSupabase) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Vozila zahtijevaju Supabase.</p>
        <Button asChild className="mt-4"><Link href="/vozila">Natrag</Link></Button>
      </div>
    );
  }

  if (isLoading || !vozilo) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Učitavanje…</p>
        <Button asChild className="mt-4"><Link href="/vozila">Natrag</Link></Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          <Car className="mr-2 inline h-6 w-6" />
          {vozilo.naziv} ({vozilo.registracija})
        </h1>
        <Button variant="outline" asChild>
          <Link href="/vozila">Natrag na vozila</Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Podaci vozila</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>Marka / model: {[vozilo.marka, vozilo.model].filter(Boolean).join(" ") || "—"}</div>
          <div>Nabavna vrijednost: {vozilo.nabavna_vrijednost != null ? formatCurrency(vozilo.nabavna_vrijednost) : "—"}</div>
          <div>Porezno priznato (vozilo): {vozilo.porezno_priznato}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troškovi vozila</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-2 font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> Dodaj trošak</h4>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <Label>Datum</Label>
                <Input type="date" value={newTrošak.datum} onChange={(e) => setNewTrošak((s) => ({ ...s, datum: e.target.value }))} />
              </div>
              <div>
                <Label>Tip</Label>
                <Input placeholder="npr. gorivo" value={newTrošak.tip} onChange={(e) => setNewTrošak((s) => ({ ...s, tip: e.target.value }))} />
              </div>
              <div>
                <Label>Iznos</Label>
                <Input type="number" step={0.01} placeholder="0" value={newTrošak.iznos} onChange={(e) => setNewTrošak((s) => ({ ...s, iznos: e.target.value }))} />
              </div>
              <div className="flex-1 min-w-[120px]">
                <Label>Opis</Label>
                <Input placeholder="Opis" value={newTrošak.opis} onChange={(e) => setNewTrošak((s) => ({ ...s, opis: e.target.value }))} />
              </div>
              <Button
                onClick={() => {
                  const iznos = Number(newTrošak.iznos);
                  if (!newTrošak.datum || isNaN(iznos) || iznos <= 0) {
                    toast.error("Unesite datum i iznos.");
                    return;
                  }
                  addTrošakMutation.mutate({
                    datum: newTrošak.datum,
                    tip: newTrošak.tip,
                    iznos,
                    opis: newTrošak.opis,
                  });
                }}
                disabled={addTrošakMutation.isPending}
              >
                Dodaj
              </Button>
            </div>
          </div>
          {loadingTroskovi ? (
            <p className="text-slate-500">Učitavanje troškova…</p>
          ) : troskovi.length === 0 ? (
            <p className="text-slate-500">Nema unosa troškova za ovo vozilo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Datum</th>
                    <th className="pb-3 font-medium">Tip</th>
                    <th className="pb-3 font-medium text-right">Iznos</th>
                    <th className="pb-3 font-medium">Opis</th>
                    <th className="pb-3 font-medium">Ulazni račun</th>
                    <th className="pb-3 font-medium">Porezno priznato</th>
                    <th className="pb-3 font-medium">Akcija</th>
                  </tr>
                </thead>
                <tbody>
                  {troskovi.map((t: { id: string; datum: string; tip: string | null; iznos: number; opis: string | null; ulazni_racun_id: string | null; porezno_priznato: number | null }) => (
                    <tr key={t.id} className="border-b border-slate-100">
                      <td className="py-3">{formatDate(t.datum)}</td>
                      <td className="py-3">{t.tip ?? "—"}</td>
                      <td className="py-3 text-right">{formatCurrency(t.iznos)}</td>
                      <td className="py-3">{t.opis ?? "—"}</td>
                      <td className="py-3">{getUlazniRacunLabel(t.ulazni_racun_id)}</td>
                      <td className="py-3">{t.porezno_priznato ?? 50}%</td>
                      <td className="py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => setLinkModal({ trošakId: t.id, ulazni_racun_id: t.ulazni_racun_id ?? "", porezno_priznato: t.porezno_priznato ?? 50 })}
                        >
                          <Link2 className="h-4 w-4" />
                          Poveži trošak
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

      <Dialog open={!!linkModal} onOpenChange={(open) => !open && setLinkModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Poveži trošak s ulaznim računom</DialogTitle>
          </DialogHeader>
          {linkModal && (
            <>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Ulazni račun</label>
                  <Select
                    value={linkModal.ulazni_racun_id || "none"}
                    onValueChange={(v) => setLinkModal((m) => (m ? { ...m, ulazni_racun_id: v === "none" ? "" : v } : m))}
                  >
                    <SelectTrigger><SelectValue placeholder="Odaberi račun" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Bez povezanog računa —</SelectItem>
                      {ulazniRacuni.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.broj_racuna ?? u.id.slice(0, 8)} — {formatDate(u.datum_racuna)} — {formatCurrency(u.ukupno_s_pdv ?? 0)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Porezno priznato</label>
                  <Select
                    value={String(linkModal.porezno_priznato)}
                    onValueChange={(v) => setLinkModal((m) => (m ? { ...m, porezno_priznato: Number(v) } : m))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50%</SelectItem>
                      <SelectItem value="100">100%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLinkModal(null)}>Odustani</Button>
                <Button
                  onClick={() => {
                    updateTrošakMutation.mutate({
                      trošakId: linkModal.trošakId,
                      ulazni_racun_id: linkModal.ulazni_racun_id || null,
                      porezno_priznato: linkModal.porezno_priznato,
                    });
                  }}
                  disabled={updateTrošakMutation.isPending}
                >
                  Spremi
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
