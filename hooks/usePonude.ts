"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClient } from "@/lib/supabase/client";
import type { Ponuda, PonudaStavka } from "@/lib/types";

export function usePonude(companyId: string | null) {
  return useQuery({
    queryKey: ["ponude", companyId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("ponude")
        .select("*")
        .eq("company_id", companyId!)
        .order("datum", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Ponuda[];
    },
    enabled: !!companyId,
  });
}

export function usePonuda(id: string | null) {
  return useQuery({
    queryKey: ["ponuda", id],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase || !id) return undefined;
      const { data: p, error: e1 } = await supabase.from("ponude").select("*").eq("id", id).single();
      if (e1) throw e1;
      const { data: stavke } = await supabase.from("ponude_stavke").select("*").eq("ponuda_id", id).order("redosljed");
      return { ...p, stavke: (stavke ?? []) as PonudaStavka[] };
    },
    enabled: !!id,
  });
}

export function useAddPonuda(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      ponuda: Omit<Ponuda, "id" | "created_at">;
      stavke: Omit<PonudaStavka, "id" | "ponuda_id">[];
    }) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      const { data: p, error: e1 } = await supabase.from("ponude").insert(payload.ponuda).select().single();
      if (e1) throw e1;
      if (payload.stavke.length) {
        const rows = payload.stavke.map((s, i) => ({ ...s, ponuda_id: p.id, redosljed: i }));
        const { error: e2 } = await supabase.from("ponude_stavke").insert(rows);
        if (e2) throw e2;
      }
      return { ...p, stavke: payload.stavke };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ponude", companyId] }),
  });
}
