"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClient } from "@/lib/supabase/client";
import type { Placa } from "@/lib/types";

export function usePlace(companyId: string | null) {
  return useQuery({
    queryKey: ["place", companyId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("place")
        .select("*")
        .eq("company_id", companyId!)
        .order("period_od", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Placa[];
    },
    enabled: !!companyId,
  });
}

export function useAddPlaca(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Placa, "id" | "created_at">) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      const { data, error } = await supabase.from("place").insert(input).select().single();
      if (error) throw error;
      return data as Placa;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["place", companyId] }),
  });
}
