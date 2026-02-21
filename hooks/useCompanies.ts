"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClient } from "@/lib/supabase/client";
import type { Company } from "@/lib/types";

const COMPANY_KEY = "knjigovodstvo_current_company_id";

export function getStoredCompanyId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(COMPANY_KEY);
}

export function setStoredCompanyId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(COMPANY_KEY, id);
  else localStorage.removeItem(COMPANY_KEY);
}

export function useCompanies(userId: string | undefined) {
  const query = useQuery({
    queryKey: ["companies", userId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Company[];
    },
    enabled: !!userId,
  });
  return query;
}

export function useCurrentCompanyId(userId: string | undefined) {
  const { data: companies = [] } = useCompanies(userId);
  const stored = getStoredCompanyId();
  const valid = companies.some((c) => c.id === stored);
  return valid ? stored! : companies[0]?.id ?? null;
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { user_id: string; naziv: string; oib: string; pdv_obveznik?: boolean; grad?: string; adresa?: string; iban?: string;       tip_firme?: string }) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      const { data, error } = await supabase
        .from("companies")
        .insert({
          user_id: input.user_id,
          naziv: input.naziv,
          oib: input.oib,
          pdv_obveznik: input.pdv_obveznik ?? false,
          grad: input.grad,
          adresa: input.adresa,
          iban: input.iban,
          tip_firme: input.tip_firme,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Company;
    },
    onSuccess: (data) => {
      setStoredCompanyId(data.id);
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}
