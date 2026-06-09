import { createServerClient } from "../../../../../lib/supabase-server";

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { cliente_pago, pagado_vendedor } = body;

    const supabase = createServerClient();

    const updates = {};
    if (typeof cliente_pago === "boolean") {
      updates.cliente_pago = cliente_pago;
    }
    if (typeof pagado_vendedor === "boolean") {
      updates.pagado_vendedor = pagado_vendedor;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true, order: data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
