import * as React from "react";
import { useState, useEffect } from "react";
import { categoryColors, type Category, type Question } from "@/data/questions";
import { CategoryBadge } from "@/components/quiz/CategoryBadge";

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  onAnswer: (option: number) => void;
  onSoundSelect?: () => void;
}

const optionLetters = ["A", "B", "C", "D"];

export function QuestionCard({
  question,
  questionIndex,
  onAnswer,
  onSoundSelect,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const [entered, setEntered] = useState(false);

  // Reset + entrance animation on new question
  useEffect(() => {
    setSelected(null);
    setAnimating(false);
    setEntered(false);
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(t);
  }, [questionIndex]);

  const handleSelect = (index: number) => {
    if (selected !== null || animating) return;
    setSelected(index);
    setAnimating(true);
    onSoundSelect?.();
    setTimeout(() => {
      onAnswer(index);
    }, 480);
  };

  const color = categoryColors[question.category as Category] || "#9f8cff";

  return (
    <div
      className="relative overflow-hidden rounded-[2rem] border bg-white/[.04] p-6 sm:p-10 transition-all duration-500"
      style={{
        borderColor: `${color}30`,
        boxShadow: `0 0 40px ${color}12, 0 8px 48px rgba(0,0,0,0.35)`,
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0) scale(1)" : "translateY(20px) scale(0.98)",
        transition: "opacity 0.45s cubic-bezier(0.16,1,0.3,1), transform 0.45s cubic-bezier(0.16,1,0.3,1), border-color 0.3s",
      }}
    >
      {/* Top color accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[2rem]"
        style={{ background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }}
      />

      {/* Header row */}
      <div className="mb-8 flex items-center justify-between">
        <CategoryBadge category={question.category as Category} />
        <span className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[.03] px-3 py-1 text-[11px] text-white/40">
          ⏱ responda no seu ritmo
        </span>
      </div>

      {/* Question text */}
      <h3
        className="text-2xl font-semibold leading-snug sm:text-3xl"
        style={{ transition: "opacity 0.3s" }}
      >
        {question.prompt}
      </h3>

      {/* Options */}
      <div className="mt-9 grid gap-3">
        {question.options.map((option, index) => {
          const isSelected = selected === index;
          const isOther = selected !== null && !isSelected;

          return (
            <button
              key={option}
              id={`option-${index}`}
              onClick={() => handleSelect(index)}
              disabled={selected !== null}
              className="option-btn group relative flex items-center gap-4 rounded-2xl border p-4 text-left"
              style={{
                borderColor: isSelected ? `${color}80` : "rgba(255,255,255,0.08)",
                backgroundColor: isSelected
                  ? `${color}18`
                  : "rgba(255,255,255,0.025)",
                opacity: isOther ? 0.42 : 1,
                transform: isSelected
                  ? "translateX(8px) scale(1.01)"
                  : isOther
                  ? "translateX(0)"
                  : undefined,
                transition: "all 0.28s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: isSelected ? `0 0 20px ${color}25` : "none",
              }}
            >
              {/* Letter badge */}
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold transition-all duration-200"
                style={{
                  backgroundColor: isSelected ? color : "rgba(255,255,255,0.06)",
                  color: isSelected ? "#12111a" : "rgba(255,255,255,0.5)",
                  border: isSelected ? "none" : "1px solid rgba(255,255,255,0.1)",
                  transform: isSelected ? "scale(1.1)" : "scale(1)",
                }}
              >
                {isSelected ? "✓" : optionLetters[index]}
              </span>

              {/* Option text */}
              <span
                className="text-base font-medium transition-colors duration-200"
                style={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.72)" }}
              >
                {option}
              </span>

              {/* Ripple on selection */}
              {isSelected && (
                <span
                  className="absolute inset-0 rounded-2xl animate-ripple"
                  style={{ backgroundColor: `${color}20` }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Subtle corner decoration */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full opacity-10"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 70%)`,
          transform: "translate(30%, 30%)",
        }}
      />
    </div>
  );
}
