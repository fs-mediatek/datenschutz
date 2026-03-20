"use client";

import { useEffect, useState, useRef } from "react";
import PageHeader from "@/components/PageHeader";

interface Process {
  id: string;
  number: number | null;
  name: string;
  status: string;
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

export default function ExportPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  function handleHTMLExport(processId: string) {
    window.open(`/api/export/${processId}?format=html`, "_blank");
  }

  function handlePDFExport(processId: string) {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.src = `/api/export/${processId}?format=html`;
    iframe.onload = () => {
      try {
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Drucken fehlgeschlagen:", err);
        window.open(`/api/export/${processId}?format=html`, "_blank");
      }
    };
  }

  function handleFullExportHTML() {
    window.open("/api/export/all?format=html", "_blank");
  }

  function handleFullExportPDF() {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.src = "/api/export/all?format=html";
    iframe.onload = () => {
      try {
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Drucken fehlgeschlagen:", err);
        window.open("/api/export/all?format=html", "_blank");
      }
    };
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Laden...</div></div>;
  }

  return (
    <div>
      <PageHeader
        title="Export"
        description="Exportieren Sie Ihr Verarbeitungsverzeichnis als HTML oder PDF"
        action={
          <div className="flex gap-2">
            <button
              onClick={handleFullExportHTML}
              className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Gesamtes VVT (HTML)
            </button>
            <button
              onClick={handleFullExportPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Gesamtes VVT (PDF)
            </button>
          </div>
        }
      />

      {processes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Keine Verarbeitungen vorhanden.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {processes.map((process) => (
            <div
              key={process.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">
                  {process.number ? `#${process.number} ` : ""}
                  {process.name}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[process.status] ?? "bg-gray-100 text-gray-700"}`}>
                  {statusLabels[process.status] ?? process.status}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleHTMLExport(process.id)}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  HTML exportieren
                </button>
                <button
                  onClick={() => handlePDFExport(process.id)}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  PDF exportieren
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <iframe ref={iframeRef} className="hidden" title="Export-Frame" />
    </div>
  );
}
