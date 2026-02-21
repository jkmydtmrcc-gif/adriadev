"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useMockStore } from "@/lib/mock-db";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { RacunFormEdit } from "@/components/racuni/RacunFormEdit";

export default function UrediRacunPage() {
  const params = useParams();
  const id = params.id as string;
  const racun = useMockStore((s) => s.getRacun(id));

  if (!racun) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Račun nije pronađen.</p>
        <Button asChild className="mt-4">
          <Link href="/racuni">Natrag</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/racuni/${racun.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Uredi račun {racun.broj_racuna}</h1>
      </div>
      <RacunFormEdit racun={racun} />
    </div>
  );
}
