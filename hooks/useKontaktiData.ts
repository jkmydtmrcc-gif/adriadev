"use client";

import { useCompany } from "@/contexts/CompanyContext";
import { useKontakti, useCreateKontakt, useUpdateKontakt } from "@/hooks/useKontakti";
import { useMockStore } from "@/lib/mock-db";
import type { Kontakt } from "@/lib/types";

export function useKontaktiData() {
  const { companyId, useSupabase } = useCompany();
  const fromSupabase = useKontakti(companyId);
  const mockKontakti = useMockStore((s) =>
    s.kontakti.filter((k) => k.company_id === (s.currentCompanyId ?? ""))
  );
  return {
    kontakti: useSupabase ? (fromSupabase.data ?? []) : mockKontakti,
    isLoading: useSupabase ? fromSupabase.isLoading : false,
  };
}

export function useCreateKontaktMutation() {
  const { companyId, useSupabase } = useCompany();
  const supabaseCreate = useCreateKontakt(companyId);
  const mockAdd = useMockStore((s) => s.addKontakt);
  if (useSupabase) return supabaseCreate;
  return {
    mutateAsync: async (input: Omit<Kontakt, "id" | "created_at">) =>
      mockAdd({ ...input, company_id: companyId! }),
    isPending: false,
  };
}

export function useUpdateKontaktMutation() {
  const { companyId, useSupabase } = useCompany();
  const supabaseUpdate = useUpdateKontakt(companyId);
  const mockUpdate = useMockStore((s) => s.updateKontakt);
  if (useSupabase) return supabaseUpdate;
  return {
    mutateAsync: async ({ id, ...updates }: Partial<Kontakt> & { id: string }) => {
      mockUpdate(id, updates);
      return { id, ...updates } as Kontakt;
    },
    isPending: false,
  };
}
