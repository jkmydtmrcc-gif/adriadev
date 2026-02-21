export interface BankTransaction {
  datum: string;
  tip: "prihod" | "rashod";
  iznos: number;
  opis?: string;
  iban_partnera?: string;
  poziv_na_broj?: string;
}

export interface MatchResult {
  tip: "racun" | "ulazni_racun" | null;
  id: string | null;
  confidence: number;
}
