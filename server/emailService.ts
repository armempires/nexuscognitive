import axios from "axios";
import { CognitiveReportData } from "../shared/report-template";

export interface EmailSendResult {
  success: boolean;
  emailId?: string;
  isSimulated?: boolean;
  message?: string;
  details?: any;
}

export function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY || "";
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Nexus Cognitive <noreply@mailer.kitoexpert.online>";
  return {
    apiKey,
    fromEmail,
    isConfigured: !!apiKey,
  };
}

export async function verifyResendDomain(fromEmail: string): Promise<{ verified: boolean; message?: string }> {
  const config = getResendConfig();
  if (!config.apiKey) {
    return { verified: false, message: "Resend não configurado." };
  }

  try {
    const domainMatch = fromEmail.match(/<(.+?)>/);
    const domain = domainMatch ? domainMatch[1].split("@")[1] : fromEmail.split("@")[1];

    if (!domain) {
      return { verified: false, message: "Domínio não identificado no remetente." };
    }

    const response = await axios.get(
      `https://api.resend.com/domains`,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      }
    );

    const domains = response.data?.data || [];
    const domainRecord = domains.find((d: any) => d.name === domain);

    if (!domainRecord) {
      return {
        verified: false,
        message: `Domínio "${domain}" não encontrado na conta Resend. Verifique se o domínio está adicionado e verificado no painel do Resend.`
      };
    }

    if (domainRecord.status === "verified") {
      return { verified: true, message: `Domínio "${domain}" verificado com sucesso.` };
    }

    return {
      verified: false,
      message: `Domínio "${domain}" encontrado, mas status é "${domainRecord.status}". Aguarde a verificação ou verifique os registros DNS.`
    };
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || error.message || "Erro ao verificar domínio.";
    return { verified: false, message: errorMsg };
  }
}

// URL base pública do projeto (usada para montar o link da imagem do anel de score).
// Configure PUBLIC_BASE_URL nas variáveis de ambiente da Vercel, ex: https://seu-projeto.vercel.app
function getPublicBaseUrl(): string {
  return process.env.PUBLIC_BASE_URL || process.env.APP_URL || "http://localhost:3000";
}

// Monta a URL da imagem do anel de score, gerada pela rota /api/score-ring (@vercel/og).
// Substitui o antigo <svg> que não renderizava no Gmail.
function buildScoreRingImageUrl(score: number, max: number, label: string): string {
  const baseUrl = getPublicBaseUrl();
  const params = new URLSearchParams({
    score: String(score),
    max: String(max),
    label,
  });
  return `${baseUrl}/api/score-ring?${params.toString()}`;
}

