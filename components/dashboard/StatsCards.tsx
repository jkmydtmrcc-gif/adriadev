"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, FileText, Receipt, Wallet } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon: React.ReactNode;
  sparkline?: number[];
}

function StatCard({ title, value, change, changePositive, icon, sparkline }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <span className="text-sm font-medium text-slate-500">{title}</span>
          <span className="rounded-lg bg-slate-100 p-2 text-slate-600">{icon}</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {change != null && (
            <div className="mt-1 flex items-center gap-1 text-xs">
              {changePositive ? (
                <TrendingUp className="h-3.5 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3.5 w-3 text-danger" />
              )}
              <span className={changePositive ? "text-success" : "text-danger"}>
                {change}
              </span>
              <span className="text-slate-500">u odnosu na prošli mjesec</span>
            </div>
          )}
          {sparkline && sparkline.length > 0 && (
            <div className="mt-3 flex h-8 items-end gap-0.5">
              {sparkline.map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-t bg-primary/30"
                  style={{ height: `${Math.max(4, (h / Math.max(...sparkline)) * 100)}%` }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface StatsCardsProps {
  prihodiMjesec: number;
  prihodiPromjena?: number;
  neplaceniIznos: number;
  neplaceniBroj: number;
  pdvObveza: number;
  pdvDospijece?: string;
  troskoviMjesec: number;
  topKategorija?: string;
}

export function StatsCards({
  prihodiMjesec,
  prihodiPromjena = 0,
  neplaceniIznos,
  neplaceniBroj,
  pdvObveza,
  pdvDospijece,
  troskoviMjesec,
  topKategorija,
}: StatsCardsProps) {
  const sparkline = [40, 55, 60, 45, 70, 65, 80, 75, 90, 85, 88, 100];
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Prihodi ovaj mjesec"
        value={formatCurrency(prihodiMjesec)}
        change={prihodiPromjena !== 0 ? `${Math.abs(prihodiPromjena)}%` : undefined}
        changePositive={prihodiPromjena >= 0}
        icon={<TrendingUp className="h-5 w-5" />}
        sparkline={sparkline}
      />
      <StatCard
        title="Neplaćeni računi"
        value={formatCurrency(neplaceniIznos)}
        change={neplaceniBroj > 0 ? `${neplaceniBroj} račun(a)` : undefined}
        icon={<FileText className="h-5 w-5" />}
      />
      <StatCard
        title="PDV obveza"
        value={formatCurrency(pdvObveza)}
        change={pdvDospijece ? `Dospijeće: ${pdvDospijece}` : undefined}
        icon={<Receipt className="h-5 w-5" />}
      />
      <StatCard
        title="Troškovi ovaj mjesec"
        value={formatCurrency(troskoviMjesec)}
        change={topKategorija ? `Top: ${topKategorija}` : undefined}
        icon={<Wallet className="h-5 w-5" />}
      />
    </div>
  );
}
