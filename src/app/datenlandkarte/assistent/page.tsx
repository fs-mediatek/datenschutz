"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Company {
  id: string;
  name: string;
}

interface DataSource {
  id: string;
  label: string;
  icon: string;
  custom?: boolean;
  dataTypes: string[];
}

interface ProcessingSystem {
  id: string;
  label: string;
  icon: string;
  custom?: boolean;
  productName: string;
}

interface InternalRecipient {
  id: string;
  label: string;
  icon: string;
  custom?: boolean;
  accessLevel: "full" | "limited" | "readonly";
}

interface ExternalRecipient {
  name: string;
  purpose: string;
  hasAVV: boolean;
}

interface Authority {
  name: string;
  custom?: boolean;
}

interface ThirdCountryTransfer {
  country: string;
  guarantee: string;
}

interface WizardState {
  // Step 1
  processName: string;
  processDescription: string;
  companyId: string;
  // Step 2
  dataSources: DataSource[];
  // Step 3
  processingSystems: ProcessingSystem[];
  // Step 4
  internalRecipients: InternalRecipient[];
  // Step 5
  hasExternalRecipients: boolean;
  externalRecipients: ExternalRecipient[];
  hasAuthorityTransfer: boolean;
  authorities: Authority[];
  hasThirdCountryTransfer: boolean;
  thirdCountryTransfers: ThirdCountryTransfer[];
  // Step 6
  deletionMethods: string[];
  archiveTransferSystem: string;
  archiveDuration: string;
  hasDeletionConcept: boolean | null;
}

// ─── Preset Options ──────────────────────────────────────────────────────────

const DATA_SOURCE_OPTIONS = [
  { id: "email", label: "E-Mail-Postfach", icon: "\uD83D\uDCE7" },
  { id: "website", label: "Website / Online-Formular", icon: "\uD83C\uDF10" },
  { id: "mail", label: "Postalischer Eingang", icon: "\uD83D\uDCEC" },
  { id: "phone", label: "Telefon / Gespr\u00E4chsnotizen", icon: "\uD83D\uDCDE" },
  { id: "inperson", label: "Pers\u00F6nlicher Kontakt / Vor-Ort", icon: "\uD83E\uDD1D" },
  { id: "api", label: "API-Schnittstelle", icon: "\uD83D\uDD0C" },
  { id: "external_db", label: "Externe Datenbank / Beh\u00F6rde", icon: "\uD83C\uDFDB\uFE0F" },
  { id: "jobportal", label: "Bewerbungsportal", icon: "\uD83D\uDCBC" },
  { id: "internal_system", label: "Internes System", icon: "\uD83D\uDCBB" },
];

const DATA_TYPE_OPTIONS = [
  "Name",
  "Adresse",
  "Telefonnummer",
  "E-Mail",
  "Lebenslauf/Dokumente",
  "Bankdaten",
  "Gesundheitsdaten",
  "Vertragsdaten",
];

const SYSTEM_OPTIONS = [
  { id: "hr", label: "HR-Software", icon: "\uD83D\uDC65" },
  { id: "crm", label: "CRM-System", icon: "\uD83D\uDCCA" },
  { id: "erp", label: "ERP-System", icon: "\uD83C\uDFED" },
  { id: "email_server", label: "E-Mail-Server", icon: "\uD83D\uDCE8" },
  { id: "fileserver", label: "Dateisystem / Fileserver", icon: "\uD83D\uDCC1" },
  { id: "cloud", label: "Cloud-Speicher", icon: "\u2601\uFE0F" },
  { id: "paper", label: "Papierakte / Archiv", icon: "\uD83D\uDDC4\uFE0F" },
  { id: "accounting", label: "Buchhaltungssoftware", icon: "\uD83D\uDCB0" },
  { id: "database", label: "Eigene Datenbank", icon: "\uD83D\uDDC3\uFE0F" },
];

const RECIPIENT_OPTIONS = [
  { id: "hr_dept", label: "Personalabteilung", icon: "\uD83D\uDC65" },
  { id: "management", label: "Gesch\u00E4ftsf\u00FChrung", icon: "\uD83D\uDC54" },
  { id: "department", label: "Fachabteilung", icon: "\uD83D\uDD27" },
  { id: "it", label: "IT-Abteilung", icon: "\uD83D\uDCBB" },
  { id: "finance", label: "Buchhaltung / Finanzen", icon: "\uD83D\uDCB6" },
  { id: "legal", label: "Rechtsabteilung", icon: "\u2696\uFE0F" },
  { id: "reception", label: "Empfang / Sekretariat", icon: "\uD83C\uDFE2" },
  { id: "council", label: "Betriebsrat", icon: "\uD83E\uDD1D" },
];

const AUTHORITY_OPTIONS = [
  { name: "Finanzamt", custom: false },
  { name: "Sozialversicherungstr\u00E4ger", custom: false },
  { name: "Arbeitsagentur", custom: false },
];

const GUARANTEE_OPTIONS = [
  "Angemessenheitsbeschluss",
  "Standardvertragsklauseln",
  "BCR (Binding Corporate Rules)",
  "Einwilligung",
];

const ARCHIVE_DURATION_OPTIONS = [
  "6 Monate",
  "1 Jahr",
  "3 Jahre",
  "6 Jahre",
  "10 Jahre",
];

// ─── Step Labels ─────────────────────────────────────────────────────────────

const STEPS = [
  "Grundlagen",
  "Datenquellen",
  "Systeme",
  "Interne Empf\u00E4nger",
  "Externe Empf\u00E4nger",
  "L\u00F6schung",
  "Zusammenfassung",
];

// ─── Initial State ───────────────────────────────────────────────────────────

