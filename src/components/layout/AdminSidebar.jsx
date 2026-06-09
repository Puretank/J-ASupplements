"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Productos", icon: "📦" },
  { href: "/admin/import", label: "Importar", icon: "🔗" },
  { href: "/admin/settings", label: "Configuración", icon: "⚙️" }
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/5 bg-surface-800">
      <div className="border-b border-white/5 p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-black">
            J
          </div>
          <div>
            <p className="font-display text-sm font-bold text-white">J&A Supplements</p>
            <p className="text-xs text-gray-500">Panel Admin</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-brand-500/10 text-brand-400"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:text-white"
        >
          ← Volver a la tienda
        </Link>
      </div>
    </aside>
  );
}
