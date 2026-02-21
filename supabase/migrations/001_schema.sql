-- Knjigovodstvo – kompletna shema + RLS
-- Pokreni u Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Firme (korisnik može imati više firmi)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  naziv TEXT NOT NULL,
  oib TEXT NOT NULL,
  adresa TEXT,
  grad TEXT,
  postanski_broj TEXT,
  drzava TEXT DEFAULT 'HR',
  iban TEXT,
  pdv_obveznik BOOLEAN DEFAULT false,
  pdv_id TEXT,
  djelatnost TEXT,
  mbs TEXT,
  nadlezni_sud TEXT,
  temeljni_kapital DECIMAL(15,2),
  tip_firme TEXT CHECK (tip_firme IN ('obrt', 'jdoo', 'doo', 'pausalni_obrt')),
  logo_url TEXT,
  boja_primarna TEXT DEFAULT '#2563eb',
  footer_tekst TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Kontakti
CREATE TABLE IF NOT EXISTS kontakti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  naziv TEXT NOT NULL,
  oib TEXT,
  pdv_id TEXT,
  tip TEXT CHECK (tip IN ('kupac', 'dobavljac', 'oboje')),
  adresa TEXT,
  grad TEXT,
  postanski_broj TEXT,
  drzava TEXT DEFAULT 'HR',
  email TEXT,
  telefon TEXT,
  iban TEXT,
  napomena TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Artikli
CREATE TABLE IF NOT EXISTS artikli (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  naziv TEXT NOT NULL,
  opis TEXT,
  jedinica_mjere TEXT DEFAULT 'kom',
  cijena DECIMAL(15,2) NOT NULL,
  pdv_stopa DECIMAL(5,2) DEFAULT 25.00,
  konto TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ponude
CREATE TABLE IF NOT EXISTS ponude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  kontakt_id UUID REFERENCES kontakti(id),
  broj_ponude TEXT NOT NULL,
  datum DATE NOT NULL,
  datum_valjanosti DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'poslana', 'prihvacena', 'odbijena', 'istekla')),
  napomena TEXT,
  uvjeti_placanja TEXT,
  ukupno_bez_pdv DECIMAL(15,2),
  ukupno_pdv DECIMAL(15,2),
  ukupno_s_pdv DECIMAL(15,2),
  valuta TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stavke ponude
CREATE TABLE IF NOT EXISTS ponude_stavke (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ponuda_id UUID REFERENCES ponude(id) ON DELETE CASCADE,
  artikl_id UUID REFERENCES artikli(id),
  naziv TEXT NOT NULL,
  opis TEXT,
  kolicina DECIMAL(15,4) NOT NULL,
  jedinica_mjere TEXT,
  cijena_bez_pdv DECIMAL(15,4) NOT NULL,
  pdv_stopa DECIMAL(5,2) DEFAULT 25.00,
  pdv_iznos DECIMAL(15,2),
  ukupno DECIMAL(15,2),
  redosljed INTEGER DEFAULT 0
);

-- Računi (izlazni)
CREATE TABLE IF NOT EXISTS racuni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  kontakt_id UUID REFERENCES kontakti(id),
  ponuda_id UUID REFERENCES ponude(id),
  broj_racuna TEXT NOT NULL,
  datum_izdavanja DATE NOT NULL,
  datum_valute DATE NOT NULL,
  datum_isporuke DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'izdan', 'poslan', 'djelomicno_placen', 'placen', 'storniran')),
  tip TEXT DEFAULT 'racun' CHECK (tip IN ('racun', 'avansni_racun', 'storno')),
  nacin_placanja TEXT DEFAULT 'transakcijski_racun',
  napomena TEXT,
  ukupno_bez_pdv DECIMAL(15,2),
  ukupno_pdv DECIMAL(15,2),
  ukupno_s_pdv DECIMAL(15,2),
  placeno DECIMAL(15,2) DEFAULT 0,
  valuta TEXT DEFAULT 'EUR',
  eracun_status TEXT,
  eracun_xml TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stavke računa
CREATE TABLE IF NOT EXISTS racuni_stavke (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  racun_id UUID REFERENCES racuni(id) ON DELETE CASCADE,
  artikl_id UUID REFERENCES artikli(id),
  naziv TEXT NOT NULL,
  opis TEXT,
  kolicina DECIMAL(15,4) NOT NULL,
  jedinica_mjere TEXT,
  cijena_bez_pdv DECIMAL(15,4) NOT NULL,
  pdv_stopa DECIMAL(5,2) DEFAULT 25.00,
  pdv_iznos DECIMAL(15,2),
  ukupno DECIMAL(15,2),
  konto_prihoda TEXT DEFAULT '7500',
  redosljed INTEGER DEFAULT 0
);

