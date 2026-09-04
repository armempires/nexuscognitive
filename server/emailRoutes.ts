import { Express, Request, Response } from "express";
import { sendReportEmail, getResendConfig, verifyResendDomain, checkResendAccountStatus } from "./emailService";

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
}
