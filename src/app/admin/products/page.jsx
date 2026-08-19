"use client";

import { useEffect, useState } from "react";
import { formatCOP } from "../../../lib/format";

const CATEGORIAS = [
  "Proteína limpia",
  "Proteína Hipercalórica",
  "Vitaminas, Minerales Y Antioxidantes",
  "Hidratantes y Electrolitos",
  "Pre-Entreno",
  "Creatina",
  "Omega-3",
  "Colágeno Y Resveratrol",
  "Salud Intestinal",
  "Refuerzos para la testosterona"
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [reimporting, setReimporting] = useState(false);
  const [reimportProgress, setReimportProgress] = useState({ current: 0, total: 0 });
  const [imageEditor, setImageEditor] = useState(null);
  const [imageWizard, setImageWizard] = useState(null);
  const [wizardIndex, setWizardIndex] = useState(0);
  const [wizardSelectedImages, setWizardSelectedImages] = useState(new Set());
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);

  async function loadProducts() {
    const res = await fetch("/api/products?stats=true");
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
    // Cargar estado de mantenimiento desde el servidor
    async function loadMaintenanceMode() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.settings?.maintenance_mode !== undefined) {
          setMaintenanceMode(data.settings.maintenance_mode);
        }
      } catch (e) {
        console.error("Error loading maintenance mode:", e);
      }
    }
    loadMaintenanceMode();
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

  async function assignBulkCategory() {
    if (selectedProducts.size === 0) return;
    if (!bulkCategory) {
      alert("Por favor selecciona una categoría");
      return;
    }

    if (!confirm(`¿Asignar categoría "${bulkCategory}" a ${selectedProducts.size} productos seleccionados?`)) return;

    for (const id of selectedProducts) {
      await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoria: bulkCategory })
      });
    }

    await loadProducts();
    setSelectedProducts(new Set());
    setBulkCategory("");
  }

  function startImageWizard() {
    const productsWithImages = products.filter(p => p.imagenes && p.imagenes.length > 0);
    if (productsWithImages.length === 0) {
      alert("No hay productos con imágenes para editar");
      return;
    }
    setImageWizard(productsWithImages);
    setWizardIndex(0);
    setWizardSelectedImages(new Set(productsWithImages[0].imagenes_seleccionadas || productsWithImages[0].imagenes || []));
  }

  async function saveWizardProduct() {
    const currentProduct = imageWizard[wizardIndex];
    try {
      await fetch(`/api/products/${currentProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagenes_seleccionadas: Array.from(wizardSelectedImages)
        })
      });
    } catch (e) {
      console.error("Error al guardar imágenes:", e);
    }
  }

  async function nextWizardProduct() {
    await saveWizardProduct();
    if (wizardIndex < imageWizard.length - 1) {
      const nextProduct = imageWizard[wizardIndex + 1];
      setWizardIndex(wizardIndex + 1);
      setWizardSelectedImages(new Set(nextProduct.imagenes_seleccionadas || nextProduct.imagenes || []));
    } else {
      await loadProducts();
      setImageWizard(null);
      setWizardIndex(0);
      alert("¡Todos los productos han sido procesados!");
    }
  }

  async function skipWizardProduct() {
    if (wizardIndex < imageWizard.length - 1) {
      const nextProduct = imageWizard[wizardIndex + 1];
      setWizardIndex(wizardIndex + 1);
      setWizardSelectedImages(new Set(nextProduct.imagenes_seleccionadas || nextProduct.imagenes || []));
    } else {
      await loadProducts();
      setImageWizard(null);
      setWizardIndex(0);
      alert("¡Todos los productos han sido procesados!");
    }
  }

  async function toggleMaintenanceMode() {
    setLoadingMaintenance(true);
    try {
      const newMode = !maintenanceMode;
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenance_mode: newMode })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error en la respuesta del servidor");
      }
      if (data.settings) {
        setMaintenanceMode(data.settings.maintenance_mode);
        alert(data.settings.maintenance_mode ? "Modo mantenimiento activado" : "Modo mantenimiento desactivado");
      }
    } catch (e) {
      console.error("Error toggling maintenance mode:", e);
      alert(`Error al cambiar modo de mantenimiento: ${e.message}`);
    } finally {
      setLoadingMaintenance(false);
    }
  }

  async function reimportAllProducts() {
    const productsWithUrls = products.filter(p => p.iherb_url);
    if (productsWithUrls.length === 0) {
      alert("No hay productos con URL de iHerb para reimportar");
      return;
    }

    if (!confirm(`¿Reimportar ${productsWithUrls.length} productos para actualizar precios? (Se mantendrán las imágenes seleccionadas y categorías)`)) return;

    setReimporting(true);
    setReimportProgress({ current: 0, total: productsWithUrls.length });

    for (let i = 0; i < productsWithUrls.length; i++) {
      const product = productsWithUrls[i];
      setReimportProgress({ current: i + 1, total: productsWithUrls.length });

      try {
        const res = await fetch("/api/import-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: product.iherb_url })
        });
        const data = await res.json();

        // Si el producto se importó correctamente, restaurar las imágenes seleccionadas y categoría
        if (data.product) {
          const updates = {};
          if (product.imagenes_seleccionadas) {
            updates.imagenes_seleccionadas = product.imagenes_seleccionadas;
          }
          if (product.categoria) {
            updates.categoria = product.categoria;
          }

          if (Object.keys(updates).length > 0) {
            await fetch(`/api/products/${data.product.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updates)
            });
          }
        }
      } catch (e) {
        console.error(`Error reimporting product ${product.id}:`, e);
      }
    }

    await loadProducts();
    setReimporting(false);
    setReimportProgress({ current: 0, total: 0 });
  }

  async function reimportSelectedProducts() {
    const selectedProductsList = Array.from(selectedProducts).map(id => products.find(p => p.id === id)).filter(p => p && p.iherb_url);
    if (selectedProductsList.length === 0) {
      alert("No hay productos seleccionados con URL de iHerb para reimportar");
      return;
    }

    if (!confirm(`¿Reimportar ${selectedProductsList.length} productos seleccionados para actualizar precios? (Se mantendrán las imágenes seleccionadas y categorías)`)) return;

    setReimporting(true);
    setReimportProgress({ current: 0, total: selectedProductsList.length });

    for (let i = 0; i < selectedProductsList.length; i++) {
      const product = selectedProductsList[i];
      setReimportProgress({ current: i + 1, total: selectedProductsList.length });

      try {
        const res = await fetch("/api/import-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: product.iherb_url })
        });
        const data = await res.json();

        // Si el producto se importó correctamente, restaurar las imágenes seleccionadas y categoría
        if (data.product) {
          const updates = {};
          if (product.imagenes_seleccionadas) {
            updates.imagenes_seleccionadas = product.imagenes_seleccionadas;
          }
          if (product.categoria) {
            updates.categoria = product.categoria;
          }

          if (Object.keys(updates).length > 0) {
            await fetch(`/api/products/${data.product.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updates)
            });
          }
        }
      } catch (e) {
        console.error(`Error reimporting product ${product.id}:`, e);
      }
    }

    await loadProducts();
    setSelectedProducts(new Set());
    setReimporting(false);
    setReimportProgress({ current: 0, total: 0 });
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
        <div className="flex items-center gap-3">
          <button
            onClick={startImageWizard}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-400"
          >
            Seleccionar imágenes
          </button>
          <button
            onClick={reimportAllProducts}
            disabled={reimporting}
            className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-400 disabled:opacity-50"
          >
            {reimporting ? "Reimportando..." : "Reimportar todos"}
          </button>
          <button
            onClick={toggleMaintenanceMode}
            disabled={loadingMaintenance}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              maintenanceMode
                ? "bg-red-500 text-white hover:bg-red-400"
                : "bg-gray-500 text-white hover:bg-gray-400"
            } disabled:opacity-50`}
          >
            {loadingMaintenance ? "Cargando..." : maintenanceMode ? "Desactivar mantenimiento" : "Activar mantenimiento"}
          </button>
          {selectedProducts.size > 0 && (
            <button
              onClick={reimportSelectedProducts}
              disabled={reimporting}
              className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
            >
              {reimporting ? "Reimportando..." : `Reimportar ${selectedProducts.size} seleccionados`}
            </button>
          )}
          {selectedProducts.size > 0 && (
            <>
              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                className="rounded-xl border border-white/10 bg-surface-700 px-4 py-2 text-sm text-white outline-none"
              >
                <option value="">Seleccionar categoría...</option>
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                onClick={assignBulkCategory}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-400"
              >
                Asignar categoría
              </button>
              <button
                onClick={deleteSelectedProducts}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Eliminar {selectedProducts.size} seleccionados
              </button>
            </>
          )}
        </div>
      </div>

      {reimporting && reimportProgress.total > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-sm text-gray-400">
            <span>Reimportando productos...</span>
            <span>{reimportProgress.current} / {reimportProgress.total}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-700">
            <div
              className="h-full bg-green-500 transition-all"
              style={{
                width: `${(reimportProgress.current / reimportProgress.total) * 100}%`
              }}
            />
          </div>
        </div>
      )}

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
                <td className="max-w-[300px]">
                  {product.iherb_url ? (
                    <a
                      href={product.iherb_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate font-medium text-brand-400 hover:text-brand-300 hover:underline"
                      title={product.nombre}
                    >
                      {product.nombre}
                    </a>
                  ) : (
                    <p className="truncate font-medium text-white" title={product.nombre}>
                      {product.nombre}
                    </p>
                  )}
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
                <td>
                  {editing === `${product.id}-precio-original` ? (
                    <input
                      type="number"
                      defaultValue={product.precio_cop || product.precio_final}
                      className="admin-input w-28"
                      onBlur={(e) =>
                        updateProduct(product.id, {
                          precio_cop: Number(e.target.value)
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.target.blur();
                      }}
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setEditing(`${product.id}-precio-original`)}
                      className="text-gray-300 hover:underline"
                    >
                      {formatCOP(product.precio_cop || product.precio_final)}
                    </button>
                  )}
                </td>
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
                  <div className="flex gap-2">
                    {product.imagenes && product.imagenes.length > 0 && (
                      <button
                        onClick={() => setImageEditor(product)}
                        className="admin-btn text-xs"
                      >
                        Imágenes
                      </button>
                    )}
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="admin-btn-danger text-xs"
                    >
                      Eliminar
                    </button>
                  </div>
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

      {/* Modal para editar imágenes */}
      {imageEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-4xl w-full mx-4 rounded-2xl border border-white/5 bg-surface-800 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-white">
                Editar imágenes - {imageEditor.nombre}
              </h3>
              <button
                onClick={() => setImageEditor(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-300">
              Selecciona las imágenes a mostrar ({imageEditor.imagenes_seleccionadas?.length || 0} seleccionadas)
            </p>

            <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {imageEditor.imagenes?.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                    imageEditor.imagenes_seleccionadas?.includes(img)
                      ? "border-brand-500"
                      : "border-transparent hover:border-white/20"
                  }`}
                  onClick={() => {
                    setImageEditor((prev) => {
                      const selected = prev.imagenes_seleccionadas || [];
                      const newSelected = selected.includes(img)
                        ? selected.filter((i) => i !== img)
                        : [...selected, img];
                      return { ...prev, imagenes_seleccionadas: newSelected };
                    });
                  }}
                >
                  <img
                    src={img}
                    alt={`Imagen ${idx + 1}`}
                    className="h-24 w-full object-contain bg-surface-600"
                  />
                  {imageEditor.imagenes_seleccionadas?.includes(img) && (
                    <div className="absolute top-1 right-1 rounded-full bg-brand-500 p-1">
                      <svg className="h-3 w-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setImageEditor((prev) => ({ ...prev, imagenes_seleccionadas: prev.imagenes || [] }))}
                className="text-xs text-brand-400 hover:text-brand-300"
              >
                Seleccionar todas
              </button>
              <button
                onClick={() => setImageEditor((prev) => ({ ...prev, imagenes_seleccionadas: [] }))}
                className="text-xs text-gray-400 hover:text-white"
              >
                Deseleccionar todas
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={imageEditor.imagenes?.length || 0}
                  placeholder="N"
                  className="w-12 rounded-lg border border-white/10 bg-surface-700 px-2 py-1 text-center text-xs text-white outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const n = parseInt(e.target.value);
                      if (n > 0 && n <= (imageEditor.imagenes?.length || 0)) {
                        setImageEditor((prev) => ({ ...prev, imagenes_seleccionadas: prev.imagenes?.slice(0, n) || [] }));
                      }
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousElementSibling;
                    const n = parseInt(input.value);
                    if (n > 0 && n <= (imageEditor.imagenes?.length || 0)) {
                      setImageEditor((prev) => ({ ...prev, imagenes_seleccionadas: prev.imagenes?.slice(0, n) || [] }));
                    }
                  }}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Primeras N
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setImageEditor(null)}
                className="rounded-xl border border-white/10 bg-surface-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-surface-600"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetch(`/api/products/${imageEditor.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        imagenes_seleccionadas: imageEditor.imagenes_seleccionadas
                      })
                    });
                    await loadProducts();
                    setImageEditor(null);
                  } catch (e) {
                    alert("Error al guardar imágenes");
                  }
                }}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-400"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wizard para seleccionar imágenes secuencialmente */}
      {imageWizard && imageWizard[wizardIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-5xl w-full mx-4 rounded-2xl border border-white/5 bg-surface-800 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-white">
                  Seleccionar imágenes - Producto {wizardIndex + 1} de {imageWizard.length}
                </h3>
                <p className="text-sm text-gray-400">{imageWizard[wizardIndex].nombre}</p>
              </div>
              <button
                onClick={() => {
                  setImageWizard(null);
                  setWizardIndex(0);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-300">
              Selecciona las imágenes a mostrar ({wizardSelectedImages.size} seleccionadas)
            </p>

            <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {imageWizard[wizardIndex].imagenes?.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                    wizardSelectedImages.has(img)
                      ? "border-brand-500"
                      : "border-transparent hover:border-white/20"
                  }`}
                  onClick={() => {
                    setWizardSelectedImages((prev) => {
                      const newSet = new Set(prev);
                      if (newSet.has(img)) {
                        newSet.delete(img);
                      } else {
                        newSet.add(img);
                      }
                      return newSet;
                    });
                  }}
                >
                  <img
                    src={img}
                    alt={`Imagen ${idx + 1}`}
                    className="h-24 w-full object-contain bg-surface-600"
                  />
                  {wizardSelectedImages.has(img) && (
                    <div className="absolute top-1 right-1 rounded-full bg-brand-500 p-1">
                      <svg className="h-3 w-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setWizardSelectedImages(new Set(imageWizard[wizardIndex].imagenes || []))}
                className="text-xs text-brand-400 hover:text-brand-300"
              >
                Seleccionar todas
              </button>
              <button
                onClick={() => setWizardSelectedImages(new Set())}
                className="text-xs text-gray-400 hover:text-white"
              >
                Deseleccionar todas
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={imageWizard[wizardIndex].imagenes?.length || 0}
                  placeholder="N"
                  className="w-12 rounded-lg border border-white/10 bg-surface-700 px-2 py-1 text-center text-xs text-white outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const n = parseInt(e.target.value);
                      if (n > 0 && n <= (imageWizard[wizardIndex].imagenes?.length || 0)) {
                        setWizardSelectedImages(new Set(imageWizard[wizardIndex].imagenes?.slice(0, n) || []));
                      }
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousElementSibling;
                    const n = parseInt(input.value);
                    if (n > 0 && n <= (imageWizard[wizardIndex].imagenes?.length || 0)) {
                      setWizardSelectedImages(new Set(imageWizard[wizardIndex].imagenes?.slice(0, n) || []));
                    }
                  }}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Primeras N
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={skipWizardProduct}
                className="rounded-xl border border-white/10 bg-surface-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-surface-600"
              >
                Saltar
              </button>
              <button
                onClick={nextWizardProduct}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-400"
              >
                {wizardIndex === imageWizard.length - 1 ? "Finalizar" : "Siguiente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
