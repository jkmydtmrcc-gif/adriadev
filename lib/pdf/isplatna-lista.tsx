import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const S = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 9 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#2563eb" },
  subtitle: { fontSize: 9, color: "#64748b", marginTop: 3 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    backgroundColor: "#f1f5f9",
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 6,
    marginTop: 14,
    color: "#1e293b",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  rowAlt: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: "#f8fafc",
  },
  label: { color: "#475569" },
  val: { fontWeight: "bold", color: "#1e293b" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#2563eb",
    marginTop: 4,
    borderRadius: 4,
  },
  totalText: { fontSize: 11, fontWeight: "bold", color: "#ffffff" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: "#000",
    width: 160,
    marginTop: 28,
    paddingTop: 3,
  },
  sigLabel: { fontSize: 7, color: "#64748b" },
});

export interface IsplatnaListaFirma {
  naziv: string;
  oib?: string;
  adresa?: string;
  grad?: string;
}

export interface IsplatnaListaRadnik {
  ime: string;
  prezime: string;
  oib?: string;
  iban?: string;
  opcina?: string;
}

export interface IsplatnaListaObracun {
  period_od: string;
  period_do: string;
  bruto: number;
  doprinosi_iz_place?: number;
  dohodak?: number;
  osobni_odbitak?: number;
  porezna_osnovica?: number;
  porez_i_prirez?: number;
  neto?: number;
  doprinosi_na_placu?: number;
  ukupni_trosak?: number;
}

function n(value: number | undefined | null): number {
  const v = Number(value);
  return Number.isFinite(v) ? v : 0;
}

function f(num: number): string {
  return `${num.toFixed(2).replace(".", ",")} €`;
}

export function IsplatnaListaPDF({
  firma,
  radnik,
  obracun,
}: {
  firma: IsplatnaListaFirma;
  radnik: IsplatnaListaRadnik;
  obracun: IsplatnaListaObracun;
}) {
  const bruto = n(obracun.bruto);
  const doprinosiIz = n(obracun.doprinosi_iz_place);
  const dohodak = n(obracun.dohodak);
  const osobniOdbitak = n(obracun.osobni_odbitak);
  const poreznaOsnovica = n(obracun.porezna_osnovica);
  const porezPrirez = n(obracun.porez_i_prirez);
  const neto = n(obracun.neto);
  const doprinosiNa = n(obracun.doprinosi_na_placu);
  const ukupniTrosak = n(obracun.ukupni_trosak);

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <View>
            <Text style={S.title}>ISPLATNA LISTA</Text>
            <Text style={S.subtitle}>
              Period: {obracun.period_od} — {obracun.period_do}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontWeight: "bold", fontSize: 11 }}>{firma.naziv || "—"}</Text>
            {firma.oib ? <Text style={{ color: "#64748b" }}>OIB: {firma.oib}</Text> : null}
            {(firma.adresa || firma.grad) ? (
              <Text style={{ color: "#64748b" }}>
                {[firma.adresa, firma.grad].filter(Boolean).join(", ")}
              </Text>
            ) : null}
          </View>
        </View>

        <Text style={S.sectionTitle}>PODACI O RADNIKU</Text>
        <View style={S.row}>
          <Text style={S.label}>Ime i prezime</Text>
          <Text style={S.val}>
            {radnik.ime} {radnik.prezime}
          </Text>
        </View>
        <View style={S.rowAlt}>
          <Text style={S.label}>OIB</Text>
          <Text style={S.val}>{radnik.oib || "—"}</Text>
        </View>
        <View style={S.row}>
          <Text style={S.label}>IBAN</Text>
          <Text style={S.val}>{radnik.iban || "—"}</Text>
        </View>
        <View style={S.rowAlt}>
          <Text style={S.label}>Općina poreza</Text>
          <Text style={S.val}>{radnik.opcina || "—"}</Text>
        </View>

        <Text style={S.sectionTitle}>OBRAČUN</Text>
        <View style={S.row}>
          <Text style={S.label}>BRUTO plaća</Text>
          <Text style={S.val}>{f(bruto)}</Text>
        </View>
        <View style={S.rowAlt}>
          <Text style={S.label}>(-) Doprinosi iz plaće (MIO I + II)</Text>
          <Text style={S.val}>- {f(doprinosiIz)}</Text>
        </View>
        <View style={S.row}>
          <Text style={[S.label, { fontWeight: "bold" }]}>= DOHODAK</Text>
          <Text style={[S.val, { color: "#2563eb" }]}>{f(dohodak)}</Text>
        </View>
        <View style={S.rowAlt}>
          <Text style={S.label}>(-) Osobni odbitak</Text>
          <Text style={S.val}>- {f(osobniOdbitak)}</Text>
        </View>
        <View style={S.row}>
          <Text style={S.label}>= Porezna osnovica</Text>
          <Text style={S.val}>{f(poreznaOsnovica)}</Text>
        </View>
        <View style={S.rowAlt}>
          <Text style={S.label}>(-) Porez i prirez</Text>
          <Text style={S.val}>- {f(porezPrirez)}</Text>
        </View>

        <View style={S.totalRow}>
          <Text style={S.totalText}>NETO ZA ISPLATU</Text>
          <Text style={S.totalText}>{f(neto)}</Text>
        </View>

        <Text style={S.sectionTitle}>TROŠAK POSLODAVCA</Text>
        <View style={S.row}>
          <Text style={S.label}>Bruto plaća</Text>
          <Text style={S.val}>{f(bruto)}</Text>
        </View>
        <View style={S.rowAlt}>
          <Text style={S.label}>(+) Zdravstveno osiguranje (16,5%)</Text>
          <Text style={S.val}>+ {f(doprinosiNa)}</Text>
        </View>
        <View style={S.totalRow}>
          <Text style={S.totalText}>UKUPNI TROŠAK POSLODAVCA</Text>
          <Text style={S.totalText}>{f(ukupniTrosak)}</Text>
        </View>

        <View style={S.footer}>
          <View>
            <View style={S.sigLine} />
            <Text style={S.sigLabel}>Potpis poslodavca</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={S.sigLabel}>Datum: _______________</Text>
          </View>
          <View>
            <View style={S.sigLine} />
            <Text style={S.sigLabel}>Potpis radnika</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
