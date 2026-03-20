"use client";

import { useState } from "react";

interface EdgeLabelModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { label: string; dataType: string; transferType: string }) => void;
}

const dataTypeOptions = [
  "Personendaten",
  "Finanzdaten",
  "Gesundheitsdaten",
  "Kommunikationsdaten",
  "Vertragsdaten",
  "Sonstiges",
];

const transferTypeOptions = ["digital", "physisch", "API", "E-Mail"];

export default function EdgeLabelModal({ open, onClose, onSave }: EdgeLabelModalProps) {
  const [label, setLabel] = useState("");
  const [dataType, setDataType] = useState(dataTypeOptions[0]);
  const [transferType, setTransferType] = useState(transferTypeOptions[0]);

  if (!open) return null;

  const handleSave = () => {
    onSave({ label, dataType, transferType });
    setLabel("");
    setDataType(dataTypeOptions[0]);
    setTransferType(transferTypeOptions[0]);
  };

  const handleCancel = () => {
    setLabel("");
    setDataType(dataTypeOptions[0]);
    setTransferType(transferTypeOptions[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Datenfluss beschreiben
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bezeichnung
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="z.B. Bewerbungsdaten, Gehaltsdaten..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Datenart
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {dataTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Übertragungsart
            </label>
            <select
              value={transferType}
              onChange={(e) => setTransferType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {transferTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Verbindung erstellen
          </button>
        </div>
      </div>
    </div>
  );
}
