"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, hasSupabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const APP_NAME = "Adriadev";
const TIP_FIRME = ["Obrt", "J.d.o.o.", "D.o.o.", "Paušalni obrtnik"] as const;

function passwordStrength(p: string): 0 | 1 | 2 | 3 {
  if (!p.length) return 0;
  const hasLower = /[a-z]/.test(p);
  const hasUpper = /[A-Z]/.test(p);
  const hasNumber = /\d/.test(p);
  const hasSpecial = /[^a-zA-Z0-9]/.test(p);
  const len = p.length >= 8;
  let s = 0;
  if (len) s++;
  if ((hasLower || hasUpper) && (hasNumber || hasSpecial)) s++;
  if (len && (hasLower && hasUpper) && (hasNumber && hasSpecial)) s++;
  if (s === 0 && p.length >= 1) s = 1;
  return Math.min(3, Math.max(1, s)) as 0 | 1 | 2 | 3;
}

export default function RegisterPage() {
  const router = useRouter();
  const [ime, setIme] = useState("");
  const [prezime, setPrezime] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tipFirme, setTipFirme] = useState<string>(TIP_FIRME[0]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const passwordMatch = confirmPassword === password && confirmPassword.length > 0;

  useEffect(() => {
    if (!hasSupabase()) router.replace("/dashboard");
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSupabase() || !acceptTerms) return;
    if (password !== confirmPassword) {
      toast.error("Lozinke se ne podudaraju.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast.success("Račun kreiran. Provjerite email za potvrdu (ako je omogućeno).");
      router.push("/onboarding");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Greška pri registraciji.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col lg:flex-row">
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

      <div className="flex-1 flex items-center justify-center p-6 md:p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400" />
            <span className="font-bold text-white text-lg">{APP_NAME}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Kreiraj račun</h1>
          <p className="text-slate-400 mb-8">Započni besplatno 30 dana. Bez kreditne kartice.</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Ime</label>
                <input
                  type="text"
                  placeholder="Ime"
                  value={ime}
                  onChange={(e) => setIme(e.target.value)}
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Prezime</label>
                <input
                  type="text"
                  placeholder="Prezime"
                  value={prezime}
                  onChange={(e) => setPrezime(e.target.value)}
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

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
                  minLength={6}
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
              <div className="flex gap-1 mt-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      strength >= i
                        ? i === 1
                          ? "bg-red-500"
                          : i === 2
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        : "bg-[var(--border)]"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Potvrdi lozinku</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-[var(--card)] border rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors ${
                    confirmPassword.length && !passwordMatch
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-[var(--border)] focus:border-blue-500 focus:ring-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  aria-label={showConfirm ? "Sakrij lozinku" : "Prikaži lozinku"}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Tip firme</label>
              <select
                value={tipFirme}
                onChange={(e) => setTipFirme(e.target.value)}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                {TIP_FIRME.map((t) => (
                  <option key={t} value={t} className="bg-[var(--card)]">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                required
                className="mt-1 w-4 h-4 rounded border-[var(--border)] bg-[var(--card)] text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">
                Prihvaćam uvjete korištenja i pravnu obavijest.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:transform-none"
            >
              {loading ? "Kreiranje..." : "Kreiraj račun"}
            </button>

            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3">
              <span className="text-green-400 text-lg">✓</span>
              <span className="text-sm text-slate-300">30 dana besplatno, bez kreditne kartice</span>
            </div>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Već imaš račun?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
              Prijavi se →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
