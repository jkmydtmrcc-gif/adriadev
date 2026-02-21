"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PonudaForm } from "@/components/ponude/PonudaForm";
import { ArrowLeft } from "lucide-react";

export default function NovaPonudaPage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ponude">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Nova ponuda</h1>
      </div>
      <PonudaForm />
    </div>
  );
}
