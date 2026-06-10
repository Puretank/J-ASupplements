import { createServerClient } from "../../../lib/supabase-server";

export async function PATCH(req, { params }) {
  try {
    const body = await req.json();
    const precioUnitario = Number(body.precio_unitario);

    if (Number.isNaN(precioUnitario)) {
      return Response.json({ error: "Precio inválido" }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: existingItem, error: fetchError } = await supabase
      .from("order_items")
      .select("quantity")
      .eq("id", params.id)
      .single();

    if (fetchError || !existingItem) {
      throw fetchError || new Error("Item no encontrado");
    }

    const { data: orderItem, error: itemError } = await supabase
      .from("order_items")
      .update({
        precio_unitario: precioUnitario,
        subtotal: Math.round(precioUnitario * (existingItem.quantity || 1))
      })
      .eq("id", params.id)
      .select()
      .single();

    if (itemError) {
      throw itemError;
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("subtotal")
      .eq("order_id", orderItem.order_id);

    if (itemsError) {
      throw itemsError;
    }

    const total = items.reduce((acc, item) => acc + (item.subtotal || 0), 0);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .update({ total })
      .eq("id", orderItem.order_id)
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    return Response.json({ orderItem, order });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
