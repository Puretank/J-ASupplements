"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { formatCOP } from "../../lib/format";

export default function CartPage() {
  const {
    cart,
    cartTotal,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [selectedContact, setSelectedContact] = useState("julian");
  const [loading, setLoading] = useState(false);

  async function enviarPedido() {
    if (!customerName || !customerName.trim()) {
      alert("Por favor ingresa tu nombre");
      return;
    }

    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    setLoading(true);

    try {
      const phone = selectedContact === "julian" ? "573192572657" : "573115630074";

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          items: cart.map((item) => ({
            product_id: item.id,
            nombre: item.nombre,
            marca: item.marca,
            quantity: item.quantity,
            precio_unitario: item.precio_final
          }))
        })
      });

      const orderData = await orderRes.json();

      if (orderData.error) {
        alert(orderData.error);
        setLoading(false);
        return;
      }

      let mensaje = `*NUEVO PEDIDO - Supplements J&A Importados*\n\n`;
      mensaje += `*Cliente:* ${customerName}\n\n`;
      mensaje += `*PRODUCTOS:*\n`;

      cart.forEach((item) => {
        // Simplificar nombre del producto para evitar caracteres especiales
        const nombreSimple = item.nombre.replace(/[™®©]/g, '').substring(0, 50);
        mensaje += `• ${nombreSimple}\n`;
        mensaje += `  ${item.marca} | Cant: ${item.quantity}\n`;
        mensaje += `  ${formatCOP(item.precio_final)} c/u = ${formatCOP(item.precio_final * item.quantity)}\n\n`;
      });

      mensaje += `*TOTAL: ${formatCOP(cartTotal)}*`;

      // Verificar que el mensaje no esté vacío
      if (!mensaje || mensaje.length < 50) {
        console.error("Mensaje vacío o muy corto:", mensaje);
        alert("Error al generar el mensaje del pedido");
        setLoading(false);
        return;
      }

      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
      window.open(whatsappUrl, "_blank");

      clearCart();
      setCustomerName("");
    } catch {
      alert("Error al procesar el pedido");
    } finally {
      setLoading(false);
    }
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="text-6xl">🛒</div>
        <h1 className="mt-4 font-display text-3xl font-bold text-white">
          Tu carrito está vacío
        </h1>
        <p className="mt-2 text-gray-400">
          Agrega suplementos para comenzar tu pedido
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-brand-500 px-8 py-3 font-semibold text-black transition hover:bg-brand-400"
        >
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 font-display text-3xl font-bold text-white">
        Tu Carrito
      </h1>

      <div className="space-y-4">
        {cart.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 rounded-2xl border border-white/5 bg-surface-700 p-4"
          >
            {item.imagen && (
              <img
                src={item.imagen}
                alt={item.nombre}
                className="h-20 w-20 rounded-xl object-contain bg-surface-600"
              />
            )}

            <div className="flex flex-1 flex-col">
              <h3 className="font-medium text-white">{item.nombre}</h3>
              <p className="text-sm text-gray-400">{item.marca}</p>
              <p className="mt-1 font-semibold text-brand-400">
                {formatCOP(item.precio_final)}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateQuantity(item.id, item.quantity - 1)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-600 text-white transition hover:bg-surface-500"
                >
                  −
                </button>
                <span className="w-8 text-center font-medium">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    updateQuantity(item.id, item.quantity + 1)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-600 text-white transition hover:bg-surface-500"
                >
                  +
                </button>
              </div>

              <p className="text-sm font-semibold text-white">
                {formatCOP(item.precio_final * item.quantity)}
              </p>

              <button
                onClick={() => removeFromCart(item.id)}
                className="text-xs text-red-400 transition hover:text-red-300"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-white/5 bg-surface-700 p-6">
        <h2 className="mb-4 font-display text-xl font-bold text-white">
          Datos de contacto
        </h2>

        <div>
          <input
            type="text"
            placeholder="Tu nombre"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="admin-input w-full"
          />
        </div>

        <div className="mt-4">
          <p className="mb-3 text-sm font-medium text-gray-300">¿Con quién deseas comunicarte?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedContact("julian")}
              className={`flex-1 rounded-lg px-4 py-2 font-semibold transition ${
                selectedContact === "julian"
                  ? "bg-brand-500 text-black"
                  : "bg-surface-600 text-white hover:bg-surface-500"
              }`}
            >
              👨 Julián
            </button>
            <button
              onClick={() => setSelectedContact("tatiana")}
              className={`flex-1 rounded-lg px-4 py-2 font-semibold transition ${
                selectedContact === "tatiana"
                  ? "bg-brand-500 text-black"
                  : "bg-surface-600 text-white hover:bg-surface-500"
              }`}
            >
              👩 Tatiana
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
          <div>
            <p className="text-sm text-gray-400">Total del pedido</p>
            <p className="font-display text-3xl font-bold text-white">
              {formatCOP(cartTotal)}
            </p>
          </div>

          <button
            onClick={enviarPedido}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-3 font-semibold text-black transition hover:bg-brand-400 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.555 4.126 1.528 5.867L0 24l6.335-1.662A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
            </svg>
            {loading ? "Procesando..." : "Pedir por WhatsApp"}
          </button>
        </div>
      </div>
    </div>
  );
}
