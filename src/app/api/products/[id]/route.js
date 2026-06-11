import { calcularPrecio, recalcularConPrecioFinal } from "../../../../lib/pricing";
import { createServerClient, getStoreSettings } from "../../../../lib/supabase-server";

const MISSING_COLUMN_REGEX = /could not find the ['"]?([^'"]+)['"]? column|column ['"]?([^'"]+)['"]? does not exist/i;

function extractMissingColumn(error) {
  const message = error?.message || error?.code || "";
  const match = MISSING_COLUMN_REGEX.exec(message);
  return match ? match[1] || match[2] : null;
}

async function updateProductWithFallback(supabase, id, updates) {
  let attemptUpdates = { ...updates };
  let result;
  let lastError;

  while (true) {
    result = await supabase.from("products").update(attemptUpdates).eq("id", id).select().single();
    if (!result.error) {
      return result.data;
    }

    const missingColumn = extractMissingColumn(result.error);
    if (!missingColumn || !(missingColumn in attemptUpdates)) {
      lastError = result.error;
      break;
    }

    delete attemptUpdates[missingColumn];
  }

  throw lastError;
}

export async function PATCH(req, { params }) {
  try {
    const id = params.id;
    const body = await req.json();
    const supabase = createServerClient();

    const { data: current } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (!current) {
      return Response.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const settings = await getStoreSettings();
    let updates = { ...body };

    if (body.precio_usd !== undefined || body.tiene_promocion !== undefined) {
      const pricing = calcularPrecio(
        body.precio_usd ?? current.precio_usd,
        body.tiene_promocion ?? current.tiene_promocion,
        body.trm ?? settings.trm,
        body.ganancia ?? settings.ganancia
      );
      updates = { ...updates, ...pricing };
    } else if (body.precio_cop !== undefined) {
      // Al editar precio original, recalcular costo_real y utilidad
      const precioOriginal = Math.round(body.precio_cop);
      const costoReal = Math.round(precioOriginal * 0.8); // 20% descuento
      const precioFinal = current.precio_final || (costoReal + settings.ganancia);
      updates.precio_cop = precioOriginal;
      updates.costo_real = costoReal;
      updates.precio_final = precioFinal;
      updates.utilidad = Math.round(precioFinal - costoReal);
    } else if (body.precio_final !== undefined) {
      // Al editar precio final, mantener costo_real y recalcular utilidad
      const costo = body.costo_real ?? current.costo_real ?? 0;
      const precioFinal = Math.round(body.precio_final);
      updates.precio_final = precioFinal;
      updates.utilidad = precioFinal - costo;
      // Mantener costo_real sin cambios
      if (current.costo_real !== undefined) {
        updates.costo_real = current.costo_real;
      }
    } else if (body.utilidad !== undefined) {
      const costo = body.costo_real ?? current.costo_real;
      updates.precio_final = Math.round(costo) + Math.round(body.utilidad);
      updates.utilidad = Math.round(body.utilidad);
    }

    delete updates.trm;
    delete updates.ganancia;
    if (updates.categoria == null || updates.categoria === "") {
      delete updates.categoria;
    }

    const data = await updateProductWithFallback(supabase, id, updates);
    return Response.json({ product: data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", params.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
