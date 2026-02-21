"use client";

import Link from "next/link";
import { RacunForm } from "@/components/racuni/RacunForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NoviRacunPage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/racuni">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Novi račun</h1>
      </div>
      <RacunForm />
    </div>
  );
}
