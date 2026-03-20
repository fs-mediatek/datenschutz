"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import FormField from "@/components/FormField";

interface LegalBasis {
  id: string;
  article: string;
  description: string;
}

const emptyForm = { article: "", description: "" };

const presetBases = [
  { article: "Art. 6 Abs. 1 lit. a DSGVO", description: "Einwilligung der betroffenen Person" },
  { article: "Art. 6 Abs. 1 lit. b DSGVO", description: "Erfuellung eines Vertrags oder vorvertragliche Massnahmen" },
  { article: "Art. 6 Abs. 1 lit. c DSGVO", description: "Erfuellung einer rechtlichen Verpflichtung" },
  { article: "Art. 6 Abs. 1 lit. d DSGVO", description: "Schutz lebenswichtiger Interessen" },
  { article: "Art. 6 Abs. 1 lit. e DSGVO", description: "Wahrnehmung einer Aufgabe im oeffentlichen Interesse" },
  { article: "Art. 6 Abs. 1 lit. f DSGVO", description: "Wahrung berechtigter Interessen" },
  { article: "Art. 9 Abs. 2 lit. a DSGVO", description: "Ausdrueckliche Einwilligung (besondere Kategorien)" },
  { article: "Art. 9 Abs. 2 lit. b DSGVO", description: "Arbeitsrecht, Sozialschutz" },
  { article: "Art. 9 Abs. 2 lit. c DSGVO", description: "Schutz lebenswichtiger Interessen (besondere Kategorien)" },
  { article: "Art. 9 Abs. 2 lit. d DSGVO", description: "Stiftung, Vereinigung, gemeinnuetzige Organisation" },
  { article: "Art. 9 Abs. 2 lit. e DSGVO", description: "Offensichtlich oeffentlich gemachte Daten" },
  { article: "Art. 9 Abs. 2 lit. f DSGVO", description: "Geltendmachung von Rechtsanspruechen" },
  { article: "Art. 9 Abs. 2 lit. g DSGVO", description: "Erhebliches oeffentliches Interesse" },
  { article: "Art. 9 Abs. 2 lit. h DSGVO", description: "Gesundheitsvorsorge, Arbeitsmedizin" },
  { article: "Art. 9 Abs. 2 lit. i DSGVO", description: "Oeffentliche Gesundheit" },
  { article: "Art. 9 Abs. 2 lit. j DSGVO", description: "Archivzwecke, Forschung, Statistik" },
];

export default function RechtsgrundlagenPage() {
  const [bases, setBases] = useState<LegalBasis[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const inputClass = "border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm";

  async function loadData() {
    try {
      const res = await fetch("/api/legal-bases");
      const data = await res.json();
      if (Array.isArray(data)) setBases(data);
    } catch (err) {
      console.error("Fehler beim Laden:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row: Record<string, unknown>) {
    const b = row as unknown as LegalBasis;
    setEditingId(b.id);
    setForm({ article: b.article, description: b.description });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.article.trim()) return;
    setSaving(true);
    try {
      const url = editingId ? `/api/legal-bases/${editingId}` : "/api/legal-bases";
      const method = editingId ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/legal-bases/${id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      console.error("Fehler beim Loeschen:", err);
    }
  }

  async function handlePreseed() {
    setSeeding(true);
    try {
      const existingArticles = new Set(bases.map((b) => b.article));
      const toCreate = presetBases.filter((p) => !existingArticles.has(p.article));
      for (const item of toCreate) {
        await fetch("/api/legal-bases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }
      await loadData();
    } catch (err) {
      console.error("Fehler beim Erstellen:", err);
    } finally {
      setSeeding(false);
    }
  }

  const columns = [
    { key: "article", label: "Artikel" },
    { key: "description", label: "Beschreibung" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Laden...</div></div>;
  }

  return (
    <div>
      <PageHeader
        title="Rechtsgrundlagen"
        description="Rechtsgrundlagen fuer die Datenverarbeitung nach DSGVO"
        action={
          <div className="flex gap-2">
            <button
              onClick={handlePreseed}
              disabled={seeding}
              className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {seeding ? "Erstelle..." : "DSGVO-Vorlagen laden"}
            </button>
            <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              + Rechtsgrundlage hinzufuegen
            </button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={bases as unknown as Record<string, unknown>[]}
        onEdit={openEdit}
        onDelete={(row) => setDeleteConfirm(row.id as string)}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Rechtsgrundlage bearbeiten" : "Neue Rechtsgrundlage"}>
        <FormField label="Artikel" required hint="z.B. Art. 6 Abs. 1 lit. a DSGVO">
          <input className={inputClass} value={form.article} onChange={(e) => setForm({ ...form, article: e.target.value })} />
        </FormField>
        <FormField label="Beschreibung" required>
          <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </FormField>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Abbrechen</button>
          <button onClick={handleSave} disabled={saving || !form.article.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Rechtsgrundlage loeschen" size="sm">
        <p className="text-sm text-gray-600 mb-6">Moechten Sie diese Rechtsgrundlage wirklich loeschen?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Abbrechen</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Loeschen</button>
        </div>
      </Modal>
    </div>
  );
}
