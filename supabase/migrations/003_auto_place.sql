-- Automatski obračun plaća - postavke na companies
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS placa_dan_obracuna INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS placa_auto BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS placa_dan_isplate INTEGER DEFAULT 15;

-- Radnici - dopunska polja za obračun
ALTER TABLE radnici
  ADD COLUMN IF NOT EXISTS ima_drugi_mirovinki_stup BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS datum_kraja_ugovora DATE,
  ADD COLUMN IF NOT EXISTS vrsta_ugovora TEXT DEFAULT 'neodredjeno'
    CHECK (vrsta_ugovora IN ('neodredjeno', 'odredjeno', 'student', 'ugovor_o_djelu'));

-- Place - oznaka automatski generirano
ALTER TABLE place
  ADD COLUMN IF NOT EXISTS auto_generirana BOOLEAN DEFAULT false;
