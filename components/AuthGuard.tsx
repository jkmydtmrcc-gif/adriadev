"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanies } from "@/hooks/useCompanies";
import { hasSupabase } from "@/lib/supabase/client";

const PUBLIC_PATHS = ["/login", "/register", "/onboarding"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const useSupabase = hasSupabase();
  const { data: companies = [], isLoading: companiesLoading } = useCompanies(user?.id);
  const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (!useSupabase) return;
    if (authLoading) return;
    if (isPublic) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (companiesLoading) return;
    if (companies.length === 0) {
      router.replace("/onboarding");
    }
  }, [useSupabase, authLoading, user, isPublic, companies.length, companiesLoading, router]);

  if (!useSupabase) return <>{children}</>;
  if (authLoading || (user && companiesLoading && companies.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="text-slate-500">Učitavanje...</div>
      </div>
    );
  }
  if (!isPublic && !user) return null;
  if (!isPublic && user && companies.length === 0) return null;
  return <>{children}</>;
}
