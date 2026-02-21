"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClient } from "@/lib/supabase/client";
import type { Temeljnica, TemeljnicaStavka } from "@/lib/types";

export function useTemeljnice(companyId: string | null) {
  return useQuery({
    queryKey: ["temeljnice", companyId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("temeljnice")
        .select("*")
        .eq("company_id", companyId!)
        .order("datum", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Temeljnica[];
    },
    enabled: !!companyId,
  });
}

export function useTemeljniceStavke(companyId: string | null) {
  return useQuery({
    queryKey: ["temeljnice_stavke", companyId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase) return [];
      const { data: temeljnice } = await supabase.from("temeljnice").select("id").eq("company_id", companyId!);
      const ids = (temeljnice ?? []).map((t) => t.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase.from("temeljnice_stavke").select("*").in("temeljnica_id", ids);
      if (error) throw error;
      return (data ?? []) as TemeljnicaStavka[];
    },
    enabled: !!companyId,
  });
}

export function useTemeljnica(id: string | null) {
  return useQuery({
    queryKey: ["temeljnica", id],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase || !id) return undefined;
      const { data: t, error: e1 } = await supabase.from("temeljnice").select("*").eq("id", id).single();
      if (e1) throw e1;
      const { data: stavke } = await supabase.from("temeljnice_stavke").select("*").eq("temeljnica_id", id).order("id");
      return { ...t, stavke: (stavke ?? []) as TemeljnicaStavka[] } as Temeljnica & { stavke: TemeljnicaStavka[] };
    },
    enabled: !!id,
  });
}

export function useAddTemeljnica(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      temeljnica: Omit<Temeljnica, "id" | "created_at">;
      stavke: Omit<TemeljnicaStavka, "id" | "temeljnica_id">[];
    }) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      const { data: t, error: e1 } = await supabase.from("temeljnice").insert(payload.temeljnica).select().single();
      if (e1) throw e1;
      if (payload.stavke.length) {
        const rows = payload.stavke.map((s) => ({ ...s, temeljnica_id: t.id }));
        const { error: e2 } = await supabase.from("temeljnice_stavke").insert(rows);
        if (e2) throw e2;
      }
      return { ...t, stavke: payload.stavke };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["temeljnice", companyId] }),
  });
}
