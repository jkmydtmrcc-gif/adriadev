"use client";

import { useCompany } from "@/contexts/CompanyContext";
import { useRacuni, useRacun, useCreateRacun, useUpdateRacun } from "@/hooks/useRacuni";
import { useMockStore } from "@/lib/mock-db";

export function useRacuniData() {
  const { companyId, useSupabase } = useCompany();
  const fromSupabase = useRacuni(companyId);
  const mockRacuni = useMockStore((s) =>
    s.racuni.filter((r) => r.company_id === (s.currentCompanyId ?? ""))
  );
  const racuni = useSupabase ? (fromSupabase.data ?? []) : mockRacuni;
  return {
    racuni,
    isLoading: useSupabase ? fromSupabase.isLoading : false,
    refetch: fromSupabase.refetch,
  };
}

export function useRacunData(id: string | null) {
  const { useSupabase } = useCompany();
  const fromSupabase = useRacun(id);
  const mockRacun = useMockStore((s) => (id ? s.getRacun(id) : undefined));
  return {
    racun: useSupabase ? fromSupabase.data : mockRacun,
    isLoading: useSupabase && !!id ? fromSupabase.isLoading : false,
    refetch: fromSupabase.refetch,
  };
}

export function useCreateRacunMutation() {
  const { companyId, useSupabase } = useCompany();
  const supabaseCreate = useCreateRacun(companyId);
  const mockAdd = useMockStore((s) => s.addRacun);
  if (useSupabase) return supabaseCreate;
  return {
    mutateAsync: async (payload: { racun: Parameters<typeof mockAdd>[0]; stavke: Parameters<typeof mockAdd>[1] }) =>
      mockAdd(payload.racun, payload.stavke),
    isPending: false,
  };
}

export function useUpdateRacunMutation() {
  const { companyId, useSupabase } = useCompany();
  const supabaseUpdate = useUpdateRacun(companyId);
  const mockUpdate = useMockStore((s) => s.updateRacun);
  const mockSetStavke = useMockStore((s) => s.setRacunStavke);
  if (useSupabase) return supabaseUpdate;
  return {
    mutateAsync: async (payload: {
      id: string;
      updates: Record<string, unknown>;
      stavke?: Array<Record<string, unknown>>;
    }) => {
      mockUpdate(payload.id, payload.updates as any);
      if (payload.stavke) mockSetStavke(payload.id, payload.stavke as any);
      return payload.id;
    },
    isPending: false,
  };
}
