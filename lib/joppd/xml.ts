/**
 * Generiranje JOPPD XML za ePoreznu (pojednostavljena shema).
 * Struktura: JOPPD s P1 (obveznik), P2 (isplatna lista), P3 (po primatelju).
 */

export interface JOPPDRed {
  oib: string;
  ime: string;
  prezime: string;
  bruto: number;
  doprinosi_iz: number;
  dohodak: number;
  osobni_odbitak: number;
  porez_prirez: number;
  neto: number;
  doprinosi_na: number;
}

export interface JOPPDParams {
  oibObveznika: string;
  nazivObveznika: string;
  adresaObveznika: string;
  period: string; // YYYY-MM
  redovi: JOPPDRed[];
}

function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generirajJOPPDXml(params: JOPPDParams): string {
  const [year, month] = params.period.split("-");
  const indent = (n: number) => "  ".repeat(n);
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "",
    '<JOPPD xmlns="http://www.apis-it.hr/joppd/2022" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.apis-it.hr/joppd/2022 joppd-2022.xsd">',
    indent(1) + "<P1>",
    indent(2) + `<Oib>${escapeXml(params.oibObveznika)}</Oib>`,
    indent(2) + `<NazivObveznika>${escapeXml(params.nazivObveznika)}</NazivObveznika>`,
    indent(2) + `<AdresaObveznika>${escapeXml(params.adresaObveznika)}</AdresaObveznika>`,
    indent(2) + `<Mjesec>${month}</Mjesec>`,
    indent(2) + `<Godina>${year}</Godina>`,
    indent(1) + "</P1>",
    indent(1) + "<P2>",
    indent(2) + `<UkupniBrojPrimatelja>${params.redovi.length}</UkupniBrojPrimatelja>`,
    indent(2) + `<UkupniIznosBruto>${params.redovi.reduce((a, r) => a + r.bruto, 0).toFixed(2)}</UkupniIznosBruto>`,
    indent(2) + `<UkupniIznosDoprinosi>${params.redovi.reduce((a, r) => a + r.doprinosi_iz + r.doprinosi_na, 0).toFixed(2)}</UkupniIznosDoprinosi>`,
    indent(2) + `<UkupniIznosPorezPrirez>${params.redovi.reduce((a, r) => a + r.porez_prirez, 0).toFixed(2)}</UkupniIznosPorezPrirez>`,
    indent(2) + `<UkupniIznosNeto>${params.redovi.reduce((a, r) => a + r.neto, 0).toFixed(2)}</UkupniIznosNeto>`,
    indent(1) + "</P2>",
  ];
  params.redovi.forEach((r, i) => {
    lines.push(indent(1) + "<P3>");
    lines.push(indent(2) + `<RedniBroj>${i + 1}</RedniBroj>`);
    lines.push(indent(2) + `<Oib>${escapeXml(r.oib)}</Oib>`);
    lines.push(indent(2) + `<Ime>${escapeXml(r.ime)}</Ime>`);
    lines.push(indent(2) + `<Prezime>${escapeXml(r.prezime)}</Prezime>`);
    lines.push(indent(2) + `<IznosBruto>${r.bruto.toFixed(2)}</IznosBruto>`);
    lines.push(indent(2) + `<IznosDoprinosiIz>${r.doprinosi_iz.toFixed(2)}</IznosDoprinosiIz>`);
    lines.push(indent(2) + `<IznosDohodak>${r.dohodak.toFixed(2)}</IznosDohodak>`);
    lines.push(indent(2) + `<IznosOsobniOdbitak>${r.osobni_odbitak.toFixed(2)}</IznosOsobniOdbitak>`);
    lines.push(indent(2) + `<IznosPorezPrirez>${r.porez_prirez.toFixed(2)}</IznosPorezPrirez>`);
    lines.push(indent(2) + `<IznosNeto>${r.neto.toFixed(2)}</IznosNeto>`);
    lines.push(indent(2) + `<IznosDoprinosiNa>${r.doprinosi_na.toFixed(2)}</IznosDoprinosiNa>`);
    lines.push(indent(1) + "</P3>");
  });
  lines.push("</JOPPD>");
  lines.push("");
  return lines.join("\n");
}
