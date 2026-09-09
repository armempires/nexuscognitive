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

function buildCognitiveReportHtml(data: any): string {
  const colors: Record<string, string> = {
    Lógico: "#9f8cff",
    Visual: "#5bd6c5",
    Verbal: "#f6c66a",
    Padrões: "#ff8da1",
  };

  const classificationLabel =
    data.classification === "A desenvolver"
      ? "Abaixo da média"
      : data.classification === "Faixa média"
      ? "Médio"
      : data.classification;

  const categories = data.categories.map((category: any) => {
    const color = colors[category.name] || "#9f8cff";
    const width = Math.max(0, Math.min(100, category.value));
    return `<tr><td style="padding:0 0 13px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:13px;color:#d6d2df;font-weight:600">${category.name}</td><td align="right" style="font-size:13px;color:${color};font-weight:700">${category.value}%</td></tr><tr><td colspan="2" style="padding-top:7px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#302e38;border-radius:8px"><tr><td width="${width}%" height="8" style="background:${color};border-radius:8px;font-size:1px;line-height:8px">&nbsp;</td><td style="font-size:1px;line-height:8px">&nbsp;</td></tr></table></td></tr></table></td></tr>`;
  }).join("");

  const tags = (items: string[], color: string) =>
    items.map((item: string) => `<span style="display:inline-block;margin:0 5px 6px 0;padding:6px 10px;border:1px solid ${color}55;border-radius:999px;background:${color}12;color:#e7e1ed;font-size:11px">${item}</span>`).join("");

  const scoreBox = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#211e2d;border:1px solid #393449;border-radius:22px">
      <tr>
        <td align="center" style="padding:28px 16px">
          <div style="color:#777184;font-size:10px;letter-spacing:3px">SCORE NEXUS</div>
          <div style="margin:18px 0 6px;color:#9f8cff;font-size:64px;font-weight:800;line-height:1">${data.score}</div>
          <div style="color:#777184;font-size:14px;margin-bottom:16px">/ 145</div>
          <div style="display:inline-block;padding:8px 18px;border-radius:999px;background:#9f8cff22;color:#c4b5ff;font-size:13px;font-weight:700">${classificationLabel}</div>
          <p style="max-width:180px;margin:20px auto 0;color:#96909f;font-size:12px;line-height:1.7">Você apresentou desempenho equilibrado em relação ao conjunto de referência.</p>
        </td>
      </tr>
    </table>`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Seu relatório Nexus</title>
  <style>
    @media only screen and (max-width:620px){
      .main-wrap{padding:12px 4px!important}
      .outer{border-radius:14px!important}
      .body-pad{padding:20px 14px!important}
      .two-col{display:block!important;width:100%!important}
      .two-col td{display:block!important;width:100%!important;padding:0 0 12px 0!important}
      .bottom-col{display:block!important;width:100%!important;padding:12px 0 0 0!important}
      .bottom-col td{display:block!important;width:100%!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0c0c12;color:#f8f6f1;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="main-wrap" style="padding:24px 10px;background:#0c0c12">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="outer" style="max-width:980px;background:#111018;border:1px solid #2d293b;border-radius:22px;overflow:hidden">

      <!-- HEADER -->
      <tr><td align="center" style="padding:28px 20px 24px;border-bottom:1px solid #2d293b;background:linear-gradient(135deg,#211d38,#151c21)">
        <div style="display:inline-block;width:44px;height:44px;line-height:44px;border-radius:12px;background:#9f8cff;color:#15121f;font-size:22px">🧠</div>
        <div style="margin-top:9px;color:#fff;font-size:16px;font-weight:bold;letter-spacing:3px">NEXUS</div>
        <div style="margin-top:3px;color:#817b91;font-size:9px;letter-spacing:3px">COGNITIVE INSIGHT</div>
        <p style="max-width:620px;margin:18px auto 0;color:#8e8998;font-size:13px;line-height:1.7">Seu teste cognitivo Nexus foi concluído com sucesso. Confira abaixo o resumo do seu perfil e métricas detalhadas.</p>
      </td></tr>

      <!-- BODY -->
      <tr><td class="body-pad" style="padding:30px 24px">
        <div style="color:#5bd6c5;font-size:10px;font-weight:bold;letter-spacing:3px;text-transform:uppercase">Relatório desbloqueado</div>
        <h1 style="margin:10px 0 18px;color:#fff;font-size:30px">Olá, ${data.name || "explorador"}.</h1>

        <!-- SCORE + MAPA -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="two-col">
          <tr>
            <td width="28%" valign="top" style="padding-right:8px">
              ${scoreBox}
            </td>
            <td width="72%" valign="top" style="padding-left:8px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#202429;border:1px solid #303640;border-radius:22px">
                <tr><td style="padding:28px 24px">
                  <div style="color:#777184;font-size:10px;letter-spacing:3px">MAPA DE DESEMPENHO</div>
                  <h2 style="margin:9px 0 22px;color:#fff;font-size:21px">Suas dimensões cognitivas</h2>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${categories}</table>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- PERFIL + CAMINHOS -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="two-col" style="margin-top:14px">
          <tr>
            <td width="50%" valign="top" class="bottom-col" style="padding-right:8px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#211f21;border:1px solid #4d3d76;border-radius:22px">
                <tr><td style="padding:26px">
                  <div style="color:#9f8cff;font-size:10px;letter-spacing:3px">PERFIL COGNITIVO</div>
                  ${data.processingStyle ? `<div style="display:inline-block;margin-top:10px;padding:6px 10px;border:1px solid #5bd6c555;border-radius:999px;color:#7fe6d7;font-size:10px">${data.processingStyle}</div>` : ""}
                  <h2 style="margin:12px 0;color:#fff;font-size:22px">${data.profileTitle}</h2>
                  <p style="margin:0;color:#aaa5b0;font-size:13px;line-height:1.7">${data.profileDescription}</p>
                  ${data.primaryCategory ? `<div style="margin-top:20px;color:#d5ceff;font-size:11px"><span style="padding:6px 9px;background:#9f8cff22;border-radius:7px">Principal: <strong>${data.primaryCategory}</strong></span>${data.secondaryCategory ? ` <span style="padding:6px 9px;background:#f6c66a22;border-radius:7px;color:#ffe4aa">Secundário: <strong>${data.secondaryCategory}</strong></span>` : ""}</div>` : ""}
                </td></tr>
              </table>
            </td>
            <td width="50%" valign="top" class="bottom-col" style="padding-left:8px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#211f21;border:1px solid #40362c;border-radius:22px">
                <tr><td style="padding:26px">
                  <div style="color:#f6c66a;font-size:10px;letter-spacing:3px">PRÓXIMOS CAMINHOS</div>
                  <h2 style="margin:12px 0 20px;color:#fff;font-size:21px">Profissões &amp; Cursos</h2>
                  <div style="margin-bottom:9px;color:#777184;font-size:10px;font-weight:bold;letter-spacing:1px">PROFISSÕES</div>
                  ${tags(data.recommendations, "#9f8cff")}
                  <div style="margin:14px 0 9px;color:#777184;font-size:10px;font-weight:bold;letter-spacing:1px">ESPECIALIZAÇÕES</div>
                  ${tags(data.courses || [], "#f6c66a")}
                </td></tr>
              </table>
            </td>
          </tr>
        </table>

      </td></tr>

      <!-- FOOTER -->
      <tr><td style="padding:20px;text-align:center;border-top:1px solid #2d293b;color:#777184;font-size:10px;line-height:1.6">
        © 2026 Nexus Cognitive Insight.<br>Este relatório tem caráter informativo e não substitui avaliação psicológica profissional.
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
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
    const reportData = body.reportData;

    if (!email || !reportData || !reportData.name) {
      return json({ success: false, message: "E-mail do destinatário e dados do relatório são obrigatórios." }, 400);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY") || "";
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Nexus Cognitive <noreply@mailer.kitoexpert.online>";

    if (!apiKey) {
      return json({ success: true, isSimulated: true, message: "Modo de simulação: configure RESEND_API_KEY no Supabase para envio real." });
    }

    const htmlContent = buildCognitiveReportHtml(reportData);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `Seu Relatório de Q.I. Nexus (${reportData.score} pts) - ${reportData.name}`,
        html: htmlContent,
        headers: {
          "List-Unsubscribe": "<mailto:unsubscribe@kitoexpert.online>, <https://kitoexpert.online/unsubscribe>",
          "X-Priority": "1",
          "X-MSMail-Priority": "High",
          "Importance": "high",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Resend] Error sending report email:", response.status, errorText);
      return json({ success: false, message: `Erro ao enviar relatório: ${response.status}` }, 500);
    }

    const result = await response.json();
    return json({ success: true, emailId: result.id, message: "Relatório enviado com sucesso para o seu e-mail!" });
  } catch (error: any) {
    console.error("Erro em email-send-report:", error);
    return json({ success: false, message: error.message || "Erro interno ao enviar relatório." }, 500);
  }
});
