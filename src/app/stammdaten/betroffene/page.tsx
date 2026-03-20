"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import FormField from "@/components/FormField";

interface AffectedGroup {
  id: string;
  name: string;
  description: string | null;
}

const emptyForm = { name: "", description: "" };

export default function BetroffenePage() {
  const [groups, setGroups] = useState<AffectedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const inputClass = "border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm";

  async function loadData() {
    try {
      const res = await fetch("/api/affected-groups");
      const data = await res.json();
      if (Array.isArray(data)) setGroups(data);
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
    const g = row as unknown as AffectedGroup;
    setEditingId(g.id);
    setForm({ name: g.name, description: g.description ?? "" });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const url = editingId ? `/api/affected-groups/${editingId}` : "/api/affected-groups";
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
      await fetch(`/api/affected-groups/${id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      console.error("Fehler beim Loeschen:", err);
    }
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "description", label: "Beschreibung" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Laden...</div></div>;
  }

  return (
    <div>
      <PageHeader
        title="Betroffenengruppen"
        description="Gruppen betroffener Personen verwalten"
        action={
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Gruppe hinzufuegen
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={groups as unknown as Record<string, unknown>[]}
        onEdit={openEdit}
        onDelete={(row) => setDeleteConfirm(row.id as string)}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Gruppe bearbeiten" : "Neue Betroffenengruppe"}>
        <FormField label="Name" required hint="z.B. Beschaeftigte, Kunden, Bewerber">
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <FormField label="Beschreibung">
          <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </FormField>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Abbrechen</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Gruppe loeschen" size="sm">
        <p className="text-sm text-gray-600 mb-6">Moechten Sie diese Betroffenengruppe wirklich loeschen?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Abbrechen</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Loeschen</button>
        </div>
      </Modal>
    </div>
  );
}
