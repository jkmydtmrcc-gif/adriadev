"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClient } from "@/lib/supabase/client";
import type { UlazniRacun } from "@/lib/types";

export function useUlazniRacuni(companyId: string | null) {
  return useQuery({
    queryKey: ["ulazni_racuni", companyId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("ulazni_racuni")
        .select("*")
        .eq("company_id", companyId!)
        .order("datum_racuna", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UlazniRacun[];
    },
    enabled: !!companyId,
  });
}

export function useAddUlazniRacun(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<UlazniRacun, "id" | "created_at">) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      const { data, error } = await supabase.from("ulazni_racuni").insert(input).select().single();
      if (error) throw error;
      return data as UlazniRacun;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ulazni_racuni", companyId] }),
  });
}

export function useUpdateUlazniRacun(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UlazniRacun> & { id: string }) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      const { data, error } = await supabase
        .from("ulazni_racuni")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as UlazniRacun;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ulazni_racuni", companyId] }),
  });
}
