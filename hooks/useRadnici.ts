"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClient } from "@/lib/supabase/client";
import type { Radnik } from "@/lib/types";

export function useRadnici(companyId: string | null) {
  return useQuery({
    queryKey: ["radnici", companyId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("radnici")
        .select("*")
        .eq("company_id", companyId!)
        .order("prezime");
      if (error) throw error;
      return (data ?? []) as Radnik[];
    },
    enabled: !!companyId,
  });
}

export function useAddRadnik(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Radnik, "id" | "created_at">) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      const { data, error } = await supabase.from("radnici").insert(input).select().single();
      if (error) throw error;
      return data as Radnik;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["radnici", companyId] }),
  });
}
