"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DataMap {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    nodes: number;
    edges: number;
  };
}

export default function DatenlandkartePage() {
  const [maps, setMaps] = useState<DataMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchMaps = async () => {
    try {
      const res = await fetch("/api/data-maps");
      const data = await res.json();
      setMaps(data);
    } catch (err) {
      console.error("Fehler beim Laden der Datenlandkarten:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaps();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/data-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDescription || null }),
      });
      if (res.ok) {
        setNewName("");
        setNewDescription("");
        setShowCreateModal(false);
        await fetchMaps();
      }
    } catch (err) {
      console.error("Fehler beim Erstellen:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Soll diese Datenlandkarte wirklich gelöscht werden?")) return;
    try {
      const res = await fetch(`/api/data-maps/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMaps((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error("Fehler beim Löschen:", err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Datenlandkarte</h1>
          <p className="text-sm text-slate-500 mt-1">
            Visualisieren Sie Ihre Datenflüsse und Verarbeitungstätigkeiten
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          Neue Datenlandkarte
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Laden...</div>
      ) : maps.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
          <div className="text-4xl mb-3">🗺️</div>
          <h3 className="text-lg font-medium text-slate-700 mb-1">
            Keine Datenlandkarten vorhanden
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Erstellen Sie Ihre erste Datenlandkarte, um Datenflüsse zu visualisieren.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Erste Datenlandkarte erstellen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {maps.map((map) => (
            <div
              key={map.id}
              className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <Link
                  href={`/datenlandkarte/${map.id}`}
                  className="text-base font-semibold text-slate-800 hover:text-blue-600 transition-colors"
                >
                  {map.name}
                </Link>
                <button
                  onClick={() => handleDelete(map.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors text-sm p-1"
                  title="Löschen"
                >
                  🗑️
                </button>
              </div>
              {map.description && (
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{map.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>{map._count.nodes} Knoten</span>
                <span>{map._count.edges} Verbindungen</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <Link
                  href={`/datenlandkarte/${map.id}`}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Bearbeiten →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Neue Datenlandkarte erstellen
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="z.B. HR-Datenflüsse"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optionale Beschreibung..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewName("");
                  setNewDescription("");
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Erstelle..." : "Erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
