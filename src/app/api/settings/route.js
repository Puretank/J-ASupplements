import { createServerClient } from "../../../lib/supabase-server";

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    return Response.json({
      settings: { trm: 4100, ganancia: 45000, whatsapp_phone: "573001112233", julian_phone: "573001112233", tatiana_phone: "573011111111" }
    });
  }

  return Response.json({ settings: data });
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (body.trm !== undefined) updates.trm = body.trm;
    if (body.ganancia !== undefined) updates.ganancia = body.ganancia;
    if (body.whatsapp_phone !== undefined) {
      updates.whatsapp_phone = body.whatsapp_phone;
    }
    if (body.julian_phone !== undefined) {
      updates.julian_phone = body.julian_phone;
    }
    if (body.tatiana_phone !== undefined) {
      updates.tatiana_phone = body.tatiana_phone;
    }

    const { data, error } = await supabase
      .from("store_settings")
      .upsert({ id: 1, ...updates })
      .select()
      .single();

    if (error) throw error;

    return Response.json({ settings: data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
