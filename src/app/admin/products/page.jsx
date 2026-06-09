"use client";

import { useEffect, useState } from "react";
import { formatCOP } from "../../../lib/format";

const CATEGORIAS = [
  "Proteínas",
  "Creatina",
  "Aminoácidos",
  "Pre-entreno",
  "Ganadores de masa",
  "Quemadores de grasa",
  "Vitaminas",
  "Minerales",
  "Omega-3",
  "Colágeno",
  "Proteína de suero",
  "Proteína vegetal",
  "Barras proteicas",
  "Suplementos"
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());

  async function loadProducts() {
    const res = await fetch("/api/products?stats=true");
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function updateProduct(id, updates) {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (data.product) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? data.product : p))
      );
    }
    setEditing(null);
  }

  async function deleteProduct(id) {
    if (!confirm("¿Eliminar este producto?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function deleteSelectedProducts() {
    if (selectedProducts.size === 0) return;
    if (!confirm(`¿Eliminar ${selectedProducts.size} productos seleccionados?`)) return;

    for (const id of selectedProducts) {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
    }

    setProducts((prev) => prev.filter((p) => !selectedProducts.has(p.id)));
    setSelectedProducts(new Set());
  }

  function toggleProductSelection(id) {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  function toggleAllSelection() {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    }
  }

  if (loading) {
    return <div className="animate-pulse text-gray-400">Cargando productos...</div>;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Productos
          </h1>
          <p className="text-gray-400">{products.length} productos en catálogo</p>
        </div>
        {selectedProducts.size > 0 && (
          <button
            onClick={deleteSelectedProducts}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Eliminar {selectedProducts.size} seleccionados
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-surface-800">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  checked={selectedProducts.size === products.length && products.length > 0}
                  onChange={toggleAllSelection}
                  className="h-4 w-4 rounded border-white/20 bg-surface-700 text-brand-500 focus:ring-brand-500"
                />
              </th>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Categoría</th>
              <th>Precio original</th>
              <th>Precio descuento</th>
              <th>Precio final</th>
              <th>Utilidad</th>
              <th>Vendidos</th>
              <th>Promo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-white/[0.02]">
                <td>
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => toggleProductSelection(product.id)}
                    className="h-4 w-4 rounded border-white/20 bg-surface-700 text-brand-500 focus:ring-brand-500"
                  />
                </td>
                <td>
                  {product.imagen ? (
                    <img
                      src={product.imagen}
                      alt=""
                      className="h-10 w-10 rounded-lg object-contain bg-surface-600"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-surface-600" />
                  )}
                </td>
                <td className="max-w-[200px]">
                  <p className="truncate font-medium text-white">
                    {product.nombre}
                  </p>
                  {product.categoria && (
                    <p className="text-xs text-gray-500">{product.categoria}</p>
                  )}
                </td>
                <td>{product.marca}</td>
                <td>
                  {editing === `${product.id}-categoria` ? (
                    <select
                      defaultValue={product.categoria || ""}
                      className="admin-input w-32"
                      onBlur={(e) =>
                        updateProduct(product.id, {
                          categoria: e.target.value || null
                        })
                      }
                      autoFocus
                    >
                      <option value="">Sin categoría</option>
                      {CATEGORIAS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditing(`${product.id}-categoria`)}
                      className="text-gray-300 hover:underline"
                    >
                      {product.categoria || "Sin categoría"}
                    </button>
                  )}
                </td>
                <td>{formatCOP(product.precio_cop || product.precio_final)}</td>
                <td>{formatCOP(product.costo_real || product.precio_final)}</td>
                <td>
                  {editing === `${product.id}-precio` ? (
                    <input
                      type="number"
                      defaultValue={product.precio_final}
                      className="admin-input w-28"
                      onBlur={(e) =>
                        updateProduct(product.id, {
                          precio_final: Number(e.target.value)
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.target.blur();
                      }}
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setEditing(`${product.id}-precio`)}
                      className="font-semibold text-brand-400 hover:underline"
                    >
                      {formatCOP(product.precio_final)}
                    </button>
                  )}
                </td>
                <td>
                  {editing === `${product.id}-utilidad` ? (
                    <input
                      type="number"
                      defaultValue={product.utilidad}
                      className="admin-input w-28"
                      onBlur={(e) =>
                        updateProduct(product.id, {
                          utilidad: Number(e.target.value)
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.target.blur();
                      }}
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setEditing(`${product.id}-utilidad`)}
                      className="text-gray-300 hover:underline"
                    >
                      {formatCOP(product.utilidad)}
                    </button>
                  )}
                </td>
                <td className="text-center font-medium">
                  {product.unidades_vendidas || 0}
                </td>
                <td>
                  {editing === `${product.id}-promo` ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateProduct(product.id, { tiene_promocion: true })}
                        className="admin-btn text-xs"
                      >
                        Marcar Sí
                      </button>
                      <button
                        onClick={() => updateProduct(product.id, { tiene_promocion: false })}
                        className="admin-btn-danger text-xs"
                      >
                        Marcar No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditing(`${product.id}-promo`)}
                      className={`font-medium ${
                        product.tiene_promocion === null
                          ? "text-yellow-400"
                          : product.tiene_promocion
                          ? "text-red-400"
                          : "text-gray-300 hover:underline"
                      }`}
                    >
                      {product.tiene_promocion === null
                        ? "Pendiente"
                        : product.tiene_promocion
                        ? "Sí"
                        : "No"}
                    </button>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="admin-btn-danger text-xs"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <p className="p-8 text-center text-gray-400">
            No hay productos. Importa productos.
          </p>
        )}
      </div>
    </div>
  );
}
