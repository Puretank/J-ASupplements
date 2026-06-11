"use client";

import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
        setLoading(false);
      });
  }, []);

  async function saveSettings() {
    setSaving(true);
    setSaved(false);

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });

    const data = await res.json();
    if (data.settings) {
      setSettings(data.settings);
      setSaved(true);
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="animate-pulse text-gray-400">Cargando...</div>;
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-white">
        Configuración
      </h1>
      <p className="mb-8 text-gray-400">
        Ajusta TRM, ganancia y datos de contacto
      </p>

      <div className="max-w-lg space-y-6 rounded-2xl border border-white/5 bg-surface-800 p-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            TRM (USD → COP)
          </label>
          <input
            type="number"
            value={settings.trm}
            onChange={(e) =>
              setSettings({ ...settings, trm: Number(e.target.value) })
            }
            className="admin-input"
          />
          <p className="mt-1 text-xs text-gray-500">
            Tasa de cambio actual para convertir precios USD
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Ganancia objetivo (COP)
          </label>
          <input
            type="number"
            value={settings.ganancia}
            onChange={(e) =>
              setSettings({ ...settings, ganancia: Number(e.target.value) })
            }
            className="admin-input"
          />
          <p className="mt-1 text-xs text-gray-500">
            Ganancia aproximada por producto (~$45.000). El precio final se
            redondea a múltiplos de $1.000
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            📱 Números de WhatsApp
          </label>
          <div className="space-y-2 text-sm text-gray-400">
            <p><strong className="text-white">Julián:</strong> 3192572657</p>
            <p><strong className="text-white">Tatiana:</strong> 3115630074</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="admin-btn-primary disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
          {saved && (
            <span className="text-sm text-brand-400">
              Guardado correctamente
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 max-w-lg rounded-2xl border border-white/5 bg-surface-800 p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-white">
          Lógica de precios
        </h2>
        <div className="space-y-3 text-sm text-gray-400">
          <p>
            <strong className="text-white">Sin promoción:</strong> Se aplica
            20% de descuento del proveedor, luego se suma la ganancia.
          </p>
          <p>
            <strong className="text-white">Con promoción:</strong> No se aplica
            el 20% porque el proveedor ya descontó el precio.
          </p>
          <p>
            <strong className="text-white">Redondeo:</strong> El precio final se
            redondea al múltiplo de $1.000 más cercano.
          </p>
        </div>
      </div>
    </div>
  );
}
