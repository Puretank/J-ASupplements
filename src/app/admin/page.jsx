"use client";

import { useEffect, useState } from "react";
import MetricCard from "../../components/admin/MetricCard";
import { formatCOP } from "../../lib/format";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/metrics")
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data.metrics);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-surface-700" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-surface-700" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-white">
        Dashboard
      </h1>
      <p className="mb-8 text-gray-400">
        Resumen general de tu tienda
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Ventas Totales"
          value={formatCOP(metrics?.ventas_totales)}
          subtitle="Pedidos pagados"
          icon="💰"
          color="brand"
        />
        <MetricCard
          title="Utilidad Total"
          value={formatCOP(metrics?.utilidad_total)}
          subtitle="Ganancia acumulada"
          icon="📈"
          color="blue"
        />
        <MetricCard
          title="Pedidos Pendientes"
          value={metrics?.pedidos_pendientes}
          subtitle="Por confirmar pago"
          icon="⏳"
          color="yellow"
        />
        <MetricCard
          title="Productos Vendidos"
          value={metrics?.productos_vendidos}
          subtitle="Unidades totales"
          icon="📦"
          color="purple"
        />
        <MetricCard
          title="Promociones Pendientes"
          value={metrics?.promociones_pendientes}
          subtitle="Promos por revisar"
          icon="⚠️"
          color="red"
        />
        <MetricCard
          title="Total Productos"
          value={metrics?.total_productos}
          subtitle={`${metrics?.total_pedidos} pedidos totales`}
          icon="🏪"
          color="brand"
        />
      </div>
    </div>
  );
}
