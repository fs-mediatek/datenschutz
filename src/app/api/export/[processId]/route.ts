import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { jsonResponse } from "@/lib/response";

const processIncludes = {
  responsible: true,
  processor: true,
  dataCategories: { include: { dataCategory: true } },
  legalBases: { include: { legalBasis: true } },
  affectedGroups: { include: { affectedGroup: true } },
  technicalMeasures: { include: { technicalMeasure: true } },
  recipients: { include: { company: true } },
  processors: { include: { company: true } },
};

function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateHtml(process: any): string {
  const responsible = process.responsible;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verarbeitungsverzeichnis – ${escapeHtml(process.name)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      background: #fff;
      padding: 40px;
      max-width: 210mm;
      margin: 0 auto;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
      section { break-inside: avoid; }
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #1a365d;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header-left h1 {
      font-size: 18pt;
      color: #1a365d;
      margin-bottom: 4px;
    }
    .header-left .subtitle {
      font-size: 10pt;
      color: #666;
    }
    .header-right {
      text-align: right;
      font-size: 9pt;
      color: #666;
    }
    .logo-placeholder {
      width: 80px;
      height: 80px;
      border: 1px dashed #ccc;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8pt;
      color: #999;
      margin-bottom: 8px;
      margin-left: auto;
    }
    .meta-bar {
      display: flex;
      gap: 24px;
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 20px;
      margin-bottom: 24px;
      font-size: 9.5pt;
    }
    .meta-bar .meta-item { display: flex; gap: 6px; }
    .meta-bar .meta-label { font-weight: 600; color: #4a5568; }
    section {
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    section h2 {
      font-size: 11pt;
      background: #1a365d;
      color: #fff;
      padding: 10px 16px;
      margin: 0;
    }
    section .content {
      padding: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
    }
    table th {
      text-align: left;
      background: #edf2f7;
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-weight: 600;
      color: #2d3748;
    }
    table td {
      padding: 8px 12px;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: top;
    }
    table tr:last-child td { border-bottom: none; }
    .field-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .field-row:last-child { border-bottom: none; }
    .field-label {
      width: 220px;
      min-width: 220px;
      font-weight: 600;
      color: #4a5568;
    }
    .field-value { flex: 1; }
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: 500;
    }
    .badge-active { background: #c6f6d5; color: #22543d; }
    .badge-draft { background: #fefcbf; color: #744210; }
    .badge-archived { background: #e2e8f0; color: #4a5568; }
    .badge-sensitive { background: #fed7d7; color: #9b2c2c; }
    .badge-yes { background: #fed7d7; color: #9b2c2c; }
    .badge-no { background: #c6f6d5; color: #22543d; }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 8.5pt;
      color: #999;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>Verzeichnis von Verarbeitungst\u00e4tigkeiten</h1>
      <div class="subtitle">gem\u00e4\u00df Art. 30 Abs. 1 DSGVO</div>
    </div>
    <div class="header-right">
      <div class="logo-placeholder">Logo</div>
      <div>Erstellt: ${formatDate(process.createdAt)}</div>
      <div>Aktualisiert: ${formatDate(process.updatedAt)}</div>
    </div>
  </div>

  <div class="meta-bar">
    <div class="meta-item">
      <span class="meta-label">Nr.:</span>
      <span>${process.number ?? "—"}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Bezeichnung:</span>
      <span>${escapeHtml(process.name)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Status:</span>
      <span class="badge badge-${process.status}">${escapeHtml(process.status)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">DSFA:</span>
      <span class="badge ${process.dsfaRequired ? "badge-yes" : "badge-no"}">${process.dsfaRequired ? "Erforderlich" : "Nicht erforderlich"}</span>
    </div>
  </div>

  <!-- 1. Verantwortlicher -->
  <section>
    <h2>1. Name und Kontaktdaten des Verantwortlichen</h2>
    <div class="content">
      ${responsible ? `
      <div class="field-row"><div class="field-label">Organisation</div><div class="field-value">${escapeHtml(responsible.name)}</div></div>
      <div class="field-row"><div class="field-label">Anschrift</div><div class="field-value">${escapeHtml([responsible.street, responsible.zip, responsible.city].filter(Boolean).join(", "))} ${escapeHtml(responsible.country)}</div></div>
      <div class="field-row"><div class="field-label">Telefon</div><div class="field-value">${escapeHtml(responsible.phone) || "—"}</div></div>
      <div class="field-row"><div class="field-label">E-Mail</div><div class="field-value">${escapeHtml(responsible.email) || "—"}</div></div>
      <div class="field-row"><div class="field-label">Website</div><div class="field-value">${escapeHtml(responsible.website) || "—"}</div></div>
      <div class="field-row"><div class="field-label">Datenschutzbeauftragter</div><div class="field-value">${escapeHtml(responsible.dsbName) || "—"}</div></div>
      <div class="field-row"><div class="field-label">DSB E-Mail</div><div class="field-value">${escapeHtml(responsible.dsbEmail) || "—"}</div></div>
      <div class="field-row"><div class="field-label">DSB Telefon</div><div class="field-value">${escapeHtml(responsible.dsbPhone) || "—"}</div></div>
      ` : `<p>Kein Verantwortlicher zugeordnet.</p>`}
    </div>
  </section>

  <!-- 2. Zweck der Verarbeitung -->
  <section>
    <h2>2. Zwecke der Verarbeitung</h2>
    <div class="content">
      <div class="field-row"><div class="field-label">Bezeichnung</div><div class="field-value">${escapeHtml(process.name)}</div></div>
      <div class="field-row"><div class="field-label">Beschreibung</div><div class="field-value">${escapeHtml(process.description) || "—"}</div></div>
      <div class="field-row"><div class="field-label">Zweck</div><div class="field-value">${escapeHtml(process.purpose) || "—"}</div></div>
    </div>
  </section>

  <!-- 3. Rechtsgrundlage -->
  <section>
    <h2>3. Rechtsgrundlage der Verarbeitung</h2>
    <div class="content">
      ${process.legalBases.length > 0 ? `
      <table>
        <thead><tr><th>Artikel</th><th>Beschreibung</th></tr></thead>
        <tbody>
          ${process.legalBases.map((lb: { legalBasis: { article: string; description: string } }) => `
          <tr>
            <td>${escapeHtml(lb.legalBasis.article)}</td>
            <td>${escapeHtml(lb.legalBasis.description)}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      ` : `<p>Keine Rechtsgrundlagen zugeordnet.</p>`}
    </div>
  </section>

  <!-- 4. Kategorien betroffener Personen -->
  <section>
    <h2>4. Kategorien betroffener Personen</h2>
    <div class="content">
      ${process.affectedGroups.length > 0 ? `
      <table>
        <thead><tr><th>Gruppe</th><th>Beschreibung</th></tr></thead>
        <tbody>
          ${process.affectedGroups.map((ag: { affectedGroup: { name: string; description?: string | null } }) => `
          <tr>
            <td>${escapeHtml(ag.affectedGroup.name)}</td>
            <td>${escapeHtml(ag.affectedGroup.description) || "—"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      ` : `<p>Keine betroffenen Personengruppen zugeordnet.</p>`}
    </div>
  </section>

  <!-- 5. Kategorien personenbezogener Daten -->
  <section>
    <h2>5. Kategorien personenbezogener Daten</h2>
    <div class="content">
      ${process.dataCategories.length > 0 ? `
      <table>
        <thead><tr><th>Kategorie</th><th>Beschreibung</th><th>Sensibel (Art. 9)</th><th>L\u00f6schfrist</th></tr></thead>
        <tbody>
          ${process.dataCategories.map((dc: { dataCategory: { name: string; description?: string | null; isSensitive: boolean }; deletionPeriod?: string | null }) => `
          <tr>
            <td>${escapeHtml(dc.dataCategory.name)}</td>
            <td>${escapeHtml(dc.dataCategory.description) || "—"}</td>
            <td>${dc.dataCategory.isSensitive ? `<span class="badge badge-sensitive">Ja</span>` : "Nein"}</td>
            <td>${escapeHtml(dc.deletionPeriod) || "—"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      ` : `<p>Keine Datenkategorien zugeordnet.</p>`}
    </div>
  </section>

  <!-- 6. Empfänger -->
  <section>
    <h2>6. Kategorien von Empf\u00e4ngern</h2>
    <div class="content">
      ${process.recipients.length > 0 ? `
      <table>
        <thead><tr><th>Name</th><th>Kategorie</th><th>Zweck</th></tr></thead>
        <tbody>
          ${process.recipients.map((r: { name: string; category?: string | null; purpose?: string | null }) => `
          <tr>
            <td>${escapeHtml(r.name)}</td>
            <td>${escapeHtml(r.category) || "—"}</td>
            <td>${escapeHtml(r.purpose) || "—"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      ` : `<p>Keine Empf\u00e4nger zugeordnet.</p>`}
    </div>
  </section>

  <!-- 7. Drittlandübermittlung -->
  <section>
    <h2>7. \u00dcbermittlungen an ein Drittland</h2>
    <div class="content">
      <div class="field-row"><div class="field-label">Drittland</div><div class="field-value">${escapeHtml(process.thirdCountry) || "Keine \u00dcbermittlung in Drittl\u00e4nder"}</div></div>
      <div class="field-row"><div class="field-label">Garantien</div><div class="field-value">${escapeHtml(process.thirdCountryGuarantee) || "—"}</div></div>
    </div>
  </section>

  <!-- 8. Löschfristen -->
  <section>
    <h2>8. Vorgesehene L\u00f6schfristen</h2>
    <div class="content">
      <div class="field-row"><div class="field-label">L\u00f6schkonzept</div><div class="field-value">${escapeHtml(process.deletionConcept) || "—"}</div></div>
      ${process.dataCategories.length > 0 ? `
      <table style="margin-top: 12px;">
        <thead><tr><th>Datenkategorie</th><th>L\u00f6schfrist</th></tr></thead>
        <tbody>
          ${process.dataCategories
            .filter((dc: { deletionPeriod?: string | null }) => dc.deletionPeriod)
            .map((dc: { dataCategory: { name: string }; deletionPeriod?: string | null }) => `
          <tr>
            <td>${escapeHtml(dc.dataCategory.name)}</td>
            <td>${escapeHtml(dc.deletionPeriod)}</td>
          </tr>`).join("") || `<tr><td colspan="2">Keine spezifischen L\u00f6schfristen definiert.</td></tr>`}
        </tbody>
      </table>
      ` : ""}
    </div>
  </section>

  <!-- 9. Technische und organisatorische Maßnahmen -->
  <section>
    <h2>9. Technische und organisatorische Ma\u00dfnahmen (Art. 32 DSGVO)</h2>
    <div class="content">
      ${process.technicalMeasures.length > 0 ? `
      <table>
        <thead><tr><th>Ma\u00dfnahme</th><th>Kategorie</th><th>Beschreibung</th><th>Status</th></tr></thead>
        <tbody>
          ${process.technicalMeasures.map((tm: { technicalMeasure: { name: string; category?: string | null; description?: string | null }; status: string }) => `
          <tr>
            <td>${escapeHtml(tm.technicalMeasure.name)}</td>
            <td>${escapeHtml(tm.technicalMeasure.category) || "—"}</td>
            <td>${escapeHtml(tm.technicalMeasure.description) || "—"}</td>
            <td>${escapeHtml(tm.status)}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      ` : `<p>Keine technischen und organisatorischen Ma\u00dfnahmen zugeordnet.</p>`}
    </div>
  </section>

  <!-- 10. Auftragsverarbeiter -->
  <section>
    <h2>10. Auftragsverarbeiter</h2>
    <div class="content">
      ${process.processors.length > 0 ? `
      <table>
        <thead><tr><th>Name</th><th>AVV-Datum</th><th>Beschreibung</th></tr></thead>
        <tbody>
          ${process.processors.map((p: { name: string; avvDate?: string | null; description?: string | null }) => `
          <tr>
            <td>${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.avvDate) || "—"}</td>
            <td>${escapeHtml(p.description) || "—"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      ` : `<p>Keine Auftragsverarbeiter zugeordnet.</p>`}
    </div>
  </section>

  <!-- Risikobewertung -->
  ${process.riskAssessment ? `
  <section>
    <h2>Risikobewertung</h2>
    <div class="content">
      <p>${escapeHtml(process.riskAssessment)}</p>
    </div>
  </section>
  ` : ""}

  <!-- Überprüfung -->
  <section>
    <h2>\u00dcberpr\u00fcfung</h2>
    <div class="content">
      <div class="field-row"><div class="field-label">Letzte \u00dcberpr\u00fcfung</div><div class="field-value">${formatDate(process.lastReviewDate)}</div></div>
      <div class="field-row"><div class="field-label">N\u00e4chste \u00dcberpr\u00fcfung</div><div class="field-value">${formatDate(process.nextReviewDate)}</div></div>
    </div>
  </section>

  <div class="footer">
    Dieses Dokument wurde automatisch erstellt. | Verarbeitungsverzeichnis gem\u00e4\u00df Art. 30 DSGVO | Stand: ${formatDate(new Date())}
  </div>
</body>
</html>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string }> }
) {
  try {
    const { processId } = await params;
    const format = request.nextUrl.searchParams.get("format") ?? "json";

    const process = await prisma.process.findUnique({
      where: { id: processId },
      include: processIncludes,
    });

    if (!process) {
      return jsonResponse({ error: "Process not found" }, 404);
    }

    if (format === "html") {
      const html = generateHtml(process);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="VVT-${process.number ?? process.id}.html"`,
        },
      });
    }

    return jsonResponse(process);
  } catch (error) {
    console.error("Failed to export process:", error);
    return jsonResponse({ error: "Failed to export process" }, 500);
  }
}
