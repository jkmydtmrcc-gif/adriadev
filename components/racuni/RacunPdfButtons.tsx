"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { RacunPDFDocument } from "@/components/pdf/RacunPDF";
import type { Company } from "@/lib/types";
import type { Kontakt } from "@/lib/types";
import type { Racun } from "@/lib/types";
import type { RacunStavka } from "@/lib/types";
import { FileDown, ExternalLink, Printer } from "lucide-react";

interface RacunPdfButtonsProps {
  company: Company;
  kontakt: Kontakt;
  racun: Racun;
  stavke: RacunStavka[];
}

export function RacunPdfButtons({ company, kontakt, racun, stavke }: RacunPdfButtonsProps) {
  const [loading, setLoading] = useState(false);

  const generatePdf = async (action: "download" | "open" | "print") => {
    setLoading(true);
    try {
      const doc = (
        <RacunPDFDocument
          company={company}
          kontakt={kontakt}
          racun={racun}
          stavke={stavke}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      if (action === "download") {
        const a = document.createElement("a");
        a.href = url;
        a.download = `racun-${racun.broj_racuna.replace(/\s/g, "-")}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const w = window.open(url, "_blank");
        if (w && action === "print") w.onload = () => w.print();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => generatePdf("download")}
        className="gap-2"
      >
        <FileDown className="h-4 w-4" />
        Preuzmi PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => generatePdf("open")}
        className="gap-2"
      >
        <ExternalLink className="h-4 w-4" />
        Otvori PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => generatePdf("print")}
        className="gap-2"
      >
        <Printer className="h-4 w-4" />
        Ispis
      </Button>
    </div>
  );
}
