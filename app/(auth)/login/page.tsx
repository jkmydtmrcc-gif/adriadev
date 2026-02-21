"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, hasSupabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const APP_NAME = "Adriadev";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasSupabase()) router.replace("/dashboard");
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSupabase()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Uspješna prijava.");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Greška pri prijavi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col lg:flex-row">
      {/* Left - hidden on mobile */}
      <div className="hidden lg:flex lg:w-2/5 bg-[var(--card)] border-r border-[var(--border)] flex-col justify-between p-8 xl:p-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400" />
          <span className="font-bold text-white">{APP_NAME}</span>
        </div>
        <div>
          <blockquote className="text-xl xl:text-2xl font-bold text-white mb-4">
            &ldquo;Štedim 250€ svaki mjesec otkad koristim ovu aplikaciju.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-white text-sm">
              MP
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Marko Perić</p>
              <p className="text-slate-400 text-xs">Vlasnik obrta, Zagreb</p>
            </div>
          </div>
          <ul className="mt-8 space-y-3">
            {["Automatska fiskalizacija", "AI skeniranje računa", "PDV bez računovođe"].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 text-xs">✓</span>
                </div>
                <span className="text-slate-300 text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-slate-500 text-xs">© 2026 {APP_NAME}. Napravljeno u Hrvatskoj 🇭🇷</p>
      </div>

      {/* Right - form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400" />
            <span className="font-bold text-white text-lg">{APP_NAME}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Dobrodošao natrag</h1>
          <p className="text-slate-400 mb-8">Prijavi se u svoj račun</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Email adresa</label>
              <input
                type="email"
                placeholder="ime@firma.hr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Lozinka</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  aria-label={showPassword ? "Sakrij lozinku" : "Prikaži lozinku"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <Link href="/zaboravljena-lozinka" className="text-xs text-blue-400 hover:text-blue-300">
                  Zaboravljena lozinka?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:transform-none"
            >
              {loading ? "Prijava..." : "Prijavi se"}
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-slate-500 text-sm">ili</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            <button
              type="button"
              className="w-full border border-[var(--border)] hover:border-slate-500 text-white py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span className="font-medium">G</span> Nastavi s Googleom
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Nemaš račun?{" "}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold">
              Započni besplatno →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
