"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Calendar } from "lucide-react";

const defaultRokovi = [
  { label: "JOPPD prijava", datum: "15. u mjesecu", tip: "mjesečno" },
  { label: "PDV prijava", datum: "Do 20. u narednom mjesecu", tip: "mjesečno" },
  { label: "Godišnji PDV (PDV-K)", datum: "Do 28. veljače", tip: "godišnje" },
];

export function TaxObligations() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4 text-primary" />
          PDV i porezni rokovi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {defaultRokovi.map((r, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg border border-slate-100 p-2"
            >
              <div>
                <div className="font-medium text-slate-900">{r.label}</div>
                <div className="text-xs text-slate-500">{r.tip}</div>
              </div>
              <span className="text-sm text-slate-600">{r.datum}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
