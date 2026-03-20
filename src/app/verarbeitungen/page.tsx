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

      {/* Wizard CTA */}
      <Link href="/verarbeitungen/assistent" className="block mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-lg p-3 flex-shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg">Assistent starten</div>
              <div className="text-blue-100 text-sm mt-0.5">
                Gefuehrte Erstellung &ndash; Schritt fuer Schritt durch alle Anforderungen nach Art. 30 DSGVO gefuehrt werden
              </div>
            </div>
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </Link>

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
