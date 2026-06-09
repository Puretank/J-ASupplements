"use client";

import { useEffect, useState, useMemo } from "react";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/products/ProductCard";

const CATEGORIAS = [
  "all",
  "Proteínas",
  "Creatina",
  "Vitaminas",
  "Omega-3",
  "Pre-Entreno",
  "Aminoácidos",
  "Colágeno",
  "Probióticos",
  "Control de Peso",
  "Quemadores",
  "Snacks",
  "Barras",
  "Suplementos"
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("all");
  const [marca, setMarca] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const { addToCart } = useCart();

  async function loadProducts() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoria !== "all") params.set("categoria", categoria);
    if (marca !== "all") params.set("marca", marca);

    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [search, categoria, marca]);

  const marcas = useMemo(() => {
    const unique = [...new Set(products.map((p) => p.marca).filter(Boolean))];
    return unique.sort();
  }, [products]);

  const sortedProducts = useMemo(() => {
    const list = [...products];
    switch (sortBy) {
      case "price-asc":
        return list.sort((a, b) => a.precio_final - b.precio_final);
      case "price-desc":
        return list.sort((a, b) => b.precio_final - a.precio_final);
      case "name":
        return list.sort((a, b) => a.nombre.localeCompare(b.nombre));
      default:
        return list;
    }
  }, [products, sortBy]);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-brand-500/5 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-400">
              Productos Importados
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-6xl">
              SUPLEMENTOS
              <br />
              <span className="text-brand-400">PREMIUM</span>
            </h1>
            <p className="mt-4 text-lg text-gray-400">
              Proteínas, creatina, vitaminas y más. Calidad internacional
              con entrega en Colombia.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-700 py-3 pl-10 pr-4 text-white placeholder-gray-500 outline-none transition focus:border-brand-500/50"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="rounded-xl border border-white/10 bg-surface-700 px-4 py-2.5 text-sm text-white outline-none"
            >
              <option value="all">Todas las categorías</option>
              {CATEGORIAS.filter((c) => c !== "all").map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="rounded-xl border border-white/10 bg-surface-700 px-4 py-2.5 text-sm text-white outline-none"
            >
              <option value="all">Todas las marcas</option>
              {marcas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-white/10 bg-surface-700 px-4 py-2.5 text-sm text-white outline-none"
            >
              <option value="newest">Más recientes</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name">Nombre A-Z</option>
            </select>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORIAS.slice(0, 8).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                categoria === cat
                  ? "bg-brand-500 text-black"
                  : "bg-surface-700 text-gray-400 hover:text-white"
              }`}
            >
              {cat === "all" ? "Todos" : cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl bg-surface-700"
              />
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-xl text-gray-400">No se encontraron productos</p>
            <p className="mt-2 text-sm text-gray-500">
              Importa productos desde el panel admin
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
