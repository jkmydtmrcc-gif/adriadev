ALTER TABLE vozila_troskovi
  ADD COLUMN IF NOT EXISTS porezno_priznato INTEGER DEFAULT 50 CHECK (porezno_priznato IN (50, 100));
