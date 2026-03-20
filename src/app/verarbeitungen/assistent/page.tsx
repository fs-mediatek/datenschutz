"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Company {
  id: string;
  name: string;
  street?: string;
  zip?: string;
  city?: string;
  dsbName?: string;
  dsbEmail?: string;
}

interface LegalBasis {
  id: string;
  article: string;
  description: string;
}

interface AffectedGroup {
  id: string;
  name: string;
  description?: string;
}

interface DataCategory {
  id: string;
  name: string;
  isSensitive: boolean;
}

interface TechnicalMeasure {
  id: string;
  name: string;
  category: string | null;
}

interface InternalRecipient {
  name: string;
  purpose: string;
}

interface ExternalRecipient {
  name: string;
  purpose: string;
  isProcessor: boolean;
  avvDate: string;
  description: string;
}

interface DataCategorySelection {
  dataCategoryId: string;
  deletionPeriod: string;
}

interface TechnicalMeasureSelection {
  technicalMeasureId: string;
  status: string;
}

interface WizardData {
  /* Step 1 */
  name: string;
  description: string;
  purpose: string;
  /* Step 2 */
  responsibleId: string;
  newCompany: { name: string; street: string; zip: string; city: string; dsbName: string; dsbEmail: string };
  /* Step 3 */
  legalBases: string[];
  /* Step 4 */
  affectedGroups: string[];
  /* Step 5 */
  dataCategories: DataCategorySelection[];
  /* Step 6 */
  internalRecipients: InternalRecipient[];
  externalRecipients: ExternalRecipient[];
  /* Step 7 */
  hasThirdCountry: boolean;
  thirdCountry: string;
  thirdCountryGuarantees: string[];
  thirdCountryGuaranteeOther: string;
  /* Step 8 */
  technicalMeasures: TechnicalMeasureSelection[];
  /* Step 9 */
  deletionConcept: string;
  riskAssessment: string;
  dsfaRequired: string; // "yes" | "no" | ""
}

const defaultWizard: WizardData = {
  name: "",
  description: "",
  purpose: "",
  responsibleId: "",
  newCompany: { name: "", street: "", zip: "", city: "", dsbName: "", dsbEmail: "" },
  legalBases: [],
  affectedGroups: [],
  dataCategories: [],
  internalRecipients: [],
  externalRecipients: [],
  hasThirdCountry: false,
  thirdCountry: "",
  thirdCountryGuarantees: [],
  thirdCountryGuaranteeOther: "",
  technicalMeasures: [],
  deletionConcept: "",
  riskAssessment: "",
  dsfaRequired: "",
};

/* ------------------------------------------------------------------ */
/*  Legal‐basis explanations                                           */
/* ------------------------------------------------------------------ */

const legalBasisExplanations: Record<string, string> = {
  "Art. 6 Abs. 1 lit. a":
    "Die betroffene Person hat ihre Einwilligung gegeben (z.B. Newsletter-Anmeldung, Cookies)",
  "Art. 6 Abs. 1 lit. b":
    "Die Verarbeitung ist zur Erfuellung eines Vertrags erforderlich (z.B. Arbeitsvertrag, Kaufvertrag, Dienstleistungsvertrag)",
  "Art. 6 Abs. 1 lit. c":
    "Die Verarbeitung ist zur Erfuellung einer rechtlichen Verpflichtung erforderlich (z.B. Steuerrecht, Handelsrecht, Sozialversicherungsrecht)",
  "Art. 6 Abs. 1 lit. d":
    "Die Verarbeitung ist zum Schutz lebenswichtiger Interessen erforderlich (z.B. medizinische Notfaelle)",
  "Art. 6 Abs. 1 lit. e":
    "Die Verarbeitung ist zur Wahrnehmung einer Aufgabe im oeffentlichen Interesse erforderlich",
  "Art. 6 Abs. 1 lit. f":
    "Die Verarbeitung ist zur Wahrung berechtigter Interessen erforderlich (z.B. Betrugspraevention, IT-Sicherheit, Direktwerbung)",
  "\u00a7 26 BDSG":
    "Verarbeitung fuer Zwecke des Beschaeftigungsverhaeltnisses (Einstellung, Durchfuehrung, Beendigung)",
};

const STEP_LABELS = [
  "Benennung",
  "Verantwortlicher",
  "Rechtsgrundlage",
  "Betroffene",
  "Datenkategorien",
  "Empfaenger",
  "Drittland",
  "TOMs",
  "Loeschkonzept",
  "Zusammenfassung",
];

const TOTAL_STEPS = STEP_LABELS.length;

const tomCategoryExplanations: Record<string, string> = {
  Zutrittskontrolle: "Wer kann physisch auf die Raeume zugreifen?",
  Zugangskontrolle: "Wie wird der Zugang zu IT-Systemen gesichert?",
  Zugriffskontrolle: "Wer darf welche Daten sehen/bearbeiten?",
  Weitergabekontrolle: "Wie werden Daten bei Uebertragung geschuetzt?",
  Eingabekontrolle: "Wer hat wann welche Daten eingegeben/veraendert?",
  Auftragskontrolle: "Wie wird die weisungsgemaesse Verarbeitung sichergestellt?",
  Verfuegbarkeitskontrolle: "Wie werden Daten gegen Verlust geschuetzt?",
  Trennbarkeit: "Wie wird sichergestellt, dass Daten getrennt verarbeitet werden?",
};

