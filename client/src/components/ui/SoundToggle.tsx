import { Volume2, VolumeX } from "lucide-react";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { cn } from "@/lib/utils";

interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}

export function SoundToggle({ enabled, onToggle, className }: SoundToggleProps) {
  return (
    <AnimatedButton
      variant="ghost"
      size="icon"
      onClick={onToggle}
      onSoundClick={() => {}}
      className={cn("rounded-full", className)}
      aria-label={enabled ? "Desativar sons" : "Ativar sons"}
    >
      {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </AnimatedButton>
  );
}
