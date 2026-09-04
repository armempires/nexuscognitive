import { useCallback, useEffect, useRef, useState } from "react";

type SoundType = "click" | "select" | "whoosh" | "success" | "error" | "reveal";

const SOUND_FILES: Record<SoundType, string> = {
  click: "/sounds/click.mp3",
  select: "/sounds/select.mp3",
  whoosh: "/sounds/whoosh.mp3",
  success: "/sounds/success.mp3",
  error: "/sounds/error.mp3",
  reveal: "/sounds/reveal.mp3",
};

export function useAudio() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setSoundEnabled(false);
    }
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setSoundEnabled(false);
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const initContext = useCallback(() => {
    if (initializedRef.current) return null;
    const ctx = new AudioContext();
    setAudioContext(ctx);
    initializedRef.current = true;
    return ctx;
  }, []);

  const playTone = useCallback(
    (freq: number, duration: number, type: OscillatorType = "sine", volume = 0.1) => {
      if (!soundEnabled) return;
      let ctx = audioContext;
      if (!ctx) {
        ctx = initContext();
      }
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    },
    [audioContext, soundEnabled, initContext]
  );

  const playSynth = useCallback(
    (type: SoundType) => {
      if (!soundEnabled) return;
      switch (type) {
        case "click":
          playTone(800, 0.2, "sine", 0.08);
          break;
        case "select":
          playTone(523.25, 0.25, "sine", 0.1);
          setTimeout(() => playTone(659.25, 0.2, "sine", 0.08), 80);
          break;
        case "whoosh":
          playTone(200, 0.15, "sawtooth", 0.04);
          break;
        case "success":
          playTone(523.25, 0.2, "sine", 0.1);
          setTimeout(() => playTone(659.25, 0.2, "sine", 0.1), 100);
          setTimeout(() => playTone(783.99, 0.25, "sine", 0.1), 200);
          break;
        case "error":
          playTone(200, 0.3, "sine", 0.08);
          setTimeout(() => playTone(150, 0.3, "sine", 0.06), 100);
          break;
        case "reveal":
          playTone(392, 0.2, "sine", 0.08);
          setTimeout(() => playTone(440, 0.2, "sine", 0.08), 150);
          setTimeout(() => playTone(523.25, 0.3, "sine", 0.1), 300);
          setTimeout(() => playTone(659.25, 0.4, "sine", 0.1), 450);
          break;
        default:
          break;
      }
    },
    [playTone, soundEnabled]
  );

  const playFile = useCallback(
    async (type: SoundType) => {
      if (!soundEnabled) return;
      const src = SOUND_FILES[type];
      if (!src) return;
      try {
        let ctx = audioContext;
        if (!ctx) {
          ctx = initContext();
        }
        if (!ctx) return;
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = type === "whoosh";
        const gainNode = ctx.createGain();
        gainNode.gain.value = type === "reveal" || type === "success" ? 0.3 : 0.15;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start();
      } catch {
        // Ignore audio file errors and fall back to synthesized sounds
      }
    },
    [audioContext, soundEnabled, initContext]
  );

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  return {
    soundEnabled,
    toggleSound,
    playSynth,
    playFile,
    initContext,
  };
}
