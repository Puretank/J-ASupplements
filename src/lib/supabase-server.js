import { createClient } from "@supabase/supabase-js";

// Use the service role key on the server to bypass RLS when needed.
// Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in your environment (not public).
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceKey) {
    return createClient(url, serviceKey);
  }

  // Fallback to anon key if service role is not provided (may hit RLS limits).
  return createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getStoreSettings() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .single();

  return data || { trm: 4100, ganancia: 45000, whatsapp_phone: "573001112233" };
}
