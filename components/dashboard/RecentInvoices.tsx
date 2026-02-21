"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";
import type { Racun } from "@/lib/types";

const statusLabels: Record<string, string> = {
  draft: "Nacrt",
  izdan: "Izdan",
  poslan: "Poslan",
  djelomicno_placen: "Djelomično plaćen",
  placen: "Plaćen",
  storniran: "Storniran",
};

const statusColor: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  izdan: "bg-blue-100 text-blue-700",
  poslan: "bg-amber-100 text-amber-700",
  djelomicno_placen: "bg-orange-100 text-orange-700",
  placen: "bg-green-100 text-green-700",
  storniran: "bg-red-100 text-red-700",
};

export function RecentInvoices({ racuni }: { racuni: Racun[] }) {
  const recent = racuni
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Zadnji računi</CardTitle>
        <Link
          href="/racuni"
          className="text-sm font-medium text-primary hover:underline"
        >
          Svi
        </Link>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">Nema računa. Kreiraj prvi račun.</p>
        ) : (
          <ul className="space-y-3">
            {recent.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/racuni/${r.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-2 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="font-medium text-slate-900">
                        {r.broj_racuna}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDate(r.datum_izdavanja)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(r.ukupno_s_pdv ?? 0)}
                    </div>
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-xs ${statusColor[r.status] ?? "bg-slate-100"}`}
                    >
                      {statusLabels[r.status] ?? r.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
