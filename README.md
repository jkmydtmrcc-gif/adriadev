# Knjigovodstvo — Hrvatsko računovodstvo i fakturiranje

Aplikacija podržava **Supabase** (produkcija) i **lokalni mock** (testiranje bez baze).

## 1. Pokretanje

```bash
npm install
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000).

- **Bez Supabase** (nema `.env.local`): automatski se koristi mock (localStorage). Otvori direktno `/dashboard`.
- **Sa Supabase** (postavljen `.env.local`): otvori `/login`, registriraj se, dodaj tvrtku (onboarding), zatim dashboard.

## 2. Supabase setup

1. Kreiraj projekt na [supabase.com](https://supabase.com).
2. U **SQL Editor** otvori i pokreni cijeli sadržaj datoteke:
   - `supabase/migrations/001_schema.sql`
3. U **Authentication → Providers** uključi **Email** (Enable Email provider).
4. U rootu projekta kreiraj `.env.local` (ili prepiši iz `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://tvoj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tvoj_anon_key
OPENAI_API_KEY=sk-...   # opcionalno, za AI uvide na dashboardu
```

5. **Ne commitaj** `.env.local` (već je u `.gitignore`). Ako su ključevi izloženi, promijeni ih u Supabase dashboardu.

## 3. Što aplikacija sadrži

- **Auth**: Prijava, registracija, odjava (Supabase Auth). Onboarding – unos prve tvrtke.
- **Dashboard**: Statistike (prihodi, neplaćeni računi, PDV, troškovi), graf prihodi/rashodi, zadnji računi, PDV rokovi, AI uvidi (ako je postavljen `OPENAI_API_KEY`).
- **Računi**: Lista, novi račun (kupac, stavke, PDV), pregled, uređivanje, **Preuzmi PDF** i **Otvori PDF** (profesionalni ispis).
- **Ponude, Kontakti, Artikli**: Lista i pregled (forme za novi unos u izradi).
- **Ulazni računi, Banka, Knjigovodstvo, Plaće, PDV, Izvještaji**: Placeholder stranice za daljnji razvoj.
- **Postavke**: Pregled tvrtke, reset na početne podatke (samo u mock modu).

## 4. PDF računi

Na stranici pojedinačnog računa (`/racuni/[id]`) dostupni su gumbi:

- **Preuzmi PDF** – preuzimanje PDF-a (ime: `racun-BROJ.pdf`).
- **Otvori PDF** – otvaranje PDF-a u novom tabu.

PDF uključuje: podatke tvrtke i kupca, stavke, ukupno bez PDV / PDV / ukupno, footer s IBAN/OIB i zakonskim tekstom (čl. 75. Zakona o PDV-u).

## 5. Tehnologije

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase (Auth + PostgreSQL), Zustand (mock + persist)
- TanStack Query, Radix UI, Framer Motion, Recharts
- @react-pdf/renderer (PDF računa), Sonner (toastovi)
