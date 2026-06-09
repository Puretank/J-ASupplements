import { createServerClient } from "../../../lib/supabase-server";

export async function GET() {
  const supabase = createServerClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        quantity,
        precio_unitario,
        subtotal,
        product_name,
        product_marca,
        product_id,
        products (
          imagen,
          imagenes,
          precio_usd,
          precio_cop,
          costo_real,
          precio_final,
          utilidad,
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ orders });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { customer_name, items } = body;

    if (!customer_name || !items?.length) {
      return Response.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const total = items.reduce(
      (acc, item) => acc + item.precio_unitario * item.quantity,
      0
    );

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name,
        customer_phone: null,
        total,
        payment_status: "pending"
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      precio_unitario: item.precio_unitario,
      subtotal: item.precio_unitario * item.quantity,
      product_name: item.nombre,
      product_marca: item.marca
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // No stock tracking: do not update product stock on orders

    return Response.json({ order });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const supabase = createServerClient();

    await supabase.from("order_items").delete().eq("order_id", params.id);
    const { error } = await supabase.from("orders").delete().eq("id", params.id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
