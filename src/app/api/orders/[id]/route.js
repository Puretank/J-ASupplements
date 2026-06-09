import { createServerClient } from "../../../../lib/supabase-server";

export async function PATCH(req, { params }) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("orders")
      .update({ payment_status: body.payment_status })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    return Response.json({ order: data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
