import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10 },
  title: { fontSize: 14, marginBottom: 20, fontWeight: "bold" },
  row: { flexDirection: "row", marginBottom: 6 },
  label: { width: 140 },
  value: { flex: 1 },
  hr: { borderBottomWidth: 1, borderBottomColor: "#ccc", marginVertical: 12 },
  footer: { marginTop: 24, fontSize: 8, color: "#666" },
});

export interface IsplatnaListaData {
  companyNaziv: string;
  radnikIme: string;
  radnikPrezime: string;
  radnikOib: string;
  periodOd: string;
  periodDo: string;
  bruto: number;
  doprinosiIz: number;
  dohodak: number;
  osobniOdbitak: number;
  porezPrirez: number;
  neto: number;
}

function n(value: number | undefined | null): number {
  const v = Number(value);
  return Number.isFinite(v) ? v : 0;
}

export function IsplatnaListaDocument({ data }: { data: IsplatnaListaData }) {
  const bruto = n(data.bruto);
  const doprinosiIz = n(data.doprinosiIz);
  const dohodak = n(data.dohodak);
  const osobniOdbitak = n(data.osobniOdbitak);
  const porezPrirez = n(data.porezPrirez);
  const neto = n(data.neto);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>ISPLATNA LISTA</Text>
        <Text>{data.companyNaziv || "—"}</Text>
        <View style={styles.hr} />
        <View style={styles.row}>
          <Text style={styles.label}>Zaposlenik:</Text>
          <Text style={styles.value}>{data.radnikIme || ""} {data.radnikPrezime || ""} (OIB: {data.radnikOib || "—"})</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Obračunsko razdoblje:</Text>
          <Text style={styles.value}>{data.periodOd || "—"} – {data.periodDo || "—"}</Text>
        </View>
        <View style={styles.hr} />
        <View style={styles.row}>
          <Text style={styles.label}>Bruto plaća:</Text>
          <Text style={styles.value}>{bruto.toFixed(2)} €</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Doprinosi iz plaće:</Text>
          <Text style={styles.value}>-{doprinosiIz.toFixed(2)} €</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Dohodak:</Text>
          <Text style={styles.value}>{dohodak.toFixed(2)} €</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Osobni odbitak:</Text>
          <Text style={styles.value}>-{osobniOdbitak.toFixed(2)} €</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Porez i prirez:</Text>
          <Text style={styles.value}>-{porezPrirez.toFixed(2)} €</Text>
        </View>
        <View style={styles.hr} />
        <View style={styles.row}>
          <Text style={styles.label}>NETO ZA ISPLATU:</Text>
          <Text style={[styles.value, { fontWeight: "bold" }]}>{neto.toFixed(2)} €</Text>
        </View>
        <Text style={styles.footer}>Dokument generiran iz sustava. Službeni dokument za isplatu plaće.</Text>
      </Page>
    </Document>
  );
}
