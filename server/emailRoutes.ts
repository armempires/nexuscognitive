import { Express, Request, Response } from "express";
import { sendReportEmail, getResendConfig, verifyResendDomain, checkResendAccountStatus } from "./emailService";
import { readCertificate, renderCertificateHtml, sendCertificateEmail, type CertificateData } from "./certificateService";

export function registerEmailRoutes(app: Express) {
  // Get Resend status
  app.get("/api/email/config", (_req: Request, res: Response) => {
    const config = getResendConfig();
    res.json({
      hasApiKey: config.isConfigured,
      fromEmail: config.fromEmail,
    });
  });

  // Verify Resend domain configuration
  app.get("/api/email/verify-domain", async (req: Request, res: Response) => {
    try {
      const fromEmail = req.query.from as string || process.env.RESEND_FROM_EMAIL || "noreply@mailer.kitoexpert.online";
      const result = await verifyResendDomain(fromEmail);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        verified: false,
        message: error.message || "Erro ao verificar domínio.",
      });
    }
  });

  // Check Resend account status
  app.get("/api/email/account-status", async (_req: Request, res: Response) => {
    try {
      const status = await checkResendAccountStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        message: error.message || "Erro ao verificar status da conta Resend.",
      });
    }
  });

  // Send Cognitive Report via Resend
  app.post("/api/email/send-report", async (req: Request, res: Response) => {
    try {
      const { email, reportData } = req.body;

      if (!email || !reportData || !reportData.name) {
        res.status(400).json({
          success: false,
          message: "E-mail do destinatário e dados do relatório são obrigatórios.",
        });
        return;
      }

      const result = await sendReportEmail(email, reportData);
      res.json(result);
    } catch (error: any) {
      console.error("Erro no envio de e-mail:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Erro interno ao enviar e-mail.",
      });
    }
  });

  app.post("/api/email/send-certificate", async (req: Request, res: Response) => {
    try {
      const { email, certificateData } = req.body;

      if (!email || !certificateData?.name || !certificateData?.testDate) {
        res.status(400).json({
          success: false,
          message: "E-mail e dados do certificado são obrigatórios.",
        });
        return;
      }

      res.json(await sendCertificateEmail(email, certificateData as CertificateData));
    } catch (error: any) {
      console.error("Erro no envio do certificado:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Erro interno ao enviar certificado.",
      });
    }
  });

  app.get("/api/certificate/validate/:token", (req: Request, res: Response) => {
    const certificate = readCertificate(req.params.token);
    if (!certificate) {
      res.status(404).json({ valid: false, message: "Certificado inválido ou adulterado." });
      return;
    }

    res.json({
      valid: true,
      code: certificate.code,
      name: certificate.data.name,
      score: certificate.data.score,
      classification: certificate.data.classification,
      testDate: certificate.data.testDate,
      signedBy: "Nexus Cognitive Insight",
    });
  });

  app.get("/api/certificate/download/:token", (req: Request, res: Response) => {
    const certificate = readCertificate(req.params.token);
    if (!certificate) {
      res.status(404).send("Certificado inválido ou adulterado.");
      return;
    }

    res
      .type("html")
      .setHeader("Content-Disposition", `attachment; filename="certificado-nexus-${certificate.code}.html"`)
      .send(renderCertificateHtml(certificate));
  });
}
