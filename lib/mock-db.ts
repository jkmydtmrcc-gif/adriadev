"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Company,
  Kontakt,
  Artikl,
  Ponuda,
  PonudaStavka,
  Racun,
  RacunStavka,
  UlazniRacun,
  Temeljnica,
  TemeljnicaStavka,
  Radnik,
  Placa,
  BankovniPromet,
  KontniPlanStavka,
} from "./types";
import {
  buildTemeljnicaFromRacun,
  buildTemeljnicaFromUlazniRacun,
  buildTemeljnicaFromUplata,
  buildTemeljnicaFromPlaca,
} from "./auto-temeljnica";

const STORAGE_KEY = "knjigovodstvo_mock";

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function now(): string {
  return new Date().toISOString();
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface MockState {
  companies: Company[];
  kontakti: Kontakt[];
  artikli: Artikl[];
  ponude: Ponuda[];
  ponude_stavke: PonudaStavka[];
  racuni: Racun[];
  racuni_stavke: RacunStavka[];
  ulazni_racuni: UlazniRacun[];
  temeljnice: Temeljnica[];
  temeljnice_stavke: TemeljnicaStavka[];
  radnici: Radnik[];
  place: Placa[];
  bankovni_promet: BankovniPromet[];
  kontni_plan: KontniPlanStavka[];
  currentCompanyId: string | null;
}

const defaultCompany: Company = {
  id: "company-1",
  naziv: "Moja tvrtka d.o.o.",
  oib: "12345678903",
  adresa: "Ulica primjer 1",
  grad: "Zagreb",
  postanski_broj: "10000",
  drzava: "HR",
  iban: "HR1234567890123456789",
  pdv_obveznik: true,
  pdv_id: "HR12345678903",
  tip_firme: "doo",
  boja_primarna: "#2563eb",
  created_at: now(),
};

const seedKontakti: Kontakt[] = [
  {
    id: "kontakt-1",
    company_id: "company-1",
    naziv: "Kupac A d.o.o.",
    oib: "11111111111",
    tip: "kupac",
    adresa: "Adresa kupca 1",
    grad: "Zagreb",
    postanski_broj: "10000",
    email: "kupac@primjer.hr",
    telefon: "+385 1 234 5678",
    created_at: now(),
  },
  {
    id: "kontakt-2",
    company_id: "company-1",
    naziv: "Dobavljač B",
    oib: "22222222222",
    tip: "dobavljac",
    grad: "Split",
    email: "dobavljac@primjer.hr",
    created_at: now(),
  },
];

const seedArtikli: Artikl[] = [
  {
    id: "artikl-1",
    company_id: "company-1",
    naziv: "Konzultantske usluge",
    jedinica_mjere: "sat",
    cijena: 75,
    pdv_stopa: 25,
    created_at: now(),
  },
  {
    id: "artikl-2",
    company_id: "company-1",
    naziv: "Licenca software",
    jedinica_mjere: "kom",
    cijena: 199,
    pdv_stopa: 25,
    created_at: now(),
  },
];

function getInitialState(): MockState {
  return {
    companies: [defaultCompany],
    kontakti: seedKontakti,
    artikli: seedArtikli,
    ponude: [],
    ponude_stavke: [],
    racuni: [],
    racuni_stavke: [],
    ulazni_racuni: [],
    temeljnice: [],
    temeljnice_stavke: [],
    radnici: [],
    place: [],
    bankovni_promet: [],
    kontni_plan: [],
    currentCompanyId: "company-1",
  };
}

type MockActions = {
  setCurrentCompany: (id: string | null) => void;
  // Company
  updateCompany: (id: string, data: Partial<Company>) => void;
  // Kontakti
  addKontakt: (k: Omit<Kontakt, "id" | "created_at">) => Kontakt;
  updateKontakt: (id: string, data: Partial<Kontakt>) => void;
  deleteKontakt: (id: string) => void;
  getKontakti: (companyId: string) => Kontakt[];
  // Artikli
  addArtikl: (a: Omit<Artikl, "id" | "created_at">) => Artikl;
  updateArtikl: (id: string, data: Partial<Artikl>) => void;
  deleteArtikl: (id: string) => void;
  getArtikli: (companyId: string) => Artikl[];
  // Računi
  addRacun: (r: Omit<Racun, "id" | "created_at">, stavke: Omit<RacunStavka, "id" | "racun_id">[]) => Racun;
  updateRacun: (id: string, data: Partial<Racun>) => void;
  setRacunStavke: (racunId: string, stavke: Omit<RacunStavka, "id" | "racun_id">[]) => void;
  deleteRacun: (id: string) => void;
  getRacuni: (companyId: string) => Racun[];
  getRacun: (id: string) => Racun | undefined;
  // Ponude
  addPonuda: (p: Omit<Ponuda, "id" | "created_at">, stavke: Omit<PonudaStavka, "id" | "ponuda_id">[]) => Ponuda;
  updatePonuda: (id: string, data: Partial<Ponuda>) => void;
  getPonude: (companyId: string) => Ponuda[];
  getPonuda: (id: string) => Ponuda | undefined;
  // Ulazni računi
  addUlazniRacun: (r: Omit<UlazniRacun, "id" | "created_at">) => UlazniRacun;
  updateUlazniRacun: (id: string, data: Partial<UlazniRacun>) => void;
  getUlazniRacuni: (companyId: string) => UlazniRacun[];
  // Bankovni promet
  addBankovniPromet: (b: Omit<BankovniPromet, "id" | "created_at">) => BankovniPromet;
  getBankovniPromet: (companyId: string) => BankovniPromet[];
  // Temeljnice
  addTemeljnica: (t: Omit<Temeljnica, "id" | "created_at">, stavke: Omit<TemeljnicaStavka, "id" | "temeljnica_id">[]) => Temeljnica;
  getTemeljnice: (companyId: string) => Temeljnica[];
  getTemeljnica: (id: string) => Temeljnica | undefined;
  // Radnici
  addRadnik: (r: Omit<Radnik, "id" | "created_at">) => Radnik;
  getRadnici: (companyId: string) => Radnik[];
  // Plaće
  addPlaca: (p: Omit<Placa, "id" | "created_at">) => Placa;
  getPlace: (companyId: string) => Placa[];
  // Reset
  resetToSeed: () => void;
};

export const useMockStore = create<MockState & MockActions>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      setCurrentCompany: (id) => set({ currentCompanyId: id }),

      updateCompany: (id, data) =>
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),

      addKontakt: (k) => {
        const newK: Kontakt = {
          ...k,
          id: uuid(),
          created_at: now(),
        };
        set((s) => ({ kontakti: [...s.kontakti, newK] }));
        return newK;
      },
      updateKontakt: (id, data) =>
        set((s) => ({
          kontakti: s.kontakti.map((k) => (k.id === id ? { ...k, ...data } : k)),
        })),
      deleteKontakt: (id) =>
        set((s) => ({ kontakti: s.kontakti.filter((k) => k.id !== id) })),
      getKontakti: (companyId) =>
        get().kontakti.filter((k) => k.company_id === companyId),

      addArtikl: (a) => {
        const newA: Artikl = {
          ...a,
          id: uuid(),
          created_at: now(),
        };
        set((s) => ({ artikli: [...s.artikli, newA] }));
        return newA;
      },
      updateArtikl: (id, data) =>
        set((s) => ({
          artikli: s.artikli.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),
      deleteArtikl: (id) =>
        set((s) => ({ artikli: s.artikli.filter((a) => a.id !== id) })),
      getArtikli: (companyId) =>
        get().artikli.filter((a) => a.company_id === companyId),

      addRacun: (r, stavke) => {
        const id = uuid();
        const racun: Racun = {
          ...r,
          id,
          created_at: now(),
        };
        const stavkeWithId: RacunStavka[] = stavke.map((st, i) => ({
          ...st,
          id: uuid(),
          racun_id: id,
          redosljed: i,
        }));
        set((s) => {
          const out: Partial<MockState> = {
            racuni: [...s.racuni, racun],
            racuni_stavke: [...s.racuni_stavke, ...stavkeWithId],
          };
          if (r.status === "izdan") {
            const payload = buildTemeljnicaFromRacun(r.company_id, racun, s.temeljnice);
            const tId = uuid();
            const tem: Temeljnica = { ...payload.temeljnica, id: tId, created_at: now() };
            const tStavke: TemeljnicaStavka[] = payload.stavke.map((st) => ({
              ...st,
              id: uuid(),
              temeljnica_id: tId,
            }));
            out.temeljnice = [...s.temeljnice, tem];
            out.temeljnice_stavke = [...s.temeljnice_stavke, ...tStavke];
          }
          return out as MockState;
        });
        return { ...racun, stavke: stavkeWithId };
      },
      updateRacun: (id, data) =>
        set((s) => {
          const racuni = s.racuni.map((r) => (r.id === id ? { ...r, ...data } : r));
          const updated = racuni.find((r) => r.id === id);
          const out: Partial<MockState> = { racuni };
          if (updated && data.status === "izdan" && updated.status === "izdan") {
            const payload = buildTemeljnicaFromRacun(updated.company_id, updated, s.temeljnice);
            const tId = uuid();
            const tem: Temeljnica = { ...payload.temeljnica, id: tId, created_at: now() };
            const tStavke: TemeljnicaStavka[] = payload.stavke.map((st) => ({
              ...st,
              id: uuid(),
              temeljnica_id: tId,
            }));
            out.temeljnice = [...s.temeljnice, tem];
            out.temeljnice_stavke = [...s.temeljnice_stavke, ...tStavke];
          }
          return out as MockState;
        }),
      setRacunStavke: (racunId, stavke) => {
        const newStavke: RacunStavka[] = stavke.map((st, i) => ({
          ...st,
          id: uuid(),
          racun_id: racunId,
          redosljed: i,
        }));
        set((s) => ({
          racuni_stavke: [
            ...s.racuni_stavke.filter((st) => st.racun_id !== racunId),
            ...newStavke,
          ],
        }));
      },
      deleteRacun: (id) =>
        set((s) => ({
          racuni: s.racuni.filter((r) => r.id !== id),
          racuni_stavke: s.racuni_stavke.filter((st) => st.racun_id !== id),
        })),
      getRacuni: (companyId) =>
        get().racuni.filter((r) => r.company_id === companyId),
      getRacun: (id) => {
        const r = get().racuni.find((x) => x.id === id);
        if (!r) return undefined;
        const stavke = get().racuni_stavke
          .filter((s) => s.racun_id === id)
          .sort((a, b) => a.redosljed - b.redosljed);
        return { ...r, stavke };
      },

      addPonuda: (p, stavke) => {
        const id = uuid();
        const ponuda: Ponuda = { ...p, id, created_at: now() };
        const stavkeWithId: PonudaStavka[] = stavke.map((st, i) => ({
          ...st,
          id: uuid(),
          ponuda_id: id,
          redosljed: i,
        }));
        set((s) => ({
          ponude: [...s.ponude, ponuda],
          ponude_stavke: [...s.ponude_stavke, ...stavkeWithId],
        }));
        return { ...ponuda, stavke: stavkeWithId };
      },
      updatePonuda: (id, data) =>
        set((s) => ({
          ponude: s.ponude.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      getPonude: (companyId) =>
        get().ponude.filter((p) => p.company_id === companyId),
      getPonuda: (id) => {
        const p = get().ponude.find((x) => x.id === id);
        if (!p) return undefined;
        const stavke = get().ponude_stavke
          .filter((s) => s.ponuda_id === id)
          .sort((a, b) => a.redosljed - b.redosljed);
        return { ...p, stavke };
      },

      addUlazniRacun: (r) => {
        const rid = uuid();
        const newR: UlazniRacun = { ...r, id: rid, created_at: now() };
        set((s) => {
          const out: Partial<MockState> = { ulazni_racuni: [...s.ulazni_racuni, newR] };
          if (r.status === "knjizen") {
            const payload = buildTemeljnicaFromUlazniRacun(r.company_id, newR, s.temeljnice);
            const tId = uuid();
            const tem: Temeljnica = { ...payload.temeljnica, id: tId, created_at: now() };
            const tStavke: TemeljnicaStavka[] = payload.stavke.map((st) => ({
              ...st,
              id: uuid(),
              temeljnica_id: tId,
            }));
            out.temeljnice = [...s.temeljnice, tem];
            out.temeljnice_stavke = [...s.temeljnice_stavke, ...tStavke];
          }
          return out as MockState;
        });
        return newR;
      },
      updateUlazniRacun: (id, data) =>
        set((s) => {
          const ulazni_racuni = s.ulazni_racuni.map((u) => (u.id === id ? { ...u, ...data } : u));
          const updated = ulazni_racuni.find((u) => u.id === id);
          const out: Partial<MockState> = { ulazni_racuni };
          if (updated && data.status === "knjizen" && updated.status === "knjizen") {
            const payload = buildTemeljnicaFromUlazniRacun(updated.company_id, updated, s.temeljnice);
            const tId = uuid();
            const tem: Temeljnica = { ...payload.temeljnica, id: tId, created_at: now() };
            const tStavke: TemeljnicaStavka[] = payload.stavke.map((st) => ({
              ...st,
              id: uuid(),
              temeljnica_id: tId,
            }));
            out.temeljnice = [...s.temeljnice, tem];
            out.temeljnice_stavke = [...s.temeljnice_stavke, ...tStavke];
          }
          return out as MockState;
        }),
      getUlazniRacuni: (companyId) =>
        get().ulazni_racuni.filter((u) => u.company_id === companyId),

      addBankovniPromet: (b) => {
        const bid = uuid();
        const newB: BankovniPromet = { ...b, id: bid, created_at: now() };
        set((s) => {
          const out: Partial<MockState> = { bankovni_promet: [...s.bankovni_promet, newB] };
          if (b.tip === "prihod" && (b.racun_id || b.iznos)) {
            const payload = buildTemeljnicaFromUplata(b.company_id, newB, s.temeljnice);
            const tId = uuid();
            const tem: Temeljnica = { ...payload.temeljnica, id: tId, created_at: now() };
            const tStavke: TemeljnicaStavka[] = payload.stavke.map((st) => ({
              ...st,
              id: uuid(),
              temeljnica_id: tId,
            }));
            out.temeljnice = [...s.temeljnice, tem];
            out.temeljnice_stavke = [...s.temeljnice_stavke, ...tStavke];
          }
          return out as MockState;
        });
        return newB;
      },
      getBankovniPromet: (companyId) =>
        get().bankovni_promet.filter((bp) => bp.company_id === companyId),

      addTemeljnica: (t, stavke) => {
        const id = uuid();
        const tem: Temeljnica = { ...t, id, created_at: now() };
        const stavkeWithId: TemeljnicaStavka[] = stavke.map((s) => ({
          ...s,
          id: uuid(),
          temeljnica_id: id,
        }));
        set((s) => ({
          temeljnice: [...s.temeljnice, tem],
          temeljnice_stavke: [...s.temeljnice_stavke, ...stavkeWithId],
        }));
        return { ...tem, stavke: stavkeWithId };
      },
      getTemeljnice: (companyId) =>
        get().temeljnice.filter((x) => x.company_id === companyId),
      getTemeljnica: (id) => {
        const t = get().temeljnice.find((x) => x.id === id);
        if (!t) return undefined;
        const stavke = get().temeljnice_stavke.filter((s) => s.temeljnica_id === id);
        return { ...t, stavke };
      },

      addRadnik: (r) => {
        const newR: Radnik = { ...r, id: uuid(), created_at: now() };
        set((s) => ({ radnici: [...s.radnici, newR] }));
        return newR;
      },
      getRadnici: (companyId) =>
        get().radnici.filter((x) => x.company_id === companyId),

      addPlaca: (p) => {
        const pid = uuid();
        const newP: Placa = { ...p, id: pid, created_at: now() };
        set((s) => {
          const payload = buildTemeljnicaFromPlaca(p.company_id, newP, s.temeljnice);
          const tId = uuid();
          const tem: Temeljnica = { ...payload.temeljnica, id: tId, created_at: now() };
          const tStavke: TemeljnicaStavka[] = payload.stavke.map((st) => ({
            ...st,
            id: uuid(),
            temeljnica_id: tId,
          }));
          return {
            place: [...s.place, newP],
            temeljnice: [...s.temeljnice, tem],
            temeljnice_stavke: [...s.temeljnice_stavke, ...tStavke],
          };
        });
        return newP;
      },
      getPlace: (companyId) =>
        get().place.filter((x) => x.company_id === companyId),

      resetToSeed: () => set(getInitialState()),
    }),
    { name: STORAGE_KEY }
  )
);
