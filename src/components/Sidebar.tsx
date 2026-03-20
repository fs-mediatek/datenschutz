"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/stammdaten/unternehmen", label: "Unternehmen", icon: "🏢" },
  { href: "/stammdaten/datenkategorien", label: "Datenkategorien", icon: "📁" },
  { href: "/stammdaten/rechtsgrundlagen", label: "Rechtsgrundlagen", icon: "⚖️" },
  { href: "/stammdaten/betroffene", label: "Betroffenengruppen", icon: "👥" },
  { href: "/stammdaten/toms", label: "TOMs", icon: "🔒" },
  { href: "/datenlandkarte", label: "Datenlandkarte", icon: "🗺️" },
  { href: "/verarbeitungen", label: "Verarbeitungen (VVT)", icon: "📋" },
  { href: "/export", label: "Export", icon: "📄" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#1e293b] text-[#e2e8f0] flex flex-col z-50">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-lg font-bold text-white">🛡️ Datenschutz-Tool</h1>
        <p className="text-xs text-slate-400 mt-1">DSGVO Compliance Manager</p>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? "bg-blue-600/20 text-blue-400 border-r-2 border-blue-400"
                  : "hover:bg-slate-700/50 text-slate-300"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 text-xs text-slate-500">
        DSGVO-konform · Art. 30
      </div>
    </aside>
  );
}
