import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends React.ComponentProps<typeof Button> {
  onSoundClick?: () => void;
  onSoundHover?: () => void;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, onSoundClick, onSoundHover, onMouseEnter, onClick, children, ...props }, ref) => {
    const [isHovering, setIsHovering] = React.useState(false);
    const [isPressed, setIsPressed] = React.useState(false);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 150);
      onClick?.(e);
      onSoundClick?.();
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsHovering(true);
      onMouseEnter?.(e);
      onSoundHover?.();
    };

    return (
      <Button
        ref={ref}
        className={cn(
          "transition-all duration-200",
          isHovering && "translate-y-[-2px] shadow-lg",
          isPressed && "scale-[0.96]",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton };
