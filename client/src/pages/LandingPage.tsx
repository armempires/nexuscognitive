import { useEffect, useState } from "react";
import { ArrowRight, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { categoryColors } from "@/data/questions";
import type { Category } from "@/data/questions";

interface LandingPageProps {
  onStart: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const categories: { label: Category; pct: number }[] = [
  { label: "Lógico",   pct: 78 },
  { label: "Visual",   pct: 65 },
  { label: "Verbal",   pct: 82 },
  { label: "Padrões",  pct: 70 },
];

const benefits = [
  "Sem matemática complexa",
  "Resultado em ≈ 6 minutos",
  "Perfil cognitivo detalhado",
  "Linguagem não clínica",
];

export function LandingPage({ onStart, soundEnabled, onToggleSound }: LandingPageProps) {
  const [visible, setVisible] = useState(false);
  const [bars, setBars] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 80);
    const t2 = setTimeout(() => setBars(true), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <section className="relative py-12 sm:py-16 lg:py-20">

      {/* ── LEFT + RIGHT grid ── */}
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">

        {/* ── LEFT: copy ── */}
        <div className="max-w-2xl">

          {/* Eyebrow */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#9f8cff]/30 bg-[#9f8cff]/10 px-4 py-2 text-xs text-[#d8d1ff] transition-all duration-700"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)" }}
          >
            <Sparkles size={13} />
            Uma experiência de descoberta cognitiva
          </div>

          {/* Headline */}
          <h1
            className="text-5xl font-bold leading-[1.03] tracking-[-0.055em] sm:text-7xl transition-all duration-700 delay-100"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)" }}
          >
            Entenda como você{" "}
            <span className="gradient-text-purple">pensa</span>
            , conecta e{" "}
            <span className="gradient-text-purple">decide.</span>
          </h1>

          {/* Body */}
          <p
            className="mt-7 max-w-xl text-lg leading-8 text-white/62 transition-all duration-700 delay-150"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(14px)" }}
          >
            O Nexus transforma desafios de lógica, visão, linguagem e padrões em um
            retrato claro das suas forças cognitivas — sem matemática complexa e sem linguagem clínica.
          </p>

          {/* Why box */}
          <div
            className="mt-8 rounded-2xl border border-[#f6c66a]/20 bg-[#f6c66a]/[.06] p-5 text-sm leading-7 text-[#f8dfa4] transition-all duration-700 delay-200"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)" }}
          >
            <strong className="text-[#ffe9ae]">Por que fazer o teste?</strong>{" "}
            Para ganhar uma pausa de autopercepção: reconhecer como você aprende,
            resolve problemas e quais caminhos de estudo ou carreira podem combinar melhor com seu perfil.
          </div>

          {/* CTA row */}
          <div
            className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center transition-all duration-700 delay-300"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(12px)" }}
          >
            <button
              id="start-quiz-btn"
              onClick={onStart}
              className="group relative h-14 overflow-hidden rounded-full px-8 text-base font-bold text-[#15131d] transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9f8cff] active:scale-95 shimmer-btn animate-pulse-glow"
            >
              <span className="relative z-10 flex items-center gap-2">
                Começar minha descoberta
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </span>
            </button>

            <div className="flex items-center gap-3 px-2 text-sm text-white/50">
              <Clock3 size={17} className="shrink-0 text-[#f6c66a]" />
              <span>
                26 desafios · cerca de 6 min
                <br />
                <strong className="font-medium text-white/75">
                  Resultado indicativo e responsável
                </strong>
              </span>
            </div>
          </div>

          {/* Benefits chips */}
          <div
            className="mt-8 flex flex-wrap gap-2 transition-all duration-700 delay-400"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(10px)" }}
          >
            {benefits.map(b => (
              <span
                key={b}
                className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[.03] px-3 py-1.5 text-xs text-white/50"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#5bd6c5]" />
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* ── RIGHT: preview card ── */}
        <div
          className="group relative mx-auto w-full max-w-[480px] transition-all duration-1000 delay-200"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.94)" }}
        >
          {/* Glow behind card */}
          <div className="absolute -inset-6 rounded-[3rem] bg-[#9f8cff]/10 blur-3xl transition-opacity duration-700 group-hover:opacity-90" />

          {/* Card */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] p-8 backdrop-blur-sm">

            {/* Top accent bar */}
            <div
              className="absolute top-0 left-6 right-6 h-[2px] rounded-b-full"
              style={{ background: "linear-gradient(90deg, transparent, #9f8cff80, transparent)" }}
            />

            {/* Card header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#9f8cff] text-[#12111a] animate-pulse-glow">
                  {/* simple brain svg inline to avoid icon weirdness */}
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.61A3 3 0 0 1 4.5 9c0-1.1.59-2.07 1.5-2.62A2.5 2.5 0 0 1 9.5 2Z"/>
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.07-4.61A3 3 0 0 0 19.5 9c0-1.1-.59-2.07-1.5-2.62A2.5 2.5 0 0 0 14.5 2Z"/>
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-bold tracking-[.2em]">NEXUS</p>
                  <p className="text-[10px] uppercase tracking-[.26em] text-white/40">cognitive insight</p>
                </div>
              </div>

              {/* Simulated live dot */}
              <span className="flex items-center gap-1.5 rounded-full border border-[#5bd6c5]/30 bg-[#5bd6c5]/10 px-2.5 py-1 text-[10px] text-[#5bd6c5]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5bd6c5] opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#5bd6c5]" />
                </span>
                ao vivo
              </span>
            </div>

            {/* Category bars */}
            <div className="mt-10 space-y-4">
              {categories.map(({ label, pct }, i) => {
                const color = categoryColors[label];
                return (
                  <div key={label}>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-white/55 font-medium">{label}</span>
                      <span className="font-bold transition-all duration-500" style={{ color }}>
                        {bars ? `${pct}%` : "–"}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: bars ? `${pct}%` : "0%",
                          background: `linear-gradient(90deg, ${color}88, ${color})`,
                          boxShadow: bars ? `0 0 8px ${color}60` : "none",
                          transition: `width 0.9s cubic-bezier(0.4,0,0.2,1) ${i * 110}ms, box-shadow 0.9s ease ${i * 110}ms`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Score preview */}
            <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/8 bg-white/[.03] px-5 py-4">
              <div>
                <p className="text-[11px] text-white/35 uppercase tracking-wider">Score simulado</p>
                <p className="mt-1 text-4xl font-extrabold tracking-[-0.04em] gradient-text-purple">
                  142
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-white/35 uppercase tracking-wider">Faixa</p>
                <p className="mt-1 text-sm font-semibold text-[#9f8cff]">Acima da média</p>
              </div>
            </div>

            {/* Privacy note */}
            <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-white/30">
              <ShieldCheck size={12} className="text-[#5bd6c5]" />
              Experiência privada · sem diagnóstico clínico
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
