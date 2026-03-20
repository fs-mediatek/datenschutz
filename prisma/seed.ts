import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("Seeding database...");

  // Legal Bases
  const legalBases = [
    { article: "Art. 6 Abs. 1 lit. a DSGVO", description: "Einwilligung der betroffenen Person" },
    { article: "Art. 6 Abs. 1 lit. b DSGVO", description: "Erfüllung eines Vertrags oder vorvertragliche Maßnahmen" },
    { article: "Art. 6 Abs. 1 lit. c DSGVO", description: "Erfüllung einer rechtlichen Verpflichtung" },
    { article: "Art. 6 Abs. 1 lit. d DSGVO", description: "Schutz lebenswichtiger Interessen" },
    { article: "Art. 6 Abs. 1 lit. e DSGVO", description: "Wahrnehmung einer Aufgabe im öffentlichen Interesse" },
    { article: "Art. 6 Abs. 1 lit. f DSGVO", description: "Berechtigtes Interesse des Verantwortlichen oder eines Dritten" },
    { article: "Art. 9 Abs. 2 lit. a DSGVO", description: "Ausdrückliche Einwilligung (besondere Kategorien)" },
    { article: "Art. 9 Abs. 2 lit. b DSGVO", description: "Arbeitsrecht, Sozialschutz (besondere Kategorien)" },
    { article: "§ 26 BDSG", description: "Datenverarbeitung für Zwecke des Beschäftigungsverhältnisses" },
  ];

  for (const lb of legalBases) {
    await prisma.legalBasis.upsert({
      where: { id: lb.article.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() },
      update: {},
      create: { id: lb.article.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase(), ...lb },
    });
  }

  // Data Categories
  const categories = [
    { name: "Persönliche Stammdaten", description: "Name, Geburtsdatum, Geschlecht, Familienstand, Nationalität", isSensitive: false },
    { name: "Kontaktdaten", description: "Adresse, Telefonnummer, E-Mail-Adresse", isSensitive: false },
    { name: "Bankverbindung", description: "IBAN, BIC, Kontoinhaberdaten", isSensitive: false },
    { name: "Lohn- & Gehaltsdaten", description: "Gehaltshöhe, Steuerklasse, SV-Daten, Kinderfreibeträge", isSensitive: false },
    { name: "Qualifikationsdaten", description: "Bewerbungsunterlagen, Zeugnisse, Beurteilungen", isSensitive: false },
    { name: "Öffentliche Identifikationsdaten", description: "Steuer-ID, Personalausweisnummer, SV-Ausweisnummer", isSensitive: false },
    { name: "Elektronische Identifikation", description: "IP-Adressen, Cookies, Verbindungszeiten", isSensitive: false },
    { name: "Vertragsdaten", description: "Vertragsgegenstand, Laufzeit, Konditionen", isSensitive: false },
    { name: "Kommunikationsdaten", description: "E-Mail-Inhalte, Gesprächsnotizen", isSensitive: false },
    { name: "Gesundheitsdaten", description: "Ärztliche Berichte, Diagnosen, Schwerbehinderung", isSensitive: true },
    { name: "Biometrische Daten", description: "Fingerabdrücke, Gesichtserkennung", isSensitive: true },
    { name: "Religionszugehörigkeit", description: "Konfession (besondere Kategorie gem. Art. 9 DSGVO)", isSensitive: true },
  ];

  for (const cat of categories) {
    await prisma.dataCategory.upsert({
      where: { id: cat.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() },
      update: {},
      create: { id: cat.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase(), ...cat },
    });
  }

  // Affected Groups
  const groups = [
    { name: "Beschäftigte", description: "Arbeitnehmer des Unternehmens" },
    { name: "Bewerber", description: "Bewerber auf offene Stellen" },
    { name: "Kunden", description: "Kunden und Auftraggeber" },
    { name: "Lieferanten", description: "Lieferanten und Dienstleister" },
    { name: "Interessenten", description: "Potenzielle Kunden und Kontakte" },
    { name: "Auszubildende", description: "Auszubildende im Unternehmen" },
    { name: "Ehemalige Beschäftigte", description: "Ausgeschiedene Mitarbeiter" },
    { name: "Websitebesucher", description: "Besucher der Unternehmenswebsite" },
  ];

  for (const g of groups) {
    await prisma.affectedGroup.upsert({
      where: { id: g.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() },
      update: {},
      create: { id: g.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase(), ...g },
    });
  }

  // Technical Measures (TOMs)
  const toms = [
    { name: "Zutrittskontrolle Gebäude", description: "Schlüsselvergabe, Besucherprotokoll, Alarmanlage", category: "Zutrittskontrolle" },
    { name: "Passwortrichtlinie", description: "Mindestlänge, Komplexität, regelmäßiger Wechsel", category: "Zugangskontrolle" },
    { name: "Zwei-Faktor-Authentifizierung", description: "2FA für kritische Systeme", category: "Zugangskontrolle" },
    { name: "Berechtigungskonzept", description: "Rollenbasierte Zugriffssteuerung (Need-to-know)", category: "Zugriffskontrolle" },
    { name: "Protokollierung", description: "Logging von Zugriffen und Änderungen", category: "Eingabekontrolle" },
    { name: "Verschlüsselung Datenübertragung", description: "TLS/SSL für alle externen Verbindungen", category: "Weitergabekontrolle" },
    { name: "Verschlüsselung Datenträger", description: "Festplattenverschlüsselung auf mobilen Geräten", category: "Weitergabekontrolle" },
    { name: "AVV mit Dienstleistern", description: "Auftragsverarbeitungsverträge gem. Art. 28 DSGVO", category: "Auftragskontrolle" },
    { name: "Backup-Konzept", description: "Regelmäßige Datensicherung, Offsite-Backup", category: "Verfügbarkeitskontrolle" },
    { name: "Mandantentrennung", description: "Logische Trennung von Datenbeständen", category: "Trennungsgebot" },
  ];

  for (const t of toms) {
    await prisma.technicalMeasure.upsert({
      where: { id: t.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase() },
      update: {},
      create: { id: t.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase(), ...t },
    });
  }

  console.log("Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
