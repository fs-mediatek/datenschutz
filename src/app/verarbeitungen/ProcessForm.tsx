"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/FormField";

interface Company {
  id: string;
  name: string;
}

interface LegalBasis {
  id: string;
  article: string;
  description: string;
}

interface AffectedGroup {
  id: string;
  name: string;
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

interface RecipientEntry {
  name: string;
  companyId: string;
  category: string;
  purpose: string;
}

interface ProcessorEntry {
  name: string;
  companyId: string;
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

interface ProcessFormData {
  name: string;
  description: string;
  purpose: string;
  status: string;
  responsibleId: string;
  processorId: string;
  deletionConcept: string;
  thirdCountry: string;
  thirdCountryGuarantee: string;
  riskAssessment: string;
  dsfaRequired: boolean;
  legalBases: string[];
  affectedGroups: string[];
  dataCategories: DataCategorySelection[];
  technicalMeasures: TechnicalMeasureSelection[];
  recipients: RecipientEntry[];
  processors: ProcessorEntry[];
}

const defaultForm: ProcessFormData = {
  name: "",
  description: "",
  purpose: "",
  status: "draft",
  responsibleId: "",
  processorId: "",
  deletionConcept: "",
  thirdCountry: "",
  thirdCountryGuarantee: "",
  riskAssessment: "",
  dsfaRequired: false,
  legalBases: [],
  affectedGroups: [],
  dataCategories: [],
  technicalMeasures: [],
  recipients: [],
  processors: [],
};

interface ProcessFormProps {
  processId?: string;
}

export default function ProcessForm({ processId }: ProcessFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProcessFormData>(defaultForm);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allLegalBases, setAllLegalBases] = useState<LegalBasis[]>([]);
  const [allAffectedGroups, setAllAffectedGroups] = useState<AffectedGroup[]>([]);
  const [allDataCategories, setAllDataCategories] = useState<DataCategory[]>([]);
  const [allMeasures, setAllMeasures] = useState<TechnicalMeasure[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = "border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm";

  const loadMasterData = useCallback(async () => {
    try {
      const [companiesRes, lbRes, agRes, dcRes, tmRes] = await Promise.all([
        fetch("/api/companies"),
        fetch("/api/legal-bases"),
        fetch("/api/affected-groups"),
        fetch("/api/data-categories"),
        fetch("/api/technical-measures"),
      ]);
      const [companiesData, lbData, agData, dcData, tmData] = await Promise.all([
        companiesRes.json(),
        lbRes.json(),
        agRes.json(),
        dcRes.json(),
        tmRes.json(),
      ]);
      if (Array.isArray(companiesData)) setCompanies(companiesData);
      if (Array.isArray(lbData)) setAllLegalBases(lbData);
      if (Array.isArray(agData)) setAllAffectedGroups(agData);
      if (Array.isArray(dcData)) setAllDataCategories(dcData);
      if (Array.isArray(tmData)) setAllMeasures(tmData);
    } catch (err) {
      console.error("Fehler beim Laden der Stammdaten:", err);
    }
  }, []);

  const loadProcess = useCallback(async () => {
    if (!processId) return;
    try {
      const res = await fetch(`/api/processes/${processId}`);
      if (!res.ok) throw new Error("Verarbeitung nicht gefunden");
      const data = await res.json();
      setForm({
        name: data.name ?? "",
        description: data.description ?? "",
        purpose: data.purpose ?? "",
        status: data.status ?? "draft",
        responsibleId: data.responsibleId ?? "",
        processorId: data.processorId ?? "",
        deletionConcept: data.deletionConcept ?? "",
        thirdCountry: data.thirdCountry ?? "",
        thirdCountryGuarantee: data.thirdCountryGuarantee ?? "",
        riskAssessment: data.riskAssessment ?? "",
        dsfaRequired: data.dsfaRequired ?? false,
        legalBases: data.legalBases?.map((lb: { legalBasisId: string }) => lb.legalBasisId) ?? [],
        affectedGroups: data.affectedGroups?.map((ag: { affectedGroupId: string }) => ag.affectedGroupId) ?? [],
        dataCategories: data.dataCategories?.map((dc: { dataCategoryId: string; deletionPeriod?: string }) => ({
          dataCategoryId: dc.dataCategoryId,
          deletionPeriod: dc.deletionPeriod ?? "",
        })) ?? [],
        technicalMeasures: data.technicalMeasures?.map((tm: { technicalMeasureId: string; status: string }) => ({
          technicalMeasureId: tm.technicalMeasureId,
          status: tm.status,
        })) ?? [],
        recipients: data.recipients?.map((r: RecipientEntry) => ({
          name: r.name ?? "",
          companyId: r.companyId ?? "",
          category: r.category ?? "",
          purpose: r.purpose ?? "",
        })) ?? [],
        processors: data.processors?.map((p: ProcessorEntry) => ({
          name: p.name ?? "",
          companyId: p.companyId ?? "",
          avvDate: p.avvDate ?? "",
          description: p.description ?? "",
        })) ?? [],
      });
    } catch (err) {
      setError("Verarbeitung konnte nicht geladen werden.");
      console.error(err);
    }
  }, [processId]);

  useEffect(() => {
    async function init() {
      await loadMasterData();
      if (processId) await loadProcess();
      setLoading(false);
    }
    init();
  }, [loadMasterData, loadProcess, processId]);

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Bitte geben Sie einen Namen ein.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        responsibleId: form.responsibleId || null,
        processorId: form.processorId || null,
        legalBases: form.legalBases.map((id) => ({ legalBasisId: id })),
        affectedGroups: form.affectedGroups.map((id) => ({ affectedGroupId: id })),
        dataCategories: form.dataCategories.map((dc) => ({
          dataCategoryId: dc.dataCategoryId,
          deletionPeriod: dc.deletionPeriod || null,
        })),
        technicalMeasures: form.technicalMeasures.map((tm) => ({
          technicalMeasureId: tm.technicalMeasureId,
          status: tm.status,
        })),
      };

