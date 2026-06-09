import { scrapeIHerbProduct } from "../../../scraper/iherbScraper";
import { calcularPrecio, redondearAMil } from "../../../lib/pricing";
import { createServerClient, getStoreSettings } from "../../../lib/supabase-server";

const MISSING_COLUMN_REGEX = /could not find the ['"]?([^'"]+)['"]? column|column ['"]?([^'"]+)['"]? does not exist/i;

function extractMissingColumn(error) {
  const message = error?.message || error?.code || "";
  const match = MISSING_COLUMN_REGEX.exec(message);
  return match ? match[1] || match[2] : null;
}

function cleanProductPayload(payload) {
  const cleaned = { ...payload };
  if (cleaned.categoria == null || cleaned.categoria === "") {
    delete cleaned.categoria;
  }
  return cleaned;
}

async function insertProductWithFallback(supabase, payload) {
  let attemptPayload = cleanProductPayload(payload);
  let result;
  let lastError;

  while (true) {
    result = await supabase.from("products").insert(attemptPayload).select().single();
    if (!result.error) {
      return result.data;
    }

    const missingColumn = extractMissingColumn(result.error);
    if (!missingColumn || !(missingColumn in attemptPayload)) {
      lastError = result.error;
      break;
    }
    delete attemptPayload[missingColumn];
  }

  throw lastError;
}

async function updateProductWithFallback(supabase, id, payload) {
  let attemptPayload = cleanProductPayload(payload);
  let result;
  let lastError;

  while (true) {
    result = await supabase.from("products").update(attemptPayload).eq("id", id).select().single();
    if (!result.error) {
      return result.data;
    }

    const missingColumn = extractMissingColumn(result.error);
    if (!missingColumn || !(missingColumn in attemptPayload)) {
      lastError = result.error;
      break;
    }
    delete attemptPayload[missingColumn];
  }

  throw lastError;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || !url.includes("iherb")) {
      return Response.json(
        { error: "URL de iHerb inválida" },
        { status: 400 }
      );
    }

    // Ensure URL has protocol
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    const settings = await getStoreSettings();
    const data = await scrapeIHerbProduct(formattedUrl);

    if ((!data.precioUSD && !data.precioCOP) || !data.nombre) {
      return Response.json(
        { error: "No se pudo extraer el producto. Verifica la URL." },
        { status: 422 }
      );
    }

    let pricing;
    if (data.moneda === "COP") {
      // Precio ya en COP: restar 20% si NO tiene promoción
      const precio_cop = Math.round(data.precioCOP);
      let costo_real = precio_cop;
      if (!data.tienePromocion) {
        costo_real = precio_cop * 0.8; // Restar 20%
      }
      const precio_final = redondearAMil(costo_real + settings.ganancia);
      const utilidad = Math.round(precio_final - costo_real);

      pricing = {
        precio_usd: 0,
        precio_cop,
        costo_real,
        precio_final,
        utilidad,
        tiene_promocion: Boolean(data.tienePromocion)
      };
    } else {
      // Si está en USD, aplicar conversión normal
      const usdPricing = calcularPrecio(
        data.precioUSD,
        data.tienePromocion,
        settings.trm,
        settings.ganancia
      );

      pricing = {
        ...usdPricing
      };
    }

    const supabase = createServerClient();

    const productData = {
      nombre: data.nombre,
      marca: data.marca,
      imagen: data.imagen,
      imagenes: data.imagenes || null,
      precio_usd: pricing.precio_usd,
      precio_cop: pricing.precio_cop || 0,
      costo_real: pricing.costo_real || 0,
      precio_final: pricing.precio_final,
      utilidad: pricing.utilidad || 0,
      tiene_promocion: pricing.tiene_promocion,
      tamano: data.tamano || null,
      sabores: data.sabores || null,
      iherb_url: data.iherb_url || url
    };
    if (data.categoria) {
      productData.categoria = data.categoria;
    }

    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("nombre", data.nombre)
      .maybeSingle();

    let result;

    if (existing) {
      result = await updateProductWithFallback(supabase, existing.id, productData);
    } else {
      result = await insertProductWithFallback(supabase, productData);
    }

    return Response.json({ success: true, product: result });
  } catch (err) {
    console.error("Import error:", err);
    return Response.json(
      { error: err.message || "Error al importar producto" },
      { status: 500 }
    );
  }
}
