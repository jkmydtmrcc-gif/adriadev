"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClient } from "@/lib/supabase/client";
import type { OsnovnoSredstvo } from "@/lib/types";

export function useOsnovnaSredstva(companyId: string | null) {
  return useQuery({
    queryKey: ["osnovna_sredstva", companyId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("osnovna_sredstva")
        .select("*")
        .eq("company_id", companyId!)
        .order("datum_nabave", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OsnovnoSredstvo[];
    },
    enabled: !!companyId,
  });
}

export function useAddOsnovnoSredstvo(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<OsnovnoSredstvo, "id" | "created_at">) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      const { data, error } = await supabase.from("osnovna_sredstva").insert(input).select().single();
      if (error) throw error;
      return data as OsnovnoSredstvo;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["osnovna_sredstva", companyId] }),
  });
}

export function useUpdateOsnovnoSredstvo(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OsnovnoSredstvo> & { id: string }) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      const { data, error } = await supabase
        .from("osnovna_sredstva")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as OsnovnoSredstvo;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["osnovna_sredstva", companyId] }),
  });
}
