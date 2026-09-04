import { useEffect, useState } from "react";
import { Brain } from "lucide-react";
import { ProgressBar } from "@/components/quiz";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { categoryColors, type Category } from "@/data/questions";

interface QuizPageProps {
  current: number;
  total: number;
  question: {
    category: string;
    prompt: string;
    options: string[];
  };
  onAnswer: (option: number) => void;
  soundEnabled: boolean;
  onSoundSelect: () => void;
}

const categoryLabels: Record<string, string> = {
  Lógico:  "Raciocínio Lógico",
  Visual:  "Percepção Visual",
  Verbal:  "Linguagem & Conceitos",
  Padrões: "Reconhecimento de Padrões",
};

function QuizMinimap({ current, total }: { current: number; total: number }) {
  const dots = Array.from({ length: total }, (_, i) => i);
  return (
    <div className="flex items-center gap-[3px]">
      {dots.map(i => (
        <div
          key={i}
          className="rounded-full transition-all duration-400"
          style={{
            width: i === current ? 16 : 6,
            height: 6,
            backgroundColor:
              i < current
                ? "#9f8cff"
                : i === current
                ? "#c4b5ff"
                : "rgba(255,255,255,0.1)",
          }}
        />
      ))}
    </div>
  );
}

export function QuizPage({
  current,
  total,
  question,
  onAnswer,
  soundEnabled,
  onSoundSelect,
}: QuizPageProps) {
  const remaining = Math.max(1, Math.ceil((total - current) * 0.23));
  const cat = question.category as Category;
  const color = categoryColors[cat] || "#9f8cff";
  const label = categoryLabels[cat] || cat;
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="mx-auto max-w-3xl py-10 sm:py-16"
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "none" : "translateY(12px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      {/* Top row: category info + counter */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* Category dot pill */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300"
            style={{
              backgroundColor: `${color}18`,
              border: `1px solid ${color}35`,
              boxShadow: `0 0 12px ${color}18`,
            }}
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">
              {label}
            </p>
            <h2 className="mt-0.5 text-2xl font-bold tracking-tight">
              Desafio{" "}
              <span className="font-extrabold" style={{ color }}>
                {String(current + 1).padStart(2, "0")}
              </span>
              <span className="ml-1 text-base font-normal text-white/30">/ {total}</span>
            </h2>
          </div>
        </div>

        {/* Right: time estimate */}
        <div className="flex flex-col items-end gap-1">
          <QuizMinimap current={current} total={total} />
          <p className="text-xs text-white/35">≈ {remaining} min restantes</p>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar current={current} total={total} className="mb-10" />

      {/* Question card */}
      <QuestionCard
        question={question as any}
        questionIndex={current}
        onAnswer={onAnswer}
        onSoundSelect={onSoundSelect}
      />

      {/* Bottom disclaimer */}
      <p className="mt-6 text-center text-[11px] leading-5 text-white/25">
        O resultado é uma leitura indicativa de desempenho — sem diagnóstico clínico.
      </p>
    </section>
  );
}
