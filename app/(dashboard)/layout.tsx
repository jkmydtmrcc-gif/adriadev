"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AuthGuard } from "@/components/AuthGuard";
import { CompanyProvider } from "@/contexts/CompanyContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublic = ["/login", "/register", "/onboarding"].some((p) => pathname?.startsWith(p));

  if (isPublic) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <CompanyProvider>
        <DashboardShell>{children}</DashboardShell>
      </CompanyProvider>
    </AuthGuard>
  );
}
