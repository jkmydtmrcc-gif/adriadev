"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClient } from "@/lib/supabase/client";
import type { Racun, RacunStavka } from "@/lib/types";

export function useRacuni(companyId: string | null) {
  return useQuery({
    queryKey: ["racuni", companyId],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("racuni")
        .select("*")
        .eq("company_id", companyId!)
        .order("datum_izdavanja", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Racun[];
    },
    enabled: !!companyId,
  });
}

export function useRacun(id: string | null) {
  const racuniQuery = useQuery({
    queryKey: ["racun", id],
    queryFn: async () => {
      const supabase = getClient();
      if (!supabase) return undefined;
      const { data: racun, error: e1 } = await supabase
        .from("racuni")
        .select("*")
        .eq("id", id!)
        .single();
      if (e1) throw e1;
      const { data: stavke, error: e2 } = await supabase
        .from("racuni_stavke")
        .select("*")
        .eq("racun_id", id!)
        .order("redosljed");
      if (e2) throw e2;
      return { ...racun, stavke: (stavke ?? []) as RacunStavka[] };
    },
    enabled: !!id,
  });
  return racuniQuery;
}

export function useCreateRacun(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      racun: Omit<Racun, "id" | "created_at">;
      stavke: Omit<RacunStavka, "id" | "racun_id">[];
    }) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      const { data: r, error: e1 } = await supabase
        .from("racuni")
        .insert(payload.racun)
        .select()
        .single();
      if (e1) throw e1;
      if (payload.stavke.length) {
        const rows = payload.stavke.map((s, i) => ({
          ...s,
          racun_id: r.id,
          redosljed: i,
        }));
        const { error: e2 } = await supabase.from("racuni_stavke").insert(rows);
        if (e2) throw e2;
      }
      return { ...r, stavke: payload.stavke };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["racuni", companyId] });
    },
  });
}

export function useUpdateRacun(companyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      updates: Partial<Racun>;
      stavke?: Omit<RacunStavka, "id" | "racun_id">[];
    }) => {
      const supabase = getClient();
      if (!supabase) throw new Error("Supabase nije konfiguriran");
      if (Object.keys(payload.updates).length) {
        const { error: e1 } = await supabase
          .from("racuni")
          .update(payload.updates)
          .eq("id", payload.id);
        if (e1) throw e1;
      }
      if (payload.stavke !== undefined) {
        await supabase.from("racuni_stavke").delete().eq("racun_id", payload.id);
        if (payload.stavke.length) {
          const rows = payload.stavke.map((s, i) => ({
            ...s,
            racun_id: payload.id,
            redosljed: i,
          }));
          const { error: e2 } = await supabase.from("racuni_stavke").insert(rows);
          if (e2) throw e2;
        }
      }
      return payload.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["racuni", companyId] });
      queryClient.invalidateQueries({ queryKey: ["racun"] });
    },
  });
}
