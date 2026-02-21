"use client";

import { useCompany } from "@/contexts/CompanyContext";
import { useArtikli, useCreateArtikl, useUpdateArtikl } from "@/hooks/useArtikli";
import { useMockStore } from "@/lib/mock-db";
import type { Artikl } from "@/lib/types";

export function useArtikliData() {
  const { companyId, useSupabase } = useCompany();
  const fromSupabase = useArtikli(companyId);
  const mockArtikli = useMockStore((s) =>
    s.artikli.filter((a) => a.company_id === (s.currentCompanyId ?? ""))
  );
  return {
    artikli: useSupabase ? (fromSupabase.data ?? []) : mockArtikli,
    isLoading: useSupabase ? fromSupabase.isLoading : false,
  };
}

export function useCreateArtiklMutation() {
  const { companyId, useSupabase } = useCompany();
  const supabaseCreate = useCreateArtikl(companyId);
  const mockAdd = useMockStore((s) => s.addArtikl);
  if (useSupabase) return supabaseCreate;
  return {
    mutateAsync: async (input: Omit<Artikl, "id" | "created_at">) =>
      mockAdd({ ...input, company_id: companyId! }),
    isPending: false,
  };
}

export function useUpdateArtiklMutation() {
  const { companyId, useSupabase } = useCompany();
  const supabaseUpdate = useUpdateArtikl(companyId);
  const mockUpdate = useMockStore((s) => s.updateArtikl);
  if (useSupabase) return supabaseUpdate;
  return {
    mutateAsync: async ({ id, ...updates }: Partial<Artikl> & { id: string }) => {
      mockUpdate(id, updates);
      return { id, ...updates } as Artikl;
    },
    isPending: false,
  };
}
