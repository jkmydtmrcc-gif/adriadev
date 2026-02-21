"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClient } from "@/lib/supabase/client";
import type { Artikl } from "@/lib/types";

export function useArtikli(companyId: string | null) {
  return useQuery({
    queryKey: ["artikli", companyId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("artikli")
        .select("*")
        .eq("company_id", companyId!)
        .order("naziv");
      if (error) throw error;
      return (data ?? []) as Artikl[];
    },
    enabled: !!companyId,
  });
}

export function useCreateArtikl(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Artikl, "id" | "created_at">) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      const { data, error } = await supabase
        .from("artikli")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Artikl;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["artikli", companyId] }),
  });
}

export function useUpdateArtikl(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Artikl> & { id: string }) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      const { data, error } = await supabase
        .from("artikli")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Artikl;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["artikli", companyId] }),
  });
}
