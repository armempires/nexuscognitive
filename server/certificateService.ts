import crypto from "crypto";
import axios from "axios";
import type { CognitiveReportData } from "../shared/report-template";
import { getResendConfig } from "./emailService";

export type CertificateData = CognitiveReportData & {
  testDate: string;
  processingStyle?: string;
  primaryCategory?: string;
  secondaryCategory?: string;
  courses?: string[];
};

type SignedCertificate = {
  data: CertificateData;
  signature: string;
};

function getCertificateSecret() {
  return process.env.CERTIFICATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "development-certificate-secret";
}

function getPublicBaseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT || 3000}`;
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decode<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getCertificateSecret()).update(payload).digest("hex");
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function createCertificate(data: CertificateData) {
  const payload = encode(data);
  const signature = sign(payload);
  const token = encode({ data: payload, signature });
  const code = `NXS-${signature.slice(0, 12).toUpperCase()}`;
  const validationUrl = `${getPublicBaseUrl()}/api/certificate/validate/${token}`;
  const downloadUrl = `${getPublicBaseUrl()}/api/certificate/download/${token}`;

  return { data, token, code, validationUrl, downloadUrl };
}

export function readCertificate(token: string) {
  try {
    const signed = decode<{ data: string; signature: string }>(token);
    const expected = sign(signed.data);
    const expectedBuffer = Buffer.from(expected, "hex");
    const receivedBuffer = Buffer.from(signed.signature, "hex");

    if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
      return null;
    }

    const data = decode<CertificateData>(signed.data);
    return {
      data,
      token,
      code: `NXS-${expected.slice(0, 12).toUpperCase()}`,
      validationUrl: `${getPublicBaseUrl()}/api/certificate/validate/${token}`,
      downloadUrl: `${getPublicBaseUrl()}/api/certificate/download/${token}`,
    };
  } catch {
    return null;
  }
}

function renderList(items: string[], className: string) {
  return items.length
    ? `<div class="${className}">${items.map(item => `<span>${escapeHtml(item)}</span>`).join("")}</div>`
    : "<p class=\"muted\">Não informado</p>";
}

export function renderCertificateHtml(certificate: ReturnType<typeof createCertificate> | NonNullable<ReturnType<typeof readCertificate>>) {
  const { data, code, validationUrl, downloadUrl } = certificate;
  const date = new Date(data.testDate).toLocaleDateString("pt-BR", { dateStyle: "long" });
  const categories = data.categories.map(category => `
    <div class="category-row">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="category-label">
        <tr><td>${escapeHtml(category.name)}</td><td align="right"><strong>${category.value}%</strong></td></tr>
      </table>
      <div class="track"><div class="bar" style="width:${Math.max(0, Math.min(100, category.value))}%"></div></div>
    </div>`).join("");

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certificado Nexus - ${escapeHtml(data.name)}</title>
<style>
body{margin:0;background:#0c0c12;color:#f8f6f1;font-family:Arial,Helvetica,sans-serif;padding:24px 12px}.page{max-width:680px;margin:auto;background:#13121f;border:1px solid #37334c;border-radius:16px;overflow:hidden}.header{text-align:center;padding:28px 20px;border-bottom:1px solid #302d40;background:#1b1930}.mark{display:inline-block;background:#9f8cff;color:#13121f;font-weight:bold;border-radius:10px;padding:10px 12px;font-size:20px}.brand{margin:10px 0 2px;font-size:18px;letter-spacing:3px}.eyebrow{font-size:10px;letter-spacing:2px;color:#5bd6c5;text-transform:uppercase}.content{padding:24px}.intro{color:#a9a4b5;font-size:13px;line-height:1.6}.card{border:1px solid #37334c;background:#1a1824;border-radius:12px;padding:18px;margin-top:16px}.score{text-align:center}.score-number{font-size:42px;color:#f6c66a;font-weight:bold;margin:8px 0}.pill{display:inline-block;background:#3a3140;color:#ffe4aa;border-radius:999px;padding:5px 10px;font-size:11px}.title{font-size:18px;margin:0 0 8px}.muted{color:#9690a4;font-size:12px;line-height:1.5}.category-row{margin-top:12px}.category-label{font-size:12px;color:#ddd8e5}.category-label td{padding:0}.category-label strong{color:#b9a8ff}.track{height:7px;background:#302e38;border-radius:8px;margin-top:5px;overflow:hidden}.bar{height:100%;background:linear-gradient(90deg,#9f8cff,#5bd6c5);border-radius:8px}.signature{border-color:#5bd6c5;background:#152321}.signature strong{color:#7fe6d7}.code{font-family:monospace;letter-spacing:1px;color:#f6c66a}.tags span{display:inline-block;border:1px solid #4b4656;border-radius:999px;padding:5px 8px;margin:4px 4px 0 0;color:#ddd8e5;font-size:11px}.courses span{border-color:#927738;color:#ffe9ae}.footer{text-align:center;border-top:1px solid #302d40;padding:18px;color:#777184;font-size:10px;line-height:1.5}a{color:#9f8cff}
</style></head><body><div class="page"><div class="header"><div class="mark">✦</div><div class="brand">NEXUS</div><div class="muted" style="letter-spacing:3px;font-size:9px">COGNITIVE INSIGHT</div></div><div class="content"><div class="eyebrow">Certificado de resultado</div><h1 class="title" style="font-size:25px;margin-top:8px">${escapeHtml(data.name)}</h1><p class="intro">Certificamos que o resultado abaixo foi gerado pela avaliação cognitiva Nexus em <strong>${escapeHtml(date)}</strong>.</p><div class="card score"><div class="eyebrow" style="color:#9690a4">Pontuação Nexus</div><div class="score-number">${data.score} <span style="font-size:16px;color:#777184">/ 145</span></div><span class="pill">${escapeHtml(data.classification)}</span></div><div class="card"><h2 class="title">Desempenho por Dimensão</h2>${categories}</div><div class="card"><h2 class="title">${escapeHtml(data.profileTitle)}</h2><p class="muted">${escapeHtml(data.profileDescription)}</p>${data.processingStyle ? `<span class="pill">${escapeHtml(data.processingStyle)}</span>` : ""}${data.primaryCategory ? `<p class="muted"><strong>Principal:</strong> ${escapeHtml(data.primaryCategory)}${data.secondaryCategory ? ` &nbsp; <strong>Secundário:</strong> ${escapeHtml(data.secondaryCategory)}` : ""}</p>` : ""}</div><div class="card"><h2 class="title" style="color:#f6c66a">Profissões &amp; Cursos</h2><div class="muted"><strong>Profissões</strong></div>${renderList(data.recommendations, "tags")}<div class="muted" style="margin-top:12px"><strong>Especializações</strong></div>${renderList(data.courses || [], "tags courses")}</div><div class="card signature"><p class="muted" style="margin:0">Resultado assinado digitalmente por <strong>Nexus Cognitive Insight</strong>.</p><p class="muted">Código de validação: <span class="code">${code}</span></p><p class="muted" style="margin-bottom:0">Valide a autenticidade: <a href="${validationUrl}">${validationUrl}</a><br><a href="${downloadUrl}">Baixar certificado</a></p></div></div><div class="footer">© 2026 Nexus Cognitive Insight.<br>Este certificado é informativo e não substitui uma avaliação psicológica profissional.</div></div></body></html>`;
}

export async function sendCertificateEmail(recipientEmail: string, data: CertificateData) {
  const config = getResendConfig();
  const certificate = createCertificate(data);

  if (!config.apiKey) {
    return { success: true, isSimulated: true, code: certificate.code, validationUrl: certificate.validationUrl, downloadUrl: certificate.downloadUrl, message: "Modo de simulação: configure RESEND_API_KEY para envio real." };
  }

  try {
    await axios.post("https://api.resend.com/emails", {
      from: config.fromEmail,
      to: [recipientEmail],
      subject: `Certificado Nexus - ${data.name}`,
      html: renderCertificateHtml(certificate),
    }, { headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" } });

    return { success: true, isSimulated: false, code: certificate.code, validationUrl: certificate.validationUrl, downloadUrl: certificate.downloadUrl, message: "Certificado enviado para o seu e-mail." };
  } catch (error: any) {
    return { success: false, message: error?.response?.data?.message || error.message || "Erro ao enviar certificado." };
  }
}
