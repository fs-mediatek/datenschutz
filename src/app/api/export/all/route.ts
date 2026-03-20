import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
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
  if (!date) return "\u2014";
  const d = new Date(date);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderProcessSection(process: any, index: number): string {
  const responsible = process.responsible;
  return `
    <div class="process-block" ${index > 0 ? 'style="page-break-before: always;"' : ""}>
      <h2>${process.number ? `${process.number}. ` : `${index + 1}. `}${escapeHtml(process.name)}</h2>
      <div class="meta-bar">
        <div class="meta-item"><span class="meta-label">Status:</span> <span>${escapeHtml(process.status)}</span></div>
        <div class="meta-item"><span class="meta-label">Erstellt:</span> <span>${formatDate(process.createdAt)}</span></div>
        <div class="meta-item"><span class="meta-label">Aktualisiert:</span> <span>${formatDate(process.updatedAt)}</span></div>
      </div>

      <table>
        <tr><th style="width:220px;">Verantwortlicher</th><td>${responsible ? escapeHtml(responsible.name) : "\u2014"}</td></tr>
        <tr><th>Beschreibung</th><td>${escapeHtml(process.description) || "\u2014"}</td></tr>
        <tr><th>Zweck</th><td>${escapeHtml(process.purpose) || "\u2014"}</td></tr>
      </table>

      <h3>Rechtsgrundlagen</h3>
      ${process.legalBases.length > 0 ? `<ul>${process.legalBases.map((lb: { legalBasis: { article: string; description: string } }) =>
        `<li><strong>${escapeHtml(lb.legalBasis.article)}</strong> \u2013 ${escapeHtml(lb.legalBasis.description)}</li>`
      ).join("")}</ul>` : "<p>Keine angegeben</p>"}

      <h3>Betroffene Personengruppen</h3>
      ${process.affectedGroups.length > 0 ? `<ul>${process.affectedGroups.map((ag: { affectedGroup: { name: string } }) =>
        `<li>${escapeHtml(ag.affectedGroup.name)}</li>`
      ).join("")}</ul>` : "<p>Keine angegeben</p>"}

      <h3>Datenkategorien</h3>
      ${process.dataCategories.length > 0 ? `<table><thead><tr><th>Kategorie</th><th>Sensibel</th><th>L\u00f6schfrist</th></tr></thead><tbody>${
        process.dataCategories.map((dc: { dataCategory: { name: string; isSensitive: boolean }; deletionPeriod?: string | null }) =>
          `<tr><td>${escapeHtml(dc.dataCategory.name)}</td><td>${dc.dataCategory.isSensitive ? "Ja (Art. 9)" : "Nein"}</td><td>${escapeHtml(dc.deletionPeriod) || "\u2014"}</td></tr>`
        ).join("")
      }</tbody></table>` : "<p>Keine angegeben</p>"}

      <h3>Empf\u00e4nger</h3>
      ${process.recipients.length > 0 ? `<table><thead><tr><th>Name</th><th>Kategorie</th><th>Zweck</th></tr></thead><tbody>${
        process.recipients.map((r: { name: string; category?: string | null; purpose?: string | null }) =>
          `<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.category) || "\u2014"}</td><td>${escapeHtml(r.purpose) || "\u2014"}</td></tr>`
        ).join("")
      }</tbody></table>` : "<p>Keine angegeben</p>"}

      <h3>Auftragsverarbeiter</h3>
      ${process.processors.length > 0 ? `<table><thead><tr><th>Name</th><th>AVV-Datum</th><th>Beschreibung</th></tr></thead><tbody>${
        process.processors.map((p: { name: string; avvDate?: string | null; description?: string | null }) =>
          `<tr><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.avvDate) || "\u2014"}</td><td>${escapeHtml(p.description) || "\u2014"}</td></tr>`
        ).join("")
      }</tbody></table>` : "<p>Keine angegeben</p>"}

      <h3>Drittland\u00fcbermittlung</h3>
      <p>${process.thirdCountry ? `<strong>${escapeHtml(process.thirdCountry)}</strong>: ${escapeHtml(process.thirdCountryGuarantee) || "Keine Garantien angegeben"}` : "Keine Drittland\u00fcbermittlung"}</p>

      <h3>L\u00f6schkonzept</h3>
      <p>${escapeHtml(process.deletionConcept) || "Nicht angegeben"}</p>

      <h3>TOMs</h3>
      ${process.technicalMeasures.length > 0 ? `<table><thead><tr><th>Ma\u00dfnahme</th><th>Kategorie</th><th>Status</th></tr></thead><tbody>${
        process.technicalMeasures.map((tm: { technicalMeasure: { name: string; category?: string | null }; status: string }) =>
          `<tr><td>${escapeHtml(tm.technicalMeasure.name)}</td><td>${escapeHtml(tm.technicalMeasure.category) || "\u2014"}</td><td>${escapeHtml(tm.status)}</td></tr>`
        ).join("")
      }</tbody></table>` : "<p>Keine angegeben</p>"}

      ${process.riskAssessment ? `<h3>Risikobewertung</h3><p>${escapeHtml(process.riskAssessment)}</p>` : ""}
      <p><strong>DSFA erforderlich:</strong> ${process.dsfaRequired ? "Ja" : "Nein"}</p>
    </div>
  `;
}

