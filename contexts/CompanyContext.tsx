"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { useCompanies, useCurrentCompanyId, getStoredCompanyId, setStoredCompanyId } from "@/hooks/useCompanies";
import { useMockStore } from "@/lib/mock-db";
import { hasSupabase } from "@/lib/supabase/client";
import type { Company } from "@/lib/types";

type CompanyContextType = {
  companyId: string | null;
  companies: Company[];
  setCompanyId: (id: string | null) => void;
  isLoading: boolean;
  useSupabase: boolean;
};

const CompanyContext = createContext<CompanyContextType>({
  companyId: null,
  companies: [],
  setCompanyId: () => {},
  isLoading: false,
  useSupabase: false,
});

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const useSupabase = hasSupabase() && !!user;

  const supabaseCompanies = useCompanies(user?.id);
  const supabaseCompanyId = useCurrentCompanyId(user?.id);
  const mockCompanies = useMockStore((s) => s.companies);
  const mockCompanyId = useMockStore((s) => s.currentCompanyId);
  const mockSetCompanyId = useMockStore((s) => s.setCurrentCompanyId);

  const companyId = useSupabase ? supabaseCompanyId : mockCompanyId;
  const companies = useSupabase ? (supabaseCompanies.data ?? []) : mockCompanies;
  const isLoading = useSupabase ? supabaseCompanies.isLoading : false;

  const setCompanyId = (id: string | null) => {
    if (useSupabase) setStoredCompanyId(id);
    else mockSetCompanyId(id);
  };

  const value = useMemo(
    () => ({ companyId, companies, setCompanyId, isLoading, useSupabase }),
    [companyId, companies, isLoading, useSupabase]
  );

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
