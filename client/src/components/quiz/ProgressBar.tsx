import { cn } from "@/lib/utils";

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className }: ProgressBarProps) {
  const progress = Math.round((current / total) * 100);
  const segments = Array.from({ length: total }, (_, i) => i);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Segmented dot progress */}
      <div className="flex items-center gap-1">
        {segments.map(i => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-500"
            style={{
              backgroundColor:
                i < current
                  ? "#9f8cff"
                  : i === current
                  ? "rgba(159,140,255,0.45)"
                  : "rgba(255,255,255,0.08)",
              boxShadow: i < current ? "0 0 6px rgba(159,140,255,0.6)" : "none",
              transform: i === current ? "scaleY(1.5)" : "scaleY(1)",
            }}
          />
        ))}
      </div>
      {/* Percentage label */}
      <div className="flex justify-between text-[11px] text-white/35">
        <span>{current} de {total} respondidas</span>
        <span className="font-semibold text-[#9f8cff]">{progress}%</span>
      </div>
    </div>
  );
}
