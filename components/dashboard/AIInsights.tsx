"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

const defaultInsights = [
  "Prihodi su stabilni u zadnjih 6 mjeseci. Razmislite o maloj promociji za rast.",
  "Imate 3 računa koja kasne više od 30 dana. Pošaljite podsjetnik kupcima.",
  "PDV obveza za ovaj mjesec je unutar očekivanog. Prijava do 15. u sljedećem mjesecu.",
  "Troškovi za uredski materijal su porasli 12% u odnosu na prošli kvartal.",
];

export function AIInsights({ insights: propInsights }: { insights?: string[] }) {
  const [fetched, setFetched] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/dashboard/ai-insights")
      .then((r) => r.json())
      .then((d) => Array.isArray(d.insights) && d.insights.length && setFetched(d.insights))
      .catch(() => {});
  }, []);
  const list = propInsights?.length ? propInsights : (fetched.length ? fetched : defaultInsights);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          AI uvid
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {list.slice(0, 4).map((text, i) => (
            <li
              key={i}
              className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-sm text-slate-700"
            >
              {text}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
