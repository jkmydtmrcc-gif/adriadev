"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, Eye, ChevronDown } from "lucide-react";

const APP_NAME = "Adriadev";

export default function LandingPage() {
  const [isScrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans">
      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex items-center justify-between px-4 py-4 md:px-6 md:py-4 lg:px-8"
        style={{
          background: isScrolled ? "rgba(10,10,15,0.95)" : "transparent",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400" />
          <span className="font-bold text-white text-lg">{APP_NAME}</span>
        </div>

        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          <a href="#znacajke" className="text-sm text-slate-300 hover:text-white transition-colors">Značajke</a>
          <a href="#cijene" className="text-sm text-slate-300 hover:text-white transition-colors">Cijene</a>
          <a href="#faq" className="text-sm text-slate-300 hover:text-white transition-colors">FAQ</a>
          <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors">Prijava</Link>
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full text-sm font-semibold text-white transition-colors"
          >
            Započni besplatno
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden p-2 text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Izbornik"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute top-full left-0 right-0 z-40 bg-[var(--card)] border-b border-[var(--border)] overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-4">
              <a href="#znacajke" className="text-slate-300 hover:text-white" onClick={() => setMenuOpen(false)}>Značajke</a>
              <a href="#cijene" className="text-slate-300 hover:text-white" onClick={() => setMenuOpen(false)}>Cijene</a>
              <a href="#faq" className="text-slate-300 hover:text-white" onClick={() => setMenuOpen(false)}>FAQ</a>
              <Link href="/login" className="text-slate-300 hover:text-white" onClick={() => setMenuOpen(false)}>Prijava</Link>
              <Link
                href="/register"
                className="w-full bg-blue-600 py-3 rounded-full text-center font-semibold text-white"
                onClick={() => setMenuOpen(false)}
              >
                Započni besplatno
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="min-h-screen flex items-center pt-24 md:pt-28 pb-20 md:pb-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400">AI računovodstvo za Hrvatsku</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight mb-6">
              <span className="text-white">Zaboravi na </span>
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                računovođu.
              </span>
              <br />
              <span className="text-white">AI radi sve.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 mb-8 max-w-lg mx-auto lg:mx-0">
              Fotografiraš račun, AI ga proknjiži. Izdaješ račune, automatski fiskalizirani. Plaće se obračunaju same. Od 19€/mj.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center lg:justify-start">
              <Link
                href="/register"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all transform hover:scale-105 text-center"
              >
                Isprobaj besplatno 30 dana
              </Link>
              <a
                href="#znacajke"
                className="w-full sm:w-auto border border-slate-600 hover:border-slate-400 text-white px-8 py-4 rounded-full text-lg transition-all text-center"
              >
                Pogledaj demo →
              </a>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="flex -space-x-2">
                {["MK", "AP", "IB", "TN"].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-xs font-bold border-2 border-[var(--bg)]"
                  >
                    {i}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex text-yellow-400 text-sm">★★★★★</div>
                <p className="text-xs text-slate-400">Povjerenje 2.500+ hr. poduzetnika</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-[var(--border)]">
              <p className="text-xs text-slate-500 mb-3">Integracije i sukladnost:</p>
              <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-start">
                {["Fina", "Porezna uprava", "Fiskalizacija", "eGrađani"].map((l) => (
                  <span
                    key={l}
                    className="text-xs text-slate-400 bg-[var(--card)] border border-[var(--border)] px-3 py-1 rounded-full"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hidden sm:block relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full" />
            <div className="relative z-10 bg-[#1e1e2e] rounded-2xl border border-[#2e2e3e] p-4 shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="flex-1 bg-[var(--bg)] rounded px-3 py-1 text-xs text-slate-500 ml-2">
                  app.knjigu.hr/dashboard
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: "Prihodi", val: "12.450 €", color: "text-green-400" },
                  { label: "PDV obveza", val: "2.340 €", color: "text-yellow-400" },
                  { label: "Neplaćeni", val: "3.200 €", color: "text-red-400" },
                  { label: "Troškovi", val: "4.100 €", color: "text-blue-400" },
                ].map((c) => (
                  <div key={c.label} className="bg-[var(--bg)] rounded-lg p-3">
                    <p className="text-xs text-slate-500">{c.label}</p>
                    <p className={`text-sm font-bold ${c.color}`}>{c.val}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[var(--bg)] rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-2">Prihodi vs Rashodi</p>
                <div className="flex items-end gap-1 h-16">
                  {[60, 80, 55, 90, 70, 85, 75, 95, 65, 88, 72, 90].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col gap-1 items-center">
                      <div className="w-full bg-blue-500 rounded-sm" style={{ height: `${h}%` }} />
                      <div className="w-full bg-red-400/50 rounded-sm" style={{ height: `${h * 0.6}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 lg:-left-8 bg-[#1e1e2e] border border-[#2e2e3e] rounded-2xl p-4 shadow-2xl w-40 lg:w-44">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Scanning Success</p>
                  <p className="text-xs text-slate-400">AI proknjižio</p>
                </div>
              </div>
              <div className="bg-[var(--bg)] rounded p-2">
                <p className="text-xs text-cyan-400">HT račun: 59,96 €</p>
                <p className="text-xs text-slate-500">Konto: 4230 ✓</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-[#0d0d14]" id="znacajke">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Koliko te košta računovođa svaki mjesec?
          </h2>
          <p className="text-slate-400 mb-12">Zbrojaj samo jednom. Bit će ti jasno.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {[
              { icon: "💸", title: "200-400€/mj", desc: "Za rutinske stvari koje AI može napraviti" },
              { icon: "⏰", title: "Sati papirologije", desc: "Slanje PDF-ova, praćenje rokova, evidencija" },
              { icon: "😰", title: "Strah od kazni", desc: "Zakasneli JOPPD, PDV, fiskalizacija" },
            ].map((p) => (
              <div key={p.title} className="bg-[var(--card)] border border-red-500/20 rounded-2xl p-6">
                <div className="text-4xl mb-3">{p.icon}</div>
                <h3 className="text-lg font-bold text-red-400 mb-2">{p.title}</h3>
                <p className="text-slate-400 text-sm">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="inline-flex items-center gap-3 bg-blue-600/10 border border-blue-600/30 rounded-full px-6 py-3">
            <span className="text-blue-400 font-semibold">Postoji bolji način →</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-16">
            Kako funkcionira?
          </h2>

          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-4">
            {[
              { num: "01", icon: "📷", title: "Fotografiraš račun", desc: "Mobitelom ili uploadom" },
              { num: "02", icon: "🤖", title: "AI analizira", desc: "Kategorija, konto, iznos — sve automatski" },
              { num: "03", icon: "✅", title: "Proknjiženo", desc: "Za 3 sekunde, bez ikakvog unosa" },
            ].map((s, i) => (
              <div key={s.num} className="flex md:flex-col items-center gap-4 md:gap-0 flex-1">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-3xl flex-shrink-0">
                  {s.icon}
                </div>
                <div className="md:text-center md:mt-4">
                  <p className="text-xs text-blue-400 font-mono mb-1">{s.num}</p>
                  <h3 className="text-white font-bold mb-1">{s.title}</h3>
                  <p className="text-slate-400 text-sm">{s.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block w-16 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Sve što treba tvoja firma
          </h2>
          <p className="text-slate-400 text-center mb-12">Jedan alat. Sve funkcije. Nula računovođe.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "📷", title: "AI Skeniranje", desc: "Fotografiraš račun → AI ga proknjiži automatski. Kategorija, konto, PDV — sve sam.", color: "from-blue-600 to-blue-400" },
              { icon: "🧾", title: "Fiskalizacija", desc: "Svaki izlazni račun automatski fiskaliziran. JIR kod u sekundi.", color: "from-cyan-600 to-cyan-400" },
              { icon: "💰", title: "Obračun plaća", desc: "Upiši bruto, sve ostalo automatski. JOPPD XML spreman za predaju.", color: "from-purple-600 to-purple-400" },
              { icon: "📊", title: "PDV automatski", desc: "Obračun iz temeljnica, XML za e-Porezna. Nikad više ručnog računanja.", color: "from-green-600 to-green-400" },
              { icon: "🤖", title: "AI Savjetnik", desc: "Pitaj bilo što o hrvatskim porezima. Odgovori za sekunde, 24/7.", color: "from-orange-600 to-orange-400" },
              { icon: "📈", title: "Dashboard", desc: "Prihodi, rashodi, PDV obveze, cash flow — sve na jednom ekranu.", color: "from-pink-600 to-pink-400" },
            ].map((f) => (
              <div
                key={f.title}
                className="group bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 hover:border-blue-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/10 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-white font-bold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 md:py-24 px-4 md:px-8" id="cijene">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Jednostavne cijene
          </h2>
          <p className="text-slate-400 text-center mb-12">Bez skrivenih naknada. Otkaži kad hoćeš.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Osnovni",
                price: "19",
                popular: false,
                features: ["Do 50 dokumenata/mj", "Računi i ponude", "Osnovno knjigovodstvo", "Email podrška"],
                cta: "Odaberi",
              },
              {
                name: "Profesionalni",
                price: "39",
                popular: true,
                features: ["Neograničeni dokumenti", "AI skeniranje računa", "Plaće i JOPPD", "PDV obračun", "AI porezni savjetnik", "Putni nalozi"],
                cta: "Započni besplatno",
              },
              {
                name: "Business",
                price: "79",
                popular: false,
                features: ["Sve iz Profesionalnog", "Do 5 korisnika", "Robno-materijalno", "Cash flow forecast", "Prioritetna podrška", "Više valuta"],
                cta: "Odaberi",
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 ${
                  plan.popular
                    ? "bg-gradient-to-b from-blue-600/20 to-[var(--card)] border-2 border-blue-500 md:scale-105"
                    : "bg-[var(--card)] border border-[var(--border)]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Najpopularniji
                  </div>
                )}
                <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-black text-white">{plan.price}€</span>
                  <span className="text-slate-400 mb-1">/mj</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-400 text-xs">✓</span>
                      </div>
                      <span className="text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.popular ? "/register" : "/register"}
                  className={`block w-full py-3 rounded-xl font-semibold transition-all text-center ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90"
                      : "border border-[#2e2e3e] text-white hover:border-blue-600"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
            <p className="text-green-400 font-semibold text-lg">💰 Prosječna računovođa košta 200-400€/mj.</p>
            <p className="text-slate-400 mt-1">Naš Business plan košta 79€. Uštedite 120-320€ svaki mjesec.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Što kažu korisnici
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "Konačno ne moram slati PDF-ove računovođi. Skeniram i gotovo.", name: "Ana K.", role: "Vlasnica obrta", init: "AK" },
              { quote: "Plaće i JOPPD za 5 minuta. Preporučujem svima.", name: "Marko P.", role: "Direktor j.d.o.o.", init: "MP" },
              { quote: "AI savjetnik mi je odgovorio na sve porezne dileme. Nevjerojatno.", name: "Ivana S.", role: "Samostalna obrtnica", init: "IS" },
            ].map((t) => (
              <div key={t.name} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex text-yellow-400 text-sm mb-3">★★★★★</div>
                <p className="text-slate-300 text-sm mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-white text-sm">
                    {t.init}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-slate-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 px-4 md:px-8" id="faq">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Česta pitanja
          </h2>
          <div className="space-y-3">
            {[
              { q: "Mogu li probati besplatno?", a: "Da. 30 dana besplatno, bez kreditne kartice. Otkažeš kad hoćeš." },
              { q: "Je li fiskalizacija uključena?", a: "Da. Svaki izlazni račun automatski se fiskalizira prema hrvatskim propisima." },
              { q: "Što ako imam pitanje o porezima?", a: "AI savjetnik je uključen u Profesionalni i Business plan. Odgovara 24/7 na hrvatske poreze i doprinose." },
              { q: "Mogu li uvesti postojeće podatke?", a: "Da. Podržavamo uvoz računa, kontakata i temeljnica iz Excel/CSV ili drugih sustava." },
              { q: "Je li ugovor na određeno?", a: "Ne. Mjesečna pretplata, otkažeš kad god. Nema dugoročnih obveza." },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-4 md:p-5 text-left text-white font-medium"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${faqOpen === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {faqOpen === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 md:px-5 pb-4 md:pb-5 text-slate-400 text-sm">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 px-4 md:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            Spreman za računovodstvo bez glavobolje?
          </h2>
          <p className="text-slate-400 mb-8">Pridruži se tisućama hrvatskih poduzetnika.</p>
          <Link
            href="/register"
            className="inline-block bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold px-10 py-4 rounded-full text-lg transition-all transform hover:scale-105"
          >
            Isprobaj besplatno 30 dana →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-12 md:py-16 px-4 md:px-8 bg-[var(--card)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400" />
                <span className="font-bold text-white">{APP_NAME}</span>
              </div>
              <p className="text-slate-400 text-sm">AI računovodstvo za hrvatske firme.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Proizvod</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#znacajke" className="hover:text-white">Značajke</a></li>
                <li><a href="#cijene" className="hover:text-white">Cijene</a></li>
                <li><a href="#faq" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Pravno</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">Uvjeti korištenja</a></li>
                <li><a href="#" className="hover:text-white">Pravna obavijest</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Kontakt</h4>
              <p className="text-slate-400 text-sm">podrška@knjigu.hr</p>
            </div>
          </div>
          <p className="text-slate-500 text-xs text-center">© 2026 {APP_NAME}. Napravljeno u Hrvatskoj 🇭🇷</p>
        </div>
      </footer>

      {/* Mobile sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--bg)]/95 backdrop-blur border-t border-[var(--border)] md:hidden z-50">
        <Link
          href="/register"
          className="block w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-4 rounded-xl text-center"
        >
          Isprobaj besplatno 30 dana →
        </Link>
      </div>

      {/* Spacer so sticky bar doesn't cover content on mobile */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
