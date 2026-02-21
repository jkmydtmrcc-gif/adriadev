"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, PlusCircle, Upload } from "lucide-react";

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild>
        <Link href="/racuni/novi" className="gap-2">
          <FileText className="h-4 w-4" />
          Novi račun
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/ponude/nova" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Nova ponuda
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/ulazni-racuni" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Dodaj trošak
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/banka" className="gap-2">
          <Upload className="h-4 w-4" />
          Uvezi bankovni promet
        </Link>
      </Button>
    </div>
  );
}