      const url = processId ? `/api/processes/${processId}` : "/api/processes";
      const method = processId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Fehler beim Speichern");
      router.push("/verarbeitungen");
    } catch (err) {
      setError("Fehler beim Speichern der Verarbeitung.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function toggleLegalBasis(id: string) {
    setForm((prev) => ({
      ...prev,
      legalBases: prev.legalBases.includes(id)
        ? prev.legalBases.filter((x) => x !== id)
        : [...prev.legalBases, id],
    }));
  }

  function toggleAffectedGroup(id: string) {
    setForm((prev) => ({
      ...prev,
      affectedGroups: prev.affectedGroups.includes(id)
        ? prev.affectedGroups.filter((x) => x !== id)
        : [...prev.affectedGroups, id],
    }));
  }

  function toggleDataCategory(id: string) {
    setForm((prev) => {
      const exists = prev.dataCategories.find((dc) => dc.dataCategoryId === id);
      if (exists) {
        return { ...prev, dataCategories: prev.dataCategories.filter((dc) => dc.dataCategoryId !== id) };
      }
      return { ...prev, dataCategories: [...prev.dataCategories, { dataCategoryId: id, deletionPeriod: "" }] };
    });
  }

  function updateDataCategoryPeriod(id: string, period: string) {
    setForm((prev) => ({
      ...prev,
      dataCategories: prev.dataCategories.map((dc) =>
        dc.dataCategoryId === id ? { ...dc, deletionPeriod: period } : dc
      ),
    }));
  }

  function toggleMeasure(id: string) {
    setForm((prev) => {
      const exists = prev.technicalMeasures.find((tm) => tm.technicalMeasureId === id);
      if (exists) {
        return { ...prev, technicalMeasures: prev.technicalMeasures.filter((tm) => tm.technicalMeasureId !== id) };
      }
      return { ...prev, technicalMeasures: [...prev.technicalMeasures, { technicalMeasureId: id, status: "vorhanden" }] };
    });
  }

  function updateMeasureStatus(id: string, status: string) {
    setForm((prev) => ({
      ...prev,
      technicalMeasures: prev.technicalMeasures.map((tm) =>
        tm.technicalMeasureId === id ? { ...tm, status } : tm
      ),
    }));
  }

  function addRecipient() {
    setForm((prev) => ({
      ...prev,
      recipients: [...prev.recipients, { name: "", companyId: "", category: "", purpose: "" }],
    }));
  }

  function updateRecipient(index: number, field: keyof RecipientEntry, value: string) {
    setForm((prev) => ({
      ...prev,
      recipients: prev.recipients.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    }));
  }

  function removeRecipient(index: number) {
    setForm((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index),
    }));
  }

  function addProcessor() {
    setForm((prev) => ({
      ...prev,
      processors: [...prev.processors, { name: "", companyId: "", avvDate: "", description: "" }],
    }));
  }

  function updateProcessor(index: number, field: keyof ProcessorEntry, value: string) {
    setForm((prev) => ({
      ...prev,
      processors: prev.processors.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  }

  function removeProcessor(index: number) {
    setForm((prev) => ({
      ...prev,
      processors: prev.processors.filter((_, i) => i !== index),
    }));
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Laden...</div></div>;
  }

  const sectionClass = "bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6";
  const sectionTitle = "text-lg font-semibold text-gray-900 mb-4";

  return (
    <div className="max-w-4xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Grunddaten */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Grunddaten</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <div className="md:col-span-2">
            <FormField label="Bezeichnung der Verarbeitung" required>
              <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <FormField label="Beschreibung">
              <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <FormField label="Zweck der Verarbeitung">
              <textarea className={inputClass} rows={2} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Entwurf</option>
              <option value="active">Aktiv</option>
              <option value="archived">Archiviert</option>
            </select>
          </FormField>
          <FormField label="Verantwortlicher (Unternehmen)">
            <select className={inputClass} value={form.responsibleId} onChange={(e) => setForm({ ...form, responsibleId: e.target.value })}>
              <option value="">-- Waehlen --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Auftragsverarbeiter (Unternehmen)">
            <select className={inputClass} value={form.processorId} onChange={(e) => setForm({ ...form, processorId: e.target.value })}>
              <option value="">-- Waehlen --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {/* Rechtsgrundlagen */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Rechtsgrundlagen</h2>
        {allLegalBases.length === 0 ? (
          <p className="text-sm text-gray-500">Keine Rechtsgrundlagen vorhanden. Bitte zuerst unter Stammdaten anlegen.</p>
        ) : (
          <div className="space-y-2">
            {allLegalBases.map((lb) => (
              <label key={lb.id} className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={form.legalBases.includes(lb.id)}
                  onChange={() => toggleLegalBasis(lb.id)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">{lb.article}</span>
                  <span className="text-sm text-gray-500 ml-2">{lb.description}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Betroffene Personen */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Betroffene Personengruppen</h2>
        {allAffectedGroups.length === 0 ? (
          <p className="text-sm text-gray-500">Keine Betroffenengruppen vorhanden. Bitte zuerst unter Stammdaten anlegen.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allAffectedGroups.map((ag) => {
              const selected = form.affectedGroups.includes(ag.id);
              return (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => toggleAffectedGroup(ag.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    selected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {ag.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Datenkategorien */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Datenkategorien</h2>
        {allDataCategories.length === 0 ? (
          <p className="text-sm text-gray-500">Keine Datenkategorien vorhanden. Bitte zuerst unter Stammdaten anlegen.</p>
        ) : (
          <div className="space-y-3">
            {allDataCategories.map((dc) => {
              const sel = form.dataCategories.find((s) => s.dataCategoryId === dc.id);
              return (
                <div key={dc.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={!!sel}
                    onChange={() => toggleDataCategory(dc.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 min-w-[150px]">
                    {dc.name}
                    {dc.isSensitive && (
                      <span className="ml-2 bg-red-100 text-red-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">Art. 9</span>
                    )}
                  </span>
                  {sel && (
                    <input
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Loeschfrist"
                      value={sel.deletionPeriod}
                      onChange={(e) => updateDataCategoryPeriod(dc.id, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Empfaenger */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Empfaenger</h2>
        {form.recipients.map((r, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
            <input
              className={inputClass}
              placeholder="Name"
              value={r.name}
              onChange={(e) => updateRecipient(idx, "name", e.target.value)}
            />
            <select
              className={inputClass}
              value={r.companyId}
              onChange={(e) => updateRecipient(idx, "companyId", e.target.value)}
            >
              <option value="">-- Unternehmen --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className={inputClass}
              value={r.category}
              onChange={(e) => updateRecipient(idx, "category", e.target.value)}
            >
              <option value="">-- Kategorie --</option>
              <option value="intern">Intern</option>
              <option value="extern">Extern</option>
              <option value="auftragsverarbeiter">Auftragsverarbeiter</option>
            </select>
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="Zweck"
                value={r.purpose}
                onChange={(e) => updateRecipient(idx, "purpose", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeRecipient(idx)}
                className="text-red-500 hover:text-red-700 px-2 text-lg"
                title="Entfernen"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addRecipient}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          + Empfaenger hinzufuegen
        </button>
      </div>

      {/* Auftragsverarbeiter */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Auftragsverarbeiter</h2>
        {form.processors.map((p, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
            <input
              className={inputClass}
              placeholder="Name"
              value={p.name}
              onChange={(e) => updateProcessor(idx, "name", e.target.value)}
            />
            <select
              className={inputClass}
              value={p.companyId}
              onChange={(e) => updateProcessor(idx, "companyId", e.target.value)}
            >
              <option value="">-- Unternehmen --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              className={inputClass}
              placeholder="AVV-Datum"
              type="date"
              value={p.avvDate}
              onChange={(e) => updateProcessor(idx, "avvDate", e.target.value)}
            />
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="Beschreibung"
                value={p.description}
                onChange={(e) => updateProcessor(idx, "description", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeProcessor(idx)}
                className="text-red-500 hover:text-red-700 px-2 text-lg"
                title="Entfernen"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addProcessor}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          + Auftragsverarbeiter hinzufuegen
        </button>
      </div>

      {/* Drittlanduebermittlung */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Drittlanduebermittlung</h2>
        <FormField label="Drittland" hint="Falls Daten in ein Land ausserhalb des EWR uebermittelt werden">
          <input className={inputClass} value={form.thirdCountry} onChange={(e) => setForm({ ...form, thirdCountry: e.target.value })} placeholder="z.B. USA, Schweiz" />
        </FormField>
        <FormField label="Garantien" hint="Angemessenheitsbeschluss, Standardvertragsklauseln, etc.">
          <textarea className={inputClass} rows={3} value={form.thirdCountryGuarantee} onChange={(e) => setForm({ ...form, thirdCountryGuarantee: e.target.value })} />
        </FormField>
      </div>

      {/* Loeschkonzept */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Loeschkonzept</h2>
        <FormField label="Loeschfristen und -konzept">
          <textarea className={inputClass} rows={4} value={form.deletionConcept} onChange={(e) => setForm({ ...form, deletionConcept: e.target.value })} placeholder="Beschreiben Sie die Loeschfristen und das Loeschkonzept..." />
        </FormField>
      </div>

      {/* TOMs */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Technisch-Organisatorische Massnahmen (TOMs)</h2>
        {allMeasures.length === 0 ? (
          <p className="text-sm text-gray-500">Keine TOMs vorhanden. Bitte zuerst unter Stammdaten anlegen.</p>
        ) : (
          <div className="space-y-2">
            {allMeasures.map((m) => {
              const sel = form.technicalMeasures.find((tm) => tm.technicalMeasureId === m.id);
              return (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={!!sel}
                    onChange={() => toggleMeasure(m.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 min-w-[200px]">
                    {m.name}
                    {m.category && (
                      <span className="ml-2 text-xs text-gray-400">({m.category})</span>
                    )}
                  </span>
                  {sel && (
                    <select
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={sel.status}
                      onChange={(e) => updateMeasureStatus(m.id, e.target.value)}
                    >
                      <option value="vorhanden">Vorhanden</option>
                      <option value="geplant">Geplant</option>
                      <option value="ausstehend">Ausstehend</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Risikobewertung */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Risikobewertung</h2>
        <FormField label="Risikobewertung">
          <textarea className={inputClass} rows={4} value={form.riskAssessment} onChange={(e) => setForm({ ...form, riskAssessment: e.target.value })} placeholder="Bewertung der Risiken fuer die Rechte und Freiheiten der betroffenen Personen..." />
        </FormField>
        <FormField label="Datenschutz-Folgenabschaetzung (DSFA)">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.dsfaRequired}
              onChange={(e) => setForm({ ...form, dsfaRequired: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">DSFA erforderlich (Art. 35 DSGVO)</span>
          </label>
        </FormField>
      </div>

      {/* Aktionen */}
      <div className="flex justify-between items-center mb-12">
        <button
          type="button"
          onClick={() => router.push("/verarbeitungen")}
          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          Zurueck zur Uebersicht
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? "Speichern..." : processId ? "Aenderungen speichern" : "Verarbeitung erstellen"}
        </button>
      </div>
    </div>
  );
}