const initialState: WizardState = {
  processName: "",
  processDescription: "",
  companyId: "",
  dataSources: [],
  processingSystems: [],
  internalRecipients: [],
  hasExternalRecipients: false,
  externalRecipients: [],
  hasAuthorityTransfer: false,
  authorities: [],
  hasThirdCountryTransfer: false,
  thirdCountryTransfers: [],
  deletionMethods: [],
  archiveTransferSystem: "",
  archiveDuration: "",
  hasDeletionConcept: null,
};

// ─── Helper: generate unique id ──────────────────────────────────────────────

let _counter = 0;
function uid() {
  return `wizard_${Date.now()}_${++_counter}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DatenlandkarteAssistentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(initialState);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // custom source input
  const [customSourceLabel, setCustomSourceLabel] = useState("");
  const [customSystemLabel, setCustomSystemLabel] = useState("");
  const [customRecipientLabel, setCustomRecipientLabel] = useState("");
  const [customAuthorityName, setCustomAuthorityName] = useState("");
  // sonstiges data type per source
  const [sonstigesInput, setSonstigesInput] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data) => setCompanies(data))
      .catch(() => {});
  }, []);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const update = (patch: Partial<WizardState>) =>
    setState((prev) => ({ ...prev, ...patch }));

  const canAdvance = (): boolean => {
    switch (step) {
      case 0:
        return state.processName.trim().length > 0;
      case 1:
        return state.dataSources.length > 0;
      case 2:
        return state.processingSystems.length > 0;
      case 3:
        return state.internalRecipients.length > 0;
      default:
        return true;
    }
  };

  // ─── Toggle helpers ──────────────────────────────────────────────────────

  const toggleDataSource = (opt: { id: string; label: string; icon: string }) => {
    setState((prev) => {
      const exists = prev.dataSources.find((s) => s.id === opt.id);
      if (exists) {
        return { ...prev, dataSources: prev.dataSources.filter((s) => s.id !== opt.id) };
      }
      return {
        ...prev,
        dataSources: [
          ...prev.dataSources,
          { id: opt.id, label: opt.label, icon: opt.icon, dataTypes: [] },
        ],
      };
    });
  };

  const toggleDataType = (sourceId: string, dataType: string) => {
    setState((prev) => ({
      ...prev,
      dataSources: prev.dataSources.map((s) => {
        if (s.id !== sourceId) return s;
        const has = s.dataTypes.includes(dataType);
        return {
          ...s,
          dataTypes: has
            ? s.dataTypes.filter((d) => d !== dataType)
            : [...s.dataTypes, dataType],
        };
      }),
    }));
  };

  const addCustomSource = () => {
    if (!customSourceLabel.trim()) return;
    const id = uid();
    setState((prev) => ({
      ...prev,
      dataSources: [
        ...prev.dataSources,
        { id, label: customSourceLabel.trim(), icon: "\u2795", custom: true, dataTypes: [] },
      ],
    }));
    setCustomSourceLabel("");
  };

  const toggleSystem = (opt: { id: string; label: string; icon: string }) => {
    setState((prev) => {
      const exists = prev.processingSystems.find((s) => s.id === opt.id);
      if (exists) {
        return {
          ...prev,
          processingSystems: prev.processingSystems.filter((s) => s.id !== opt.id),
        };
      }
      return {
        ...prev,
        processingSystems: [
          ...prev.processingSystems,
          { id: opt.id, label: opt.label, icon: opt.icon, productName: "" },
        ],
      };
    });
  };

  const setSystemProductName = (sysId: string, name: string) => {
    setState((prev) => ({
      ...prev,
      processingSystems: prev.processingSystems.map((s) =>
        s.id === sysId ? { ...s, productName: name } : s
      ),
    }));
  };

  const addCustomSystem = () => {
    if (!customSystemLabel.trim()) return;
    const id = uid();
    setState((prev) => ({
      ...prev,
      processingSystems: [
        ...prev.processingSystems,
        { id, label: customSystemLabel.trim(), icon: "\u2795", custom: true, productName: "" },
      ],
    }));
    setCustomSystemLabel("");
  };

  const toggleRecipient = (opt: { id: string; label: string; icon: string }) => {
    setState((prev) => {
      const exists = prev.internalRecipients.find((r) => r.id === opt.id);
      if (exists) {
        return {
          ...prev,
          internalRecipients: prev.internalRecipients.filter((r) => r.id !== opt.id),
        };
      }
      return {
        ...prev,
        internalRecipients: [
          ...prev.internalRecipients,
          { id: opt.id, label: opt.label, icon: opt.icon, accessLevel: "readonly" },
        ],
      };
    });
  };

  const setRecipientAccess = (
    rId: string,
    level: "full" | "limited" | "readonly"
  ) => {
    setState((prev) => ({
      ...prev,
      internalRecipients: prev.internalRecipients.map((r) =>
        r.id === rId ? { ...r, accessLevel: level } : r
      ),
    }));
  };

  const addCustomRecipient = () => {
    if (!customRecipientLabel.trim()) return;
    const id = uid();
    setState((prev) => ({
      ...prev,
      internalRecipients: [
        ...prev.internalRecipients,
        {
          id,
          label: customRecipientLabel.trim(),
          icon: "\u2795",
          custom: true,
          accessLevel: "readonly" as const,
        },
      ],
    }));
    setCustomRecipientLabel("");
  };

  const addExternalRecipient = () => {
    update({
      externalRecipients: [
        ...state.externalRecipients,
        { name: "", purpose: "", hasAVV: false },
      ],
    });
  };

  const updateExternalRecipient = (
    idx: number,
    patch: Partial<ExternalRecipient>
  ) => {
    update({
      externalRecipients: state.externalRecipients.map((r, i) =>
        i === idx ? { ...r, ...patch } : r
      ),
    });
  };

  const removeExternalRecipient = (idx: number) => {
    update({
      externalRecipients: state.externalRecipients.filter((_, i) => i !== idx),
    });
  };

  const toggleAuthority = (auth: { name: string }) => {
    setState((prev) => {
      const exists = prev.authorities.find((a) => a.name === auth.name);
      if (exists) {
        return { ...prev, authorities: prev.authorities.filter((a) => a.name !== auth.name) };
      }
      return { ...prev, authorities: [...prev.authorities, { name: auth.name }] };
    });
  };

  const addCustomAuthority = () => {
    if (!customAuthorityName.trim()) return;
    setState((prev) => ({
      ...prev,
      authorities: [
        ...prev.authorities,
        { name: customAuthorityName.trim(), custom: true },
      ],
    }));
    setCustomAuthorityName("");
  };

  const addThirdCountryTransfer = () => {
    update({
      thirdCountryTransfers: [
        ...state.thirdCountryTransfers,
        { country: "", guarantee: "" },
      ],
    });
  };

  const updateThirdCountryTransfer = (
    idx: number,
    patch: Partial<ThirdCountryTransfer>
  ) => {
    update({
      thirdCountryTransfers: state.thirdCountryTransfers.map((t, i) =>
        i === idx ? { ...t, ...patch } : t
      ),
    });
  };

  const removeThirdCountryTransfer = (idx: number) => {
    update({
      thirdCountryTransfers: state.thirdCountryTransfers.filter((_, i) => i !== idx),
    });
  };

  const toggleDeletionMethod = (method: string) => {
    setState((prev) => {
      const has = prev.deletionMethods.includes(method);
      return {
        ...prev,
        deletionMethods: has
          ? prev.deletionMethods.filter((m) => m !== method)
          : [...prev.deletionMethods, method],
      };
    });
  };

  // ─── Generate map ────────────────────────────────────────────────────────

  const generateMap = async () => {
    setGenerating(true);
    setError(null);

    try {
      // 1. Create the data map
      const mapRes = await fetch("/api/data-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.processName,
          description: state.processDescription || null,
          companyId: state.companyId || null,
        }),
      });
      if (!mapRes.ok) throw new Error("Fehler beim Erstellen der Datenlandkarte");
      const map = await mapRes.json();
      const mapId = map.id;

      // 2. Create nodes with auto-calculated positions
      // Layout: 5 columns
      // Col 0 (x=50):   Data sources
      // Col 1 (x=400):  Processing systems
      // Col 2 (x=750):  Internal recipients
      // Col 3 (x=750):  External recipients (below internal)
      // Col 4 (x=1100): Archive/deletion

      const nodeIds: Record<string, string> = {};
      const spacing = 120;

      // Sources (col 0)
      for (let i = 0; i < state.dataSources.length; i++) {
        const src = state.dataSources[i];
        const res = await fetch(`/api/data-maps/${mapId}/nodes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: src.label,
            type: "datasource",
            positionX: 50,
            positionY: 50 + i * spacing,
            metadata: JSON.stringify({ dataTypes: src.dataTypes, icon: src.icon }),
          }),
        });
        if (res.ok) {
          const node = await res.json();
          nodeIds[`source_${src.id}`] = node.id;
        }
      }

      // Process node (center, represents the main process)
      const processNodeRes = await fetch(`/api/data-maps/${mapId}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: state.processName,
          type: "process",
          positionX: 400,
          positionY: 50,
        }),
      });
      let processNodeId = "";
      if (processNodeRes.ok) {
        const pn = await processNodeRes.json();
        processNodeId = pn.id;
      }

      // Systems (col 1, below process)
      for (let i = 0; i < state.processingSystems.length; i++) {
        const sys = state.processingSystems[i];
        const label = sys.productName
          ? `${sys.label} (${sys.productName})`
          : sys.label;
        const res = await fetch(`/api/data-maps/${mapId}/nodes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label,
            type: "system",
            positionX: 400,
            positionY: 180 + i * spacing,
            metadata: JSON.stringify({ icon: sys.icon }),
          }),
        });
        if (res.ok) {
          const node = await res.json();
          nodeIds[`system_${sys.id}`] = node.id;
        }
      }

      // Internal recipients (col 2)
      for (let i = 0; i < state.internalRecipients.length; i++) {
        const rec = state.internalRecipients[i];
        const accessLabel =
          rec.accessLevel === "full"
            ? "Vollzugriff"
            : rec.accessLevel === "limited"
            ? "Eingeschr\u00E4nkt"
            : "Nur Lesen";
        const res = await fetch(`/api/data-maps/${mapId}/nodes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: `${rec.label}\n(${accessLabel})`,
            type: "person",
            positionX: 750,
            positionY: 50 + i * spacing,
            metadata: JSON.stringify({ accessLevel: rec.accessLevel, icon: rec.icon }),
          }),
        });
        if (res.ok) {
          const node = await res.json();
          nodeIds[`recipient_${rec.id}`] = node.id;
        }
      }

      // External recipients (col 3, below internal)
      const extStartY = 50 + state.internalRecipients.length * spacing + 60;

      if (state.hasExternalRecipients) {
        for (let i = 0; i < state.externalRecipients.length; i++) {
          const ext = state.externalRecipients[i];
          if (!ext.name.trim()) continue;
          const avvLabel = ext.hasAVV ? " [AVV]" : "";
          const res = await fetch(`/api/data-maps/${mapId}/nodes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              label: `${ext.name}${avvLabel}\n${ext.purpose}`,
              type: "external",
              positionX: 750,
              positionY: extStartY + i * spacing,
            }),
          });
          if (res.ok) {
            const node = await res.json();
            nodeIds[`external_${i}`] = node.id;
          }
        }
      }

      if (state.hasAuthorityTransfer) {
        const authStartIdx = state.externalRecipients.length;
        for (let i = 0; i < state.authorities.length; i++) {
          const auth = state.authorities[i];
          const res = await fetch(`/api/data-maps/${mapId}/nodes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              label: `${auth.name}\n(Beh\u00F6rde)`,
              type: "external",
              positionX: 750,
              positionY: extStartY + (authStartIdx + i) * spacing,
            }),
          });
          if (res.ok) {
            const node = await res.json();
            nodeIds[`authority_${i}`] = node.id;
          }
        }
      }

      if (state.hasThirdCountryTransfer) {
        const tcStartIdx =
          state.externalRecipients.length + state.authorities.length;
        for (let i = 0; i < state.thirdCountryTransfers.length; i++) {
          const tc = state.thirdCountryTransfers[i];
          if (!tc.country.trim()) continue;
          const res = await fetch(`/api/data-maps/${mapId}/nodes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              label: `Drittland: ${tc.country}\n(${tc.guarantee || "Keine Garantie"})`,
              type: "external",
              positionX: 750,
              positionY: extStartY + (tcStartIdx + i) * spacing,
            }),
          });
          if (res.ok) {
            const node = await res.json();
            nodeIds[`thirdcountry_${i}`] = node.id;
          }
        }
      }

      // Archive / deletion node (col 4)
      const archiveLabels: string[] = [];
      if (state.deletionMethods.includes("digital_deletion"))
        archiveLabels.push("Digitale L\u00F6schung");
      if (state.deletionMethods.includes("physical_destruction"))
        archiveLabels.push("Aktenvernichtung");
      if (state.deletionMethods.includes("transfer"))
        archiveLabels.push(`\u00DCberf\u00FChrung: ${state.archiveTransferSystem || "?"}`);
      if (state.deletionMethods.includes("archive"))
        archiveLabels.push(`Archivierung (${state.archiveDuration || "?"})`);
      if (state.deletionMethods.includes("anonymization"))
        archiveLabels.push("Anonymisierung");

      let archiveNodeId = "";
      if (archiveLabels.length > 0) {
        const res = await fetch(`/api/data-maps/${mapId}/nodes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: archiveLabels.join("\n"),
            type: "archive",
            positionX: 1100,
            positionY: 50,
          }),
        });
        if (res.ok) {
          const node = await res.json();
          archiveNodeId = node.id;
        }
      }

      // 3. Create edges
      // Sources -> Process node
      for (const src of state.dataSources) {
        const fromId = nodeIds[`source_${src.id}`];
        if (fromId && processNodeId) {
          await fetch(`/api/data-maps/${mapId}/edges`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fromNodeId: fromId,
              toNodeId: processNodeId,
              label: src.dataTypes.length > 0 ? src.dataTypes.join(", ") : null,
              dataType: "personenbezogen",
              transferType: "Eingang",
            }),
          });
        }
      }

      // Process node -> Systems
      for (const sys of state.processingSystems) {
        const toId = nodeIds[`system_${sys.id}`];
        if (processNodeId && toId) {
          await fetch(`/api/data-maps/${mapId}/edges`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fromNodeId: processNodeId,
              toNodeId: toId,
              label: "Verarbeitung",
              transferType: "Intern",
            }),
          });
        }
      }

      // Systems -> Internal recipients (first system to each recipient)
      const firstSystemId =
        state.processingSystems.length > 0
          ? nodeIds[`system_${state.processingSystems[0].id}`]
          : processNodeId;

      for (const rec of state.internalRecipients) {
        const toId = nodeIds[`recipient_${rec.id}`];
        if (firstSystemId && toId) {
          await fetch(`/api/data-maps/${mapId}/edges`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fromNodeId: firstSystemId,
              toNodeId: toId,
              label: "Zugriff",
              transferType: "Intern",
            }),
          });
        }
      }

      // Systems -> External recipients
      if (state.hasExternalRecipients) {
        for (let i = 0; i < state.externalRecipients.length; i++) {
          const toId = nodeIds[`external_${i}`];
          if (firstSystemId && toId) {
            await fetch(`/api/data-maps/${mapId}/edges`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fromNodeId: firstSystemId,
                toNodeId: toId,
                label: "Weitergabe",
                transferType: "Extern",
              }),
            });
          }
        }
      }

      if (state.hasAuthorityTransfer) {
        for (let i = 0; i < state.authorities.length; i++) {
          const toId = nodeIds[`authority_${i}`];
          if (firstSystemId && toId) {
            await fetch(`/api/data-maps/${mapId}/edges`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fromNodeId: firstSystemId,
                toNodeId: toId,
                label: "Meldepflicht",
                transferType: "Beh\u00F6rde",
              }),
            });
          }
        }
      }

      if (state.hasThirdCountryTransfer) {
        for (let i = 0; i < state.thirdCountryTransfers.length; i++) {
          const toId = nodeIds[`thirdcountry_${i}`];
          if (firstSystemId && toId) {
            await fetch(`/api/data-maps/${mapId}/edges`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fromNodeId: firstSystemId,
                toNodeId: toId,
                label: "Drittlandtransfer",
                transferType: "Drittland",
              }),
            });
          }
        }
      }

      // Recipients -> Archive
      if (archiveNodeId) {
        // Connect process node to archive
        if (processNodeId) {
          await fetch(`/api/data-maps/${mapId}/edges`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fromNodeId: processNodeId,
              toNodeId: archiveNodeId,
              label: "L\u00F6schung / Archivierung",
              transferType: "Intern",
            }),
          });
        }
      }

      // 4. Redirect to the canvas editor
      router.push(`/datenlandkarte/${mapId}`);
    } catch (err) {
      console.error("Fehler bei der Generierung:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut."
      );
      setGenerating(false);
    }
  };

  // ─── Render Helpers ──────────────────────────────────────────────────────

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                i < step
                  ? "bg-green-500 border-green-500 text-white"
                  : i === step
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-slate-300 text-slate-400"
              }`}
            >
              {i < step ? "\u2713" : i + 1}
            </div>
            <span
              className={`text-xs mt-1 text-center hidden sm:block ${
                i === step
                  ? "text-blue-600 font-semibold"
                  : i < step
                  ? "text-green-600"
                  : "text-slate-400"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );

  const InfoBox = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex gap-2">
        <span className="text-blue-500 shrink-0">i</span>
        <div className="text-sm text-blue-700">{children}</div>
      </div>
    </div>
  );

  const CardGrid = ({
    options,
    selected,
    onToggle,
  }: {
    options: { id: string; label: string; icon: string }[];
    selected: string[];
    onToggle: (opt: { id: string; label: string; icon: string }) => void;
  }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt)}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all text-center hover:shadow-md ${
              isSelected
                ? "border-blue-500 bg-blue-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <span className="text-2xl mb-2">{opt.icon}</span>
            <span
              className={`text-sm font-medium ${
                isSelected ? "text-blue-700" : "text-slate-700"
              }`}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  // ─── Step Renderers ──────────────────────────────────────────────────────

  const renderStep0 = () => (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-1">
        Grundlagen des Prozesses
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Beginnen Sie mit den grundlegenden Informationen zu dem Prozess, den Sie
        kartieren m\u00F6chten.
      </p>

      <InfoBox>
        <strong>Beispiele:</strong> Bewerbermanagement, Kundenbetreuung,
        Lohnabrechnung, Websitebetrieb, Video\u00FCberwachung
      </InfoBox>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Welchen Prozess m\u00F6chten Sie kartieren? *
          </label>
          <input
            type="text"
            value={state.processName}
            onChange={(e) => update({ processName: e.target.value })}
            placeholder="z.B. Bewerbungsprozess"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Beschreiben Sie den Prozess kurz
          </label>
          <textarea
            value={state.processDescription}
            onChange={(e) => update({ processDescription: e.target.value })}
            placeholder="Kurze Beschreibung des Prozesses und seiner Ziele..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Welches Unternehmen ist verantwortlich?
          </label>
          <select
            value={state.companyId}
            onChange={(e) => update({ companyId: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sp\u00E4ter zuweisen</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-1">
        Datenquellen &ndash; Woher kommen die Daten?
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        \u00DCber welche Kan\u00E4le gelangen personenbezogene Daten in Ihren Prozess?
      </p>

      <InfoBox>
        W\u00E4hlen Sie alle Kan\u00E4le aus, \u00FCber die personenbezogene Daten in den
        Prozess &ldquo;{state.processName}&rdquo; gelangen. Sie k\u00F6nnen auch eigene
        Quellen hinzuf\u00FCgen.
      </InfoBox>

      <CardGrid
        options={DATA_SOURCE_OPTIONS}
        selected={state.dataSources.map((s) => s.id)}
        onToggle={toggleDataSource}
      />

      {/* Custom source */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={customSourceLabel}
          onChange={(e) => setCustomSourceLabel(e.target.value)}
          placeholder="Weitere Quelle hinzuf\u00FCgen..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") addCustomSource();
          }}
        />
        <button
          type="button"
          onClick={addCustomSource}
          disabled={!customSourceLabel.trim()}
          className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Hinzuf\u00FCgen
        </button>
      </div>

      {/* Data types per selected source */}
      {state.dataSources.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">
            Welche Daten werden \u00FCber die ausgew\u00E4hlten Kan\u00E4le erfasst?
          </h3>
          {state.dataSources.map((src) => (
            <div
              key={src.id}
              className="bg-white border border-slate-200 rounded-lg p-4"
            >
              <div className="text-sm font-medium text-slate-700 mb-2">
                {src.icon} {src.label}
              </div>
              <div className="flex flex-wrap gap-2">
                {DATA_TYPE_OPTIONS.map((dt) => (
                  <label
                    key={dt}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border ${
                      src.dataTypes.includes(dt)
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={src.dataTypes.includes(dt)}
                      onChange={() => toggleDataType(src.id, dt)}
                      className="sr-only"
                    />
                    {dt}
                  </label>
                ))}
                {/* Sonstiges */}
                <div className="flex items-center gap-1">
                  <label
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border ${
                      src.dataTypes.some((d) => d.startsWith("Sonstiges:"))
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Sonstiges
                  </label>
                  <input
                    type="text"
                    value={sonstigesInput[src.id] || ""}
                    onChange={(e) =>
                      setSonstigesInput((prev) => ({
                        ...prev,
                        [src.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && sonstigesInput[src.id]?.trim()) {
                        toggleDataType(
                          src.id,
                          `Sonstiges: ${sonstigesInput[src.id].trim()}`
                        );
                        setSonstigesInput((prev) => ({ ...prev, [src.id]: "" }));
                      }
                    }}
                    placeholder="Eingabe + Enter"
                    className="px-2 py-1 border border-slate-200 rounded text-xs w-32 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-1">
        Verarbeitungssysteme &ndash; Wo werden die Daten gespeichert?
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        In welchen Systemen werden die Daten verarbeitet oder gespeichert?
      </p>

      <InfoBox>
        W\u00E4hlen Sie alle Systeme, in denen die Daten Ihres Prozesses verarbeitet
        oder gespeichert werden. Sie k\u00F6nnen optional den Produktnamen angeben.
      </InfoBox>

      <CardGrid
        options={SYSTEM_OPTIONS}
        selected={state.processingSystems.map((s) => s.id)}
        onToggle={toggleSystem}
      />

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={customSystemLabel}
          onChange={(e) => setCustomSystemLabel(e.target.value)}
          placeholder="Weiteres System hinzuf\u00FCgen..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") addCustomSystem();
          }}
        />
        <button
          type="button"
          onClick={addCustomSystem}
          disabled={!customSystemLabel.trim()}
          className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Hinzuf\u00FCgen
        </button>
      </div>

      {state.processingSystems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Produktnamen (optional)
          </h3>
          {state.processingSystems.map((sys) => (
            <div
              key={sys.id}
              className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3"
            >
              <span className="text-lg">{sys.icon}</span>
              <span className="text-sm font-medium text-slate-700 w-40 shrink-0">
                {sys.label}
              </span>
              <input
                type="text"
                value={sys.productName}
                onChange={(e) => setSystemProductName(sys.id, e.target.value)}
                placeholder="z.B. SAP, Personio, Outlook..."
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-1">
        Interne Empf\u00E4nger &ndash; Wer hat Zugriff?
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Welche Abteilungen oder Personen haben Zugriff auf die Daten?
      </p>

      <InfoBox>
        W\u00E4hlen Sie alle internen Stellen aus, die auf die Daten zugreifen k\u00F6nnen.
        Geben Sie f\u00FCr jede Stelle die Zugriffsrechte an.
      </InfoBox>

      <CardGrid
        options={RECIPIENT_OPTIONS}
        selected={state.internalRecipients.map((r) => r.id)}
        onToggle={toggleRecipient}
      />

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={customRecipientLabel}
          onChange={(e) => setCustomRecipientLabel(e.target.value)}
          placeholder="Weitere Abteilung / Person hinzuf\u00FCgen..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") addCustomRecipient();
          }}
        />
        <button
          type="button"
          onClick={addCustomRecipient}
          disabled={!customRecipientLabel.trim()}
          className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Hinzuf\u00FCgen
        </button>
      </div>

      {state.internalRecipients.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Zugriffsrechte festlegen
          </h3>
          {state.internalRecipients.map((rec) => (
            <div
              key={rec.id}
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg p-3"
            >
              <span className="text-lg">{rec.icon}</span>
              <span className="text-sm font-medium text-slate-700 w-40 shrink-0">
                {rec.label}
              </span>
              <div className="flex gap-2">
                {(
                  [
                    { value: "full", label: "Vollzugriff" },
                    { value: "limited", label: "Eingeschr\u00E4nkt" },
                    { value: "readonly", label: "Nur Lesen" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRecipientAccess(rec.id, opt.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      rec.accessLevel === opt.value
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-1">
        Externe Empf\u00E4nger &amp; Auftragsverarbeiter
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Werden Daten an externe Stellen weitergegeben?
      </p>

      <InfoBox>
        Geben Sie an, ob und an wen personenbezogene Daten au\u00DFerhalb Ihres
        Unternehmens weitergegeben werden. Ber\u00FCcksichtigen Sie Dienstleister,
        Beh\u00F6rden und Drittl\u00E4nder.
      </InfoBox>

      {/* External service providers */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-700">
            Werden Daten an externe Dienstleister weitergegeben?
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                update({ hasExternalRecipients: true });
                if (state.externalRecipients.length === 0) addExternalRecipient();
              }}
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                state.hasExternalRecipients
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              Ja
            </button>
            <button
              type="button"
              onClick={() =>
                update({ hasExternalRecipients: false, externalRecipients: [] })
              }
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                !state.hasExternalRecipients
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              Nein
            </button>
          </div>
        </div>
        {state.hasExternalRecipients && (
          <div className="space-y-3">
            {state.externalRecipients.map((ext, idx) => (
              <div
                key={idx}
                className="border border-slate-100 rounded-lg p-3 bg-slate-50"
              >
                <div className="flex gap-3 mb-2">
                  <input
                    type="text"
                    value={ext.name}
                    onChange={(e) =>
                      updateExternalRecipient(idx, { name: e.target.value })
                    }
                    placeholder="Name des Dienstleisters"
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeExternalRecipient(idx)}
                    className="text-slate-400 hover:text-red-500 px-2"
                    title="Entfernen"
                  >
                    x
                  </button>
                </div>
                <input
                  type="text"
                  value={ext.purpose}
                  onChange={(e) =>
                    updateExternalRecipient(idx, { purpose: e.target.value })
                  }
                  placeholder="Zweck der Weitergabe"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 mb-2"
                />
                <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ext.hasAVV}
                    onChange={(e) =>
                      updateExternalRecipient(idx, { hasAVV: e.target.checked })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Auftragsverarbeitungsvertrag (AVV) liegt vor
                </label>
              </div>
            ))}
            <button
              type="button"
              onClick={addExternalRecipient}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + Weiteren Dienstleister hinzuf\u00FCgen
            </button>
          </div>
        )}
      </div>

      {/* Authorities */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-700">
            Werden Daten an Beh\u00F6rden oder \u00F6ffentliche Stellen \u00FCbermittelt?
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => update({ hasAuthorityTransfer: true })}
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                state.hasAuthorityTransfer
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              Ja
            </button>
            <button
              type="button"
              onClick={() =>
                update({ hasAuthorityTransfer: false, authorities: [] })
              }
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                !state.hasAuthorityTransfer
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              Nein
            </button>
          </div>
        </div>
        {state.hasAuthorityTransfer && (
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {AUTHORITY_OPTIONS.map((auth) => {
                const isSelected = state.authorities.some(
                  (a) => a.name === auth.name
                );
                return (
                  <button
                    key={auth.name}
                    type="button"
                    onClick={() => toggleAuthority(auth)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      isSelected
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {auth.name}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customAuthorityName}
                onChange={(e) => setCustomAuthorityName(e.target.value)}
                placeholder="Sonstige Beh\u00F6rde..."
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCustomAuthority();
                }}
              />
              <button
                type="button"
                onClick={addCustomAuthority}
                disabled={!customAuthorityName.trim()}
                className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Third country */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-700">
            Werden Daten in Drittl\u00E4nder (au\u00DFerhalb EU/EWR) \u00FCbermittelt?
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                update({ hasThirdCountryTransfer: true });
                if (state.thirdCountryTransfers.length === 0)
                  addThirdCountryTransfer();
              }}
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                state.hasThirdCountryTransfer
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              Ja
            </button>
            <button
              type="button"
              onClick={() =>
                update({
                  hasThirdCountryTransfer: false,
                  thirdCountryTransfers: [],
                })
              }
              className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                !state.hasThirdCountryTransfer
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              Nein
            </button>
          </div>
        </div>
        {state.hasThirdCountryTransfer && (
          <div className="space-y-3">
            {state.thirdCountryTransfers.map((tc, idx) => (
              <div
                key={idx}
                className="border border-slate-100 rounded-lg p-3 bg-slate-50"
              >
                <div className="flex gap-3 mb-2">
                  <input
                    type="text"
                    value={tc.country}
                    onChange={(e) =>
                      updateThirdCountryTransfer(idx, {
                        country: e.target.value,
                      })
                    }
                    placeholder="Land (z.B. USA, Indien)"
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeThirdCountryTransfer(idx)}
                    className="text-slate-400 hover:text-red-500 px-2"
                  >
                    x
                  </button>
                </div>
                <select
                  value={tc.guarantee}
                  onChange={(e) =>
                    updateThirdCountryTransfer(idx, {
                      guarantee: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  <option value="">Garantie ausw\u00E4hlen...</option>
                  {GUARANTEE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button
              type="button"
              onClick={addThirdCountryTransfer}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + Weiteres Drittland hinzuf\u00FCgen
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-1">
        L\u00F6schung &amp; Archivierung
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Was passiert mit den Daten am Ende des Prozesses?
      </p>

      <InfoBox>
        Legen Sie fest, wie die Daten nach Abschluss des Prozesses behandelt
        werden. Mehrfachauswahl ist m\u00F6glich.
      </InfoBox>

      <div className="space-y-3 mb-6">
        {[
          { id: "digital_deletion", label: "Digitale L\u00F6schung nach Fristablauf" },
          { id: "physical_destruction", label: "Aktenvernichtung (physisch)" },
          { id: "transfer", label: "\u00DCberf\u00FChrung in anderes System" },
          { id: "archive", label: "Archivierung" },
          { id: "anonymization", label: "Anonymisierung" },
        ].map((method) => (
          <div key={method.id}>
            <label className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-4 cursor-pointer hover:border-blue-200 transition-colors">
              <input
                type="checkbox"
                checked={state.deletionMethods.includes(method.id)}
                onChange={() => toggleDeletionMethod(method.id)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-sm font-medium text-slate-700">
                {method.label}
              </span>
            </label>

            {/* Sub-fields */}
            {method.id === "transfer" &&
              state.deletionMethods.includes("transfer") && (
                <div className="ml-10 mt-2">
                  <input
                    type="text"
                    value={state.archiveTransferSystem}
                    onChange={(e) =>
                      update({ archiveTransferSystem: e.target.value })
                    }
                    placeholder="In welches System? (z.B. Langzeitarchiv)"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              )}

            {method.id === "archive" &&
              state.deletionMethods.includes("archive") && (
                <div className="ml-10 mt-2">
                  <span className="text-xs text-slate-500 mb-1 block">
                    Wie lange?
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {ARCHIVE_DURATION_OPTIONS.map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => update({ archiveDuration: dur })}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          state.archiveDuration === dur
                            ? "bg-blue-100 border-blue-300 text-blue-700"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <span className="text-sm font-medium text-slate-700 block mb-3">
          Gibt es ein dokumentiertes L\u00F6schkonzept?
        </span>
        <div className="flex gap-3">
          {[
            { value: true, label: "Ja" },
            { value: false, label: "Nein" },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => update({ hasDeletionConcept: opt.value })}
              className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                state.hasDeletionConcept === opt.value
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => {
    const extCount =
      state.externalRecipients.length +
      state.authorities.length +
      state.thirdCountryTransfers.length;

    return (
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">
          Zusammenfassung &amp; Generierung
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          \u00DCberpr\u00FCfen Sie Ihre Angaben und generieren Sie die Datenlandkarte.
        </p>

        {/* Visual flow summary */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
            <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-semibold border border-purple-200">
              {state.dataSources.length} Datenquelle
              {state.dataSources.length !== 1 ? "n" : ""}
            </div>
            <span className="text-slate-400 text-lg">&rarr;</span>
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold border border-green-200">
              {state.processingSystems.length} System
              {state.processingSystems.length !== 1 ? "e" : ""}
            </div>
            <span className="text-slate-400 text-lg">&rarr;</span>
            <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-semibold border border-orange-200">
              {state.internalRecipients.length} interne Empf\u00E4nger
            </div>
            {extCount > 0 && (
              <>
                <span className="text-slate-400 text-lg">&rarr;</span>
                <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold border border-red-200">
                  {extCount} externe Empf\u00E4nger
                </div>
              </>
            )}
            <span className="text-slate-400 text-lg">&rarr;</span>
            <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold border border-gray-300">
              L\u00F6schung / Archiv
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          {/* Basics */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Grundlagen
            </h3>
            <div className="text-sm text-slate-600 space-y-1">
              <p>
                <strong>Prozess:</strong> {state.processName}
              </p>
              {state.processDescription && (
                <p>
                  <strong>Beschreibung:</strong> {state.processDescription}
                </p>
              )}
              <p>
                <strong>Unternehmen:</strong>{" "}
                {state.companyId
                  ? companies.find((c) => c.id === state.companyId)?.name ||
                    "Unbekannt"
                  : "Sp\u00E4ter zuweisen"}
              </p>
            </div>
          </div>

          {/* Sources */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Datenquellen
            </h3>
            <div className="flex flex-wrap gap-2">
              {state.dataSources.map((src) => (
                <span
                  key={src.id}
                  className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs border border-purple-200"
                >
                  {src.icon} {src.label}
                  {src.dataTypes.length > 0 && (
                    <span className="text-purple-400 ml-1">
                      ({src.dataTypes.length} Datenarten)
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Systems */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Systeme
            </h3>
            <div className="flex flex-wrap gap-2">
              {state.processingSystems.map((sys) => (
                <span
                  key={sys.id}
                  className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs border border-green-200"
                >
                  {sys.icon} {sys.label}
                  {sys.productName && (
                    <span className="text-green-500">({sys.productName})</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Interne Empf\u00E4nger
            </h3>
            <div className="flex flex-wrap gap-2">
              {state.internalRecipients.map((rec) => (
                <span
                  key={rec.id}
                  className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full text-xs border border-orange-200"
                >
                  {rec.icon} {rec.label}
                  <span className="text-orange-400">
                    (
                    {rec.accessLevel === "full"
                      ? "Vollzugriff"
                      : rec.accessLevel === "limited"
                      ? "Eingeschr\u00E4nkt"
                      : "Nur Lesen"}
                    )
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* External */}
          {extCount > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Externe Empf\u00E4nger
              </h3>
              <div className="text-sm text-slate-600 space-y-1">
                {state.externalRecipients.map((ext, i) => (
                  <p key={i}>
                    {ext.name} &ndash; {ext.purpose}
                    {ext.hasAVV && (
                      <span className="ml-1 text-green-600 text-xs font-medium">
                        [AVV]
                      </span>
                    )}
                  </p>
                ))}
                {state.authorities.map((auth, i) => (
                  <p key={`auth_${i}`}>
                    {auth.name}{" "}
                    <span className="text-slate-400">(Beh\u00F6rde)</span>
                  </p>
                ))}
                {state.thirdCountryTransfers.map((tc, i) => (
                  <p key={`tc_${i}`}>
                    Drittland: {tc.country} &ndash;{" "}
                    {tc.guarantee || "Keine Garantie"}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Deletion */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              L\u00F6schung &amp; Archivierung
            </h3>
            <div className="text-sm text-slate-600 space-y-1">
              {state.deletionMethods.length === 0 ? (
                <p className="text-slate-400">Keine Angabe</p>
              ) : (
                <>
                  {state.deletionMethods.includes("digital_deletion") && (
                    <p>Digitale L\u00F6schung nach Fristablauf</p>
                  )}
                  {state.deletionMethods.includes("physical_destruction") && (
                    <p>Aktenvernichtung (physisch)</p>
                  )}
                  {state.deletionMethods.includes("transfer") && (
                    <p>
                      {"\u00DCberf\u00FChrung in: "}{state.archiveTransferSystem || "?"}
                    </p>
                  )}
                  {state.deletionMethods.includes("archive") && (
                    <p>
                      Archivierung: {state.archiveDuration || "Keine Dauer angegeben"}
                    </p>
                  )}
                  {state.deletionMethods.includes("anonymization") && (
                    <p>Anonymisierung</p>
                  )}
                </>
              )}
              <p>
                <strong>L\u00F6schkonzept:</strong>{" "}
                {state.hasDeletionConcept === true
                  ? "Ja"
                  : state.hasDeletionConcept === false
                  ? "Nein"
                  : "Keine Angabe"}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={generateMap}
            disabled={generating}
            className="px-8 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generiere Datenlandkarte...
              </span>
            ) : (
              "Datenlandkarte generieren"
            )}
          </button>
        </div>
      </div>
    );
  };

  // ─── Step renderer map ───────────────────────────────────────────────────

  const stepRenderers = [
    renderStep0,
    renderStep1,
    renderStep2,
    renderStep3,
    renderStep4,
    renderStep5,
    renderStep6,
  ];

  // ─── Main render ─────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push("/datenlandkarte")}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4"
        >
          &larr; Zur\u00FCck zur \u00DCbersicht
        </button>
        <h1 className="text-2xl font-bold text-slate-800">
          Datenlandkarte-Assistent
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Schritt f\u00FCr Schritt zur fertigen Datenlandkarte
        </p>
      </div>

      {renderProgressBar()}

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8 mb-6">
        {stepRenderers[step]()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          &larr; Zur\u00FCck
        </button>

        <span className="text-sm text-slate-400">
          Schritt {step + 1} von {STEPS.length}
        </span>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={!canAdvance()}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Weiter &rarr;
          </button>
        ) : (
          <div /> // empty div for flex spacing - generate button is above
        )}
      </div>
    </div>
  );
}
