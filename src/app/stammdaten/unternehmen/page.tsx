"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import FormField from "@/components/FormField";

interface Company {
  id: string;
  name: string;
  street: string | null;
  zip: string | null;
  city: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoPath: string | null;
  dsbName: string | null;
  dsbEmail: string | null;
  dsbPhone: string | null;
}

const emptyForm = {
  name: "",
  street: "",
  zip: "",
  city: "",
  country: "Deutschland",
  phone: "",
  email: "",
  website: "",
  logoPath: "",
  dsbName: "",
  dsbEmail: "",
  dsbPhone: "",
};

export default function UnternehmenPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const inputClass = "border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm";

  async function loadCompanies() {
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      if (Array.isArray(data)) setCompanies(data);
    } catch (err) {
      console.error("Fehler beim Laden:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCompanies(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row: Record<string, unknown>) {
    const c = row as unknown as Company;
    setEditingId(c.id);
    setForm({
      name: c.name,
      street: c.street ?? "",
      zip: c.zip ?? "",
      city: c.city ?? "",
      country: c.country,
      phone: c.phone ?? "",
      email: c.email ?? "",
      website: c.website ?? "",
      logoPath: c.logoPath ?? "",
      dsbName: c.dsbName ?? "",
      dsbEmail: c.dsbEmail ?? "",
      dsbPhone: c.dsbPhone ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const url = editingId ? `/api/companies/${editingId}` : "/api/companies";
      const method = editingId ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setModalOpen(false);
      await loadCompanies();
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/companies/${id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      await loadCompanies();
    } catch (err) {
      console.error("Fehler beim Loeschen:", err);
    }
  }

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "city",
      label: "Ort",
      render: (row: Record<string, unknown>) => {
        const parts = [row.zip, row.city].filter(Boolean);
        return parts.length ? parts.join(" ") : "-";
      },
    },
    { key: "email", label: "E-Mail" },
    {
      key: "dsbName",
      label: "DSB",
      render: (row: Record<string, unknown>) => (row.dsbName as string) || "-",
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Laden...</div></div>;
  }

  return (
    <div>
      <PageHeader
        title="Unternehmen"
        description="Verwalten Sie Ihre Unternehmen und Verantwortlichen"
        action={
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Unternehmen hinzufuegen
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={companies as unknown as Record<string, unknown>[]}
        onEdit={openEdit}
        onDelete={(row) => setDeleteConfirm(row.id as string)}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Unternehmen bearbeiten" : "Neues Unternehmen"} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <FormField label="Name" required>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Strasse">
            <input className={inputClass} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
          </FormField>
          <FormField label="PLZ">
            <input className={inputClass} value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
          </FormField>
          <FormField label="Ort">
            <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </FormField>
          <FormField label="Land">
            <input className={inputClass} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </FormField>
          <FormField label="Telefon">
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
          <FormField label="E-Mail">
            <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <FormField label="Webseite">
            <input className={inputClass} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </FormField>
          <FormField label="Logo-Pfad" hint="Pfad zum Logo-Bild">
            <input className={inputClass} value={form.logoPath} onChange={(e) => setForm({ ...form, logoPath: e.target.value })} />
          </FormField>
          <div className="col-span-full mt-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Datenschutzbeauftragter (DSB)</h3>
          </div>
          <FormField label="DSB Name">
            <input className={inputClass} value={form.dsbName} onChange={(e) => setForm({ ...form, dsbName: e.target.value })} />
          </FormField>
          <FormField label="DSB E-Mail">
            <input className={inputClass} type="email" value={form.dsbEmail} onChange={(e) => setForm({ ...form, dsbEmail: e.target.value })} />
          </FormField>
          <FormField label="DSB Telefon">
            <input className={inputClass} value={form.dsbPhone} onChange={(e) => setForm({ ...form, dsbPhone: e.target.value })} />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">
            Abbrechen
          </button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Unternehmen loeschen" size="sm">
        <p className="text-sm text-gray-600 mb-6">
          Moechten Sie dieses Unternehmen wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">
            Abbrechen
          </button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Loeschen
          </button>
        </div>
      </Modal>
    </div>
  );
}
