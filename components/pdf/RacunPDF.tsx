"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Company } from "@/lib/types";
import type { Kontakt } from "@/lib/types";
import type { Racun } from "@/lib/types";
import type { RacunStavka } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  companyBlock: {
    maxWidth: "50%",
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#0f172a",
  },
  companyLine: {
    marginBottom: 2,
    color: "#475569",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#0f172a",
    textAlign: "center",
  },
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionContent: {
    color: "#334155",
  },
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  table: {
    marginTop: 16,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#0f172a",
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: "#f8fafc",
    fontWeight: "bold",
  },
  colNaziv: { width: "32%" },
  colKolicina: { width: "10%", textAlign: "right" },
  colJmj: { width: "8%" },
  colCijena: { width: "15%", textAlign: "right" },
  colPdv: { width: "8%", textAlign: "right" },
  colUkupno: { width: "17%", textAlign: "right" },
  totals: {
    marginLeft: "auto",
    width: "40%",
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: { color: "#64748b" },
  totalValue: { fontWeight: "bold" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#64748b",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
  },
  legal: {
    marginTop: 8,
    fontSize: 7,
    color: "#94a3b8",
  },
});

interface RacunPDFProps {
  company: Company;
  kontakt: Kontakt;
  racun: Racun;
  stavke: RacunStavka[];
}

export function RacunPDFDocument({ company, kontakt, racun, stavke }: RacunPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{company.naziv}</Text>
            {company.adresa && <Text style={styles.companyLine}>{company.adresa}</Text>}
            <Text style={styles.companyLine}>
              {company.postanski_broj} {company.grad}
            </Text>
            <Text style={styles.companyLine}>OIB: {company.oib}</Text>
            {company.iban && <Text style={styles.companyLine}>IBAN: {company.iban}</Text>}
          </View>
          <View style={styles.companyBlock}>
            <Text style={styles.sectionLabel}>Kupac</Text>
            <Text style={styles.companyName}>{kontakt.naziv}</Text>
            {kontakt.adresa && <Text style={styles.companyLine}>{kontakt.adresa}</Text>}
            {kontakt.grad && (
              <Text style={styles.companyLine}>
                {kontakt.postanski_broj} {kontakt.grad}
              </Text>
            )}
            {kontakt.oib && <Text style={styles.companyLine}>OIB: {kontakt.oib}</Text>}
          </View>
        </View>

        <Text style={styles.title}>RAČUN br. {racun.broj_racuna}</Text>

        <View style={styles.twoCol}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Datum izdavanja</Text>
            <Text style={styles.sectionContent}>{formatDate(racun.datum_izdavanja)}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Datum valute</Text>
            <Text style={styles.sectionContent}>{formatDate(racun.datum_valute)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNaziv}>Naziv</Text>
            <Text style={styles.colKolicina}>Kol.</Text>
            <Text style={styles.colJmj}>JMJ</Text>
            <Text style={styles.colCijena}>Cijena bez PDV</Text>
            <Text style={styles.colPdv}>PDV %</Text>
            <Text style={styles.colUkupno}>Ukupno</Text>
          </View>
          {stavke.map((s) => (
            <View key={s.id} style={styles.tableRow}>
              <Text style={styles.colNaziv}>{s.naziv}</Text>
              <Text style={styles.colKolicina}>{Number(s.kolicina)}</Text>
              <Text style={styles.colJmj}>{s.jedinica_mjere ?? "kom"}</Text>
              <Text style={styles.colCijena}>{Number(s.cijena_bez_pdv).toFixed(2)} €</Text>
              <Text style={styles.colPdv}>{Number(s.pdv_stopa)}%</Text>
              <Text style={styles.colUkupno}>{formatCurrency(s.ukupno ?? 0)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Ukupno bez PDV</Text>
            <Text style={styles.totalValue}>{formatCurrency(racun.ukupno_bez_pdv ?? 0)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>PDV</Text>
            <Text style={styles.totalValue}>{formatCurrency(racun.ukupno_pdv ?? 0)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Ukupno za plaćanje</Text>
            <Text style={styles.totalValue}>{formatCurrency(racun.ukupno_s_pdv ?? 0)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {company.footer_tekst && <Text>{company.footer_tekst}</Text>}
          {company.iban && <Text>IBAN: {company.iban} • OIB: {company.oib}</Text>}
          {company.nadlezni_sud && <Text>Nadležni sud: {company.nadlezni_sud}</Text>}
          {company.temeljni_kapital != null && (
            <Text>Temeljni kapital: {Number(company.temeljni_kapital).toFixed(2)} €</Text>
          )}
          <Text style={styles.legal}>
            Sukladno čl. 75. Zakona o PDV-u (NN 73/13, 20/14, 115/16, 106/18), račun je ispravan,
            istinit i izdan u jednom primjerku. Na način i u roku dogovorenom s kupcem.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
