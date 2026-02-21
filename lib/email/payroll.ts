/**
 * Slanje emaila vlasniku nakon automatskog obračuna plaća.
 * Zahtijeva RESEND_API_KEY i FROM_EMAIL u env.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@example.com";

export interface PayrollEmailParams {
  to: string;
  firmaNaziv: string;
  mjesec: string;
  brojRadnika: number;
  ukupnoNeto: number;
  ukupnoTrosak: number;
}

export async function sendPayrollEmail(params: PayrollEmailParams): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [params.to],
        subject: `Plaće za ${params.mjesec} – automatski obračun (${params.firmaNaziv})`,
        html: `
          <h2>Automatski obračun plaća</h2>
          <p>Obavještavamo vas da je obračun plaća za <strong>${params.mjesec}</strong> za tvrtku <strong>${params.firmaNaziv}</strong> uspješno izvršen.</p>
          <ul>
            <li>Broj radnika: <strong>${params.brojRadnika}</strong></li>
            <li>Ukupno neto za isplatu: <strong>${params.ukupnoNeto.toFixed(2)} €</strong></li>
            <li>Ukupni trošak poslodavca: <strong>${params.ukupnoTrosak.toFixed(2)} €</strong></li>
          </ul>
          <p>JOPPD prijavu podnesite do 15. u mjesecu. Pregled obračuna možete napraviti u aplikaciji u izborniku Plaće.</p>
        `,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
