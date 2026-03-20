"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

interface Stats {
  companies: number;
  processes: number;
  dataMaps: number;
  dataCategories: number;
}

interface RecentProcess {
  id: string;
  number: number | null;
  name: string;
  status: string;
  updatedAt: string;
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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ companies: 0, processes: 0, dataMaps: 0, dataCategories: 0 });
  const [recentProcesses, setRecentProcesses] = useState<RecentProcess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [companiesRes, processesRes, dataMapsRes, categoriesRes] = await Promise.all([
          fetch("/api/companies"),
          fetch("/api/processes"),
          fetch("/api/data-maps"),
          fetch("/api/data-categories"),
        ]);

        const companies = await companiesRes.json();
        const processes = await processesRes.json();
        const dataMaps = await dataMapsRes.json();
        const categories = await categoriesRes.json();

        setStats({
          companies: Array.isArray(companies) ? companies.length : 0,
          processes: Array.isArray(processes) ? processes.length : 0,
          dataMaps: Array.isArray(dataMaps) ? dataMaps.length : 0,
          dataCategories: Array.isArray(categories) ? categories.length : 0,
        });

        if (Array.isArray(processes)) {
          const sorted = [...processes].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setRecentProcesses(sorted.slice(0, 5));
        }
      } catch (err) {
        console.error("Fehler beim Laden der Dashboard-Daten:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Laden...</div>
      </div>
    );
  }

  const cards = [
    { label: "Unternehmen", value: stats.companies, href: "/stammdaten/unternehmen", icon: "🏢" },
    { label: "Verarbeitungen", value: stats.processes, href: "/verarbeitungen", icon: "📋" },
    { label: "Datenlandkarten", value: stats.dataMaps, href: "/datenlandkarte", icon: "🗺️" },
    { label: "Datenkategorien", value: stats.dataCategories, href: "/stammdaten/datenkategorien", icon: "📁" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Uebersicht ueber Ihre DSGVO-Compliance"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-3xl font-bold text-blue-600">{card.value}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Letzte Aktivitaeten</h2>
        {recentProcesses.length === 0 ? (
          <p className="text-gray-500 text-sm">Noch keine Verarbeitungen vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {recentProcesses.map((process) => (
              <Link
                key={process.id}
                href={`/verarbeitungen/${process.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    {process.number ? `#${process.number} ` : ""}
                    {process.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[process.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {statusLabels[process.status] ?? process.status}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(process.updatedAt).toLocaleDateString("de-DE")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
