import { useEffect, useState } from "react";
import { ArrowRight, Mail, RefreshCw, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { categoryColors } from "@/data/questions";
import type { CategoryStat, Profile, ScoreBand } from "@shared/qi-score";

interface ResultPageProps {
  name: string;
  email?: string;
  result: number;
  band: ScoreBand;
  categoryStats: CategoryStat[];
  profile: Profile;
  onRestart: () => void;
  soundEnabled: boolean;
  onSoundReveal: () => void;
}

const bandColors: Record<string, string> = {
  "A desenvolver":      "#ff8da1",
  "Faixa média":        "#f6c66a",
  "Acima da média":     "#5bd6c5",
  "Muito acima da média": "#9f8cff",
};

function ScoreRing({ score, max = 145 }: { score: number; max?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const pct = Math.min(score / max, 1);
  const r = 70;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / 1600, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(eased * score));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const color = bandColors[displayed < 85 ? "A desenvolver" : displayed <= 115 ? "Faixa média" : displayed <= 130 ? "Acima da média" : "Muito acima da média"] || "#9f8cff";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      <svg className="absolute inset-0 -rotate-90" width="180" height="180">
        {/* Track */}
        <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        {/* Progress */}
        <circle
          cx="90" cy="90" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{
            filter: `drop-shadow(0 0 8px ${color}90)`,
            transition: "stroke-dasharray 0.05s linear, stroke 0.5s",
          }}
        />
      </svg>
      <div className="text-center">
        <p className="text-5xl font-extrabold tracking-tight" style={{ color }}>{displayed}</p>
        <p className="text-xs text-white/35 mt-0.5">/ {max}</p>
      </div>
    </div>
  );
}

function CategoryBar({ category, value, delay }: CategoryStat & { delay: number }) {
  const [width, setWidth] = useState(0);
  const color = categoryColors[category as keyof typeof categoryColors] || "#9f8cff";

  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay + 300);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="font-medium text-white/75">{category}</span>
        <span className="font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/[.07]">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${Math.max(width, 4)}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: `0 0 10px ${color}60`,
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