export async function GET() {
  try {
    const processes = await prisma.process.findMany({
      include: processIncludes,
      orderBy: [{ number: "asc" }, { name: "asc" }],
    });

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Verarbeitungsverzeichnis \u2013 Gesamt\u00fcbersicht</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; background: #fff; padding: 40px; max-width: 210mm; margin: 0 auto; }
  @media print { body { padding: 20px; } .process-block { page-break-before: always; } .process-block:first-child { page-break-before: auto; } }
  h1 { font-size: 18pt; color: #1a365d; border-bottom: 3px solid #1a365d; padding-bottom: 12px; margin-bottom: 24px; }
  h2 { font-size: 14pt; color: #1a365d; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
  h3 { font-size: 11pt; color: #2d3748; margin-top: 16px; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; margin: 8px 0 16px; }
  th { text-align: left; background: #edf2f7; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #2d3748; }
  td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  ul { margin: 8px 0 16px 20px; }
  li { margin-bottom: 4px; }
  p { margin: 4px 0 12px; }
  .meta-bar { display: flex; gap: 24px; background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 16px; margin-bottom: 16px; font-size: 9.5pt; }
  .meta-item { display: flex; gap: 6px; }
  .meta-label { font-weight: 600; color: #4a5568; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 8.5pt; color: #999; text-align: center; }
  .toc { margin-bottom: 32px; }
  .toc li { margin-bottom: 6px; }
</style>
</head>
<body>
  <h1>Verzeichnis von Verarbeitungst\u00e4tigkeiten</h1>
  <p style="margin-bottom: 24px; color: #666;">Gesamt\u00fcbersicht gem\u00e4\u00df Art. 30 Abs. 1 DSGVO | ${processes.length} Verarbeitungst\u00e4tigkeit${processes.length !== 1 ? "en" : ""}</p>

  <div class="toc">
    <h3>Inhaltsverzeichnis</h3>
    <ol>
      ${processes.map((p: { number?: number | null; name: string; status: string }) => `<li>${p.number ? `Nr. ${p.number}: ` : ""}${escapeHtml(p.name)} (${escapeHtml(p.status)})</li>`).join("")}
    </ol>
  </div>

  ${processes.map((p: unknown, i: number) => renderProcessSection(p, i)).join("")}

  <div class="footer">
    Dieses Dokument wurde automatisch erstellt. | Verarbeitungsverzeichnis gem\u00e4\u00df Art. 30 DSGVO | Stand: ${formatDate(new Date())}
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": 'inline; filename="VVT-Gesamtexport.html"',
      },
    });
  } catch (error) {
    console.error("Failed to export all processes:", error);
    return jsonResponse({ error: "Failed to export" }, 500);
  }
}
