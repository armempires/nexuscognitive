import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || "";

  if (!url || (!serviceRoleKey && !anonKey)) {
    throw new Error("Supabase não configurado: defina SUPABASE_URL e pelo menos SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY");
  }

  const keyToUse = serviceRoleKey || anonKey;

  console.log("[Supabase] Client initialized", {
    url,
    usingServiceRole: !!serviceRoleKey,
    usingAnon: !!anonKey && !serviceRoleKey,
  });

  return createClient(url, keyToUse, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