export function buildCognitiveReportHtml(data: CognitiveReportData): string {
  const colors: Record<string, string> = {
    Lógico: "#9f8cff",
    Visual: "#5bd6c5",
    Verbal: "#f6c66a",
    Padrões: "#ff8da1",
  };
  const categories = data.categories.map(category => {
    const color = colors[category.name] || "#9f8cff";
    const width = Math.max(0, Math.min(100, category.value));
    return `<tr><td style="padding:0 0 13px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:13px;color:#d6d2df;font-weight:600">${category.name}</td><td align="right" style="font-size:13px;color:${color};font-weight:700">${category.value}%</td></tr><tr><td colspan="2" style="padding-top:7px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#302e38;border-radius:8px"><tr><td width="${width}%" height="8" style="background:${color};border-radius:8px;font-size:1px;line-height:8px">&nbsp;</td><td style="font-size:1px;line-height:8px">&nbsp;</td></tr></table></td></tr></table></td></tr>`;
  }).join("");
  const tags = (items: string[], color: string) => items.map(item => `<span style="display:inline-block;margin:0 5px 6px 0;padding:6px 10px;border:1px solid ${color}55;border-radius:999px;background:${color}12;color:#e7e1ed;font-size:11px">${item}</span>`).join("");

  const scoreLabel = data.classification === "A desenvolver" ? "Abaixo da média" : data.classification === "Faixa média" ? "Médio" : data.classification;
  const ringImageUrl = buildScoreRingImageUrl(data.score, 145, scoreLabel);

  return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Seu relatório Nexus</title></head><body style="margin:0;padding:24px 10px;background:#0c0c12;color:#f8f6f1;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:980px;background:#111018;border:1px solid #2d293b;border-radius:22px;overflow:hidden"><tr><td align="center" style="padding:28px 20px 24px;border-bottom:1px solid #2d293b;background:linear-gradient(135deg,#211d38,#151c21)"><div style="display:inline-block;width:44px;height:44px;line-height:44px;border-radius:12px;background:#9f8cff;color:#15121f;font-size:22px">🧠</div><div style="margin-top:9px;color:#fff;font-size:16px;font-weight:bold;letter-spacing:3px">NEXUS</div><div style="margin-top:3px;color:#817b91;font-size:9px;letter-spacing:3px">COGNITIVE INSIGHT</div><p style="max-width:620px;margin:18px auto 0;color:#8e8998;font-size:13px;line-height:1.7">Seu teste cognitivo Nexus foi concluído com sucesso. Confira abaixo o resumo do seu perfil e métricas detalhadas.</p></td></tr><tr><td style="padding:30px 24px"><div style="color:#5bd6c5;font-size:10px;font-weight:bold;letter-spacing:3px;text-transform:uppercase">Relatório desbloqueado</div><h1 style="margin:10px 0 8px;color:#fff;font-size:30px">Olá, ${data.name || "explorador"}.</h1><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="28%" valign="top" style="padding-right:8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#211e2d;border:1px solid #393449;border-radius:22px"><tr><td align="center" style="padding:28px 12px"><div style="color:#777184;font-size:10px;letter-spacing:3px">SCORE NEXUS</div><img src="${ringImageUrl}" width="180" height="180" alt="Score ${data.score} de 145" style="display:block;margin:18px auto 10px;border:0;max-width:180px" /><p style="max-width:180px;margin:24px auto 0;color:#96909f;font-size:12px;line-height:1.7">Você apresentou desempenho equilibrado em relação ao conjunto de referência.</p></td></tr></table></td><td width="72%" valign="top" style="padding-left:8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#202429;border:1px solid #303640;border-radius:22px"><tr><td style="padding:28px 24px"><div style="color:#777184;font-size:10px;letter-spacing:3px">MAPA DE DESEMPENHO</div><h2 style="margin:9px 0 22px;color:#fff;font-size:21px">Suas dimensões cognitivas</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${categories}</table></td></tr></table></td></tr></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="50%" valign="top" style="padding:18px 8px 0 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="height:100%;background:#211f21;border:1px solid #4d3d76;border-radius:22px"><tr><td style="padding:26px"><div style="color:#9f8cff;font-size:10px;letter-spacing:3px">PERFIL COGNITIVO</div>${data.processingStyle ? `<div style="display:inline-block;margin-top:10px;padding:6px 10px;border:1px solid #5bd6c555;border-radius:999px;color:#7fe6d7;font-size:10px">${data.processingStyle}</div>` : ""}<h2 style="margin:12px 0;color:#fff;font-size:22px">${data.profileTitle}</h2><p style="margin:0;color:#aaa5b0;font-size:13px;line-height:1.7">${data.profileDescription}</p>${data.primaryCategory ? `<div style="margin-top:20px;color:#d5ceff;font-size:11px"><span style="padding:6px 9px;background:#9f8cff22;border-radius:7px">Principal: <strong>${data.primaryCategory}</strong></span>${data.secondaryCategory ? ` <span style="padding:6px 9px;background:#f6c66a22;border-radius:7px;color:#ffe4aa">Secundário: <strong>${data.secondaryCategory}</strong></span>` : ""}</div>` : ""}</td></tr></table></td><td width="50%" valign="top" style="padding:18px 0 0 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="height:100%;background:#211f21;border:1px solid #40362c;border-radius:22px"><tr><td style="padding:26px"><div style="color:#f6c66a;font-size:10px;letter-spacing:3px">PRÓXIMOS CAMINHOS</div><h2 style="margin:12px 0 20px;color:#fff;font-size:21px">Profissões &amp; Cursos</h2><div style="margin-bottom:9px;color:#777184;font-size:10px;font-weight:bold;letter-spacing:1px">PROFISSÕES</div>${tags(data.recommendations, "#9f8cff")}<div style="margin:14px 0 9px;color:#777184;font-size:10px;font-weight:bold;letter-spacing:1px">ESPECIALIZAÇÕES</div>${tags(data.courses || [], "#f6c66a")}</td></tr></table></td></tr></table></td></tr><tr><td style="padding:20px;text-align:center;border-top:1px solid #2d293b;color:#777184;font-size:10px;line-height:1.6">© 2026 Nexus Cognitive Insight.<br>Este relatório tem caráter informativo e não substitui avaliação psicológica profissional.</td></tr></table></td></tr></table></body></html>`;
}