const DELETION_PRESETS = [
  { label: "6 Monate", value: "6 Monate" },
  { label: "1 Jahr", value: "1 Jahr" },
  { label: "3 Jahre", value: "3 Jahre" },
  { label: "6 Jahre (\u00a7257 HGB)", value: "6 Jahre (\u00a7257 HGB)" },
  { label: "10 Jahre (\u00a7147 AO)", value: "10 Jahre (\u00a7147 AO)" },
  { label: "Dauer Vertragsverhaeltnis", value: "Dauer des Vertragsverhaeltnisses" },
  { label: "Individuell", value: "" },
];

const GUARANTEE_OPTIONS = [
  "Angemessenheitsbeschluss der EU-Kommission",
  "EU-Standardvertragsklauseln (SCC)",
  "Binding Corporate Rules (BCR)",
  "Ausdrueckliche Einwilligung der Betroffenen",
];

const INTERNAL_QUICK_CHIPS = [
  "Personalabteilung",
  "Geschaeftsfuehrung",
  "Fachabteilung",
  "IT-Abteilung",
  "Buchhaltung",
];

const EXTERNAL_QUICK_CHIPS = [
  "Steuerberater",
  "Lohnbuero",
  "Cloud-Anbieter",
  "Softwareanbieter",
];

/* ------------------------------------------------------------------ */
/*  Helper components                                                  */
/* ------------------------------------------------------------------ */

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mt-4">
      <div className="flex gap-2">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <div>{children}</div>
      </div>
    </div>
  );
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-sm text-yellow-800 mt-4">
      <div className="flex gap-2">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div>{children}</div>
      </div>
    </div>
  );
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      <span className="text-red-500 ml-0.5">*</span>
    </label>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;
}

/* ------------------------------------------------------------------ */
/*  Main wizard component                                              */
/* ------------------------------------------------------------------ */

