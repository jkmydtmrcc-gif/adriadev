"use client";

import Link from "next/link";
import { useMockStore } from "@/lib/mock-db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users } from "lucide-react";

const tipLabels: Record<string, string> = {
  kupac: "Kupac",
  dobavljac: "Dobavljač",
  oboje: "Kupac i dobavljač",
};

export default function KontaktiPage() {
  const currentCompanyId = useMockStore((s) => s.currentCompanyId);
  const kontakti = useMockStore((s) =>
    s.kontakti.filter((k) => k.company_id === currentCompanyId)
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Kontakti</h1>
        <Button asChild>
          <Link href="/kontakti/novi" className="gap-2">
            <Plus className="h-4 w-4" />
            Novi kontakt
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partneri (kupci i dobavljači)</CardTitle>
        </CardHeader>
        <CardContent>
          {kontakti.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">Nema kontakata.</p>
              <Button asChild className="mt-4">
                <Link href="/kontakti/novi">Dodaj prvi kontakt</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 font-medium">Naziv</th>
                    <th className="pb-3 font-medium">OIB</th>
                    <th className="pb-3 font-medium">Tip</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Grad</th>
                  </tr>
                </thead>
                <tbody>
                  {kontakti.map((k) => (
                    <tr key={k.id} className="border-b border-slate-100">
                      <td className="py-3 font-medium">
                        <Link href={`/kontakti/${k.id}`} className="text-primary hover:underline">
                          {k.naziv}
                        </Link>
                      </td>
                      <td className="py-3">{k.oib ?? "—"}</td>
                      <td className="py-3">{tipLabels[k.tip] ?? k.tip}</td>
                      <td className="py-3">{k.email ?? "—"}</td>
                      <td className="py-3">{k.grad ?? "—"}</td>
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