export async function sendReportEmail(recipientEmail: string, reportData: CognitiveReportData): Promise<EmailSendResult> {
  const config = getResendConfig();

  if (!config.apiKey) {
    return {
      success: true,
      isSimulated: true,
      message: "Modo de simulação ativado: Defina RESEND_API_KEY nas variáveis da Vercel para envio real de e-mails.",
    };
  }

  try {
    const htmlContent = buildCognitiveReportHtml(reportData);

    const payload: any = {
      from: config.fromEmail,
      to: [recipientEmail],
      subject: `Seu Relatório de Q.I. Nexus (${reportData.score} pts) - ${reportData.name}`,
      html: htmlContent,
      headers: {
        "List-Unsubscribe": "<mailto:unsubscribe@kitoexpert.online>, <https://kitoexpert.online/unsubscribe>",
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        "Importance": "high",
      },
    };

    const response = await axios.post(
      "https://api.resend.com/emails",
      payload,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const emailId = response.data?.id;

    console.log("[Resend] Email sent successfully", {
      emailId,
      to: recipientEmail,
      from: config.fromEmail,
      subject: payload.subject,
      statusCode: response.status,
      resendResponse: response.data,
    });

    return {
      success: true,
      emailId,
      isSimulated: false,
      message: "Relatório enviado com sucesso para o seu e-mail!",
    };
  } catch (error: any) {
    const errorDetails = error?.response?.data || error.message;
    const errorMsg = error?.response?.data?.message || error.message || "Erro ao enviar e-mail via Resend.";

    console.error("[Resend] Error sending email:", {
      error: errorDetails,
      to: recipientEmail,
      from: config.fromEmail,
      subject: `Seu Relatório de Q.I. Nexus (${reportData.score} pts) - ${reportData.name}`,
      statusCode: error?.response?.status,
      resendMessage: error?.response?.data?.message,
    });

    return {
      success: false,
      message: errorMsg,
      details: errorDetails,
    };
  }
}

export async function sendConfirmationEmail(recipientEmail: string, code: string): Promise<EmailSendResult> {
  const config = getResendConfig();

  if (!config.apiKey) {
    return {
      success: true,
      isSimulated: true,
      message: `Modo simulação: código ${code}`,
    };
  }

  const htmlContent = buildConfirmationEmailHtml(code);

  const payload: any = {
    from: config.fromEmail,
    to: [recipientEmail],
    subject: "Confirme seu e-mail - Nexus Cognitive Insight",
    html: htmlContent,
    headers: {
      "List-Unsubscribe": "<mailto:unsubscribe@kitoexpert.online>, <https://kitoexpert.online/unsubscribe>",
      "X-Priority": "1",
      "X-MSMail-Priority": "High",
      "Importance": "high",
    },
  };

  try {
    const response = await axios.post(
      "https://api.resend.com/emails",
      payload,
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const emailId = response.data?.id;

    console.log("[Resend] Confirmation email sent successfully", {
      emailId,
      to: recipientEmail,
      from: config.fromEmail,
      statusCode: response.status,
      resendResponse: response.data,
    });

    return {
      success: true,
      emailId,
      isSimulated: false,
      message: "Código de confirmação enviado para o seu e-mail!",
    };
  } catch (error: any) {
    const errorDetails = error?.response?.data || error.message;
    const errorMsg = error?.response?.data?.message || error.message || "Erro ao enviar e-mail de confirmação via Resend.";

    console.error("[Resend] Error sending confirmation email:", {
      error: errorDetails,
      to: recipientEmail,
      from: config.fromEmail,
      statusCode: error?.response?.status,
      resendMessage: error?.response?.data?.message,
    });

    return {
      success: false,
      message: errorMsg,
      details: errorDetails,
    };
  }
}

function buildConfirmationEmailHtml(code: string): string {
  return `
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
}
export async function checkResendAccountStatus(): Promise<{
  ok: boolean;
  status?: string;
  message?: string;
  details?: any;
}> {
  const config = getResendConfig();

  if (!config.apiKey) {
    return { ok: false, message: "Resend API key não configurada." };
  }

  try {
    const response = await axios.get("https://api.resend.com/emails", {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    return {
      ok: true,
      status: "active",
      message: "Conta Resend ativa.",
      details: response.data,
    };
  } catch (error: any) {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 403) {
      return {
        ok: false,
        status: "forbidden",
        message: "Conta Resend bloqueada ou em sandbox. Verifique sua conta no painel Resend.",
        details: data,
      };
    }

    if (status === 429) {
      return {
        ok: false,
        status: "rate_limited",
        message: "Limite de envio atingido no Resend.",
        details: data,
      };
    }

    return {
      ok: false,
      status: "error",
      message: data?.message || error.message || "Erro ao consultar Resend.",
      details: data || error.message,
    };
  }
}