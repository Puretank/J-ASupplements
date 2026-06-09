"use client";

import { useState } from "react";
import { formatCOP } from "../../../lib/format";

const CATEGORIES = [
  "",
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

export default function AdminImportPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [categoria, setCategoria] = useState("");
  const [error, setError] = useState("");
  const [importResults, setImportResults] = useState([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  async function guardarProducto() {
    if (!result) return;
    setLoading(true);
    setError("");

    const endpoint = result._existingId ? `/api/products/${result._existingId}` : "/api/products";
    const method = result._existingId ? "PATCH" : "POST";

    const payload = { ...result, tiene_promocion: null };
    if (categoria) {
      payload.categoria = categoria;
    } else {
      delete payload.categoria;
    }
    delete payload._saved;
    delete payload._existingId;
    delete payload.id;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.product) {
        setResult({ ...data.product, _saved: true });
      }
    } catch (e) {
      setError("Error al guardar producto");
    } finally {
      setLoading(false);
    }
  }

  async function importar() {
    if (!url.trim()) return;

    // Verificar si hay múltiples URLs (una por línea)
    const urls = url.split('\n').map(u => u.trim()).filter(u => u.length > 0);

    if (urls.length > 1) {
      // Importación masiva
      await importarMasivo(urls);
    } else {
      // Importación individual
      await importarIndividual(url);
    }
  }

  async function importarIndividual(singleUrl) {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/import-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: singleUrl })
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        // If API returns saved=false, it means promotion is unknown and product was not saved
        if (data.saved === false) {
          setResult({ ...data.product, _saved: false, _existingId: data.existing || null });
        } else {
          setResult({ ...data.product, _saved: true });
        }
        setCategoria(data.product?.categoria || "");
        setUrl("");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function importarMasivo(urls) {
    setLoading(true);
    setError("");
    setResult(null);
    setImportResults([]);
    setImportProgress({ current: 0, total: urls.length });

    const results = [];

    for (let i = 0; i < urls.length; i++) {
      const currentUrl = urls[i];
      setImportProgress({ current: i + 1, total: urls.length });

      try {
        const res = await fetch("/api/import-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: currentUrl })
        });

        const data = await res.json();

        results.push({
          url: currentUrl,
          success: !data.error,
          product: data.product,
          error: data.error
        });
      } catch (e) {
        results.push({
          url: currentUrl,
          success: false,
          error: "Error de conexión"
        });
      }
    }

    setImportResults(results);
    setUrl("");
    setLoading(false);
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-white">
        Importar Productos
      </h1>
      <p className="mb-8 text-gray-400">
        Pega la URL del producto para importarlo automáticamente
      </p>

      <div className="max-w-2xl rounded-2xl border border-white/5 bg-surface-800 p-6">
        <label className="mb-2 block text-sm font-medium text-gray-300">
          URL del producto (una por línea para importación masiva)
        </label>
        <textarea
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="admin-input mb-4 h-32 resize-y"
          rows={6}
        />

        <button
          onClick={importar}
          disabled={loading || !url.trim()}
          className="admin-btn-primary disabled:opacity-50"
        >
          {loading ? "Importando..." : "Importar producto(s)"}
        </button>

        {loading && importProgress.total > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm text-gray-400">
              <span>Progreso</span>
              <span>{importProgress.current} / {importProgress.total}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-700">
              <div
                className="h-full bg-brand-500 transition-all"
                style={{
                  width: `${(importProgress.current / importProgress.total) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4">
            <p className="mb-3 font-semibold text-brand-400">
              Producto importado correctamente
            </p>
            <div className="flex gap-4">
              {result.imagen && (
                <img
                  src={result.imagen}
                  alt=""
                  className="h-20 w-20 rounded-lg object-contain bg-surface-600"
                />
              )}
              <div>
                <p className="font-medium text-white">{result.nombre}</p>
                <p className="text-sm text-gray-400">{result.marca}</p>
                <p className="mt-1 text-sm">
                  <span className="text-gray-400">Precio final: </span>
                  <span className="font-semibold text-brand-400">
                    {formatCOP(result.precio_final)}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-400">Utilidad: </span>
                  <span className="text-white">
                    {typeof result.utilidad === "number" ? formatCOP(result.utilidad) : "-"}
                  </span>
                </p>
                {result._saved === false && (
                  <div className="mt-2 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
                        Promo: Pendiente
                      </span>
                      <button
                        onClick={guardarProducto}
                        disabled={loading}
                        className="admin-btn text-xs disabled:opacity-50"
                      >
                        Guardar producto
                      </button>
                      {result._existingId && (
                        <span className="text-sm text-gray-400">Producto existente: {result._existingId}</span>
                      )}
                    </div>
                    <label className="text-sm text-gray-300">
                      Categoría opcional
                    </label>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-surface-700 px-3 py-2 text-sm text-white outline-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat || "Sin categoría"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {result._saved === true && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-block rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                      Guardado
                    </span>
                    <button
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const res = await fetch(`/api/products/${result.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ tiene_promocion: true })
                          });
                          const data = await res.json();
                          if (data.product) setResult({ ...data.product, _saved: true });
                        } catch (e) {
                          setError("Error al marcar promoción");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="admin-btn text-xs disabled:opacity-50"
                    >
                      Marcar Sí
                    </button>
                    <button
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const res = await fetch(`/api/products/${result.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ tiene_promocion: false })
                          });
                          const data = await res.json();
                          if (data.product) setResult({ ...data.product, _saved: true });
                        } catch (e) {
                          setError("Error al marcar promoción");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="admin-btn-danger text-xs disabled:opacity-50"
                    >
                      Marcar No
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {importResults.length > 0 && (
          <div className="mt-6 rounded-xl border border-white/5 bg-surface-800 p-4">
            <p className="mb-4 font-semibold text-white">
              Resultados de importación masiva ({importResults.length} productos)
            </p>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {importResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 rounded-lg p-3 ${
                    result.success
                      ? "bg-green-500/5"
                      : "bg-red-500/5"
                  }`}
                >
                  <span className="mt-1">
                    {result.success ? "✅" : "❌"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-gray-400">
                      {result.url}
                    </p>
                    {result.success && result.product && (
                      <p className="text-sm text-white">
                        {result.product.nombre} - {formatCOP(result.product.precio_final)}
                      </p>
                    )}
                    {result.error && (
                      <p className="text-sm text-red-400">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setImportResults([])}
              className="mt-4 text-sm text-gray-400 hover:text-white"
            >
              Limpiar resultados
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 max-w-2xl rounded-2xl border border-white/5 bg-surface-800 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-white">
          Cómo funciona
        </h2>
        <ol className="space-y-2 text-sm text-gray-400">
          <li>1. Copia la URL del producto (una por línea para importación masiva)</li>
          <li>2. El sistema extrae nombre, marca, imagen y precio</li>
          <li>3. Detecta automáticamente si tiene promoción</li>
          <li>4. Calcula precio final con TRM y ganancia configurados</li>
          <li>5. Si el producto ya existe, se actualiza</li>
          <li>6. Para importación masiva, pega múltiples URLs separadas por saltos de línea</li>
        </ol>
      </div>
    </div>
  );
}
