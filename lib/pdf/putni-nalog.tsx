import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const S = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 24, color: "#1e293b" },
  hr: { borderBottomWidth: 1, borderBottomColor: "#e2e8f0", marginVertical: 12 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginBottom: 6, color: "#475569" },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 140, color: "#64748b" },
  value: { flex: 1, fontWeight: "bold" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#94a3b8" },
});

export interface PutniNalogPDFData {
  companyNaziv: string;
  brojNaloga: string;
  radnikIme: string;
  radnikPrezime: string;
  datumPolaska: string;
  datumPovratka: string;
  odrediste: string;
  svrha: string;
  drzava: string;
  tip: string;
  prijevoz: string;
  ukupnoKm: number;
  iznosKm: number;
  brojDnevnica: number;
  iznosDnevnice: number;
  ukupnoDnevnice: number;
  ukupnoZaIsplatu: number;
}

function f(n: number): string {
  return `${n.toFixed(2).replace(".", ",")}`;
}

export function PutniNalogPDF({ data }: { data: PutniNalogPDFData }) {
  const d = data;
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <Text style={S.title}>PUTNI NALOG</Text>
        <View style={S.hr} />
        <Text style={{ marginBottom: 8 }}>{d.companyNaziv}</Text>
        <Text style={{ marginBottom: 4 }}>Broj naloga: {d.brojNaloga}</Text>
        <View style={S.hr} />

        <Text style={S.sectionTitle}>Zaposlenik</Text>
        <View style={S.row}>
          <Text style={S.label}>Ime i prezime:</Text>
          <Text style={S.value}>{d.radnikIme} {d.radnikPrezime}</Text>
        </View>
        <View style={S.hr} />

        <Text style={S.sectionTitle}>Putovanje</Text>
        <View style={S.row}>
          <Text style={S.label}>Datum polaska:</Text>
          <Text style={S.value}>{d.datumPolaska}</Text>
        </View>
        <View style={S.row}>
          <Text style={S.label}>Datum povratka:</Text>
          <Text style={S.value}>{d.datumPovratka}</Text>
        </View>
        <View style={S.row}>
          <Text style={S.label}>Odrediste:</Text>
          <Text style={S.value}>{d.odrediste}</Text>
        </View>
        <View style={S.row}>
          <Text style={S.label}>Svrha:</Text>
          <Text style={S.value}>{d.svrha}</Text>
        </View>
        <View style={S.row}>
          <Text style={S.label}>Drzava / tip:</Text>
          <Text style={S.value}>{d.drzava} – {d.tip}</Text>
        </View>
        <View style={S.row}>
          <Text style={S.label}>Vrsta prijevoza:</Text>
          <Text style={S.value}>{d.prijevoz}</Text>
        </View>
        <View style={S.hr} />

        <Text style={S.sectionTitle}>Obračun</Text>
        <View style={S.row}>
          <Text style={S.label}>Ukupno km:</Text>
          <Text style={S.value}>{f(d.ukupnoKm)} km × 0,30 € = {f(d.iznosKm)} €</Text>
        </View>
        <View style={S.row}>
          <Text style={S.label}>Broj dnevnica:</Text>
          <Text style={S.value}>{f(d.brojDnevnica)} × {f(d.iznosDnevnice)} € = {f(d.ukupnoDnevnice)} €</Text>
        </View>
        <View style={S.hr} />
        <View style={S.row}>
          <Text style={S.label}>UKUPNO ZA ISPLATU:</Text>
          <Text style={[S.value, { fontSize: 12 }]}>{f(d.ukupnoZaIsplatu)} €</Text>
        </View>

        <View style={S.footer}>
          <Text>Dokument generiran iz sustava. Valjano za isplatu naknadâ po putnom nalogu.</Text>
        </View>
      </Page>
    </Document>
  );
}
