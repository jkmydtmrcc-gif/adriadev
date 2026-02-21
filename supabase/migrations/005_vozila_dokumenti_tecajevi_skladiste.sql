-- Vozila i troškovi
CREATE TABLE IF NOT EXISTS vozila (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  naziv TEXT NOT NULL,
  registracija TEXT NOT NULL,
  marka TEXT,
  model TEXT,
  godina INTEGER,
  datum_nabave DATE,
  nabavna_vrijednost DECIMAL(15,2),
  porezno_priznato INTEGER DEFAULT 50 CHECK (porezno_priznato IN (50,100)),
  konto_amortizacije TEXT DEFAULT '4300',
  stopa_amortizacije DECIMAL(5,2) DEFAULT 20,
  aktivno BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS vozila_troskovi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vozilo_id UUID REFERENCES vozila(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  datum DATE NOT NULL,
  tip TEXT,
  iznos DECIMAL(15,2) NOT NULL,
  opis TEXT,
  ulazni_racun_id UUID REFERENCES ulazni_racuni(id)
);

-- Dokumenti
CREATE TABLE IF NOT EXISTS dokumenti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  naziv TEXT NOT NULL,
  kategorija TEXT CHECK (kategorija IN (
    'racun','ulazni_racun','ugovor','putni_nalog','place','pdv','gfi','ostalo'
  )),
  tags TEXT[] DEFAULT '{}',
  storage_path TEXT NOT NULL,
  velicina INTEGER,
  mime_type TEXT,
  dokument_tip TEXT,
  dokument_id UUID,
  podijeljen_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tečajevi (HNB)
CREATE TABLE IF NOT EXISTS tecajevi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valuta TEXT NOT NULL,
  datum DATE NOT NULL,
  tecaj DECIMAL(15,6) NOT NULL,
  UNIQUE(valuta, datum)
);

ALTER TABLE racuni
  ADD COLUMN IF NOT EXISTS valuta TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS tecaj DECIMAL(15,6) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS iznos_eur DECIMAL(15,2);

-- Proizvodi i skladišni pokreti
CREATE TABLE IF NOT EXISTS proizvodi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  naziv TEXT NOT NULL,
  sifra TEXT,
  jmj TEXT DEFAULT 'kom',
  cijena_nabave DECIMAL(15,4),
  cijena_prodaje DECIMAL(15,4),
  pdv_stopa DECIMAL(5,2) DEFAULT 25,
  kolicina_na_skladistu DECIMAL(15,4) DEFAULT 0,
  min_kolicina DECIMAL(15,4) DEFAULT 0,
  konto_zaliha TEXT DEFAULT '1300',
  aktivan BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS skladisni_pokreti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  proizvod_id UUID REFERENCES proizvodi(id) ON DELETE CASCADE,
  tip TEXT CHECK (tip IN ('ulaz','izlaz','inventura','otpis')),
  kolicina DECIMAL(15,4) NOT NULL,
  cijena_po_kom DECIMAL(15,4),
  ukupno DECIMAL(15,2),
  dokument_tip TEXT,
  dokument_id UUID,
  datum DATE NOT NULL,
  napomena TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vozila ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies vozila" ON vozila FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE vozila_troskovi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies vozila_troskovi" ON vozila_troskovi FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE dokumenti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies dokumenti" ON dokumenti FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE proizvodi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies proizvodi" ON proizvodi FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE skladisni_pokreti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies skladisni_pokreti" ON skladisni_pokreti FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
