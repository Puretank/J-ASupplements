"use client";

import { useEffect, useState } from "react";
import { formatCOP } from "../../../lib/format";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const [editingPriceItemId, setEditingPriceItemId] = useState(null);

  async function updatePaymentStatus(orderId, status) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_status: status })
    });
    const data = await res.json();
    if (data.order) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o))
      );
    }
  }

  async function updatePaymentFlags(orderId, cliente_pago, pagado_vendedor) {
    const res = await fetch(`/api/orders/${orderId}/payment-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente_pago, pagado_vendedor })
    });
    const data = await res.json();
    if (data.order) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o))
      );
    }
  }

  async function deleteOrder(orderId) {
    if (!confirm("¿Eliminar este pedido?")) {
      return;
    }

    const res = await fetch(`/api/orders/${orderId}`, {
      method: "DELETE"
    });

    if (res.ok) {
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    }
  }

  async function updateOrderItemPrice(itemId, orderId, precioUnitario) {
    const res = await fetch(`/api/orders/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ precio_unitario: Number(precioUnitario) })
    });
    const data = await res.json();

    if (data.orderItem) {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;

          return {
            ...order,
            total: data.order?.total ?? order.total,
            order_items: order.order_items.map((item) =>
              item.id === itemId ? { ...item, ...data.orderItem } : item
            )
          };
        })
      );
    }

    setEditingPriceItemId(null);
  }

  function getItemImages(item) {
    const images = item.products?.imagenes?.length
      ? item.products.imagenes.slice(0, 2)
      : item.products?.imagen
      ? [item.products.imagen]
      : [];
    return images;
  }

  if (loading) {
    return <div className="animate-pulse text-gray-400">Cargando pedidos...</div>;
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-white">
        Pedidos
      </h1>
      <p className="mb-8 text-gray-400">{orders.length} pedidos registrados</p>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="overflow-hidden rounded-2xl border border-white/5 bg-surface-800"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-surface-700/50 px-6 py-4">
              <div>
                <p className="font-semibold text-white">
                  Pedido #{order.id} — {order.customer_name}
                </p>
                <p className="text-sm text-gray-400">
                  {order.customer_phone} ·{" "}
                  {new Date(order.created_at).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={
                    order.payment_status === "paid"
                      ? "status-paid"
                      : "status-pending"
                  }
                >
                  {order.payment_status === "paid" ? "Pagado" : "Pendiente"}
                </span>
                <p className="font-display text-xl font-bold text-white">
                  {formatCOP(order.total)}
                </p>
                <button
                  onClick={() => deleteOrder(order.id)}
                  className="admin-btn-danger text-xs"
                >
                  Eliminar pedido
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Imagen</th>
                    <th>Producto</th>
                    <th>Marca</th>
                    <th>Costo original</th>
                    <th>Costo 20%</th>
                    <th>Precio final</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    <th>Utilidad</th>
                    <th>Promo</th>
                  </tr>
                </thead>
                <tbody>
                  {order.order_items?.map((item) => {
                    const images = getItemImages(item);
                    const costoOriginal =
                      item.products?.precio_cop ?? item.products?.precio_final ?? item.precio_unitario;
                    const costo20 = item.products?.costo_real ?? costoOriginal;
                    const utilidadPorUnidad =
                      item.precio_unitario - (item.products?.costo_real ?? costoOriginal);

                    return (
                      <tr key={item.id}>
                        <td>
                          {images.length > 0 ? (
                            <div className="flex gap-1">
                              {images.map((src, index) => (
                                <img
                                  key={index}
                                  src={src}
                                  alt=""
                                  className="h-10 w-10 rounded-lg object-contain bg-surface-600"
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-surface-600" />
                          )}
                        </td>
                        <td className="max-w-[180px] truncate">
                          {item.product_name}
                        </td>
                        <td>{item.product_marca}</td>
                        <td>{formatCOP(costoOriginal)}</td>
                        <td>{formatCOP(costo20)}</td>
                        <td>
                          {editingPriceItemId === item.id ? (
                            <input
                              type="number"
                              defaultValue={item.precio_unitario}
                              className="admin-input w-28"
                              onBlur={(e) =>
                                updateOrderItemPrice(
                                  item.id,
                                  order.id,
                                  e.target.value
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.target.blur();
                              }}
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => setEditingPriceItemId(item.id)}
                              className="font-semibold text-brand-400 hover:underline"
                            >
                              {formatCOP(item.precio_unitario)}
                            </button>
                          )}
                        </td>
                        <td>{item.quantity}</td>
                        <td className="font-semibold text-white">
                          {formatCOP(item.subtotal)}
                        </td>
                        <td>
                          {formatCOP(Math.round(utilidadPorUnidad * item.quantity))}
                        </td>
                        <td>
                          {item.products?.tiene_promocion ? (
                            <span className="text-red-400">Sí</span>
                          ) : (
                            <span className="text-gray-500">No</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-4 border-t border-white/5 px-6 py-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`cliente-pago-${order.id}`}
                  checked={order.cliente_pago || false}
                  onChange={(e) => {
                    updatePaymentFlags(order.id, e.target.checked, order.pagado_vendedor);
                  }}
                  className="h-4 w-4 rounded bg-surface-600 checked:bg-brand-500"
                />
                <label
                  htmlFor={`cliente-pago-${order.id}`}
                  className="text-sm font-medium text-white cursor-pointer"
                >
                  ✓ Cliente pagó
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`pagado-vendedor-${order.id}`}
                  checked={order.pagado_vendedor || false}
                  onChange={(e) => {
                    updatePaymentFlags(order.id, order.cliente_pago, e.target.checked);
                  }}
                  className="h-4 w-4 rounded bg-surface-600 checked:bg-brand-500"
                />
                <label
                  htmlFor={`pagado-vendedor-${order.id}`}
                  className="text-sm font-medium text-white cursor-pointer"
                >
                  ✓ Pagado a vendedor
                </label>
              </div>

              <div className="ml-auto flex gap-2">
                {order.payment_status === "pending" ? (
                  <button
                    onClick={() => updatePaymentStatus(order.id, "paid")}
                    className="admin-btn-primary text-xs"
                  >
                    Marcar como pagado
                  </button>
                ) : (
                  <button
                    onClick={() => updatePaymentStatus(order.id, "pending")}
                    className="admin-btn-secondary text-xs"
                  >
                    Marcar como pendiente
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <p className="py-12 text-center text-gray-400">
            No hay pedidos aún
          </p>
        )}
      </div>
    </div>
  );
}
