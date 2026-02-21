// Types matching DB schema - work with both Supabase and mock store

export type TipFirme = "obrt" | "jdoo" | "doo" | "pausalni_obrt";
export type KontaktTip = "kupac" | "dobavljac" | "oboje";
export type PonudaStatus = "draft" | "poslana" | "prihvacena" | "odbijena" | "istekla";
export type RacunStatus = "draft" | "izdan" | "poslan" | "djelomicno_placen" | "placen" | "storniran";
export type RacunTip = "racun" | "avansni_racun" | "storno";
export type TemeljnicaStatus = "draft" | "knjizena" | "stornirana";
export type KontoTip = "aktiva" | "pasiva" | "prihod" | "rashod" | "izvanbilancni";

export interface Company {
  id: string;
  user_id?: string;
  naziv: string;
  oib: string;
  adresa?: string;
  grad?: string;
  postanski_broj?: string;
  drzava?: string;
  iban?: string;
  pdv_obveznik: boolean;
  pdv_id?: string;
  djelatnost?: string;
  mbs?: string;
  nadlezni_sud?: string;
  temeljni_kapital?: number;
  tip_firme?: TipFirme;
  logo_url?: string;
  boja_primarna?: string;
  footer_tekst?: string;
  placa_dan_obracuna?: number;
  placa_auto?: boolean;
  placa_dan_isplate?: number;
  created_at: string;
}

export interface Kontakt {
  id: string;
  company_id: string;
  naziv: string;
  oib?: string;
  pdv_id?: string;
  tip: KontaktTip;
  adresa?: string;
  grad?: string;
  postanski_broj?: string;
  drzava?: string;
  email?: string;
  telefon?: string;
  iban?: string;
  napomena?: string;
  created_at: string;
}

export interface Artikl {
  id: string;
  company_id: string;
  naziv: string;
  opis?: string;
  jedinica_mjere: string;
  cijena: number;
  pdv_stopa: number;
  konto?: string;
  created_at: string;
}

export interface PonudaStavka {
  id: string;
  ponuda_id: string;
  artikl_id?: string;
  naziv: string;
  opis?: string;
  kolicina: number;
  jedinica_mjere?: string;
  cijena_bez_pdv: number;
  pdv_stopa: number;
  pdv_iznos?: number;
  ukupno?: number;
  redosljed: number;
}

export interface Ponuda {
  id: string;
  company_id: string;
  kontakt_id: string;
  broj_ponude: string;
  datum: string;
  datum_valjanosti?: string;
  status: PonudaStatus;
  napomena?: string;
  uvjeti_placanja?: string;
  ukupno_bez_pdv?: number;
  ukupno_pdv?: number;
  ukupno_s_pdv?: number;
  valuta: string;
  created_at: string;
  stavke?: PonudaStavka[];
}

export interface RacunStavka {
  id: string;
  racun_id: string;
  artikl_id?: string;
  naziv: string;
  opis?: string;
  kolicina: number;
  jedinica_mjere?: string;
  cijena_bez_pdv: number;
  pdv_stopa: number;
  pdv_iznos?: number;
  ukupno?: number;
  konto_prihoda?: string;
  redosljed: number;
}

export interface Racun {
  id: string;
  company_id: string;
  kontakt_id: string;
  ponuda_id?: string;
  broj_racuna: string;
  datum_izdavanja: string;
  datum_valute: string;
  datum_isporuke?: string;
  status: RacunStatus;
  tip: RacunTip;
  nacin_placanja: string;
  napomena?: string;
  ukupno_bez_pdv?: number;
  ukupno_pdv?: number;
  ukupno_s_pdv?: number;
  placeno?: number;
  valuta?: string;
  tecaj?: number;
  iznos_eur?: number;
  eracun_status?: string;
  eracun_xml?: string;
  pdf_url?: string;
  created_at: string;
  stavke?: RacunStavka[];
}

export interface UlazniRacun {
  id: string;
  company_id: string;
  kontakt_id?: string;
  broj_racuna_dobavljaca?: string;
  datum_racuna: string;
  datum_valute?: string;
  datum_primitka?: string;
  opis?: string;
  ukupno_bez_pdv?: number;
  ukupno_pdv?: number;
  ukupno_s_pdv: number;
  pdv_odbiten: boolean;
  status: "neprocesen" | "knjizen" | "placen";
  konto_troska?: string;
  kategorija?: string;
  dokument_url?: string;
  ai_kategorija?: string;
  ai_konto?: string;
  created_at: string;
}

export interface KontniPlanStavka {
  id: string;
  company_id: string;
  konto: string;
  naziv: string;
  tip?: KontoTip;
  razred?: number;
  parent_konto?: string;
  pdv_konto: boolean;
  aktivan: boolean;
}

export interface TemeljnicaStavka {
  id: string;
  temeljnica_id: string;
  konto: string;
  naziv_konta?: string;
  duguje: number;
  potrazuje: number;
  opis?: string;
  partner_id?: string;
}

export interface Temeljnica {
  id: string;
  company_id: string;
  broj_temeljnice: string;
  datum: string;
  opis?: string;
  dokument_tip?: string;
  dokument_id?: string;
  status: TemeljnicaStatus;
  created_at: string;
  stavke?: TemeljnicaStavka[];
}

export interface Radnik {
  id: string;
  company_id: string;
  ime: string;
  prezime: string;
  oib: string;
  datum_rodenja?: string;
  adresa?: string;
  grad?: string;
  iban?: string;
  bruto_placa?: number;
  koeficijent_osobnog_odbitka?: number;
  opcina_placanja_poreza?: string;
  aktivan: boolean;
  datum_zaposlenja?: string;
  ima_drugi_mirovinki_stup?: boolean;
  datum_kraja_ugovora?: string;
  vrsta_ugovora?: "neodredjeno" | "odredjeno" | "student" | "ugovor_o_djelu";
  created_at: string;
}

export interface Placa {
  id: string;
  company_id: string;
  radnik_id: string;
  period_od: string;
  period_do: string;
  bruto: number;
  doprinosi_iz_place?: number;
  dohodak?: number;
  osobni_odbitak?: number;
  porezna_osnovica?: number;
  porez_i_prirez?: number;
  neto?: number;
  doprinosi_na_placu?: number;
  ukupni_trosak?: number;
  joppd_poslan: boolean;
  auto_generirana?: boolean;
  created_at: string;
}

export interface BankovniPromet {
  id: string;
  company_id: string;
  datum: string;
  iznos: number;
  tip: "prihod" | "rashod";
  opis?: string;
  racun_id?: string;
  ulazni_racun_id?: string;
  kategorizirano: boolean;
  ai_prijedlog?: string;
  izvod_id?: string;
  match_confidence?: number;
  match_tip?: string;
  status?: "neusklađeno" | "usklađeno" | "djelomično" | "ignorirano";
  created_at: string;
}

export interface OsnovnoSredstvo {
  id: string;
  company_id: string;
  naziv: string;
  opis?: string;
  datum_nabave: string;
  nabavna_vrijednost: number;
  ostatna_vrijednost: number;
  stopa_amortizacije: number;
  metoda: "linearna" | "degresivna";
  konto_sredstva: string;
  konto_amortizacije: string;
  konto_ispravka: string;
  aktivno: boolean;
  datum_otpisa?: string;
  created_at: string;
}
