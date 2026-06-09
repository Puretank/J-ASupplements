import { createServerClient } from "../../../lib/supabase-server";

export async function GET() {
  const supabase = createServerClient();

  const [
    { data: orders },
    { data: orderItems },
    { data: products }
  ] = await Promise.all([
    supabase.from("orders").select("id, total, payment_status"),
    supabase.from("order_items").select(`
      quantity,
      subtotal,
      product_id,
      orders!inner (payment_status)
    `),
    supabase.from("products").select("id, utilidad, tiene_promocion")
  ]);

  const paidOrders = orders?.filter((o) => o.payment_status === "paid") || [];
  const pendingOrders = orders?.filter((o) => o.payment_status === "pending") || [];

  const ventasTotales = paidOrders.reduce(
    (acc, o) => acc + Number(o.total),
    0
  );

  const paidItems = orderItems?.filter(
    (item) => item.orders?.payment_status === "paid"
  ) || [];

  const productosVendidos = paidItems.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  const utilidadTotal = paidItems.reduce((acc, item) => {
    const product = products?.find((p) => p.id === item.product_id);
    const utilidadUnit = product?.utilidad || 0;
    return acc + utilidadUnit * item.quantity;
  }, 0);

  const promocionesPendientes = products?.filter((p) => p.tiene_promocion === null).length || 0;

  return Response.json({
    metrics: {
      ventas_totales: ventasTotales,
      utilidad_total: utilidadTotal,
      pedidos_pendientes: pendingOrders.length,
      productos_vendidos: productosVendidos,
      promociones_pendientes: promocionesPendientes,
      total_pedidos: orders?.length || 0,
      total_productos: products?.length || 0
    }
  });
}
