import { useState, useEffect, useCallback } from "react";
import { Mail, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase";

interface EmailConfirmPageProps {
  email: string;
  onConfirmed: () => void;
  soundEnabled: boolean;
  onSoundClick: () => void;
}

export function EmailConfirmPage({
  email,
  onConfirmed,
  soundEnabled,
  onSoundClick,
}: EmailConfirmPageProps) {
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const sendCode = useCallback(async () => {
    setSending(true);
    setStatus(null);
    try {
      const { data, error } = await getSupabaseClient().functions.invoke("email-confirm-send", {
        body: { email },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus({
          type: "success",
          message: data.isSimulated
            ? `Modo demonstração: código ${data.message?.replace("Código de demonstração: ", "") || ""}`
            : "Código enviado! Verifique seu e-mail.",
        });
        setCooldown(60);
      } else {
        setStatus({ type: "error", message: data?.message || "Erro ao enviar código." });
      }
    } catch {
      setStatus({ type: "error", message: "Erro de conexão. Tente novamente." });
    } finally {
      setSending(false);
    }
  }, [email]);

  useEffect(() => {
    sendCode();
  }, [sendCode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setVerifying(true);
    setStatus(null);
    try {
      const { data, error } = await getSupabaseClient().functions.invoke("email-confirm-verify", {
        body: { email, code },
      });
      if (error) throw error;
      if (data?.success) {
        onConfirmed();
      } else {
        setStatus({ type: "error", message: data?.message || "Código inválido." });
      }
    } catch {
      setStatus({ type: "error", message: "Erro de conexão. Tente novamente." });
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = () => {
    setCode("");
    setStatus(null);
    setResent(true);
    sendCode();
    setTimeout(() => setResent(false), 2000);
  };

  return (
    <section className="mx-auto max-w-lg py-14 sm:py-20">
      <div className="text-center mb-10">
        <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#9f8cff]/15 animate-ripple" />
          <div className="relative grid h-14 w-14 place-items-center rounded-2xl border border-[#9f8cff]/30 bg-[#9f8cff]/15">
            <Mail size={24} className="text-[#9f8cff]" />
          </div>
        </div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#9f8cff]">Confirmação de e-mail</p>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
          Verifique seu e-mail
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Enviamos um código de 6 dígitos para<br />
          <span className="text-[#9f8cff] font-semibold">{email}</span>
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            disabled={verifying}
            containerClassName="gap-2"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || verifying}
            className="w-full h-13 rounded-2xl text-base font-bold disabled:opacity-40"
            style={{
              background: code.length === 6
                ? "linear-gradient(135deg, #9f8cff 0%, #7c6aff 100%)"
                : "rgba(159,140,255,0.25)",
              color: code.length === 6 ? "#13111a" : "rgba(255,255,255,0.4)",
            }}
          >
            {verifying ? "Verificando..." : "Confirmar e-mail"}
          </Button>

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || sending}
            className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} className={resent ? "animate-spin" : ""} />
            {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar código"}
          </button>
        </div>

        {status && (
          <div
            className={`flex items-start gap-2.5 rounded-xl p-3 text-xs ${
              status.type === "success"
                ? "border border-[#5bd6c5]/30 bg-[#5bd6c5]/10 text-[#5bd6c5]"
                : "border border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        <p className="text-center text-[10px] text-white/25">
          Não recebeu? Verifique a pasta de spam ou solicite um novo código.
        </p>
      </div>
    </section>
  );
}
