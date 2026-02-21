import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const KATEGORIJE =
  "Telekomunikacije|Uredski materijal|Gorivo|Najam|Računalne usluge|Marketing|Prijevoz|Hrana i piće|Komunalne usluge|Reprezentacija|Stručna literatura|Osiguranje|Servis|Ostalo";

const KONTNI_PLAN = `4110=Sirovine, 4210=Usluge, 4220=Zakup/najam, 4230=Telefon/internet, 4240=Reklama/marketing, 4250=Prijevoz, 4260=Reprezentacija, 4270=Osiguranje, 4280=Stručno usavršavanje, 4290=Ostali troškovi, 4300=Amortizacija, 6000=Komunalije`;

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "OPENAI_API_KEY nije postavljen" },
      { status: 500 }
    );
  }
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, error: "Nedostaje datoteka" },
        { status: 400 }
      );
    }
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            ...(mimeType === "application/pdf"
              ? [
                  {
                    type: "text" as const,
                    text: "Ova datoteka je PDF. Ako ne možeš analizirati PDF, vrati JSON s null vrijednostima i opis: 'PDF nije podržan za analizu, unesite ručno.'",
                  },
                ]
              : [
                  {
                    type: "image_url" as const,
                    image_url: {
                      url: `data:${mimeType};base64,${base64}`,
                      detail: "high" as const,
                    },
                  },
                ]),
            {
              type: "text" as const,
              text: `Analiziraj ovaj hrvatski račun/fakturu i ekstrahiraj SVE podatke.
Odgovori ISKLJUČIVO u JSON formatu, bez ikakvog teksta prije ili poslije:
{
  "naziv_dobavljaca": "puni naziv firme",
  "oib_dobavljaca": "11 znamenki ili null",
  "pdv_id_dobavljaca": "HR + OIB ili null",
  "broj_racuna": "broj računa kako piše",
  "datum_racuna": "YYYY-MM-DD",
  "datum_valute": "YYYY-MM-DD ili null",
  "datum_isporuke": "YYYY-MM-DD ili null",
  "ukupno_bez_pdv": 0.00,
  "pdv_iznos": 0.00,
  "pdv_stopa": 25,
  "ukupno_s_pdv": 0.00,
  "iban_dobavljaca": "HR... ili null",
  "model_placanja": "HR99 ili null",
  "poziv_na_broj": "poziv na broj ili null",
  "kategorija": "jedna od: ${KATEGORIJE}",
  "konto": "4xxx prema RRiF kontnom planu: ${KONTNI_PLAN}",
  "opis": "kratki opis što je račun"
}

Sve brojeve kao brojeve (number), ne string. Datume kao YYYY-MM-DD string ili null.`,
            },
          ],
        },
      ],
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content ?? "";
    const clean = content.replace(/```json|```/g, "").trim();
    const data = JSON.parse(clean);

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("AI scan error:", e);
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Nije moguće očitati račun automatski",
      },
      { status: 500 }
    );
  }
}
