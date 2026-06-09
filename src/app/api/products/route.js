import { createServerClient } from "../../../lib/supabase-server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get("categoria");
  const search = searchParams.get("search");
  const marca = searchParams.get("marca");

  const supabase = createServerClient();
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `nombre.ilike.%${search}%,marca.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  let products = data || [];
  if (categoria && categoria !== "all") {
    products = products.filter((product) => product.categoria === categoria);
  }

  if (marca && marca !== "all") {
    products = products.filter((product) => product.marca === marca);
  }

  const withStats = searchParams.get("stats") === "true";

  if (!withStats || !products?.length) {
    return Response.json({ products });
  }

  const { data: soldItems } = await supabase
    .from("order_items")
    .select("product_id, quantity, orders!inner(payment_status)")
    .eq("orders.payment_status", "paid");

  const soldMap = {};
  soldItems?.forEach((item) => {
    soldMap[item.product_id] =
      (soldMap[item.product_id] || 0) + item.quantity;
  });

  const productsWithStats = products.map((p) => ({
    ...p,
    unidades_vendidas: soldMap[p.id] || 0
  }));

  return Response.json({ products: productsWithStats });
}

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

export async function POST(req) {
  try {
    const body = await req.json();
    const supabase = createServerClient();
    const inserted = await insertProductWithFallback(supabase, body);
    return Response.json({ product: inserted });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

