import { getResendConfig, sendConfirmationEmail } from "./emailService";
import { getSupabaseClient } from "./supabase";
import crypto from "crypto";

export interface EmailConfirmationResult {
  success: boolean;
  message?: string;
  isSimulated?: boolean;
}

export function generateConfirmationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function generateConfirmationId(): string {
  return crypto.randomUUID();
}

export async function createEmailConfirmation(email: string): Promise<EmailConfirmationResult> {
  const code = generateConfirmationCode();
  const id = generateConfirmationId();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const normalizedEmail = email.trim().toLowerCase();

  const supabase = getSupabaseClient();

  const { error: insertError } = await supabase
    .from("email_confirmations")
    .insert({
      id,
      email: normalizedEmail,
      code,
      expires_at: expiresAt,
    });

  if (insertError) {
    console.error("Erro ao salvar confirmação no Supabase:", insertError);
    return {
      success: false,
      message: "Erro ao salvar código de confirmação.",
    };
  }

  const config = getResendConfig();

  if (!config.apiKey) {
    return {
      success: true,
      message: `Código de demonstração: ${code}`,
      isSimulated: true,
    };
  }

  const response = await sendConfirmationEmail(normalizedEmail, code);

  if (response.success) {
    return {
      success: true,
      message: response.isSimulated
        ? `Código de demonstração: ${code}`
        : "Código de confirmação enviado para o seu e-mail!",
      isSimulated: response.isSimulated,
    };
  }

  return {
    success: false,
    message: response.message || "Erro ao enviar e-mail de confirmação.",
  };
}

export async function verifyEmailConfirmation(email: string, code: string): Promise<EmailConfirmationResult> {
  const cleanCode = code.replace(/\D/g, "").slice(0, 6);
  const normalizedEmail = email.trim().toLowerCase();

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("email_confirmations")
    .select("*")
    .eq("email", normalizedEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { success: false, message: "Nenhuma confirmação encontrada para este e-mail." };
  }

  if (data.confirmed_at) {
    return { success: false, message: "Este e-mail já foi confirmado." };
  }

  if (new Date(data.expires_at) < new Date()) {
    return { success: false, message: "Código expirado. Solicite um novo código." };
  }

  if (data.code !== cleanCode) {
    return { success: false, message: "Código inválido. Verifique e tente novamente." };
  }

  const { error: updateError } = await supabase
    .from("email_confirmations")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("id", data.id);

  if (updateError) {
    return { success: false, message: "Erro ao confirmar código." };
  }

  return { success: true, message: "E-mail confirmado com sucesso!" };
}

export async function isEmailConfirmed(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("email_confirmations")
    .select("confirmed_at")
    .eq("email", normalizedEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return !!data.confirmed_at;
}

export async function cleanupExpiredConfirmations(): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase
    .from("email_confirmations")
    .delete()
    .lt("expires_at", new Date().toISOString());
}
