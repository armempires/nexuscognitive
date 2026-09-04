import { useState, useEffect, useRef } from "react";
import { ArrowRight, Check, ShieldCheck, Star, Copy, CreditCard, QrCode, RefreshCw, AlertCircle, Lock } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

interface PaymentPageProps {
  name?: string;
  email?: string;
  onConfirm: () => void;
  soundEnabled: boolean;
  onSoundClick: () => void;
  onSoundSuccess: () => void;
}

const features = [
  { icon: "🧠", text: "Score geral e faixa interpretativa de QI" },
  { icon: "📊", text: "Gráfico por dimensão cognitiva" },
  { icon: "🎯", text: "Perfil cognitivo híbrido personalizado" },
  { icon: "💼", text: "Profissões e cursos alinhados ao perfil" },
  { icon: "📧", text: "Relatório preparado para envio por e-mail" },
];

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ backgroundColor: color }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{4})$/, "$1-$2");
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

export function PaymentPage({
  name = "",
  email = "",
  onConfirm,
  soundEnabled: _soundEnabled,
  onSoundClick,
  onSoundSuccess,
}: PaymentPageProps) {
  const [entered, setEntered] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");

  // Customer form state
  const [customerName, setCustomerName] = useState(name || "");
  const [customerEmail, setCustomerEmail] = useState(email || "");
  const [customerCpf, setCustomerCpf] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Card form state
  const [cardHolderName, setCardHolderName] = useState(name || "");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCcv, setCardCcv] = useState("");

  // Status & processing states
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // PIX state
  const [pixData, setPixData] = useState<{
    orderId: string;
    paymentId: string;
    qrCodeImage?: string;
    payload?: string;
    isSimulated?: boolean;
    message?: string;
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [checkingPixStatus, setCheckingPixStatus] = useState(false);
  const [isRedirected, setIsRedirected] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 60);
    return () => {
      clearTimeout(t);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const checkPaymentStatus = async (orderId: string) => {
    try {
      setCheckingPixStatus(true);
      const { data, error } = await getSupabaseClient().functions.invoke("payment-status", {
        body: { orderId },
      });
      if (error) throw error;

      if (data.isConfirmed) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        handlePaymentSuccess();
        return;
      }

      const { data: reconcile } = await getSupabaseClient().functions.invoke("force-confirm-payment", {
        body: { orderId },
      });
      if (reconcile?.isConfirmed) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        handlePaymentSuccess();
      }
    } catch (err) {
      console.error("Erro ao verificar status do pagamento:", err);
    } finally {
      setCheckingPixStatus(false);
    }
  };

  const handlePaymentSuccess = () => {
    setConfirmed(true);
    setLoading(false);
    onSoundSuccess?.();
    setTimeout(() => {
      onConfirm();
    }, 1500);
  };

  const handleGeneratePix = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || !customerEmail.trim() || customerCpf.replace(/\D/g, "").length < 11) {
      setErrorMessage("Por favor, informe Nome completo, E-mail e CPF válido para gerar o PIX.");
      return;
    }

    onSoundClick();
    setLoading(true);

    try {
      const { data, error } = await getSupabaseClient().functions.invoke("create-payment", {
        body: {
          method: "pix",
          name: customerName,
          email: customerEmail,
          cpfCnpj: customerCpf,
          phone: customerPhone,
        },
      });

      if (!error && data?.qrCodeImage) {
        setLoading(false);
        setPixData(data);
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(() => checkPaymentStatus(data.orderId), 4000);
        return;
      }
      if (!error && data?.error) {
        setLoading(false);
        setErrorMessage(data.error);
        return;
      }

      const errObj: any = error;
      if (errObj) {
        let apiMessage: string | undefined;
        try {
          const ctx = errObj.context;
          if (ctx && typeof ctx.json === "function") {
            const body = await ctx.json();
            apiMessage = body?.refusalReason || body?.error;
          } else if (errObj.context && typeof errObj.context.text === "function") {
            const text = await errObj.context.text();
            try { apiMessage = JSON.parse(text)?.refusalReason || JSON.parse(text)?.error; } catch {}
          }
        } catch {}
        setLoading(false);
        setErrorMessage(apiMessage || errObj.message || "Erro ao gerar PIX. Verifique os dados e tente novamente.");
        return;
      }

      setLoading(false);
      setErrorMessage("Não foi possível gerar o PIX. Tente novamente.");
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || "Erro de comunicação com o gateway de pagamento.");
    }
  };

  const handlePayCreditCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCard = cardNumber.replace(/\D/g, "");
    const cleanCpf = customerCpf.replace(/\D/g, "");
    const [m, y] = cardExpiry.split("/");

    if (!cardHolderName.trim() || cleanCard.length < 13 || !m || !y || cardCcv.length < 3 || cleanCpf.length < 11) {
      setErrorMessage("Por favor, preencha todos os campos do cartão e do titular corretamente.");
      return;
    }

    onSoundClick();
    setLoading(true);

    try {
      const { data, error } = await getSupabaseClient().functions.invoke("create-payment", {
        body: {
          method: "card",
          name: customerName || cardHolderName,
          email: customerEmail,
          cpfCnpj: cleanCpf,
          phone: customerPhone || "11999999999",
          card: {
            holderName: cardHolderName,
            number: cleanCard,
            expiryMonth: m,
            expiryYear: y,
            ccv: cardCcv,
          },
        },
      });

      if (!error && data?.isConfirmed) {
        handlePaymentSuccess();
        return;
      }
      if (!error && data?.refused) {
        setLoading(false);
        setErrorMessage(data.refusalReason || data.error || "Cartão recusado pela operadora. Verifique os dados ou tente outro cartão.");
        return;
      }
      if (!error && data?.orderId) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(() => checkPaymentStatus(data.orderId), 4000);
        setErrorMessage("Pagamento enviado. Aguardando confirmação da operadora...");
        return;
      }
      if (!error && data?.error) {
        setLoading(false);
        setErrorMessage(data.error);
        return;
      }

      const errObj: any = error;
      if (errObj) {
        let apiMessage: string | undefined;
        try {
          const ctx = errObj.context;
          if (ctx && typeof ctx.json === "function") {
            const body = await ctx.json();
            apiMessage = body?.refusalReason || body?.error;
          } else if (errObj.context && typeof errObj.context.text === "function") {
            const text = await errObj.context.text();
            try { apiMessage = JSON.parse(text)?.refusalReason || JSON.parse(text)?.error; } catch {}
          }
        } catch {}
        setLoading(false);
        setErrorMessage(apiMessage || errObj.message || "Erro de comunicação com o gateway de pagamento.");
        return;
      }

      setLoading(false);
      setErrorMessage("Pagamento não processado. Tente novamente.");
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || "Erro de comunicação com o gateway de pagamento.");
    }
  };

  const copyPixPayload = () => {
    if (!pixData?.payload) return;
    navigator.clipboard.writeText(pixData.payload);
    setCopiedPix(true);
    onSoundClick();
    setTimeout(() => setCopiedPix(false), 3000);
  };

  return (
    <section
      className="mx-auto max-w-lg py-12 sm:py-16"
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "none" : "translateY(18px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#9f8cff]/15 animate-ripple" />
          <div className="relative grid h-14 w-14 place-items-center rounded-2xl border border-[#9f8cff]/30 bg-[#9f8cff]/15 animate-pulse-glow">
            <span className="text-2xl">🔐</span>
          </div>
        </div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#b9aeff]">Pagamento Seguro via Asaas</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">Desbloqueie seu Relatório</h2>
        <p className="mt-2 text-xs sm:text-sm text-white/50">
          Pagamento único sem assinatura. Acesso imediato após confirmação.
        </p>
      </div>

      {/* Main Card */}
      <div className="glass-card overflow-hidden rounded-3xl border border-white/10">
        {confirmed ? (
          <div className="flex flex-col items-center justify-center px-8 py-14 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-[#5bd6c5]/20 animate-ripple" />
              <div className="relative grid h-20 w-20 place-items-center rounded-full border-2 border-[#5bd6c5]/50 bg-[#5bd6c5]/20 animate-bounce-in">
                <Check size={36} className="text-[#5bd6c5]" />
              </div>
            </div>
            <p className="text-xl font-bold text-[#5bd6c5] animate-slide-up">Pagamento Confirmado!</p>
            <p className="mt-2 text-sm text-white/50 animate-slide-up delay-150">
              Liberando seu perfil cognitivo e resultados em instantes...
            </p>
            <div className="mt-6 flex gap-2 animate-slide-up delay-300">
              {["#9f8cff", "#5bd6c5", "#f6c66a", "#ff8da1"].map((c) => (
                <div key={c} className="h-2 w-8 rounded-full animate-pulse" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Offer row */}
            <div className="border-b border-white/10 bg-white/[0.02] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-base sm:text-lg">Relatório Nexus Completo</p>
                    <span className="rounded-full bg-[#f6c66a]/20 px-2 py-0.5 text-[10px] font-bold text-[#f6c66a] uppercase tracking-wider">
                      Sem Recorrência
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-white/45">
                    Pontuação QI + Perfil Cognitivo Híbrido + Profissões
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl sm:text-3xl font-extrabold gradient-text-purple">R$ 19,90</p>
                  <p className="text-[11px] text-white/30 line-through">R$ 39,90</p>
                </div>
              </div>
            </div>

            {/* Included Features */}
            <div className="space-y-2.5 p-5 sm:p-6 bg-white/[0.01]">
              {features.map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs sm:text-sm text-white/70">
                  <span className="text-base">{icon}</span>
                  {text}
                </div>
              ))}
            </div>

            {/* Payment Method Selector Tabs */}
            {isRedirected ? (
              <div className="p-6 sm:p-8 text-center space-y-4">
                <div className="flex justify-center mb-2">
                  <div className="h-12 w-12 rounded-full bg-[#9f8cff]/10 border border-[#9f8cff]/30 flex items-center justify-center">
                    <RefreshCw size={24} className="text-[#9f8cff] animate-spin" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white">Aguardando Pagamento na Asaas...</h3>
                <p className="text-xs text-white/60 max-w-sm mx-auto leading-relaxed">
                  Por favor, finalize o pagamento na página segura da Asaas. Assim que o pagamento for confirmado via webhook, seu relatório será liberado automaticamente.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => window.open(`https://www.asaas.com/cobranca?email=${encodeURIComponent(customerEmail)}&name=${encodeURIComponent(customerName)}`, "_blank")}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#9f8cff] px-5 py-3 text-xs font-bold text-[#0c0c12] hover:bg-[#8e7aff] transition-all"
                  >
                    Abrir Checkout Novamente
                  </button>
                </div>
                <p className="text-[10px] text-white/40">
                  Verificando status automaticamente para: <strong className="text-white/60">{customerEmail}</strong>
                </p>
              </div>
            ) : (
              <>
                <div className="px-5 pt-4 sm:px-6">
                  <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">
                    Selecione a forma de pagamento
                  </label>
                  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("pix");
                        setErrorMessage(null);
                        onSoundClick();
                      }}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-bold transition-all duration-200 ${
                        paymentMethod === "pix"
                          ? "bg-[#5bd6c5] text-[#0c0c12] shadow-lg shadow-[#5bd6c5]/20"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <QrCode size={16} />
                      ⚡ PIX Instantâneo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("card");
                        setErrorMessage(null);
                        onSoundClick();
                      }}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-bold transition-all duration-200 ${
                        paymentMethod === "card"
                          ? "bg-[#9f8cff] text-[#0c0c12] shadow-lg shadow-[#9f8cff]/20"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <CreditCard size={16} />
                      💳 Cartão de Crédito
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="mx-5 mt-4 sm:mx-6 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {paymentMethod === "pix" && (
                  <div className="p-5 sm:p-6 space-y-4">
                    {!pixData ? (
                      <form onSubmit={handleGeneratePix} className="space-y-3">
                        <div>
                          <label className="block text-xs text-white/50 mb-1">Nome completo do pagador</label>
                          <input
                            type="text"
                            required
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Ex: João da Silva"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/20 focus:border-[#5bd6c5] focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-white/50 mb-1">E-mail</label>
                            <input
                              type="email"
                              required
                              value={customerEmail}
                              onChange={(e) => setCustomerEmail(e.target.value)}
                              placeholder="seu@email.com"
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/20 focus:border-[#5bd6c5] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/50 mb-1">CPF (exigido pela Asaas)</label>
                            <input
                              type="text"
                              required
                              value={customerCpf}
                              onChange={(e) => setCustomerCpf(formatCpf(e.target.value))}
                              placeholder="000.000.000-00"
                              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/20 focus:border-[#5bd6c5] focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="group relative mt-2 h-13 w-full overflow-hidden rounded-2xl bg-[#5bd6c5] text-[#0c0c12] text-sm sm:text-base font-bold transition-all duration-300 hover:scale-[1.01] hover:shadow-xl active:scale-95 disabled:opacity-60 shimmer-btn"
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2 py-3">
                            {loading ? (
                              <>
                                <PulsingDot color="#0c0c12" />
                                Gerando PIX na Asaas...
                              </>
                            ) : (
                              <>
                                <QrCode size={18} />
                                Gerar PIX de R$ 19,90
                                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                              </>
                            )}
                          </span>
                        </button>
                      </form>
                    ) : (
                      <div className="flex flex-col items-center text-center space-y-4 pt-1">
                        <div className="rounded-2xl border border-[#5bd6c5]/30 bg-white p-4 shadow-xl">
                          {pixData.qrCodeImage ? (
                            <img
                              src={pixData.qrCodeImage}
                              alt="QR Code PIX Asaas"
                              className="h-44 w-44 object-contain"
                            />
                          ) : (
                            <div className="h-44 w-44 grid place-items-center text-gray-400">
                              QR Code indisponível
                            </div>
                          )}
                        </div>

                        <div className="w-full space-y-2">
                          <p className="text-xs text-white/60">Código Copia e Cola PIX:</p>
                          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
                            <input
                              type="text"
                              readOnly
                              value={pixData.payload || ""}
                              className="w-full bg-transparent px-2 text-[11px] text-white/80 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={copyPixPayload}
                              className="shrink-0 flex items-center gap-1 rounded-lg bg-[#5bd6c5] px-3 py-1.5 text-xs font-bold text-[#0c0c12] hover:bg-[#48c4b3] transition-colors"
                            >
                              <Copy size={13} />
                              {copiedPix ? "Copiado!" : "Copiar"}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between w-full pt-2">
                          <div className="flex items-center gap-2 text-xs text-[#5bd6c5]">
                            <PulsingDot color="#5bd6c5" />
                            <span>Aguardando pagamento...</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => checkPaymentStatus(pixData.orderId)}
                            disabled={checkingPixStatus}
                            className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors"
                          >
                            <RefreshCw size={12} className={checkingPixStatus ? "animate-spin" : ""} />
                            Verificar status
                          </button>
                        </div>

                        {pixData.isSimulated && (
                          <p className="text-[10px] text-amber-400/70 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                            ⚡ PIX em modo de demonstração. Clique em "Verificar status" acima ou configure ASAAS_API_KEY no arquivo .env para processar pagamentos reais.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === "card" && (
                  <form onSubmit={handlePayCreditCard} className="p-5 sm:p-6 space-y-3.5">
                    <div>
                      <label className="block text-xs text-white/50 mb-1">Nome no Cartão</label>
                      <input
                        type="text"
                        required
                        value={cardHolderName}
                        onChange={(e) => setCardHolderName(e.target.value)}
                        placeholder="COMO IMPRESSO NO CARTÃO"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm text-white uppercase placeholder-white/20 focus:border-[#9f8cff] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-white/50 mb-1">Número do Cartão</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="0000 0000 0000 0000"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/20 focus:border-[#9f8cff] focus:outline-none tracking-widest"
                        />
                        <CreditCard size={16} className="absolute right-3.5 top-3 text-white/30" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-white/50 mb-1">Validade (MM/AA)</label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/AA"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/20 focus:border-[#9f8cff] focus:outline-none text-center tracking-wider"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/50 mb-1">CVV</label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          value={cardCcv}
                          onChange={(e) => setCardCcv(e.target.value.replace(/\D/g, ""))}
                          placeholder="123"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/20 focus:border-[#9f8cff] focus:outline-none text-center tracking-widest"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs text-white/50 mb-1">CPF do Titular</label>
                        <input
                          type="text"
                          required
                          value={customerCpf}
                          onChange={(e) => setCustomerCpf(formatCpf(e.target.value))}
                          placeholder="000.000.000-00"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/20 focus:border-[#9f8cff] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/50 mb-1">Celular / WhatsApp</label>
                        <input
                          type="text"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                          placeholder="(11) 99999-9999"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/20 focus:border-[#9f8cff] focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative mt-3 h-13 w-full overflow-hidden rounded-2xl bg-[#9f8cff] text-[#0c0c12] text-sm sm:text-base font-bold transition-all duration-300 hover:scale-[1.01] hover:shadow-xl active:scale-95 disabled:opacity-60 shimmer-btn"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2 py-3">
                        {loading ? (
                          <>
                            <PulsingDot color="#0c0c12" />
                            Processando na Asaas...
                          </>
                        ) : (
                          <>
                            <Lock size={16} />
                            Pagar R$ 19,90 no Cartão
                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </span>
                    </button>
                  </form>
                )}
              </>
            )}

            {/* Gateway Footer Badge */}
            <div className="border-t border-white/5 bg-white/[0.02] px-6 py-3 text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-white/40">
                <ShieldCheck size={14} className="text-[#5bd6c5]" />
                <span>
                  Pagamento processado via <strong>Asaas</strong>
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Trust badges */}
      <div className="mt-6 flex items-center justify-center gap-5 text-xs text-white/30">
        <span className="flex items-center gap-1"><ShieldCheck size={12} /> Criptografia SSL 256-bit</span>
        <span>·</span>
        <span className="flex items-center gap-1"><Star size={12} /> Avaliação 4.9/5</span>
        <span>·</span>
        <span>Asaas Pagamentos</span>
      </div>
    </section>
  );
}
