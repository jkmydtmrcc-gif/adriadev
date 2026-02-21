"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClient } from "@/lib/supabase/client";
import type { BankovniPromet } from "@/lib/types";

export function useBankovniPromet(companyId: string | null) {
  return useQuery({
    queryKey: ["bankovni_promet", companyId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("bankovni_promet")
        .select("*")
        .eq("company_id", companyId!)
        .order("datum", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BankovniPromet[];
    },
    enabled: !!companyId,
  });
}

export function useAddBankovniPromet(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<BankovniPromet, "id" | "created_at">) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      const { data, error } = await supabase.from("bankovni_promet").insert(input).select().single();
      if (error) throw error;
      return data as BankovniPromet;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bankovni_promet", companyId] }),
  });
}
