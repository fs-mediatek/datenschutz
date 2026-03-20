#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Erstellt Muster-VVTs und Datenlandkarten basierend auf dem
Bewerbungs-/Einstellungsprozess eines Sozialträgers sowie
weiteren typischen Verarbeitungstätigkeiten.
"""

import urllib.request
import json
import sys

BASE = "http://localhost:3000/api"

def api(method, path, data=None):
    url = f"{BASE}/{path}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, method=method)
    if body:
        req.add_header("Content-Type", "application/json; charset=utf-8")
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        if hasattr(e, "read"):
            err = e.read().decode("utf-8", errors="replace")
            print(f"  API Error ({method} {path}): {err[:200]}", file=sys.stderr)
        return None

def find_or_create(endpoint, match_field, match_value, create_data):
    """Find existing record or create new one."""
    items = api("GET", endpoint) or []
    for item in items:
        if item.get(match_field) == match_value:
            return item["id"]
    result = api("POST", endpoint, create_data)
    return result["id"] if result else None

# ═══════════════════════════════════════════════════════════
print("=== Zusätzliche Stammdaten anlegen ===\n")

# Neue Datenkategorien
new_categories = [
    {"name": "Bewerbungsunterlagen", "description": "Anschreiben, Lebenslauf, Qualifikationsnachweise, Zeugnisse", "isSensitive": False},
    {"name": "Daten von Minderjährigen", "description": "Personenbezogene Daten von Kindern und Jugendlichen (besonderer Schutz)", "isSensitive": True},
    {"name": "Falldaten / Hilfeplandaten", "description": "Hilfeverlauf, Ziele, Maßnahmen aus dem Hilfeplan (Jugendhilfe)", "isSensitive": True},
    {"name": "Familiendaten", "description": "Namen und Kontaktdaten von Familienangehörigen (Eltern, Erziehungsberechtigte)", "isSensitive": False},
    {"name": "Beschäftigungsdaten", "description": "Arbeitsvertrag, Arbeitszeiten, Einsatzgebiet, Stundenzahl", "isSensitive": False},
    {"name": "Abrechnungsdaten", "description": "Stundennachweise, Fahrtkosten, Spesenabrechnungen", "isSensitive": False},
    {"name": "Zugangsdaten", "description": "Benutzernamen, Passwörter, Zugriffsberechtigungen für IT-Systeme", "isSensitive": False},
    {"name": "Standortdaten", "description": "Einsatzorte, Adressen der betreuten Personen", "isSensitive": False},
]

cat_ids = {}
for cat in new_categories:
    cid = find_or_create("data-categories", "name", cat["name"], cat)
    if cid:
        cat_ids[cat["name"]] = cid
        print(f"  Kategorie: {cat['name']} ({cid})")

# Alle existierenden Kategorien laden
all_cats = {c["name"]: c["id"] for c in (api("GET", "data-categories") or [])}
print(f"  => {len(all_cats)} Datenkategorien gesamt")

# Neue Betroffenengruppen
new_groups = [
    {"name": "Minderjährige / Begleitkinder", "description": "Kinder und Jugendliche in Betreuung/Begleitung"},
    {"name": "Eltern / Erziehungsberechtigte", "description": "Eltern oder gesetzliche Vertreter von betreuten Minderjährigen"},
    {"name": "Externe Dienstleister", "description": "Freiberufliche Mitarbeiter und externe Fachkräfte"},
]

all_groups = {g["name"]: g["id"] for g in (api("GET", "affected-groups") or [])}
for g in new_groups:
    if g["name"] not in all_groups:
        result = api("POST", "affected-groups", g)
        if result:
            all_groups[g["name"]] = result["id"]
            print(f"  Betroffenengruppe: {g['name']}")

# Alle laden
all_groups = {g["name"]: g["id"] for g in (api("GET", "affected-groups") or [])}
all_bases = {b["article"]: b["id"] for b in (api("GET", "legal-bases") or [])}
all_toms = {t["name"]: t["id"] for t in (api("GET", "technical-measures") or [])}
all_companies = api("GET", "companies") or []

# Unternehmen sicherstellen
if not all_companies:
    company = api("POST", "companies", {
        "name": "Muster GmbH",
        "street": "Musterstraße 1",
        "zip": "12345",
        "city": "Musterstadt",
        "country": "Deutschland",
        "dsbName": "Max Datenschutz",
        "dsbEmail": "dsb@muster-gmbh.de",
    })
    COMPANY_ID = company["id"]
else:
    COMPANY_ID = all_companies[0]["id"]

print(f"\n  Unternehmen: {COMPANY_ID}")

# Hilfsfunktionen
def cat_id(name):
    return all_cats.get(name)

def group_id(name):
    return all_groups.get(name)

def basis_id(article):
    return all_bases.get(article)

def tom_id(name):
    return all_toms.get(name)

def make_cats(names_periods):
    return [{"dataCategoryId": cat_id(n), "deletionPeriod": p}
            for n, p in names_periods if cat_id(n)]

def make_bases(articles):
    return [{"legalBasisId": basis_id(a)} for a in articles if basis_id(a)]

def make_groups(names):
    return [{"affectedGroupId": group_id(n)} for n in names if group_id(n)]

def make_toms(names):
    return [{"technicalMeasureId": tom_id(n), "status": "vorhanden"}
            for n in names if tom_id(n)]


# ═══════════════════════════════════════════════════════════
print("\n=== VVT-Einträge erstellen ===\n")

processes = {}

# ─── VVT 1: Bewerbungs- und Einstellungsprozess ──────────
p1 = api("POST", "processes", {
    "name": "Bewerbungs- und Einstellungsprozess",
    "description": "Verwaltung eingehender Bewerbungen von der Erfassung über Vorauswahl, Abgleich mit Fallanfragen des Integrationsdienstes, Bewerbungsgespräch, Elternkontakt bis zur finalen Einstellungsentscheidung und Arbeitsvertragserstellung.",
    "purpose": "Besetzung offener Stellen im Bereich der Integrationshilfe. Abgleich von Bewerberqualifikationen mit anonymen Fallanfragen des Integrationsdienstes (Jugendamt). Herstellung des Kontakts zwischen Bewerber und Eltern des Begleitkindes. Einstellungsentscheidung und Arbeitsvertragserstellung.",
    "status": "active",
    "responsibleId": COMPANY_ID,
    "deletionConcept": "Bewerbungsunterlagen nicht eingestellter Bewerber: Löschung 6 Monate nach Abschluss des Verfahrens (§ 15 Abs. 4 AGG). Fallanfragen und Hilfepläne: Aufbewahrung gemäß SGB VIII, Löschung nach Ende der Hilfe + 10 Jahre. Bei Einstellung: Überführung relevanter Unterlagen in die Personalakte. SharePoint-Ordner und Excel-Tabelle: Löschung nach Abschluss des jeweiligen Bewerbungsverfahrens. OneNote-Einträge: Löschung nach Fallabschluss.",
    "thirdCountry": "Nein",
    "riskAssessment": "Hohes Risiko aufgrund der Verarbeitung von Gesundheitsdaten (Hilfeplan), Daten von Minderjährigen und des Austauschs sensibler Informationen per Telefon. Besondere Schutzmaßnahmen erforderlich: verschlüsselte E-Mail-Kommunikation, eingeschränkte Zugriffsrechte auf SharePoint und OneNote, Sensibilisierung der Mitarbeiter.",
    "dsfaRequired": True,
    "dataCategories": make_cats([
        ("Persönliche Stammdaten", "6 Monate nach Verfahrensende"),
        ("Kontaktdaten", "6 Monate nach Verfahrensende"),
        ("Bewerbungsunterlagen", "6 Monate nach Verfahrensende"),
        ("Qualifikationsdaten", "6 Monate nach Verfahrensende"),
        ("Kommunikationsdaten", "6 Monate nach Verfahrensende"),
        ("Gesundheitsdaten", "Ende der Hilfe + 10 Jahre"),
        ("Daten von Minderjährigen", "Ende der Hilfe + 10 Jahre"),
        ("Falldaten / Hilfeplandaten", "Ende der Hilfe + 10 Jahre"),
        ("Familiendaten", "Ende der Hilfe + 10 Jahre"),
        ("Beschäftigungsdaten", "Dauer des Beschäftigungsverhältnisses + 10 Jahre"),
    ]),
    "legalBases": make_bases([
        "Art. 6 Abs. 1 lit. b DSGVO",
        "Art. 6 Abs. 1 lit. c DSGVO",
        "Art. 9 Abs. 2 lit. b DSGVO",
        "\u00a7 26 BDSG",
    ]),
    "affectedGroups": make_groups([
        "Bewerber",
        "Minderjährige / Begleitkinder",
        "Eltern / Erziehungsberechtigte",
        "Beschäftigte",
    ]),
    "technicalMeasures": make_toms([
        "Berechtigungskonzept",
        "Passwortrichtlinie",
        "Verschlüsselung Datenübertragung",
        "Protokollierung",
        "Backup-Konzept",
        "Zutrittskontrolle Gebäude",
        "Mandantentrennung",
    ]),
    "recipients": [
        {"name": "Bereichsleitung / Stellvertretung", "category": "intern", "purpose": "Sichtung der Bewerbungen, Abgleich mit Fallanfragen, Bewerbungsgespräche, Kontaktherstellung"},
        {"name": "Personalabteilung", "category": "intern", "purpose": "Weiterleitung der Bewerbungen, Arbeitsvertragserstellung"},
        {"name": "Integrationsdienst (Jugendamt)", "category": "extern", "purpose": "Übermittlung anonymer Fallanfragen, Mitteilung der Bewerberqualifikation, Bescheiderstellung"},
        {"name": "Eltern / Erziehungsberechtigte", "category": "extern", "purpose": "Vorstellung des Bewerbers (ohne Namensnennung), Terminvereinbarung"},
    ],
    "processors": [
        {"name": "Microsoft (SharePoint / OneNote / Outlook)", "avvDate": "2024-01-01", "description": "Cloud-Hosting der Bewerbungsunterlagen (SharePoint), Fallnotizen (OneNote), E-Mail-Kommunikation (Outlook). Server in der EU."},
    ],
})
if p1:
    processes["bewerbung"] = p1["id"]
    print(f"  VVT 1: Bewerbungs- und Einstellungsprozess ({p1['id']})")

# ─── VVT 2: Personalstammdatenverwaltung ─────────────────
p2 = api("POST", "processes", {
    "name": "Personalstammdatenverwaltung",
    "description": "Digitale und physische Verwaltung der Personalstammdaten aller Beschäftigten von der Einstellung bis zum Austritt, einschließlich Personalakte, Vertragsmanagement und Meldepflichten.",
    "purpose": "Verwaltung von Beschäftigtendaten zur Erfüllung arbeitsvertraglicher und gesetzlicher Pflichten. Dokumentation des Beschäftigungsverhältnisses. Durchführung von Meldungen an Sozialversicherungsträger und Finanzbehörden.",
    "status": "active",
    "responsibleId": COMPANY_ID,
    "deletionConcept": "Personalakte: 3 Jahre nach Beendigung des Beschäftigungsverhältnisses (§ 195 BGB Verjährungsfrist). Lohnunterlagen: 6 Jahre (§ 257 HGB) bzw. 10 Jahre (§ 147 AO). Gesundheitsdaten: unverzüglich nach Wegfall des Zwecks, spätestens mit Ende des Beschäftigungsverhältnisses. Bewerbungsunterlagen eingestellter Mitarbeiter: Übernahme in Personalakte.",
    "thirdCountry": "Nein",
    "riskAssessment": "Mittleres Risiko. Verarbeitung besonderer Kategorien (Religionszugehörigkeit für Kirchensteuer, ggf. Gesundheitsdaten/Schwerbehinderung). Schutz durch Berechtigungskonzept und verschlossene Personalakten.",
    "dsfaRequired": False,
    "dataCategories": make_cats([
        ("Persönliche Stammdaten", "3 Jahre nach Austritt"),
        ("Kontaktdaten", "3 Jahre nach Austritt"),
        ("Bankverbindung", "10 Jahre nach Austritt (§ 147 AO)"),
        ("Lohn- & Gehaltsdaten", "10 Jahre nach Austritt (§ 147 AO)"),
        ("Qualifikationsdaten", "3 Jahre nach Austritt"),
        ("Öffentliche Identifikationsdaten", "10 Jahre nach Austritt"),
        ("Beschäftigungsdaten", "3 Jahre nach Austritt"),
        ("Religionszugehörigkeit", "Dauer des Beschäftigungsverhältnisses"),
        ("Gesundheitsdaten", "Unverzüglich nach Wegfall des Zwecks"),
    ]),
    "legalBases": make_bases([
        "Art. 6 Abs. 1 lit. b DSGVO",
        "Art. 6 Abs. 1 lit. c DSGVO",
        "Art. 9 Abs. 2 lit. b DSGVO",
        "\u00a7 26 BDSG",
    ]),
    "affectedGroups": make_groups(["Beschäftigte", "Ehemalige Beschäftigte", "Auszubildende"]),
    "technicalMeasures": make_toms([
        "Berechtigungskonzept", "Passwortrichtlinie", "Zutrittskontrolle Gebäude",
        "Verschlüsselung Datenübertragung", "Verschlüsselung Datenträger",
        "Protokollierung", "Backup-Konzept", "Mandantentrennung",
    ]),
    "recipients": [
        {"name": "Personalabteilung", "category": "intern", "purpose": "Vollständige Verwaltung der Personalstammdaten"},
        {"name": "Geschäftsführung", "category": "intern", "purpose": "Einsicht in Personalentscheidungen"},
        {"name": "Buchhaltung / Finanzen", "category": "intern", "purpose": "Lohnabrechnung, Reisekostenabrechnung"},
        {"name": "Sozialversicherungsträger", "category": "extern", "purpose": "Gesetzliche Meldepflichten (SV-Meldungen)"},
        {"name": "Finanzamt", "category": "extern", "purpose": "Lohnsteuermeldungen, elektronische Lohnsteuerbescheinigung"},
    ],
    "processors": [
        {"name": "Externes Lohnbüro / Steuerberater", "avvDate": "2024-06-01", "description": "Durchführung der monatlichen Lohn- und Gehaltsabrechnung"},
        {"name": "Microsoft (SharePoint / OneDrive)", "avvDate": "2024-01-01", "description": "Cloud-Speicherung digitaler Personalakten"},
    ],
})
if p2:
    processes["personal"] = p2["id"]
    print(f"  VVT 2: Personalstammdatenverwaltung ({p2['id']})")

# ─── VVT 3: Lohn- und Gehaltsabrechnung ─────────────────
p3 = api("POST", "processes", {
    "name": "Lohn- und Gehaltsabrechnung",
    "description": "Monatliche Berechnung und Auszahlung von Löhnen und Gehältern, einschließlich Steuern, Sozialabgaben, Pfändungen und Sonderzahlungen. Erstellung der Lohnabrechnungen und Meldungen an Behörden.",
    "purpose": "Erfüllung der arbeitsvertraglichen Vergütungspflicht. Abführung von Lohnsteuer und Sozialversicherungsbeiträgen. Erstellung gesetzlich vorgeschriebener Meldungen und Bescheinigungen.",
    "status": "active",
    "responsibleId": COMPANY_ID,
    "deletionConcept": "Lohnabrechnungen und Buchungsbelege: 10 Jahre (§ 147 AO, § 257 HGB). Beitragsnachweise Sozialversicherung: 10 Jahre. Lohnsteuerbescheinigungen: 6 Jahre.",
    "thirdCountry": "Nein",
    "riskAssessment": "Geringes bis mittleres Risiko. Standardverarbeitung mit bewährten Systemen. Besonderes Augenmerk auf Vertraulichkeit der Gehaltsdaten und sichere Übermittlung an externe Stellen.",
    "dsfaRequired": False,
    "dataCategories": make_cats([
        ("Persönliche Stammdaten", "10 Jahre nach letzter Abrechnung"),
        ("Bankverbindung", "10 Jahre (§ 147 AO)"),
        ("Lohn- & Gehaltsdaten", "10 Jahre (§ 147 AO)"),
        ("Öffentliche Identifikationsdaten", "10 Jahre"),
        ("Religionszugehörigkeit", "Dauer der Beschäftigung (Kirchensteuer)"),
        ("Abrechnungsdaten", "10 Jahre (§ 147 AO)"),
    ]),
    "legalBases": make_bases([
        "Art. 6 Abs. 1 lit. b DSGVO",
        "Art. 6 Abs. 1 lit. c DSGVO",
        "\u00a7 26 BDSG",
    ]),
    "affectedGroups": make_groups(["Beschäftigte", "Ehemalige Beschäftigte", "Auszubildende"]),
    "technicalMeasures": make_toms([
        "Berechtigungskonzept", "Passwortrichtlinie",
        "Verschlüsselung Datenübertragung", "Verschlüsselung Datenträger",
        "Protokollierung", "Backup-Konzept", "Mandantentrennung",
    ]),
    "recipients": [
        {"name": "Buchhaltung / Finanzen", "category": "intern", "purpose": "Durchführung der Abrechnung"},
        {"name": "Geschäftsführung", "category": "intern", "purpose": "Freigabe der Abrechnungen"},
        {"name": "Finanzamt", "category": "extern", "purpose": "Lohnsteueranmeldung, elektronische Lohnsteuerbescheinigung"},
        {"name": "Sozialversicherungsträger", "category": "extern", "purpose": "SV-Meldungen, Beitragsnachweise"},
        {"name": "Berufsgenossenschaft", "category": "extern", "purpose": "Jahresmeldung, Unfallversicherung"},
        {"name": "Bank des Arbeitgebers", "category": "extern", "purpose": "Gehaltsüberweisung (SEPA)"},
    ],
    "processors": [
        {"name": "Externes Lohnbüro / Steuerberater", "avvDate": "2024-06-01", "description": "Monatliche Lohn- und Gehaltsabrechnung, Erstellung der Lohnabrechnungen"},
        {"name": "DATEV eG", "avvDate": "2024-03-01", "description": "Lohnabrechnungssoftware (Cloud), Datenübermittlung an Finanzbehörden"},
    ],
})
if p3:
    processes["lohn"] = p3["id"]
    print(f"  VVT 3: Lohn- und Gehaltsabrechnung ({p3['id']})")

# ─── VVT 4: Fallverwaltung Integrationshilfe ─────────────
p4 = api("POST", "processes", {
    "name": "Fallverwaltung Integrationshilfe",
    "description": "Verwaltung der Fälle in der Integrationshilfe: Erfassung von Fallanfragen des Jugendamtes, Zuordnung von Integrationshelfern, Dokumentation des Hilfeverlaufs, Kommunikation mit Jugendamt und Eltern, Abrechnung der erbrachten Leistungen.",
    "purpose": "Erbringung von Integrationshilfeleistungen nach SGB VIII/IX. Dokumentation des Hilfeverlaufs. Abrechnung mit dem Kostenträger (Jugendamt/Integrationsdienst). Qualitätssicherung der Betreuung.",
    "status": "active",
    "responsibleId": COMPANY_ID,
    "deletionConcept": "Falldaten und Hilfepläne: Aufbewahrung bis 10 Jahre nach Ende der Hilfe (§ 45 SGB VIII, Aufbewahrungspflichten). Bescheide: 10 Jahre. Kommunikationsdaten: nach Fallabschluss + 3 Jahre. Abrechnungsdaten: 10 Jahre (§ 147 AO).",
    "thirdCountry": "Nein",
    "riskAssessment": "Hohes Risiko aufgrund der systematischen Verarbeitung von Gesundheitsdaten und Daten Minderjähriger in großem Umfang. DSFA dringend empfohlen. Besondere Maßnahmen: verschlüsselte Kommunikation, strenge Zugriffsbeschränkungen, regelmäßige Schulungen.",
    "dsfaRequired": True,
    "dataCategories": make_cats([
        ("Daten von Minderjährigen", "Ende der Hilfe + 10 Jahre"),
        ("Falldaten / Hilfeplandaten", "Ende der Hilfe + 10 Jahre"),
        ("Gesundheitsdaten", "Ende der Hilfe + 10 Jahre"),
        ("Familiendaten", "Ende der Hilfe + 10 Jahre"),
        ("Persönliche Stammdaten", "Ende der Hilfe + 10 Jahre"),
        ("Kontaktdaten", "Ende der Hilfe + 10 Jahre"),
        ("Abrechnungsdaten", "10 Jahre (§ 147 AO)"),
        ("Kommunikationsdaten", "Fallabschluss + 3 Jahre"),
    ]),
    "legalBases": make_bases([
        "Art. 6 Abs. 1 lit. b DSGVO",
        "Art. 6 Abs. 1 lit. c DSGVO",
        "Art. 9 Abs. 2 lit. b DSGVO",
    ]),
    "affectedGroups": make_groups([
        "Minderjährige / Begleitkinder",
        "Eltern / Erziehungsberechtigte",
        "Beschäftigte",
    ]),
    "technicalMeasures": make_toms([
        "Berechtigungskonzept", "Passwortrichtlinie", "Zwei-Faktor-Authentifizierung",
        "Verschlüsselung Datenübertragung", "Verschlüsselung Datenträger",
        "Protokollierung", "Backup-Konzept", "Mandantentrennung", "Zutrittskontrolle Gebäude",
    ]),
    "recipients": [
        {"name": "Bereichsleitung / Stellvertretung", "category": "intern", "purpose": "Fallzuordnung, Qualitätssicherung, Kommunikation mit Jugendamt"},
        {"name": "Integrationshelfer (Beschäftigte)", "category": "intern", "purpose": "Durchführung der Betreuung, Dokumentation des Hilfeverlaufs"},
        {"name": "Integrationsdienst (Jugendamt)", "category": "extern", "purpose": "Fallanfragen, Bescheide, Hilfepläne, Abrechnung"},
        {"name": "Eltern / Erziehungsberechtigte", "category": "extern", "purpose": "Abstimmung zur Betreuung, Terminvereinbarungen"},
    ],
    "processors": [
        {"name": "Microsoft (OneNote / SharePoint)", "avvDate": "2024-01-01", "description": "Dokumentation der Falldaten und Hilfeverläufe"},
    ],
})
if p4:
    processes["fall"] = p4["id"]
    print(f"  VVT 4: Fallverwaltung Integrationshilfe ({p4['id']})")


# ═══════════════════════════════════════════════════════════
print("\n=== Datenlandkarten erstellen ===\n")

def create_map_with_nodes_edges(name, desc, nodes_def, edges_def):
    """Creates a data map with nodes and edges."""
    m = api("POST", "data-maps", {"name": name, "description": desc, "companyId": COMPANY_ID})
    if not m:
        print(f"  FEHLER: Konnte Karte '{name}' nicht erstellen")
        return
    mid = m["id"]
    print(f"  Karte: {name} ({mid})")

    node_ids = {}
    for key, label, ntype, x, y, color, pid in nodes_def:
        data = {"label": label, "type": ntype, "positionX": x, "positionY": y, "color": color}
        if pid:
            data["processId"] = pid
        n = api("POST", f"data-maps/{mid}/nodes", data)
        if n:
            node_ids[key] = n["id"]

    for frm, to, label, dtype, ttype in edges_def:
        if frm in node_ids and to in node_ids:
            api("POST", f"data-maps/{mid}/edges", {
                "fromNodeId": node_ids[frm], "toNodeId": node_ids[to],
                "label": label, "dataType": dtype, "transferType": ttype,
            })

    print(f"    {len(node_ids)} Knoten, {len(edges_def)} Kanten")
    return mid

# ─── Datenlandkarte 1: Bewerbungs- und Einstellungsprozess ──
create_map_with_nodes_edges(
    "Bewerbungs- und Einstellungsprozess",
    "Vollständiger Datenfluss des Bewerbungs- und Einstellungsprozesses eines Sozialträgers: Von der Bewerbung über den Abgleich mit Fallanfragen des Integrationsdienstes bis zur Einstellung.",
    [
        # Datenquellen (links)
        ("email", "E-Mail (Bewerbungen)", "datasource", 50, 50, "#8b5cf6", None),
        ("sharepoint", "SharePoint (Bewerbungsordner)", "system", 50, 180, "#16a34a", None),
        ("excel", "Excel-Tabelle (Bewerberliste)", "system", 50, 310, "#16a34a", None),
        ("telefon", "Telefon (Kommunikation)", "datasource", 50, 440, "#8b5cf6", None),
        ("post", "Post / verschl. E-Mail", "datasource", 50, 570, "#8b5cf6", None),
        # Hauptprozess (Mitte)
        ("prozess", "Bewerbungseingang & Vorauswahl", "process", 380, 115, "#2563eb", processes.get("bewerbung")),
        ("abgleich", "Abgleich mit Fallanfragen", "process", 380, 290, "#2563eb", None),
        ("gespraech", "Bewerbungsgespräch (vor Ort)", "process", 380, 440, "#2563eb", None),
        ("onenote", "OneNote (Falldaten)", "system", 380, 570, "#16a34a", None),
        # Personen (rechts)
        ("personal", "Personalabteilung", "person", 700, 50, "#ea580c", None),
        ("bereich", "Bereichsleitung / Stellv.", "person", 700, 180, "#ea580c", None),
        ("jugendamt", "Integrationsdienst (Jugendamt)", "external", 700, 330, "#dc2626", None),
        ("eltern", "Eltern / Erziehungsberechtigte", "external", 700, 460, "#dc2626", None),
        ("bewerber", "Bewerber", "person", 700, 570, "#ea580c", None),
        # Ergebnis (ganz rechts)
        ("vertrag", "Arbeitsvertrag / Einstellung", "archive", 1000, 180, "#6b7280", None),
        ("absage", "Absage / Löschung (6 Mon.)", "archive", 1000, 350, "#6b7280", None),
        ("hilfeplan", "Hilfeplan / Bescheid", "archive", 1000, 500, "#6b7280", None),
    ],
    [
        ("email", "prozess", "Bewerbungsunterlagen per E-Mail", "Personendaten", "E-Mail"),
        ("prozess", "sharepoint", "Ablage Bewerbungsdokumente", "Personendaten", "digital"),
        ("prozess", "excel", "Erfassung Name, Qualifikation, Stunden", "Personendaten", "digital"),
        ("personal", "prozess", "Weiterleitung der Bewerbungen", "Personendaten", "E-Mail"),
        ("prozess", "bereich", "Vollständige Bewerbungsunterlagen", "Personendaten", "digital"),
        ("jugendamt", "abgleich", "Anonyme Fallanfrage (Gesundheit, Alter, Ziele)", "Gesundheitsdaten", "E-Mail"),
        ("bereich", "abgleich", "Qualifikationsprofil Bewerber", "Personendaten", "digital"),
        ("bereich", "gespraech", "Einladung zum Gespräch", "Personendaten", "Telefon"),
        ("telefon", "gespraech", "Bewerbungsgespräch mit Fallvorstellung", "Personendaten", "physisch"),
        ("bereich", "jugendamt", "Qualifikation des Bewerbers", "Personendaten", "Telefon"),
        ("jugendamt", "onenote", "Name Kind, Eltern, Telefonnr.", "Personendaten", "Telefon"),
        ("bereich", "eltern", "Vorstellung Bewerber (ohne Namen)", "Personendaten", "Telefon"),
        ("eltern", "bewerber", "Telefonnr. für Terminvereinbarung", "Personendaten", "Telefon"),
        ("bereich", "vertrag", "Arbeitsvertragserstellung", "Vertragsdaten", "digital"),
        ("bereich", "absage", "Absage und Datenlöschung", "Personendaten", "digital"),
        ("jugendamt", "hilfeplan", "Bescheid + Hilfeplan per Post/verschl. E-Mail", "Gesundheitsdaten", "physisch"),
        ("post", "hilfeplan", "Bescheid und Hilfeplan", "Gesundheitsdaten", "physisch"),
    ],
)

# ─── Datenlandkarte 2: Personalstammdatenverwaltung ──────
create_map_with_nodes_edges(
    "Personalstammdatenverwaltung",
    "Datenflüsse der Personalstammdatenverwaltung: Von der Einstellung über die laufende Verwaltung bis zum Austritt und zur Archivierung.",
    [
        ("einstellung", "Einstellung (Unterlagen)", "datasource", 50, 100, "#8b5cf6", None),
        ("mitarbeiter", "Mitarbeiter (Änderungsmeldungen)", "datasource", 50, 250, "#8b5cf6", None),
        ("behoerden", "Behördliche Mitteilungen", "datasource", 50, 400, "#8b5cf6", None),
        ("hrsystem", "Personalverwaltungssystem", "system", 350, 100, "#16a34a", None),
        ("prozess", "Personalstammdatenpflege", "process", 350, 250, "#2563eb", processes.get("personal")),
        ("papierakte", "Papier-Personalakte", "system", 350, 400, "#16a34a", None),
        ("personal", "Personalabteilung", "person", 650, 80, "#ea580c", None),
        ("gf", "Geschäftsführung", "person", 650, 200, "#ea580c", None),
        ("buchhaltung", "Buchhaltung", "person", 650, 320, "#ea580c", None),
        ("sv", "Sozialversicherungsträger", "external", 650, 440, "#dc2626", None),
        ("finanzamt", "Finanzamt", "external", 650, 540, "#dc2626", None),
        ("lohnbuero", "Ext. Lohnbüro / Steuerberater", "external", 350, 540, "#dc2626", None),
        ("archiv", "Archiv (nach Austritt)", "archive", 900, 200, "#6b7280", None),
        ("loeschung", "Löschung (nach Aufbewahrungsfrist)", "archive", 900, 380, "#6b7280", None),
    ],
    [
        ("einstellung", "prozess", "Personalfragebogen, Vertrag, Unterlagen", "Personendaten", "physisch"),
        ("mitarbeiter", "prozess", "Adressänderung, Familienstand, Bankverbindung", "Personendaten", "digital"),
        ("behoerden", "prozess", "Steuerbescheide, SV-Bescheinigungen", "Personendaten", "physisch"),
        ("prozess", "hrsystem", "Digitale Erfassung Stammdaten", "Personendaten", "digital"),
        ("prozess", "papierakte", "Originalunterlagen, Verträge", "Personendaten", "physisch"),
        ("hrsystem", "personal", "Vollzugriff Personalverwaltung", "Personendaten", "digital"),
        ("hrsystem", "gf", "Personalentscheidungen (eingeschränkt)", "Personendaten", "digital"),
        ("hrsystem", "buchhaltung", "Gehaltsdaten, Bankverbindung", "Finanzdaten", "digital"),
        ("hrsystem", "lohnbuero", "Abrechnungsrelevante Daten", "Personendaten", "digital"),
        ("lohnbuero", "sv", "SV-Meldungen", "Personendaten", "digital"),
        ("lohnbuero", "finanzamt", "Lohnsteueranmeldung", "Finanzdaten", "digital"),
        ("hrsystem", "archiv", "Archivierung nach Austritt", "Personendaten", "digital"),
        ("papierakte", "archiv", "Physische Archivierung", "Personendaten", "physisch"),
        ("archiv", "loeschung", "Löschung nach Ablauf der Aufbewahrungsfrist", "Personendaten", "digital"),
    ],
)

# ─── Datenlandkarte 3: Lohn- und Gehaltsabrechnung ──────
create_map_with_nodes_edges(
    "Lohn- und Gehaltsabrechnung",
    "Monatlicher Datenfluss der Gehaltsabrechnung: Von den Eingangsdaten über die Berechnung bis zu den Meldungen an Behörden und die Auszahlung.",
    [
        ("zeitdaten", "Zeiterfassung / Stundennachweise", "datasource", 50, 80, "#8b5cf6", None),
        ("stammdaten", "Personalstammdaten", "datasource", 50, 220, "#8b5cf6", None),
        ("aenderungen", "Änderungsmeldungen (Steuer, SV)", "datasource", 50, 360, "#8b5cf6", None),
        ("lohnsystem", "Lohnabrechnungssoftware (DATEV)", "system", 370, 150, "#16a34a", None),
        ("prozess", "Monatliche Abrechnung", "process", 370, 310, "#2563eb", processes.get("lohn")),
        ("buchhaltung", "Buchhaltung / Finanzen", "person", 670, 80, "#ea580c", None),
        ("gf", "Geschäftsführung (Freigabe)", "person", 670, 200, "#ea580c", None),
        ("lohnbuero", "Ext. Lohnbüro", "external", 670, 340, "#dc2626", None),
        ("finanzamt", "Finanzamt", "external", 950, 80, "#dc2626", None),
        ("sv", "Sozialversicherungsträger", "external", 950, 200, "#dc2626", None),
        ("bg", "Berufsgenossenschaft", "external", 950, 320, "#dc2626", None),
        ("bank", "Bank (Gehaltsüberweisung)", "external", 950, 440, "#dc2626", None),
        ("archiv", "Archiv (10 Jahre § 147 AO)", "archive", 670, 480, "#6b7280", None),
    ],
    [
        ("zeitdaten", "prozess", "Arbeitsstunden, Überstunden, Fehlzeiten", "Personendaten", "digital"),
        ("stammdaten", "prozess", "Name, Steuerklasse, SV-Nr., Bankverbindung", "Personendaten", "digital"),
        ("aenderungen", "prozess", "Neue Steuerklasse, Kinderfreibeträge", "Personendaten", "digital"),
        ("prozess", "lohnsystem", "Abrechnungsdaten erfassen", "Finanzdaten", "digital"),
        ("lohnsystem", "buchhaltung", "Lohnjournale, Buchungsbelege", "Finanzdaten", "digital"),
        ("lohnsystem", "gf", "Abrechnungsübersicht zur Freigabe", "Finanzdaten", "digital"),
        ("lohnsystem", "lohnbuero", "Abrechnungsdaten zur Verarbeitung", "Finanzdaten", "digital"),
        ("lohnbuero", "finanzamt", "Lohnsteueranmeldung (ELSTER)", "Finanzdaten", "digital"),
        ("lohnbuero", "sv", "Beitragsnachweise, SV-Meldungen", "Personendaten", "digital"),
        ("lohnbuero", "bg", "Jahresmeldung Unfallversicherung", "Personendaten", "digital"),
        ("lohnsystem", "bank", "SEPA-Überweisung Gehälter", "Finanzdaten", "digital"),
        ("lohnsystem", "archiv", "Lohnabrechnungen, Belege (10 J.)", "Finanzdaten", "digital"),
    ],
)

# ─── Datenlandkarte 4: Fallverwaltung Integrationshilfe ──
create_map_with_nodes_edges(
    "Fallverwaltung Integrationshilfe",
    "Datenflüsse in der Fallverwaltung: Von der Fallanfrage des Jugendamtes über die Betreuungsdokumentation bis zur Abrechnung und Archivierung.",
    [
        ("fallanfrage", "Fallanfrage (Jugendamt)", "datasource", 50, 80, "#8b5cf6", None),
        ("hilfeplan", "Hilfeplan (Post/verschl. E-Mail)", "datasource", 50, 230, "#8b5cf6", None),
        ("elternkontakt", "Elternkontakt (Telefon)", "datasource", 50, 380, "#8b5cf6", None),
        ("doku", "Betreuungsdokumentation", "datasource", 50, 530, "#8b5cf6", None),
        ("onenote", "OneNote (Fallnotizen)", "system", 350, 80, "#16a34a", None),
        ("prozess", "Fallverwaltung & Zuordnung", "process", 350, 230, "#2563eb", processes.get("fall")),
        ("sharepoint", "SharePoint (Falldokumente)", "system", 350, 380, "#16a34a", None),
        ("abrechnung", "Abrechnungssystem", "system", 350, 530, "#16a34a", None),
        ("bereich", "Bereichsleitung", "person", 650, 80, "#ea580c", None),
        ("helfer", "Integrationshelfer", "person", 650, 210, "#ea580c", None),
        ("jugendamt", "Integrationsdienst (Jugendamt)", "external", 650, 360, "#dc2626", None),
        ("eltern", "Eltern / Erziehungsberechtigte", "external", 650, 490, "#dc2626", None),
        ("archiv", "Archiv (10 Jahre nach Hilfeende)", "archive", 950, 230, "#6b7280", None),
        ("loeschung", "Löschung nach Aufbewahrungsfrist", "archive", 950, 420, "#6b7280", None),
    ],
    [
        ("fallanfrage", "prozess", "Anonyme Fallanfrage (Gesundheit, Alter, Ziele)", "Gesundheitsdaten", "E-Mail"),
        ("hilfeplan", "prozess", "Hilfeplan mit Stamm-/Gesundheitsdaten", "Gesundheitsdaten", "physisch"),
        ("elternkontakt", "prozess", "Name, Telefon Eltern/Kind", "Personendaten", "Telefon"),
        ("prozess", "onenote", "Fallnotizen, Kontaktdaten", "Personendaten", "digital"),
        ("prozess", "sharepoint", "Bescheide, Hilfepläne, Dokumentation", "Gesundheitsdaten", "digital"),
        ("prozess", "bereich", "Fallübersicht, Zuordnung Helfer", "Personendaten", "digital"),
        ("prozess", "helfer", "Falldaten für Betreuung (eingeschränkt)", "Personendaten", "digital"),
        ("doku", "sharepoint", "Betreuungsberichte, Stundenzettel", "Personendaten", "digital"),
        ("sharepoint", "abrechnung", "Stundennachweise für Abrechnung", "Personendaten", "digital"),
        ("abrechnung", "jugendamt", "Leistungsabrechnung", "Finanzdaten", "digital"),
        ("prozess", "eltern", "Terminabsprachen, Betreuungsfeedback", "Personendaten", "Telefon"),
        ("sharepoint", "archiv", "Archivierung nach Hilfeende", "Gesundheitsdaten", "digital"),
        ("archiv", "loeschung", "Löschung nach 10 Jahren", "Personendaten", "digital"),
    ],
)


print("\n=== Fertig! ===")
print(f"  {len(processes)} VVT-Einträge erstellt")
print("  4 Datenlandkarten erstellt")
print("  Neue Datenkategorien und Betroffenengruppen angelegt")
