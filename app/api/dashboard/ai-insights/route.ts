import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ insights: [] });
  }
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Ti si financijski asistent za hrvatsku tvrtku. Odgovaraj isključivo na hrvatskom. Daj 3 do 4 kratke, konkretne financijske savjete (po jednu rečenicu). Nemoj numerirati.",
          },
          {
            role: "user",
            content:
              "Generiraj 3-4 kratka uvida/savjeta za vlasnika tvrtke (npr. podsjetnik na PDV, neplaćene račune, trend prihoda). Jedna rečenica po uvidu.",
          },
        ],
        max_tokens: 300,
      }),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const insights = text
      .split(/\n+/)
      .map((s: string) => s.replace(/^[\d\.\-\*]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 4);
    return NextResponse.json({ insights });
  } catch (e) {
    console.error("AI insights error:", e);
    return NextResponse.json({ insights: [] });
  }
}
