import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudio } from "@/components/audio/useAudio";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class MockOscillator {
  type = "sine";
  frequency = { setValueAtTime: vi.fn() };
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockGainNode {
  gain = {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
  connect = vi.fn();
}

Object.defineProperty(window, "AudioContext", {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    createOscillator: vi.fn(() => new MockOscillator()),
    createGain: vi.fn(() => new MockGainNode()),
    createBufferSource: vi.fn(),
    decodeAudioData: vi.fn(),
    resume: vi.fn(),
    destination: {},
    state: "running",
    currentTime: 0,
  })),
});

describe("useAudio", () => {
  it("initializes with sound enabled", () => {
    const { result } = renderHook(() => useAudio());
    expect(result.current.soundEnabled).toBe(true);
  });

  it("toggles sound", () => {
    const { result } = renderHook(() => useAudio());
    act(() => result.current.toggleSound());
    expect(result.current.soundEnabled).toBe(false);
    act(() => result.current.toggleSound());
    expect(result.current.soundEnabled).toBe(true);
  });

  it("plays synth sounds without throwing", () => {
    const { result } = renderHook(() => useAudio());
    expect(() => result.current.playSynth("click")).not.toThrow();
    expect(() => result.current.playSynth("select")).not.toThrow();
    expect(() => result.current.playSynth("whoosh")).not.toThrow();
    expect(() => result.current.playSynth("success")).not.toThrow();
    expect(() => result.current.playSynth("error")).not.toThrow();
    expect(() => result.current.playSynth("reveal")).not.toThrow();
  });

  it("does not play sounds when disabled", () => {
    const { result } = renderHook(() => useAudio());
    act(() => result.current.toggleSound());
    expect(() => result.current.playSynth("click")).not.toThrow();
  });
});
