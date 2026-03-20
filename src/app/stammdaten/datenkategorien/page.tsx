"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import FormField from "@/components/FormField";

interface DataCategory {
  id: string;
  name: string;
  description: string | null;
  isSensitive: boolean;
}

const emptyForm = { name: "", description: "", isSensitive: false };

export default function DatenkategorienPage() {
  const [categories, setCategories] = useState<DataCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const inputClass = "border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm";

  async function loadData() {
    try {
      const res = await fetch("/api/data-categories");
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
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
    const c = row as unknown as DataCategory;
    setEditingId(c.id);
    setForm({ name: c.name, description: c.description ?? "", isSensitive: c.isSensitive });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const url = editingId ? `/api/data-categories/${editingId}` : "/api/data-categories";
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
      await fetch(`/api/data-categories/${id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      console.error("Fehler beim Loeschen:", err);
    }
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "description", label: "Beschreibung" },
    {
      key: "isSensitive",
      label: "Sensibel",
      render: (row: Record<string, unknown>) =>
        row.isSensitive ? (
          <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
            Art. 9
          </span>
        ) : (
          <span className="text-gray-400 text-xs">Nein</span>
        ),
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Laden...</div></div>;
  }

  return (
    <div>
      <PageHeader
        title="Datenkategorien"
        description="Kategorien personenbezogener Daten verwalten"
        action={
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Kategorie hinzufuegen
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={categories as unknown as Record<string, unknown>[]}
        onEdit={openEdit}
        onDelete={(row) => setDeleteConfirm(row.id as string)}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Kategorie bearbeiten" : "Neue Datenkategorie"}>
        <FormField label="Name" required>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <FormField label="Beschreibung">
          <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </FormField>
        <FormField label="Besondere Kategorie (Art. 9 DSGVO)" hint="z.B. Gesundheitsdaten, biometrische Daten, religiöse Überzeugungen">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isSensitive}
              onChange={(e) => setForm({ ...form, isSensitive: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Sensible Daten nach Art. 9 DSGVO</span>
          </label>
        </FormField>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Abbrechen</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Kategorie loeschen" size="sm">
        <p className="text-sm text-gray-600 mb-6">Moechten Sie diese Datenkategorie wirklich loeschen?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Abbrechen</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Loeschen</button>
        </div>
      </Modal>
    </div>
  );
}
