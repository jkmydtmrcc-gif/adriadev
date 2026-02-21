"use client";

import { useState, useMemo } from "react";
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
import { izracunajUkupnoStavke, getPdvStope } from "@/lib/pdv-kalkulator";
import { Plus, Trash2 } from "lucide-react";
import type { Artikl } from "@/lib/types";

export interface StavkaRow {
  id: string;
  artikl_id?: string;
  naziv: string;
  opis?: string;
  kolicina: number;
  jedinica_mjere: string;
  cijena_bez_pdv: number;
  pdv_stopa: number;
  pdv_iznos?: number;
  ukupno?: number;
}

interface StavkeEditorProps {
  stavke: StavkaRow[];
  artikli: Artikl[];
  onChange: (stavke: StavkaRow[]) => void;
}

function newRow(): StavkaRow {
  return {
    id: crypto.randomUUID?.() ?? Math.random().toString(36),
    naziv: "",
    kolicina: 1,
    jedinica_mjere: "kom",
    cijena_bez_pdv: 0,
    pdv_stopa: 25,
    pdv_iznos: 0,
    ukupno: 0,
  };
}

export function StavkeEditor({ stavke, artikli, onChange }: StavkeEditorProps) {
  const pdvStope = getPdvStope();

  const updateRow = (id: string, data: Partial<StavkaRow>) => {
    const next = stavke.map((s) => {
      if (s.id !== id) return s;
      const updated = { ...s, ...data };
      const { pdv_iznos, ukupno } = izracunajUkupnoStavke(
        updated.kolicina,
        updated.cijena_bez_pdv,
        updated.pdv_stopa
      );
      return { ...updated, pdv_iznos, ukupno };
    });
    onChange(next);
  };

  const addRow = () => onChange([...stavke, newRow()]);

  const removeRow = (id: string) => onChange(stavke.filter((s) => s.id !== id));

  const selectArtikl = (rowId: string, artikl: Artikl | null) => {
    if (!artikl) return;
    const row = stavke.find((s) => s.id === rowId);
    if (!row) return;
    updateRow(rowId, {
      artikl_id: artikl.id,
      naziv: artikl.naziv,
      jedinica_mjere: artikl.jedinica_mjere,
      cijena_bez_pdv: artikl.cijena,
      pdv_stopa: artikl.pdv_stopa,
    });
  };

  const totals = useMemo(() => {
    let bez = 0,
      pdv = 0;
    stavke.forEach((s) => {
      const { pdv_iznos, ukupno } = izracunajUkupnoStavke(
        s.kolicina,
        s.cijena_bez_pdv,
        s.pdv_stopa
      );
      bez += s.kolicina * s.cijena_bez_pdv;
      pdv += pdv_iznos;
    });
    return {
      ukupno_bez_pdv: Math.round(bez * 100) / 100,
      ukupno_pdv: Math.round(pdv * 100) / 100,
      ukupno_s_pdv: Math.round((bez + pdv) * 100) / 100,
    };
  }, [stavke]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Stavke</Label>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj stavku
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="p-2 text-left font-medium">Artikl / Naziv</th>
              <th className="w-24 p-2 text-left font-medium">Količina</th>
              <th className="w-24 p-2 text-left font-medium">JMJ</th>
              <th className="w-32 p-2 text-right font-medium">Cijena bez PDV</th>
              <th className="w-24 p-2 text-left font-medium">PDV %</th>
              <th className="w-28 p-2 text-right font-medium">PDV</th>
              <th className="w-28 p-2 text-right font-medium">Ukupno</th>
              <th className="w-10 p-2"></th>
            </tr>
          </thead>
          <tbody>
            {stavke.map((s) => {
              const { pdv_iznos, ukupno } = izracunajUkupnoStavke(
                s.kolicina,
                s.cijena_bez_pdv,
                s.pdv_stopa
              );
              return (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="p-2">
                    <select
                      className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
                      value={s.artikl_id ?? ""}
                      onChange={(e) => {
                        const a = artikli.find((x) => x.id === e.target.value);
                        selectArtikl(s.id, a ?? null);
                      }}
                    >
                      <option value="">— Odaberi artikl —</option>
                      {artikli.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.naziv} ({a.cijena} €)
                        </option>
                      ))}
                    </select>
                    <Input
                      className="mt-1"
                      value={s.naziv}
                      onChange={(e) => updateRow(s.id, { naziv: e.target.value })}
                      placeholder="Naziv stavke"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={s.kolicina}
                      onChange={(e) =>
                        updateRow(s.id, { kolicina: Number(e.target.value) || 0 })
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={s.jedinica_mjere}
                      onChange={(e) =>
                        updateRow(s.id, { jedinica_mjere: e.target.value })
                      }
                      placeholder="kom"
                    />
                  </td>
                  <td className="p-2 text-right">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      className="text-right"
                      value={s.cijena_bez_pdv}
                      onChange={(e) =>
                        updateRow(s.id, {
                          cijena_bez_pdv: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Select
                      value={String(s.pdv_stopa)}
                      onValueChange={(v) =>
                        updateRow(s.id, { pdv_stopa: Number(v) })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pdvStope.map((stopa) => (
                          <SelectItem key={stopa} value={String(stopa)}>
                            {stopa}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2 text-right font-medium">
                    {pdv_iznos.toFixed(2)} €
                  </td>
                  <td className="p-2 text-right font-medium">
                    {ukupno.toFixed(2)} €
                  </td>
                  <td className="p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:bg-red-50"
                      onClick={() => removeRow(s.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {stavke.length > 0 && (
        <div className="flex justify-end gap-6 rounded-lg bg-slate-50 p-4 text-sm">
          <span>Bez PDV: <strong>{totals.ukupno_bez_pdv.toFixed(2)} €</strong></span>
          <span>PDV: <strong>{totals.ukupno_pdv.toFixed(2)} €</strong></span>
          <span>Ukupno s PDV: <strong>{totals.ukupno_s_pdv.toFixed(2)} €</strong></span>
        </div>
      )}
    </div>
  );
}
