import { corsHeaders, handleOptions, json } from "./shared/cors.ts";
import { getAdminClient } from "./shared/supabase.ts";

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
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