export default function VVTAssistentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(defaultWizard);

  /* master data */
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allLegalBases, setAllLegalBases] = useState<LegalBasis[]>([]);
  const [allAffectedGroups, setAllAffectedGroups] = useState<AffectedGroup[]>([]);
  const [allDataCategories, setAllDataCategories] = useState<DataCategory[]>([]);
  const [allMeasures, setAllMeasures] = useState<TechnicalMeasure[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({
    1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true,
  });

  const inputClass =
    "border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm";

  /* ---- load master data ---- */
  const loadMasterData = useCallback(async () => {
    try {
      const [cRes, lbRes, agRes, dcRes, tmRes] = await Promise.all([
        fetch("/api/companies"),
        fetch("/api/legal-bases"),
        fetch("/api/affected-groups"),
        fetch("/api/data-categories"),
        fetch("/api/technical-measures"),
      ]);
      const [cData, lbData, agData, dcData, tmData] = await Promise.all([
        cRes.json(), lbRes.json(), agRes.json(), dcRes.json(), tmRes.json(),
      ]);
      if (Array.isArray(cData)) setCompanies(cData);
      if (Array.isArray(lbData)) setAllLegalBases(lbData);
      if (Array.isArray(agData)) setAllAffectedGroups(agData);
      if (Array.isArray(dcData)) setAllDataCategories(dcData);
      if (Array.isArray(tmData)) setAllMeasures(tmData);
    } catch (err) {
      console.error("Fehler beim Laden der Stammdaten:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMasterData(); }, [loadMasterData]);

  /* ---- helpers ---- */
  function upd(patch: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function toggleInArray(arr: string[], id: string): string[] {
    return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
  }

  function goNext() {
    if (step < TOTAL_STEPS) { setStep(step + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }
  function goBack() {
    if (step > 1) { setStep(step - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }
  function goToStep(s: number) {
    setStep(s); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---- save ---- */
  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      /* If a new company was entered inline, create it first */
      let responsibleId = data.responsibleId;
      if (!responsibleId && data.newCompany.name.trim()) {
        const cRes = await fetch("/api/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.newCompany.name,
            street: data.newCompany.street,
            zip: data.newCompany.zip,
            city: data.newCompany.city,
            dsbName: data.newCompany.dsbName,
            dsbEmail: data.newCompany.dsbEmail,
          }),
        });
        if (!cRes.ok) throw new Error("Unternehmen konnte nicht erstellt werden");
        const newC = await cRes.json();
        responsibleId = newC.id;
      }

      /* Merge internal + external recipients into the recipients array the API expects */
      const recipients = [
        ...data.internalRecipients.filter((r) => r.name.trim()).map((r) => ({
          name: r.name,
          category: "intern",
          purpose: r.purpose,
        })),
        ...data.externalRecipients.filter((r) => r.name.trim()).filter((r) => !r.isProcessor).map((r) => ({
          name: r.name,
          category: "extern",
          purpose: r.purpose,
        })),
      ];

      const processors = data.externalRecipients
        .filter((r) => r.name.trim() && r.isProcessor)
        .map((r) => ({
          name: r.name,
          avvDate: r.avvDate,
          description: r.description || r.purpose,
        }));

      const guarantees = [
        ...data.thirdCountryGuarantees,
        ...(data.thirdCountryGuaranteeOther.trim() ? [data.thirdCountryGuaranteeOther.trim()] : []),
      ].join("; ");

      const payload = {
        name: data.name,
        description: data.description,
        purpose: data.purpose,
        status: "draft",
        responsibleId: responsibleId || null,
        processorId: null,
        deletionConcept: data.deletionConcept,
        thirdCountry: data.hasThirdCountry ? data.thirdCountry : "",
        thirdCountryGuarantee: data.hasThirdCountry ? guarantees : "",
        riskAssessment: data.riskAssessment,
        dsfaRequired: data.dsfaRequired === "yes",
        legalBases: data.legalBases.map((id) => ({ legalBasisId: id })),
        affectedGroups: data.affectedGroups.map((id) => ({ affectedGroupId: id })),
        dataCategories: data.dataCategories.map((dc) => ({
          dataCategoryId: dc.dataCategoryId,
          deletionPeriod: dc.deletionPeriod || null,
        })),
        technicalMeasures: data.technicalMeasures.map((tm) => ({
          technicalMeasureId: tm.technicalMeasureId,
          status: tm.status,
        })),
        recipients,
        processors,
      };

      const res = await fetch("/api/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Fehler beim Speichern");
      const created = await res.json();
      router.push(`/verarbeitungen/${created.id}`);
    } catch (err) {
      console.error(err);
      setError("Fehler beim Speichern der Verarbeitung. Bitte versuchen Sie es erneut.");
    } finally {
      setSaving(false);
    }
  }

  /* ---- render helpers ---- */
  function isArt9Selected(): boolean {
    return data.legalBases.some((id) => {
      const lb = allLegalBases.find((x) => x.id === id);
      return lb?.article?.toLowerCase().includes("art. 9");
    });
  }

  function hasSensitiveCategory(): boolean {
    return data.dataCategories.some((dc) => {
      const cat = allDataCategories.find((c) => c.id === dc.dataCategoryId);
      return cat?.isSensitive;
    });
  }

  function getExplanation(article: string): string {
    for (const [key, val] of Object.entries(legalBasisExplanations)) {
      if (article.includes(key)) return val;
    }
    if (article.toLowerCase().includes("art. 9"))
      return "Verarbeitung besonderer Kategorien (Gesundheit, Religion, etc.) - nur mit besonderer Rechtsgrundlage";
    return "";
  }

  /* Grouped measures by category */
  function groupedMeasures(): Record<string, TechnicalMeasure[]> {
    const groups: Record<string, TechnicalMeasure[]> = {};
    for (const m of allMeasures) {
      const cat = m.category || "Sonstige";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    }
    return groups;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Laden...</div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Progress bar                                                     */
  /* ================================================================ */

  function renderProgressBar() {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, idx) => {
            const num = idx + 1;
            const isActive = num === step;
            const isDone = num < step;
            return (
              <div key={num} className="flex flex-col items-center flex-1">
                <button
                  onClick={() => goToStep(num)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                    ${isActive ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300" : ""}
                    ${isDone ? "bg-green-500 text-white" : ""}
                    ${!isActive && !isDone ? "bg-gray-200 text-gray-500 hover:bg-gray-300" : ""}
                  `}
                >
                  {isDone ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    num
                  )}
                </button>
                <span className={`mt-1 text-xs text-center hidden lg:block ${isActive ? "text-blue-700 font-semibold" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        {/* connector line */}
        <div className="relative mt-[-26px] lg:mt-[-38px] mx-5 h-0.5 bg-gray-200 -z-10">
          <div
            className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Step renderers                                                   */
  /* ================================================================ */

  function renderStep1() {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Verarbeitungstaetigkeit benennen</h2>
        <p className="text-sm text-gray-500 mb-6">
          Was wird verarbeitet? Benennen Sie die Verarbeitungstaetigkeit.
        </p>

        <InfoBox>
          <p className="font-semibold mb-2">Beispiele fuer Verarbeitungstaetigkeiten:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Personalstammdatenverwaltung</li>
            <li>Bewerbermanagement</li>
            <li>Lohn- und Gehaltsabrechnung</li>
            <li>Kundendatenverwaltung</li>
            <li>Videoueberwachung</li>
            <li>Websiteanalyse</li>
            <li>Zeiterfassung</li>
            <li>Fuhrparkverwaltung</li>
          </ul>
        </InfoBox>

        <div className="mt-6">
          <RequiredLabel>Bezeichnung der Verarbeitungstaetigkeit</RequiredLabel>
          <input
            className={inputClass}
            value={data.name}
            onChange={(e) => upd({ name: e.target.value })}
            placeholder="z.B. Bewerbermanagement"
          />
        </div>

        <div className="mt-4">
          <Label>Beschreiben Sie kurz, worum es bei dieser Verarbeitung geht:</Label>
          <textarea
            className={inputClass}
            rows={3}
            value={data.description}
            onChange={(e) => upd({ description: e.target.value })}
            placeholder="z.B. Erfassung und Verwaltung eingehender Bewerbungen inkl. Kommunikation mit Bewerbern"
          />
        </div>

        <div className="mt-4">
          <RequiredLabel>Welchen Zweck verfolgen Sie mit dieser Datenverarbeitung?</RequiredLabel>
          <textarea
            className={inputClass}
            rows={3}
            value={data.purpose}
            onChange={(e) => upd({ purpose: e.target.value })}
            placeholder="z.B. Durchfuehrung des Bewerbungsverfahrens zur Besetzung offener Stellen"
          />
          <p className="mt-1 text-xs text-gray-400">
            Tipp: Der Zweck beschreibt, WARUM Sie die Daten verarbeiten. z.B. &quot;Durchfuehrung des Bewerbungsverfahrens zur Besetzung offener Stellen&quot;
          </p>
        </div>
      </div>
    );
  }

  function renderStep2() {
    const showInline = companies.length === 0;
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Verantwortlicher</h2>
        <p className="text-sm text-gray-500 mb-6">
          Wer ist fuer diese Verarbeitung verantwortlich?
        </p>

        <InfoBox>
          Der Verantwortliche ist die Stelle, die ueber Zwecke und Mittel der Datenverarbeitung entscheidet
          (Art. 4 Nr. 7 DSGVO). In der Regel ist dies Ihr Unternehmen.
        </InfoBox>

        {!showInline ? (
          <div className="mt-6">
            <RequiredLabel>Verantwortliches Unternehmen auswaehlen</RequiredLabel>
            <select
              className={inputClass}
              value={data.responsibleId}
              onChange={(e) => upd({ responsibleId: e.target.value })}
            >
              <option value="">-- Bitte waehlen --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-5">
            <p className="text-sm font-medium text-gray-700 mb-4">
              Es sind noch keine Unternehmen angelegt. Bitte geben Sie die Daten des Verantwortlichen ein:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <RequiredLabel>Name des Unternehmens</RequiredLabel>
                <input
                  className={inputClass}
                  value={data.newCompany.name}
                  onChange={(e) => upd({ newCompany: { ...data.newCompany, name: e.target.value } })}
                  placeholder="z.B. Muster GmbH"
                />
              </div>
              <div>
                <Label>Strasse</Label>
                <input className={inputClass} value={data.newCompany.street} onChange={(e) => upd({ newCompany: { ...data.newCompany, street: e.target.value } })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>PLZ</Label>
                  <input className={inputClass} value={data.newCompany.zip} onChange={(e) => upd({ newCompany: { ...data.newCompany, zip: e.target.value } })} />
                </div>
                <div className="col-span-2">
                  <Label>Ort</Label>
                  <input className={inputClass} value={data.newCompany.city} onChange={(e) => upd({ newCompany: { ...data.newCompany, city: e.target.value } })} />
                </div>
              </div>
              <div>
                <Label>Datenschutzbeauftragter - Name</Label>
                <input className={inputClass} value={data.newCompany.dsbName} onChange={(e) => upd({ newCompany: { ...data.newCompany, dsbName: e.target.value } })} />
              </div>
              <div>
                <Label>Datenschutzbeauftragter - E-Mail</Label>
                <input className={inputClass} type="email" value={data.newCompany.dsbEmail} onChange={(e) => upd({ newCompany: { ...data.newCompany, dsbEmail: e.target.value } })} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderStep3() {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Rechtsgrundlage</h2>
        <p className="text-sm text-gray-500 mb-6">
          Auf welcher rechtlichen Grundlage verarbeiten Sie die Daten?
        </p>

        {allLegalBases.length === 0 ? (
          <p className="text-sm text-gray-500">Keine Rechtsgrundlagen vorhanden. Bitte zuerst unter Stammdaten anlegen.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 mt-4">
            {allLegalBases.map((lb) => {
              const selected = data.legalBases.includes(lb.id);
              const explanation = getExplanation(lb.article);
              const isArt9 = lb.article.toLowerCase().includes("art. 9");
              return (
                <button
                  key={lb.id}
                  type="button"
                  onClick={() => upd({ legalBases: toggleInArray(data.legalBases, lb.id) })}
                  className={`text-left p-4 rounded-lg border-2 transition-all
                    ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}
                    ${isArt9 && selected ? "border-orange-400 bg-orange-50" : ""}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center
                      ${selected ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
                    >
                      {selected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">{lb.article}</span>
                      {lb.description && (
                        <span className="text-gray-600 ml-2 text-sm">- {lb.description}</span>
                      )}
                      {explanation && (
                        <p className="text-sm text-gray-500 mt-1">{explanation}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {isArt9Selected() && (
          <WarningBox>
            <strong>Achtung:</strong> Sie verarbeiten besondere Kategorien personenbezogener Daten. Dies erfordert erhoehte
            Schutzmassnahmen und eine besondere Rechtsgrundlage nach Art. 9 Abs. 2 DSGVO.
          </WarningBox>
        )}

        <InfoBox>
          Sie koennen mehrere Rechtsgrundlagen auswaehlen, falls verschiedene Datenverarbeitungen innerhalb
          dieser Taetigkeit auf unterschiedlichen Grundlagen beruhen.
        </InfoBox>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Betroffene Personen</h2>
        <p className="text-sm text-gray-500 mb-6">
          Wessen Daten werden verarbeitet?
        </p>

        <InfoBox>
          Betroffene Personen sind alle natuerlichen Personen, deren personenbezogene Daten verarbeitet werden.
        </InfoBox>

        {allAffectedGroups.length === 0 ? (
          <p className="text-sm text-gray-500 mt-4">Keine Betroffenengruppen vorhanden. Bitte zuerst unter Stammdaten anlegen.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
            {allAffectedGroups.map((ag) => {
              const selected = data.affectedGroups.includes(ag.id);
              return (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => upd({ affectedGroups: toggleInArray(data.affectedGroups, ag.id) })}
                  className={`text-left p-4 rounded-lg border-2 transition-all
                    ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center
                      ${selected ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
                    >
                      {selected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{ag.name}</span>
                      {ag.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{ag.description}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderStep5() {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Datenkategorien</h2>
        <p className="text-sm text-gray-500 mb-6">
          Welche Arten von Daten werden verarbeitet?
        </p>

        <InfoBox>
          Tipp: Unterscheiden Sie zwischen regulaeren personenbezogenen Daten und besonderen Kategorien nach
          Art. 9 DSGVO (Gesundheitsdaten, religioese Ueberzeugungen, biometrische Daten, etc.). Letztere erfordern erhoehten Schutz.
        </InfoBox>

        {allDataCategories.length === 0 ? (
          <p className="text-sm text-gray-500 mt-4">Keine Datenkategorien vorhanden. Bitte zuerst unter Stammdaten anlegen.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            {allDataCategories.map((dc) => {
              const sel = data.dataCategories.find((s) => s.dataCategoryId === dc.id);
              const selected = !!sel;
              return (
                <div key={dc.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (selected) {
                        upd({ dataCategories: data.dataCategories.filter((s) => s.dataCategoryId !== dc.id) });
                      } else {
                        upd({ dataCategories: [...data.dataCategories, { dataCategoryId: dc.id, deletionPeriod: "" }] });
                      }
                    }}
                    className={`text-left w-full p-4 rounded-lg border-2 transition-all
                      ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}
                      ${dc.isSensitive && !selected ? "border-red-200" : ""}
                      ${dc.isSensitive && selected ? "border-red-500 bg-red-50" : ""}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center
                        ${selected ? (dc.isSensitive ? "bg-red-600 border-red-600" : "bg-blue-600 border-blue-600") : "border-gray-300"}`}
                      >
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{dc.name}</span>
                        {dc.isSensitive && (
                          <span className="bg-red-100 text-red-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                            Art. 9
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {selected && (
                    <div className="mt-2 ml-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Wie lange werden diese Daten aufbewahrt?
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {DELETION_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              upd({
                                dataCategories: data.dataCategories.map((s) =>
                                  s.dataCategoryId === dc.id ? { ...s, deletionPeriod: preset.value || s.deletionPeriod } : s
                                ),
                              });
                            }}
                            className={`text-xs px-2 py-1 rounded-full border transition-colors
                              ${sel?.deletionPeriod === preset.value && preset.value
                                ? "bg-blue-100 border-blue-300 text-blue-800"
                                : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"
                              }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <input
                        className="border border-gray-300 rounded-lg px-2 py-1.5 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Aufbewahrungsfrist eingeben..."
                        value={sel?.deletionPeriod ?? ""}
                        onChange={(e) =>
                          upd({
                            dataCategories: data.dataCategories.map((s) =>
                              s.dataCategoryId === dc.id ? { ...s, deletionPeriod: e.target.value } : s
                            ),
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {hasSensitiveCategory() && (
          <WarningBox>
            <strong>Achtung:</strong> Sie verarbeiten besondere Kategorien personenbezogener Daten (Art. 9 DSGVO).
            Stellen Sie sicher, dass erhoehte Schutzmassnahmen implementiert sind und eine passende Rechtsgrundlage vorliegt.
          </WarningBox>
        )}
      </div>
    );
  }

  function renderStep6() {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Empfaenger</h2>
        <p className="text-sm text-gray-500 mb-6">
          An wen werden die Daten weitergegeben?
        </p>

        <InfoBox>
          Empfaenger sind alle Stellen, denen personenbezogene Daten offengelegt werden &ndash; sowohl intern
          (Abteilungen) als auch extern (Dienstleister, Behoerden).
        </InfoBox>

        {/* Internal recipients */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Interne Empfaenger</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {INTERNAL_QUICK_CHIPS.map((chip) => {
              const exists = data.internalRecipients.some((r) => r.name === chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    if (!exists) {
                      upd({ internalRecipients: [...data.internalRecipients, { name: chip, purpose: "" }] });
                    }
                  }}
                  disabled={exists}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                    ${exists ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600"}`}
                >
                  + {chip}
                </button>
              );
            })}
          </div>
          {data.internalRecipients.map((r, idx) => (
            <div key={idx} className="flex gap-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1">
                <input
                  className={inputClass}
                  placeholder="Name / Abteilung"
                  value={r.name}
                  onChange={(e) => {
                    const updated = [...data.internalRecipients];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    upd({ internalRecipients: updated });
                  }}
                />
              </div>
              <div className="flex-1">
                <input
                  className={inputClass}
                  placeholder="Zweck (z.B. Verwaltung der Bewerbungen)"
                  value={r.purpose}
                  onChange={(e) => {
                    const updated = [...data.internalRecipients];
                    updated[idx] = { ...updated[idx], purpose: e.target.value };
                    upd({ internalRecipients: updated });
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => upd({ internalRecipients: data.internalRecipients.filter((_, i) => i !== idx) })}
                className="text-red-400 hover:text-red-600 px-2 text-lg"
                title="Entfernen"
              >
                &times;
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => upd({ internalRecipients: [...data.internalRecipients, { name: "", purpose: "" }] })}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + Internen Empfaenger hinzufuegen
          </button>
        </div>

        {/* External recipients */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Externe Empfaenger</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {EXTERNAL_QUICK_CHIPS.map((chip) => {
              const exists = data.externalRecipients.some((r) => r.name === chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    if (!exists) {
                      upd({
                        externalRecipients: [
                          ...data.externalRecipients,
                          { name: chip, purpose: "", isProcessor: false, avvDate: "", description: "" },
                        ],
                      });
                    }
                  }}
                  disabled={exists}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                    ${exists ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600"}`}
                >
                  + {chip}
                </button>
              );
            })}
          </div>
          {data.externalRecipients.map((r, idx) => (
            <div key={idx} className="mb-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <input
                    className={inputClass}
                    placeholder="Name"
                    value={r.name}
                    onChange={(e) => {
                      const updated = [...data.externalRecipients];
                      updated[idx] = { ...updated[idx], name: e.target.value };
                      upd({ externalRecipients: updated });
                    }}
                  />
                </div>
                <div className="flex-1">
                  <input
                    className={inputClass}
                    placeholder="Zweck"
                    value={r.purpose}
                    onChange={(e) => {
                      const updated = [...data.externalRecipients];
                      updated[idx] = { ...updated[idx], purpose: e.target.value };
                      upd({ externalRecipients: updated });
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => upd({ externalRecipients: data.externalRecipients.filter((_, i) => i !== idx) })}
                  className="text-red-400 hover:text-red-600 px-2 text-lg"
                  title="Entfernen"
                >
                  &times;
                </button>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={r.isProcessor}
                  onChange={(e) => {
                    const updated = [...data.externalRecipients];
                    updated[idx] = { ...updated[idx], isProcessor: e.target.checked };
                    upd({ externalRecipients: updated });
                  }}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Handelt es sich um einen Auftragsverarbeiter?</span>
              </label>
              {r.isProcessor && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">AVV-Datum</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={r.avvDate}
                      onChange={(e) => {
                        const updated = [...data.externalRecipients];
                        updated[idx] = { ...updated[idx], avvDate: e.target.value };
                        upd({ externalRecipients: updated });
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Beschreibung der Verarbeitung</label>
                    <input
                      className={inputClass}
                      value={r.description}
                      onChange={(e) => {
                        const updated = [...data.externalRecipients];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        upd({ externalRecipients: updated });
                      }}
                      placeholder="z.B. Hosting der Anwendung"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              upd({
                externalRecipients: [
                  ...data.externalRecipients,
                  { name: "", purpose: "", isProcessor: false, avvDate: "", description: "" },
                ],
              })
            }
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + Externen Empfaenger hinzufuegen
          </button>
        </div>
      </div>
    );
  }

  function renderStep7() {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Drittlanduebermittlung</h2>
        <p className="text-sm text-gray-500 mb-6">
          Werden Daten in Laender ausserhalb der EU/des EWR uebermittelt?
        </p>

        <InfoBox>
          Eine Uebermittlung in Drittlaender liegt auch vor, wenn ein Cloud-Dienst Server ausserhalb der EU
          betreibt oder Support von dort erbracht wird (z.B. USA, Indien).
        </InfoBox>

        <div className="mt-6 space-y-3">
          <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-gray-300"
            style={{ borderColor: !data.hasThirdCountry ? "#3b82f6" : "#e5e7eb", backgroundColor: !data.hasThirdCountry ? "#eff6ff" : "white" }}
          >
            <input
              type="radio"
              name="thirdCountry"
              checked={!data.hasThirdCountry}
              onChange={() => upd({ hasThirdCountry: false })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Nein, keine Uebermittlung in Drittlaender</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-gray-300"
            style={{ borderColor: data.hasThirdCountry ? "#3b82f6" : "#e5e7eb", backgroundColor: data.hasThirdCountry ? "#eff6ff" : "white" }}
          >
            <input
              type="radio"
              name="thirdCountry"
              checked={data.hasThirdCountry}
              onChange={() => upd({ hasThirdCountry: true })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Ja, es werden Daten in Drittlaender uebermittelt</span>
          </label>
        </div>

        {data.hasThirdCountry && (
          <div className="mt-6 p-5 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
            <div>
              <RequiredLabel>In welche Laender?</RequiredLabel>
              <input
                className={inputClass}
                value={data.thirdCountry}
                onChange={(e) => upd({ thirdCountry: e.target.value })}
                placeholder="z.B. USA, Schweiz, Indien"
              />
            </div>
            <div>
              <Label>Welche Garantien bestehen?</Label>
              <div className="space-y-2 mt-2">
                {GUARANTEE_OPTIONS.map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.thirdCountryGuarantees.includes(g)}
                      onChange={() => upd({ thirdCountryGuarantees: toggleInArray(data.thirdCountryGuarantees, g) })}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{g}</span>
                  </label>
                ))}
                <div className="mt-2">
                  <label className="block text-sm text-gray-600 mb-1">Sonstige:</label>
                  <input
                    className={inputClass}
                    value={data.thirdCountryGuaranteeOther}
                    onChange={(e) => upd({ thirdCountryGuaranteeOther: e.target.value })}
                    placeholder="Weitere Garantien..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderStep8() {
    const groups = groupedMeasures();
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Technische &amp; Organisatorische Massnahmen (TOMs)</h2>
        <p className="text-sm text-gray-500 mb-6">
          Welche Schutzmassnahmen sind fuer diese Verarbeitung implementiert?
        </p>

        {allMeasures.length === 0 ? (
          <p className="text-sm text-gray-500">Keine TOMs vorhanden. Bitte zuerst unter Stammdaten anlegen.</p>
        ) : (
          <div className="space-y-6 mt-4">
            {Object.entries(groups).map(([category, measures]) => (
              <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">{category}</h3>
                  {tomCategoryExplanations[category] && (
                    <p className="text-xs text-gray-500 mt-0.5">{tomCategoryExplanations[category]}</p>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  {measures.map((m) => {
                    const sel = data.technicalMeasures.find((tm) => tm.technicalMeasureId === m.id);
                    const selected = !!sel;
                    return (
                      <div key={m.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            if (selected) {
                              upd({ technicalMeasures: data.technicalMeasures.filter((tm) => tm.technicalMeasureId !== m.id) });
                            } else {
                              upd({ technicalMeasures: [...data.technicalMeasures, { technicalMeasureId: m.id, status: "vorhanden" }] });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 flex-1">{m.name}</span>
                        {selected && (
                          <select
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            value={sel!.status}
                            onChange={(e) =>
                              upd({
                                technicalMeasures: data.technicalMeasures.map((tm) =>
                                  tm.technicalMeasureId === m.id ? { ...tm, status: e.target.value } : tm
                                ),
                              })
                            }
                          >
                            <option value="vorhanden">Vorhanden</option>
                            <option value="geplant">Geplant</option>
                            <option value="ausstehend">Ausstehend</option>
                          </select>
                        )}
                        {selected && (
                          <span
                            className={`w-3 h-3 rounded-full ${
                              sel!.status === "vorhanden"
                                ? "bg-green-500"
                                : sel!.status === "geplant"
                                ? "bg-yellow-400"
                                : "bg-red-500"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <InfoBox>
          <p className="font-semibold mb-1">Kategorien der TOMs:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            {Object.entries(tomCategoryExplanations).map(([cat, expl]) => (
              <li key={cat}><strong>{cat}:</strong> {expl}</li>
            ))}
          </ul>
        </InfoBox>
      </div>
    );
  }

  function renderStep9() {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Loeschkonzept &amp; Risikobewertung</h2>
        <p className="text-sm text-gray-500 mb-6">
          Wie werden die Daten geloescht und welche Risiken bestehen?
        </p>

        <div className="space-y-6">
          <div>
            <Label>Loeschkonzept</Label>
            <p className="text-xs text-gray-400 mb-2">
              Beschreiben Sie, wann und wie die Daten geloescht werden. Beruecksichtigen Sie gesetzliche Aufbewahrungsfristen.
            </p>
            <textarea
              className={inputClass}
              rows={5}
              value={data.deletionConcept}
              onChange={(e) => upd({ deletionConcept: e.target.value })}
              placeholder="z.B. Bewerbungsunterlagen werden 6 Monate nach Abschluss des Verfahrens geloescht, sofern keine Einwilligung zur laengeren Speicherung vorliegt."
            />
            <InfoBox>
              <p className="font-semibold mb-1">Typische Aufbewahrungsfristen:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>Bewerbungen: 6 Monate (&sect;15 AGG)</li>
                <li>Buchhaltungsbelege: 10 Jahre (&sect;147 AO)</li>
                <li>Handelsbriefe: 6 Jahre (&sect;257 HGB)</li>
                <li>Vertraege: 3 Jahre nach Ende (&sect;195 BGB)</li>
                <li>Personalakten: 3 Jahre nach Ausscheiden</li>
              </ul>
            </InfoBox>
          </div>

          <div>
            <Label>Risikobewertung</Label>
            <textarea
              className={inputClass}
              rows={4}
              value={data.riskAssessment}
              onChange={(e) => upd({ riskAssessment: e.target.value })}
              placeholder="Bewertung der Risiken fuer die Rechte und Freiheiten der betroffenen Personen..."
            />
          </div>

          <div>
            <Label>Ist eine Datenschutz-Folgenabschaetzung (DSFA) erforderlich?</Label>
            <p className="text-xs text-gray-400 mb-3">
              Eine DSFA ist erforderlich bei: systematischer Ueberwachung, Verarbeitung besonderer Kategorien in
              grossem Umfang, automatisierter Entscheidungsfindung mit rechtlicher Wirkung.
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                style={{
                  borderColor: data.dsfaRequired === "no" ? "#3b82f6" : "#e5e7eb",
                  backgroundColor: data.dsfaRequired === "no" ? "#eff6ff" : "white",
                }}
              >
                <input
                  type="radio"
                  name="dsfa"
                  checked={data.dsfaRequired === "no"}
                  onChange={() => upd({ dsfaRequired: "no" })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Nein, keine DSFA erforderlich</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                style={{
                  borderColor: data.dsfaRequired === "yes" ? "#3b82f6" : "#e5e7eb",
                  backgroundColor: data.dsfaRequired === "yes" ? "#eff6ff" : "white",
                }}
              >
                <input
                  type="radio"
                  name="dsfa"
                  checked={data.dsfaRequired === "yes"}
                  onChange={() => upd({ dsfaRequired: "yes" })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Ja, eine DSFA ist erforderlich (Art. 35 DSGVO)</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Step 10: Summary ---- */
  function toggleSection(n: number) {
    setExpandedSections((prev) => ({ ...prev, [n]: !prev[n] }));
  }

  function SummarySection({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
    const expanded = expandedSections[num] !== false;
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          onClick={() => toggleSection(num)}
        >
          <span className="font-semibold text-gray-800">{title}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goToStep(num); }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Bearbeiten
            </button>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        {expanded && <div className="p-4 text-sm text-gray-700">{children}</div>}
      </div>
    );
  }

  function renderStep10() {
    const responsible = companies.find((c) => c.id === data.responsibleId);
    const selectedLB = allLegalBases.filter((lb) => data.legalBases.includes(lb.id));
    const selectedAG = allAffectedGroups.filter((ag) => data.affectedGroups.includes(ag.id));
    const selectedDC = data.dataCategories.map((dc) => ({
      ...dc,
      cat: allDataCategories.find((c) => c.id === dc.dataCategoryId),
    }));
    const selectedTM = data.technicalMeasures.map((tm) => ({
      ...tm,
      measure: allMeasures.find((m) => m.id === tm.technicalMeasureId),
    }));

    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Zusammenfassung</h2>
        <p className="text-sm text-gray-500 mb-6">
          Pruefen Sie alle Angaben und speichern Sie die Verarbeitung.
        </p>

        <SummarySection num={1} title="1. Verarbeitungstaetigkeit">
          <div className="space-y-2">
            <div><strong>Bezeichnung:</strong> {data.name || <span className="text-red-500">Nicht angegeben</span>}</div>
            <div><strong>Beschreibung:</strong> {data.description || "-"}</div>
            <div><strong>Zweck:</strong> {data.purpose || "-"}</div>
          </div>
        </SummarySection>

        <SummarySection num={2} title="2. Verantwortlicher">
          {responsible ? (
            <div>{responsible.name}</div>
          ) : data.newCompany.name ? (
            <div>{data.newCompany.name} (wird neu erstellt)</div>
          ) : (
            <span className="text-gray-400">Nicht angegeben</span>
          )}
        </SummarySection>

        <SummarySection num={3} title="3. Rechtsgrundlagen">
          {selectedLB.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {selectedLB.map((lb) => (
                <li key={lb.id}><strong>{lb.article}</strong> - {lb.description}</li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-400">Keine ausgewaehlt</span>
          )}
        </SummarySection>

        <SummarySection num={4} title="4. Betroffene Personen">
          {selectedAG.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedAG.map((ag) => (
                <span key={ag.id} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {ag.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">Keine ausgewaehlt</span>
          )}
        </SummarySection>

        <SummarySection num={5} title="5. Datenkategorien">
          {selectedDC.length > 0 ? (
            <ul className="space-y-1">
              {selectedDC.map((dc) => (
                <li key={dc.dataCategoryId} className="flex items-center gap-2">
                  <span>{dc.cat?.name ?? dc.dataCategoryId}</span>
                  {dc.cat?.isSensitive && (
                    <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">Art. 9</span>
                  )}
                  {dc.deletionPeriod && (
                    <span className="text-xs text-gray-500">({dc.deletionPeriod})</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-400">Keine ausgewaehlt</span>
          )}
        </SummarySection>

        <SummarySection num={6} title="6. Empfaenger">
          <div className="space-y-3">
            {data.internalRecipients.length > 0 && (
              <div>
                <p className="font-medium mb-1">Intern:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {data.internalRecipients.filter((r) => r.name.trim()).map((r, i) => (
                    <li key={i}>{r.name}{r.purpose ? ` - ${r.purpose}` : ""}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.externalRecipients.length > 0 && (
              <div>
                <p className="font-medium mb-1">Extern:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {data.externalRecipients.filter((r) => r.name.trim()).map((r, i) => (
                    <li key={i}>
                      {r.name}{r.purpose ? ` - ${r.purpose}` : ""}
                      {r.isProcessor && <span className="text-xs text-orange-600 ml-1">(Auftragsverarbeiter)</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.internalRecipients.length === 0 && data.externalRecipients.length === 0 && (
              <span className="text-gray-400">Keine angegeben</span>
            )}
          </div>
        </SummarySection>

        <SummarySection num={7} title="7. Drittlanduebermittlung">
          {data.hasThirdCountry ? (
            <div className="space-y-1">
              <div><strong>Laender:</strong> {data.thirdCountry || "-"}</div>
              <div><strong>Garantien:</strong> {[...data.thirdCountryGuarantees, ...(data.thirdCountryGuaranteeOther.trim() ? [data.thirdCountryGuaranteeOther] : [])].join(", ") || "-"}</div>
            </div>
          ) : (
            <span>Keine Uebermittlung in Drittlaender</span>
          )}
        </SummarySection>

        <SummarySection num={8} title="8. Technische & Organisatorische Massnahmen">
          {selectedTM.length > 0 ? (
            <ul className="space-y-1">
              {selectedTM.map((tm) => (
                <li key={tm.technicalMeasureId} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    tm.status === "vorhanden" ? "bg-green-500" : tm.status === "geplant" ? "bg-yellow-400" : "bg-red-500"
                  }`} />
                  <span>{tm.measure?.name ?? tm.technicalMeasureId}</span>
                  <span className="text-xs text-gray-400">({tm.status})</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-400">Keine ausgewaehlt</span>
          )}
        </SummarySection>

        <SummarySection num={9} title="9. Loeschkonzept & Risikobewertung">
          <div className="space-y-2">
            <div><strong>Loeschkonzept:</strong> {data.deletionConcept || "-"}</div>
            <div><strong>Risikobewertung:</strong> {data.riskAssessment || "-"}</div>
            <div><strong>DSFA erforderlich:</strong> {data.dsfaRequired === "yes" ? "Ja" : data.dsfaRequired === "no" ? "Nein" : "Nicht angegeben"}</div>
          </div>
        </SummarySection>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-4">
            {error}
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !data.name.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg text-base font-semibold transition-colors"
          >
            {saving ? "Wird gespeichert..." : "Verarbeitung speichern"}
          </button>
          {!data.name.trim() && (
            <p className="text-xs text-red-500 mt-2 text-center">
              Bitte geben Sie mindestens eine Bezeichnung ein (Schritt 1).
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Main render                                                      */
  /* ================================================================ */

  const stepRenderers: Record<number, () => React.ReactNode> = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
    5: renderStep5,
    6: renderStep6,
    7: renderStep7,
    8: renderStep8,
    9: renderStep9,
    10: renderStep10,
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/verarbeitungen" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Zurueck zur Uebersicht
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">VVT-Assistent</h1>
        <p className="text-sm text-gray-500 mt-1">
          Schritt fuer Schritt durch alle Anforderungen nach Art. 30 DSGVO
        </p>
      </div>

      {/* Progress */}
      {renderProgressBar()}

      {/* Step content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6 min-h-[400px]">
        {stepRenderers[step]?.()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mb-12">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 disabled:border-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Zurueck
        </button>

        <span className="text-sm text-gray-400">
          Schritt {step} von {TOTAL_STEPS}
        </span>

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Weiter
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !data.name.trim()}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? "Speichern..." : "Speichern"}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
