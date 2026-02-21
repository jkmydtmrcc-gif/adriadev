"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  Users,
  Package,
  Inbox,
  Banknote,
  Wallet,
  BookOpen,
  BookMarked,
  Scale,
  User,
  DollarSign,
  Receipt,
  ClipboardList,
  BarChart3,
  Settings,
  ChevronDown,
  LogOut,
  Building2,
  CalendarCheck,
  Car,
  Repeat,
  MapPin,
  FileStack,
} from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
import { hasSupabase } from "@/lib/supabase/client";

export interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Računi", href: "/racuni", icon: FileText },
  { label: "Ponude", href: "/ponude", icon: FileSpreadsheet },
  { label: "Kontakti", href: "/kontakti", icon: Users },
  { label: "Artikli", href: "/artikli", icon: Package },
  { label: "Ulazni računi", href: "/ulazni-racuni", icon: Inbox },
  { label: "Bankovni promet", href: "/banka", icon: Banknote },
  { label: "Temeljnice", href: "/knjigovodstvo/temeljnice", icon: BookOpen },
  { label: "Glavna knjiga", href: "/knjigovodstvo", icon: BookMarked },
  { label: "Bruto bilanca", href: "/knjigovodstvo/bruto-bilanca", icon: Scale },
  { label: "Radnici", href: "/place", icon: User },
  { label: "Plaće", href: "/place/obracun", icon: DollarSign },
  { label: "PDV", href: "/porezi", icon: Receipt },
  { label: "JOPPD", href: "/porezi/joppd", icon: ClipboardList },
  { label: "Izvještaji", href: "/izvjestaji", icon: BarChart3 },
  { label: "Postavke", href: "/postavke", icon: Settings },
];

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { companies, companyId: currentCompanyId } = useCompany();
  const { user, signOut } = useAuth();
  const currentCompany = companies.find((c) => c.id === currentCompanyId) ?? companies[0];
  const showSignOut = hasSupabase() && user;
  const onNav = onMobileClose ?? (() => {});

  const sidebarContent = (
    <>
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-800 p-4">
          <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-2">
            <div className="flex-1 truncate text-sm font-medium">
              {currentCompany?.naziv ?? "Odaberi firmu"}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          <Link
            href="/dashboard"
            onClick={onNav}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/dashboard"
                ? "bg-primary text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <div className="my-2 border-t border-slate-800 pt-2">
            <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Prodaja
            </div>
          </div>
          {[
            { href: "/racuni", label: "Računi", icon: FileText },
            { href: "/ponude", label: "Ponude", icon: FileSpreadsheet },
            { href: "/ponavljajuci-racuni", label: "Ponavljajući računi", icon: Repeat },
            { href: "/kontakti", label: "Kontakti", icon: Users },
            { href: "/artikli", label: "Artikli", icon: Package },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-primary text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          <div className="my-2 border-t border-slate-800 pt-2">
            <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Nabava
            </div>
          </div>
          <Link
            href="/ulazni-racuni"
            onClick={onNav}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/ulazni-racuni")
                ? "bg-primary text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Inbox className="h-5 w-5" />
            Ulazni računi
          </Link>
          <div className="my-2 border-t border-slate-800 pt-2">
            <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Financije
            </div>
          </div>
          <Link
            href="/banka"
            onClick={onNav}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/banka")
                ? "bg-primary text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Banknote className="h-5 w-5" />
            Bankovni promet
          </Link>
          <Link
            href="/vozila"
            onClick={onNav}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/vozila")
                ? "bg-primary text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Car className="h-5 w-5" />
            Vozila
          </Link>
          <Link
            href="/dividende"
            onClick={onNav}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/dividende")
                ? "bg-primary text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Wallet className="h-5 w-5" />
            Dividende
          </Link>
          <div className="my-2 border-t border-slate-800 pt-2">
            <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Računovodstvo
            </div>
          </div>
          {[
            { href: "/knjigovodstvo/temeljnice", label: "Temeljnice", icon: BookOpen },
            { href: "/knjigovodstvo", label: "Glavna knjiga", icon: BookMarked },
            { href: "/knjigovodstvo/bruto-bilanca", label: "Bruto bilanca", icon: Scale },
            { href: "/osnovna-sredstva", label: "Osnovna sredstva", icon: Building2 },
            { href: "/knjigovodstvo/zatvaranje-godine", label: "Zatvaranje godine", icon: CalendarCheck },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-primary text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          <div className="my-2 border-t border-slate-800 pt-2">
            <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Kadrovi
            </div>
          </div>
          {[
            { href: "/place", label: "Plaće", icon: DollarSign, active: pathname === "/place" || pathname.startsWith("/place/obracun") },
            { href: "/place/radnici", label: "Radnici", icon: User, active: pathname.startsWith("/place/radnici") },
            { href: "/putni-nalozi", label: "Putni nalozi", icon: MapPin, active: pathname.startsWith("/putni-nalozi") },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                item.active ? "bg-primary text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          <div className="my-2 border-t border-slate-800 pt-2">
            <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Porezi
            </div>
          </div>
          <Link
            href="/porezi/pdv"
            onClick={onNav}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/porezi/pdv")
                ? "bg-primary text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Receipt className="h-5 w-5" />
            PDV
          </Link>
          <Link
            href="/porezi/joppd"
            onClick={onNav}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/porezi/joppd")
                ? "bg-primary text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <ClipboardList className="h-5 w-5" />
            JOPPD
          </Link>
          <Link
            href="/izvjestaji"
            onClick={onNav}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/izvjestaji")
                ? "bg-primary text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <BarChart3 className="h-5 w-5" />
            Izvještaji
          </Link>
          <Link
            href="/kpi"
            onClick={onNav}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/kpi")
                ? "bg-primary text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <BarChart3 className="h-5 w-5" />
            KPI
          </Link>
          <Link
            href="/dokumenti"
            onClick={onNav}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/dokumenti")
                ? "bg-primary text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <FileStack className="h-5 w-5" />
            Dokumenti
          </Link>
          <Link
            href="/skladiste"
            onClick={onNav}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/skladiste")
                ? "bg-primary text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Package className="h-5 w-5" />
            Skladište
          </Link>
          <Link
            href="/postavke"
            onClick={onNav}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/postavke")
                ? "bg-primary text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Settings className="h-5 w-5" />
            Postavke
          </Link>
          {showSignOut && (
            <button
              type="button"
              onClick={() => signOut().then(() => window.location.assign("/login"))}
              className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              Odjava
            </button>
          )}
        </nav>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-[260px] border-r border-slate-800 bg-sidebar text-white flex-col">
        {sidebarContent}
      </aside>
      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onMobileClose}
            aria-hidden
          />
          <div className="fixed left-0 top-0 h-full w-64 max-w-[85vw] bg-sidebar border-r border-slate-800 overflow-y-auto z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
