"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "../../context/CartContext";

export default function Navbar() {
  const pathname = usePathname();
  const { cartCount } = useCart();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-surface-900/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 font-display text-lg font-bold text-black">
            J&A
          </div>
          <div>
            <span className="font-display text-xl font-bold tracking-wide text-white">
              Supplements
            </span>
            <span className="ml-1 text-xs font-medium text-brand-400">
              Importados
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-gray-300 transition hover:text-brand-400"
          >
            Tienda
          </Link>
          <Link
            href="/cart"
            className="text-sm font-medium text-gray-300 transition hover:text-brand-400"
          >
            Carrito
          </Link>
          <Link
            href="/admin"
            className="text-sm font-medium text-gray-400 transition hover:text-white"
          >
            Admin
          </Link>
        </div>

        <Link
          href="/cart"
          className="relative flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-400"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Carrito
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}
