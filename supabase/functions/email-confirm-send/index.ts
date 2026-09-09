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

function validEmail(value: unknown) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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

    if (!email || !validEmail(email)) {
      return json({ success: false, message: "E-mail inválido." }, 400);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const admin = getAdminClient();
    const { error: insertError } = await admin
      .from("email_confirmations")
      .insert({ id, email, code, expires_at: expiresAt });

    if (insertError) {
      console.error("Erro ao salvar confirmação no Supabase:", insertError);
      return json({ success: false, message: "Erro ao salvar código de confirmação." }, 500);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY") || "";
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Nexus Cognitive <noreply@mailer.kitoexpert.online>";

    if (!apiKey) {
      return json({ success: true, message: `Código de demonstração: ${code}`, isSimulated: true });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirme seu e-mail - Nexus Cognitive Insight</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0c0c12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8f6f1;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0c0c12; padding: 30px 15px;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #13121f; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; max-width: 600px; width: 100%;">
                <tr>
                  <td style="padding: 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); background: linear-gradient(180deg, rgba(159,140,255,0.12), transparent);">
                    <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background-color: #9f8cff; color: #0c0c12; border-radius: 12px; font-size: 22px; font-weight: bold; margin-bottom: 10px;">🧠</div>
                    <h1 style="margin: 0; font-size: 20px; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">NEXUS</h1>
                    <p style="margin: 4px 0 0 0; font-size: 10px; letter-spacing: 3px; color: rgba(255,255,255,0.4); text-transform: uppercase;">Cognitive Insight</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px;">
                    <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #5bd6c5; margin: 0 0 8px 0; font-weight: bold;">Confirmação de E-mail</p>
                    <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #ffffff;">Seu código de acesso</h2>
                    <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 25px;">
                      Use o código abaixo para confirmar seu e-mail e liberar o acesso ao pagamento e ao seu relatório completo.
                    </p>
                    <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 25px;">
                      <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8;">Código de Confirmação</span>
                      <div style="font-size: 36px; font-weight: 800; color: #9f8cff; margin: 10px 0; letter-spacing: 8px;">${code}</div>
                      <div style="display: inline-block; background-color: rgba(159,140,255,0.15); color: #c4b5ff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;">Válido por 10 minutos</div>
                    </div>
                    <p style="font-size: 13px; line-height: 1.6; color: #64748b;">
                      Se você não solicitou esta confirmação, ignore este e-mail.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: #64748b; line-height: 1.5;">
                    © 2026 Nexus Cognitive Insight. Todos os direitos reservados.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: "Confirme seu e-mail - Nexus Cognitive Insight",
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Resend] Error sending confirmation email:", response.status, errorText);
      return json({ success: false, message: `Erro ao enviar e-mail de confirmação: ${response.status}` }, 500);
    }

    return json({ success: true, message: "Código de confirmação enviado para o seu e-mail!", isSimulated: false });
  } catch (error: any) {
    console.error("Erro em email-confirm-send:", error);
    return json({ success: false, message: error.message || "Erro interno ao enviar código de confirmação." }, 500);
  }
});
