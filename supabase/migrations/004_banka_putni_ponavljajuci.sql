-- Bankovni izvodi i matching na promet
CREATE TABLE IF NOT EXISTS bankovni_izvodi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  datum_uvoza TIMESTAMPTZ DEFAULT now(),
  format TEXT CHECK (format IN ('mt940','camt053','csv')),
  filename TEXT,
  broj_transakcija INTEGER,
  uvezeno_iznos DECIMAL(15,2)
);

ALTER TABLE bankovni_promet
  ADD COLUMN IF NOT EXISTS izvod_id UUID REFERENCES bankovni_izvodi(id),
  ADD COLUMN IF NOT EXISTS match_confidence INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS match_tip TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'neusklađeno'
    CHECK (status IN ('neusklađeno','usklađeno','djelomično','ignorirano'));

-- Putni nalozi
CREATE TABLE IF NOT EXISTS putni_nalozi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  radnik_id UUID REFERENCES radnici(id) ON DELETE SET NULL,
  broj_naloga TEXT NOT NULL,
  datum_polaska TIMESTAMPTZ NOT NULL,
  datum_povratka TIMESTAMPTZ NOT NULL,
  svrha TEXT NOT NULL,
  odrediste TEXT NOT NULL,
  drzava TEXT DEFAULT 'HR',
  tip TEXT CHECK (tip IN ('domace','inozemno')),
  prijevoz TEXT CHECK (prijevoz IN ('sluzbeni','privatni','javni')),
  registarska_oznaka TEXT,
  km_start DECIMAL(10,2),
  km_end DECIMAL(10,2),
  ukupno_km DECIMAL(10,2),
  cijena_po_km DECIMAL(5,4) DEFAULT 0.3,
  iznos_km DECIMAL(15,2) DEFAULT 0,
  broj_dnevnica DECIMAL(5,2) DEFAULT 0,
  iznos_dnevnice DECIMAL(10,2) DEFAULT 0,
  ukupno_dnevnice DECIMAL(15,2) DEFAULT 0,
  cestarina DECIMAL(15,2) DEFAULT 0,
  parking DECIMAL(15,2) DEFAULT 0,
  gorivo DECIMAL(15,2) DEFAULT 0,
  smjestaj DECIMAL(15,2) DEFAULT 0,
  ostalo DECIMAL(15,2) DEFAULT 0,
  ukupno_za_isplatu DECIMAL(15,2),
  status TEXT DEFAULT 'nacrt' CHECK (status IN ('nacrt','odobren','isplacen')),
  napomena TEXT,
  temeljnica_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ponavljajući računi
CREATE TABLE IF NOT EXISTS ponavljajuci_racuni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  kontakt_id UUID REFERENCES kontakti(id) ON DELETE CASCADE,
  naziv TEXT NOT NULL,
  frekvencija TEXT CHECK (frekvencija IN ('tjedni','mjesecni','kvartalni','godisnji')),
  dan_kreiranja INTEGER DEFAULT 1,
  sljedeci_datum DATE,
  zadnji_datum DATE,
  aktivno BOOLEAN DEFAULT true,
  auto_slanje BOOLEAN DEFAULT false,
  stavke JSONB NOT NULL DEFAULT '[]',
  ukupno_s_pdv DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bankovni_izvodi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies bankovni_izvodi" ON bankovni_izvodi FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE putni_nalozi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies putni_nalozi" ON putni_nalozi FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

ALTER TABLE ponavljajuci_racuni ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies ponavljajuci_racuni" ON ponavljajuci_racuni FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
