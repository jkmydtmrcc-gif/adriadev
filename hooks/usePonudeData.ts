"use client";

import { useCompany } from "@/contexts/CompanyContext";
import { usePonude, usePonuda, useAddPonuda } from "@/hooks/usePonude";
import { useMockStore } from "@/lib/mock-db";

export function usePonudeData() {
  const { companyId, useSupabase } = useCompany();
  const fromSupabase = usePonude(companyId);
  const fromMock = useMockStore((s) =>
    s.getPonude(s.currentCompanyId ?? "")
  );
  return {
    ponude: useSupabase ? (fromSupabase.data ?? []) : fromMock,
    isLoading: useSupabase ? fromSupabase.isLoading : false,
  };
}

export function usePonudaData(id: string | null) {
  const { useSupabase } = useCompany();
  const fromSupabase = usePonuda(id);
  const mockPonuda = useMockStore((s) => (id ? s.getPonuda(id) : undefined));
  return {
    ponuda: useSupabase ? fromSupabase.data : mockPonuda,
    isLoading: useSupabase && !!id ? fromSupabase.isLoading : false,
  };
}

export function useAddPonudaMutation() {
  const { companyId, useSupabase } = useCompany();
  const supabaseAdd = useAddPonuda(companyId);
  const mockAdd = useMockStore((s) => s.addPonuda);
  if (useSupabase) return supabaseAdd;
  return {
    mutateAsync: async (payload: { ponuda: Parameters<typeof mockAdd>[0]; stavke: Parameters<typeof mockAdd>[1] }) =>
      mockAdd(payload.ponuda, payload.stavke),
    isPending: false,
  };
}
