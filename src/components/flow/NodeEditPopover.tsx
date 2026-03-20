"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface VVTProcess {
  id: string;
  name: string;
}

interface NodeEditPopoverProps {
  open: boolean;
  nodeId: string;
  label: string;
  processId: string | null;
  processName: string | null;
  processes: VVTProcess[];
  position: { x: number; y: number };
  onClose: () => void;
  onSave: (nodeId: string, data: { label: string; processId: string | null }) => void;
  onDelete: (nodeId: string) => void;
}

export default function NodeEditPopover({
  open,
  nodeId,
  label: initialLabel,
  processId: initialProcessId,
  processName,
  processes,
  position,
  onClose,
  onSave,
  onDelete,
}: NodeEditPopoverProps) {
  const [label, setLabel] = useState(initialLabel);
  const [processId, setProcessId] = useState<string | null>(initialProcessId);

  useEffect(() => {
    setLabel(initialLabel);
    setProcessId(initialProcessId);
  }, [initialLabel, initialProcessId, nodeId]);

  if (!open) return null;

  return (
    <div
      className="fixed z-[90] bg-white rounded-lg shadow-xl border border-slate-200 p-4 w-72"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-800">Knoten bearbeiten</h4>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-lg leading-none"
        >
          &times;
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Bezeichnung
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            VVT-Prozess verknüpfen
          </label>
          <select
            value={processId || ""}
            onChange={(e) => setProcessId(e.target.value || null)}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Kein Prozess</option>
            {processes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {processId && (
          <Link
            href={`/verarbeitungen/${processId}`}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            🔗 Zum VVT-Prozess: {processName || "Anzeigen"}
          </Link>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => onDelete(nodeId)}
          className="px-3 py-1.5 text-xs text-red-600 hover:text-white hover:bg-red-600 border border-red-300 rounded transition-colors"
        >
          Löschen
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onSave(nodeId, { label, processId })}
            className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