-- Ulazni računi
CREATE TABLE IF NOT EXISTS ulazni_racuni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  kontakt_id UUID REFERENCES kontakti(id),
  broj_racuna_dobavljaca TEXT,
  datum_racuna DATE NOT NULL,
  datum_valute DATE,
  datum_primitka DATE,
  opis TEXT,
  ukupno_bez_pdv DECIMAL(15,2),
  ukupno_pdv DECIMAL(15,2),
  ukupno_s_pdv DECIMAL(15,2) NOT NULL,
  pdv_odbiten BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'neprocesen' CHECK (status IN ('neprocesen', 'knjizen', 'placen')),
  konto_troska TEXT,
  kategorija TEXT,
  dokument_url TEXT,
  ai_kategorija TEXT,
  ai_konto TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Kontni plan
CREATE TABLE IF NOT EXISTS kontni_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  konto TEXT NOT NULL,
  naziv TEXT NOT NULL,
  tip TEXT CHECK (tip IN ('aktiva', 'pasiva', 'prihod', 'rashod', 'izvanbilancni')),
  razred INTEGER,
  parent_konto TEXT,
  pdv_konto BOOLEAN DEFAULT false,
  aktivan BOOLEAN DEFAULT true
);

-- Temeljnice
CREATE TABLE IF NOT EXISTS temeljnice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  broj_temeljnice TEXT NOT NULL,
  datum DATE NOT NULL,
  opis TEXT,
  dokument_tip TEXT,
  dokument_id UUID,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'knjizena', 'stornirana')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stavke temeljnice
CREATE TABLE IF NOT EXISTS temeljnice_stavke (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temeljnica_id UUID REFERENCES temeljnice(id) ON DELETE CASCADE,
  konto TEXT NOT NULL,
  naziv_konta TEXT,
  duguje DECIMAL(15,2) DEFAULT 0,
  potrazuje DECIMAL(15,2) DEFAULT 0,
  opis TEXT,
  partner_id UUID REFERENCES kontakti(id)
);

-- Radnici (prije place jer place referencira radnici)
CREATE TABLE IF NOT EXISTS radnici (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  ime TEXT NOT NULL,
  prezime TEXT NOT NULL,
  oib TEXT NOT NULL,
  datum_rodenja DATE,
  adresa TEXT,
  grad TEXT,
  iban TEXT,
  bruto_placa DECIMAL(15,2),
  koeficijent_osobnog_odbitka DECIMAL(5,2) DEFAULT 1.0,
  opcina_placanja_poreza TEXT,
  aktivan BOOLEAN DEFAULT true,
  datum_zaposlenja DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Plaće
CREATE TABLE IF NOT EXISTS place (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  radnik_id UUID REFERENCES radnici(id) ON DELETE CASCADE,
  period_od DATE NOT NULL,
  period_do DATE NOT NULL,
  bruto DECIMAL(15,2) NOT NULL,
  doprinosi_iz_place DECIMAL(15,2),
  dohodak DECIMAL(15,2),
  osobni_odbitak DECIMAL(15,2),
  porezna_osnovica DECIMAL(15,2),
  porez_i_prirez DECIMAL(15,2),
  neto DECIMAL(15,2),
  doprinosi_na_placu DECIMAL(15,2),
  ukupni_trosak DECIMAL(15,2),
  joppd_poslan BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bankovni promet
CREATE TABLE IF NOT EXISTS bankovni_promet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  datum DATE NOT NULL,
  iznos DECIMAL(15,2) NOT NULL,
  tip TEXT CHECK (tip IN ('prihod', 'rashod')),
  opis TEXT,
  racun_id UUID REFERENCES racuni(id),
  ulazni_racun_id UUID REFERENCES ulazni_racuni(id),
  kategorizirano BOOLEAN DEFAULT false,
  ai_prijedlog TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: companies (bez funkcije u auth schema – koristimo inline subquery)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own companies" ON companies FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS: sve ostale tablice po company_id (company_id mora biti u tvrtkama trenutnog usera)
ALTER TABLE kontakti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies kontakti" ON kontakti FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE artikli ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies artikli" ON artikli FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE ponude ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies ponude" ON ponude FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE ponude_stavke ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies ponude_stavke" ON ponude_stavke FOR ALL USING (
  ponuda_id IN (SELECT id FROM ponude WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
);

ALTER TABLE racuni ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies racuni" ON racuni FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE racuni_stavke ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies racuni_stavke" ON racuni_stavke FOR ALL USING (
  racun_id IN (SELECT id FROM racuni WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
);

ALTER TABLE ulazni_racuni ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies ulazni_racuni" ON ulazni_racuni FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE kontni_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies kontni_plan" ON kontni_plan FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE temeljnice ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies temeljnice" ON temeljnice FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE temeljnice_stavke ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies temeljnice_stavke" ON temeljnice_stavke FOR ALL USING (
  temeljnica_id IN (SELECT id FROM temeljnice WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
);

ALTER TABLE radnici ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies radnici" ON radnici FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE place ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies place" ON place FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE bankovni_promet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies bankovni_promet" ON bankovni_promet FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
