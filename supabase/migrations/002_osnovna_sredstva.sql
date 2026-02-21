-- Osnovna sredstva i amortizacija
CREATE TABLE IF NOT EXISTS osnovna_sredstva (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  naziv TEXT NOT NULL,
  opis TEXT,
  datum_nabave DATE NOT NULL,
  nabavna_vrijednost DECIMAL(15,2) NOT NULL,
  ostatna_vrijednost DECIMAL(15,2) DEFAULT 0,
  stopa_amortizacije DECIMAL(5,2) NOT NULL,
  metoda TEXT DEFAULT 'linearna' CHECK (metoda IN ('linearna', 'degresivna')),
  konto_sredstva TEXT NOT NULL,
  konto_amortizacije TEXT DEFAULT '4300',
  konto_ispravka TEXT DEFAULT '0290',
  aktivno BOOLEAN DEFAULT true,
  datum_otpisa DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE osnovna_sredstva ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies osnovna_sredstva" ON osnovna_sredstva FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Opcionalno: zakljucano na temeljnicama za zatvaranje godine
ALTER TABLE temeljnice ADD COLUMN IF NOT EXISTS zakljucano BOOLEAN DEFAULT false;