export function ResultPage({
  name,
  email = "",
  result,
  band,
  categoryStats,
  profile,
  onRestart,
  soundEnabled: _soundEnabled,
  onSoundReveal,
}: ResultPageProps) {
  const [entered, setEntered] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(email);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  const bandColor = bandColors[band.label] || "#9f8cff";

  useEffect(() => {
    onSoundReveal?.();
    const t1 = setTimeout(() => setEntered(true), 60);
    
    // Auto-send report email if recipient email is available
    if (email) {
      handleSendEmail(email);
    }

    return () => { clearTimeout(t1); };
  }, []);

  const handleSendEmail = async (targetEmail?: string) => {
    const emailToUse = targetEmail || recipientEmail;
    if (!emailToUse) return;

    setSendingEmail(true);
    setEmailStatus(null);

    try {
      const response = await fetch("/api/email/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToUse,
          reportData: {
            name: name || "Explorador",
            score: result,
            classification: band.label,
            profileTitle: profile.title,
            profileDescription: profile.description,
            categories: categoryStats.map((c) => ({ name: c.category, value: c.value })),
            recommendations: profile.careers || [],
            processingStyle: profile.processingStyle,
            primaryCategory: profile.primaryCategory,
            secondaryCategory: profile.secondaryCategory,
            courses: profile.courses,
          },
        }),
      });

      const data = await response.json();
      setSendingEmail(false);

      if (data.success) {
        setEmailStatus({
          type: "success",
          message: data.message || `Relatório enviado com sucesso para ${emailToUse}!`,
        });
      } else {
        setEmailStatus({
          type: "error",
          message: data.message || "Erro ao enviar e-mail.",
        });
      }
    } catch (err: any) {
      setSendingEmail(false);
      setEmailStatus({
        type: "error",
        message: "Erro ao conectar com o serviço de e-mail.",
      });
    }
  };

  return (
    <section
      className="mx-auto max-w-5xl py-10 sm:py-16"
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "none" : "translateY(16px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      {/* ── Top header ─────────────────────────────────── */}
      <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#5bd6c5]">Relatório desbloqueado ✨</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Olá, <span className="gradient-text-purple">{name || "explorador"}</span>.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/50">
            Leitura indicativa baseada no seu desempenho. Não substitui avaliação psicológica profissional.
          </p>
        </div>
        <div
          className="shrink-0 flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold animate-slide-up"
          style={{ borderColor: `${bandColor}40`, backgroundColor: `${bandColor}12`, color: bandColor }}
        >
          <span>✓</span> {band.label}
        </div>
      </div>

      {/* ── Score + Category grid ───────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[auto_1fr]">

        {/* Score ring card */}
        <div className="glass-card flex flex-col items-center gap-5 rounded-3xl p-8 min-w-[220px] animate-scale-in">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Score Nexus</p>
          <ScoreRing score={result} />
          <div
            className="rounded-full px-4 py-1.5 text-sm font-semibold"
            style={{ backgroundColor: `${bandColor}20`, color: bandColor }}
          >
            {band.tone}
          </div>
          <p className="text-center text-xs leading-5 text-white/45 max-w-[180px]">{band.description}</p>
        </div>

        {/* Category bars card */}
        <div className="glass-card rounded-3xl p-7 sm:p-8 animate-scale-in delay-100">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-white/40">Mapa de desempenho</p>
          <h3 className="mb-6 text-xl font-bold">Suas dimensões cognitivas</h3>
          <div className="space-y-5">
            {categoryStats.map((stat, i) => (
              <CategoryBar key={stat.category} {...stat} delay={i * 120} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Profile + Recommendations ──────────────────── */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">

        {/* Cognitive profile */}
        <div className="glass-card relative overflow-hidden rounded-3xl p-7 sm:p-8 animate-slide-up delay-200">
          <div
            className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #9f8cff, transparent 70%)" }}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9f8cff]">Perfil cognitivo</p>
            {profile.processingStyle && (
              <span className="rounded-full border border-[#5bd6c5]/30 bg-[#5bd6c5]/10 px-2.5 py-1 text-[11px] font-semibold text-[#7fe6d7]">
                {profile.processingStyle}
              </span>
            )}
          </div>

          <h3 className="text-2xl font-bold">{profile.title}</h3>
          <p className="mt-3 text-sm leading-7 text-white/58">{profile.description}</p>

          {(profile.primaryCategory || profile.secondaryCategory) && (
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              {profile.primaryCategory && (
                <span className="rounded-lg bg-[#9f8cff]/20 px-2.5 py-1 font-medium text-[#d5ceff]">
                  Principal: <strong>{profile.primaryCategory}</strong>
                </span>
              )}
              {profile.secondaryCategory && profile.secondaryCategory !== profile.primaryCategory && (
                <span className="rounded-lg bg-[#f6c66a]/15 px-2.5 py-1 font-medium text-[#ffe4aa]">
                  Secundário: <strong>{profile.secondaryCategory}</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Careers + courses */}
        <div className="glass-card relative overflow-hidden rounded-3xl p-7 sm:p-8 animate-slide-up delay-300">
          <div
            className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #f6c66a, transparent 70%)" }}
          />

          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#f6c66a]">Próximos caminhos</p>
          <h3 className="mb-5 text-xl font-bold">Profissões & Cursos</h3>

          <div className="space-y-5">
            <div>
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-white/40">Profissões</p>
              <div className="flex flex-wrap gap-2">
                {(profile.careers || []).map(item => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[.05] px-3 py-1 text-xs font-medium text-white/75 transition-all duration-200 hover:border-white/20 hover:bg-white/[.09] hover:text-white"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {profile.courses && profile.courses.length > 0 && (
              <div>
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-white/40">Especializações</p>
                <div className="flex flex-wrap gap-2">
                  {profile.courses.map(item => (
                    <span
                      key={item}
                      className="rounded-full border border-[#f6c66a]/30 bg-[#f6c66a]/10 px-3 py-1 text-xs font-semibold text-[#ffe9ae] transition-all hover:bg-[#f6c66a]/15"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Resend Email Report Section ──────────────────────────────── */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-[#9f8cff]" />
              <h4 className="font-bold text-base">Receber Cópia em PDF/E-mail (Resend)</h4>
            </div>
            <p className="mt-1 text-xs text-white/50">
              Enviaremos uma cópia detalhada com todo o seu mapa cognitivo via Resend.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full sm:w-64 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/25 focus:border-[#9f8cff] focus:outline-none"
            />
            <button
              type="button"
              disabled={sendingEmail || !recipientEmail}
              onClick={() => handleSendEmail()}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#9f8cff] px-4 py-2.5 text-xs font-bold text-[#0c0c12] hover:bg-[#8e7aff] transition-all disabled:opacity-50"
            >
              {sendingEmail ? (
                <span>Enviando...</span>
              ) : (
                <>
                  <Send size={13} />
                  <span>Enviar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {emailStatus && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs ${
              emailStatus.type === "success"
                ? "border border-[#5bd6c5]/30 bg-[#5bd6c5]/10 text-[#5bd6c5]"
                : "border border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {emailStatus.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{emailStatus.message}</span>
          </div>
        )}
      </div>

      {/* ── Footer action ──────────────────────────────── */}
      <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-white/8 bg-white/[.02] p-5 text-center text-xs text-white/30 sm:flex-row sm:justify-between">
        <span className="flex items-center gap-1.5">
          <Mail size={13} />
          Serviço de e-mail integrado via Resend API
        </span>
        <button
          id="restart-btn"
          onClick={onRestart}
          className="flex items-center gap-1.5 rounded-full border border-[#9f8cff]/30 bg-[#9f8cff]/10 px-4 py-2 text-[#c5bcff] transition-all hover:bg-[#9f8cff]/20 hover:scale-105 active:scale-95"
        >
          <RefreshCw size={12} />
          Refazer o teste
        </button>
      </div>
    </section>
  );
}
