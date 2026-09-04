import { useState, useEffect } from "react";
import { ArrowRight, Sparkles, User, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LeadFormPageProps {
  name: string;
  email: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onContinue: () => void;
  soundEnabled: boolean;
  onSoundClick: () => void;
}

const confettiColors = ["#9f8cff", "#5bd6c5", "#f6c66a", "#ff8da1"];

function ConfettiDot({ x, y, color, delay }: { x: number; y: number; color: string; delay: number }) {
  return (
    <div
      className="absolute h-2 w-2 rounded-full animate-confetti-pop"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        backgroundColor: color,
        animationDelay: `${delay}ms`,
        animationDuration: "1.2s",
        animationFillMode: "both",
      }}
    />
  );
}

export function LeadFormPage({
  name,
  email,
  onNameChange,
  onEmailChange,
  onContinue,
  soundEnabled,
  onSoundClick,
}: LeadFormPageProps) {
  const [entered, setEntered] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const isValid = !!name.trim() && email.includes("@") && email.includes(".");

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 60);
    return () => clearTimeout(t);
  }, []);

  const confetti = Array.from({ length: 12 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    color: confettiColors[i % 4],
    delay: i * 80,
  }));

  return (
    <section
      className="mx-auto max-w-lg py-14 sm:py-20"
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "none" : "translateY(18px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      {/* Celebration header */}
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-[#5bd6c5]/20 bg-[#5bd6c5]/[.06] px-6 py-8 text-center">
        {confetti.map((c, i) => (
          <ConfettiDot key={i} {...c} />
        ))}

        {/* Animated check */}
        <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#5bd6c5]/15 animate-ripple" />
          <div className="absolute inset-0 rounded-full bg-[#5bd6c5]/10 animate-ripple delay-300" />
          <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-[#5bd6c5]/20 border border-[#5bd6c5]/40 animate-pulse-glow-teal">
            <span className="text-3xl">🎉</span>
          </div>
        </div>

        <p className="text-xs uppercase tracking-[0.22em] text-[#5bd6c5]">Avaliação concluída!</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">
          Seu resultado está pronto.
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Preencha seus dados para preparar sua leitura cognitiva completa.
        </p>
      </div>

      {/* Form card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-5">

        {/* Name input */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70">
            <User size={14} className="text-[#9f8cff]" />
            Seu nome
          </label>
          <div
            className="relative rounded-2xl transition-all duration-300"
            style={{
              boxShadow: nameFocused ? "0 0 0 2px rgba(159,140,255,0.5), 0 0 20px rgba(159,140,255,0.12)" : "none",
            }}
          >
            <Input
              id="lead-name"
              aria-label="Seu nome"
              value={name}
              onChange={e => onNameChange(e.target.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              placeholder="Como podemos chamar você?"
              className="h-13 rounded-2xl border-white/10 bg-white/[.05] text-white placeholder:text-white/25 focus:border-[#9f8cff]/50 focus:ring-0 focus-visible:ring-0"
            />
          </div>
          {name && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-[#5bd6c5]">
              <span>✓</span> Nome preenchido
            </p>
          )}
        </div>

        {/* Email input */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70">
            <Mail size={14} className="text-[#f6c66a]" />
            Seu e-mail
          </label>
          <div
            className="relative rounded-2xl transition-all duration-300"
            style={{
              boxShadow: emailFocused ? "0 0 0 2px rgba(246,198,106,0.45), 0 0 20px rgba(246,198,106,0.1)" : "none",
            }}
          >
            <Input
              id="lead-email"
              aria-label="Seu e-mail"
              type="email"
              value={email}
              onChange={e => onEmailChange(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              placeholder="voce@exemplo.com"
              className="h-13 rounded-2xl border-white/10 bg-white/[.05] text-white placeholder:text-white/25 focus:border-[#f6c66a]/50 focus:ring-0 focus-visible:ring-0"
            />
          </div>
          {email.includes("@") && email.includes(".") ? (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-[#5bd6c5]">
              <span>✓</span> E-mail válido
            </p>
          ) : email.length > 0 ? (
            <p className="mt-1.5 text-xs text-[#ff8da1]">
              Use um e-mail válido para receber o relatório.
            </p>
          ) : null}
        </div>

        {/* CTA */}
        <button
          id="lead-continue-btn"
          disabled={!isValid}
          onClick={() => { onSoundClick(); onContinue(); }}
          className="group mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold transition-all duration-300 disabled:opacity-35 disabled:cursor-not-allowed"
          style={{
            background: isValid
              ? "linear-gradient(135deg, #9f8cff 0%, #7c6aff 100%)"
              : "rgba(159,140,255,0.25)",
            color: isValid ? "#13111a" : "rgba(255,255,255,0.4)",
            boxShadow: isValid ? "0 0 24px rgba(159,140,255,0.4)" : "none",
            transform: isValid ? "translateY(0)" : "none",
          }}
        >
          <Sparkles size={16} className={isValid ? "animate-twinkle" : ""} />
          Ver meu resultado
          <ArrowRight
            size={17}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </button>

        <p className="text-center text-xs text-white/25">
          🔒 Seus dados são privados e usados apenas para preparar seu relatório.
        </p>
      </div>
    </section>
  );
}
