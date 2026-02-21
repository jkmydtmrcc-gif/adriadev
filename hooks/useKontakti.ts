"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClient } from "@/lib/supabase/client";
import type { Kontakt } from "@/lib/types";

export function useKontakti(companyId: string | null) {
  return useQuery({
    queryKey: ["kontakti", companyId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("kontakti")
        .select("*")
        .eq("company_id", companyId!)
        .order("naziv");
      if (error) throw error;
      return (data ?? []) as Kontakt[];
    },
    enabled: !!companyId,
  });
}

export function useCreateKontakt(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Kontakt, "id" | "created_at">) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      const { data, error } = await supabase
        .from("kontakti")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Kontakt;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kontakti", companyId] }),
  });
}

export function useUpdateKontakt(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Kontakt> & { id: string }) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      const { data, error } = await supabase
        .from("kontakti")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Kontakt;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["kontakti", companyId] }),
  });
}
