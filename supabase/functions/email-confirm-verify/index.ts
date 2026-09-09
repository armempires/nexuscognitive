const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function handleOptions(request: Request) {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

function getAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) throw new Error("Supabase service role não configurado");
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}
Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;

  try {
    if (request.method !== "POST") {
      return json({ error: "Método não permitido" }, 405);
    }

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.replace(/\D/g, "").slice(0, 6) : "";

    if (!email || !code) {
      return json({ success: false, message: "E-mail e código são obrigatórios." }, 400);
    }

    const admin = getAdminClient();
    const { data, error } = await admin
      .from("email_confirmations")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return json({ success: false, message: "Nenhuma confirmação encontrada para este e-mail." });
    }

    if (data.confirmed_at) {
      return json({ success: false, message: "Este e-mail já foi confirmado." });
    }

    if (new Date(data.expires_at) < new Date()) {
      return json({ success: false, message: "Código expirado. Solicite um novo código." });
    }

    if (data.code !== code) {
      return json({ success: false, message: "Código inválido. Verifique e tente novamente." });
    }

    const { error: updateError } = await admin
      .from("email_confirmations")
      .update({ confirmed_at: new Date().toISOString() })
      .eq("id", data.id);

    if (updateError) {
      return json({ success: false, message: "Erro ao confirmar código." }, 500);
    }

    return json({ success: true, message: "E-mail confirmado com sucesso!" });
  } catch (error: any) {
    console.error("Erro em email-confirm-verify:", error);
    return json({ success: false, message: error.message || "Erro interno ao verificar código." }, 500);
  }
});
