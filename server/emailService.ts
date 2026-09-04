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

export function buildCognitiveReportHtml(data: CognitiveReportData): string {
  const categoryItems = data.categories
    .map(
      (cat) => `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #e2e8f0; margin-bottom: 4px;">
          <span>${cat.name}</span>
          <span style="color: #9f8cff;">${cat.value}%</span>
        </div>
        <div style="background-color: rgba(255, 255, 255, 0.1); height: 8px; border-radius: 4px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #9f8cff, #5bd6c5); width: ${cat.value}%; height: 100%; border-radius: 4px;"></div>
        </div>
      </div>
    `
    )
    .join("");

  const recommendationsHtml = data.recommendations
    .map(
      (item) => `
      <li style="margin-bottom: 8px; font-size: 13px; color: #cbd5e1; line-height: 1.6;">
        ${item}
      </li>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório Nexus Cognitive Insight</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0c0c12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8f6f1;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0c0c12; padding: 30px 15px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #13121f; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; max-width: 600px; width: 100%;">
              <!-- Header -->
              <tr>
                <td style="padding: 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); background: linear-gradient(180deg, rgba(159,140,255,0.12), transparent);">
                  <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background-color: #9f8cff; color: #0c0c12; border-radius: 12px; font-size: 22px; font-weight: bold; margin-bottom: 10px;">🧠</div>
                  <h1 style="margin: 0; font-size: 20px; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">NEXUS</h1>
                  <p style="margin: 4px 0 0 0; font-size: 10px; letter-spacing: 3px; color: rgba(255,255,255,0.4); text-transform: uppercase;">Cognitive Insight</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 30px;">
                  <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #5bd6c5; margin: 0 0 8px 0; font-weight: bold;">Relatório Desbloqueado</p>
                  <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #ffffff;">Olá, ${data.name || "Explorador"}</h2>
                  <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 25px;">
                    Seu teste cognitivo Nexus foi concluído com sucesso. Confira abaixo o resumo do seu perfil e métricas detalhadas.
                  </p>
                  
                  <!-- Score Card -->
                  <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 25px;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8;">Pontuação Estimada</span>
                    <div style="font-size: 42px; font-weight: 800; color: #9f8cff; margin: 10px 0;">${data.score} <span style="font-size: 16px; color: #64748b; font-weight: 400;">/ 145</span></div>
                    <div style="display: inline-block; background-color: rgba(159,140,255,0.15); color: #c4b5ff; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;">${data.classification}</div>
                  </div>

                  <!-- Category Breakdown -->
                  <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; margin-bottom: 25px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 15px; color: #ffffff;">Desempenho por Dimensão</h3>
                    ${categoryItems}
                  </div>

                  <!-- Cognitive Profile -->
                  <div style="background-color: rgba(159,140,255,0.08); border: 1px solid rgba(159,140,255,0.2); border-radius: 16px; padding: 20px; margin-bottom: 25px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #ffffff;">${data.profileTitle}</h3>
                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #cbd5e1;">${data.profileDescription}</p>
                  </div>

                  <!-- Recommendations -->
                  <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #f6c66a;">Profissões e Caminhos Recomendados</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                      ${recommendationsHtml}
                    </ul>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: #64748b; line-height: 1.5;">
                  © 2026 Nexus Cognitive Insight. Todos os direitos reservados.<br/>
                  Este relatório tem caráter exclusivamente informativo e indicativo, não substituindo avaliações diagnósticas clínicas ou psicológicas profissionais.
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
