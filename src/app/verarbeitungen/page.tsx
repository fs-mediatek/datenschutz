"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";

interface Process {
  id: string;
  number: number | null;
  name: string;
  status: string;
  updatedAt: string;
  responsible: { id: string; name: string } | null;
}

const statusLabels: Record<string, string> = {
  draft: "Entwurf",
  active: "Aktiv",
  archived: "Archiviert",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  archived: "bg-yellow-100 text-yellow-700",
};

export default function VerarbeitungenPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/processes");
        const data = await res.json();
        if (Array.isArray(data)) setProcesses(data);
      } catch (err) {
        console.error("Fehler beim Laden:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const columns = [
    {
      key: "number",
      label: "Nr.",
      render: (row: Record<string, unknown>) => (row.number as number) ?? "-",
    },
    { key: "name", label: "Bezeichnung" },
    {
      key: "responsible",
      label: "Verantwortlicher",
      render: (row: Record<string, unknown>) => {
        const r = row.responsible as { name: string } | null;
        return r?.name ?? "-";
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row: Record<string, unknown>) => {
        const status = row.status as string;
        return (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[status] ?? "bg-gray-100 text-gray-700"}`}>
            {statusLabels[status] ?? status}
          </span>
        );
      },
    },
    {
      key: "updatedAt",
      label: "Zuletzt geaendert",
      render: (row: Record<string, unknown>) =>
        new Date(row.updatedAt as string).toLocaleDateString("de-DE"),
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Laden...</div></div>;
  }

  return (
    <div>
      <PageHeader
        title="Verarbeitungsverzeichnis (VVT)"
        description="Uebersicht aller Verarbeitungstaetigkeiten gemaess Art. 30 DSGVO"
        action={
          <Link href="/verarbeitungen/neu" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block">
            + Neue Verarbeitung
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={processes as unknown as Record<string, unknown>[]}
        onEdit={(row) => {
          window.location.href = `/verarbeitungen/${row.id}`;
        }}
      />
    </div>
  );
}
