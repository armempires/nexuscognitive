import { Express, Request, Response } from "express";
import {
  createEmailConfirmation,
  verifyEmailConfirmation,
  isEmailConfirmed,
} from "./emailConfirmService";

export function registerEmailConfirmRoutes(app: Express) {
  app.post("/api/email-confirm/send", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== "string" || !email.includes("@")) {
        res.status(400).json({
          success: false,
          message: "E-mail inválido.",
        });
        return;
      }

      const result = await createEmailConfirmation(email.trim().toLowerCase());
      res.json(result);
    } catch (error: any) {
      console.error("Erro em /api/email-confirm/send:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Erro interno ao enviar código de confirmação.",
      });
    }
  });

  app.post("/api/email-confirm/verify", async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        res.status(400).json({
          success: false,
          message: "E-mail e código são obrigatórios.",
        });
        return;
      }

      const result = await verifyEmailConfirmation(email.trim().toLowerCase(), code);
      res.json(result);
    } catch (error: any) {
      console.error("Erro em /api/email-confirm/verify:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Erro interno ao verificar código.",
      });
    }
  });

  app.get("/api/email-confirm/status", async (req: Request, res: Response) => {
    try {
      const email = req.query.email as string;

      if (!email) {
        res.status(400).json({
          success: false,
          message: "E-mail é obrigatório.",
        });
        return;
      }

      const confirmed = await isEmailConfirmed(email.trim().toLowerCase());
      res.json({
        confirmed,
        email: email.trim().toLowerCase(),
      });
    } catch (error: any) {
      console.error("Erro em /api/email-confirm/status:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Erro interno ao verificar status.",
      });
    }
  });
}
