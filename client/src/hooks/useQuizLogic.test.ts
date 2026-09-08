import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useQuizLogic } from "@/hooks/useQuizLogic";
import { questions } from "@/data/questions";

describe("useQuizLogic", () => {
  it("starts with default values", () => {
    const { result } = renderHook(() => useQuizLogic(questions));
    expect(result.current.current).toBe(0);
    expect(result.current.answers).toEqual([]);
    expect(result.current.seconds).toEqual([]);
  });

  it("resets quiz on startQuiz", () => {
    const { result } = renderHook(() => useQuizLogic(questions));
    act(() => result.current.startQuiz());
    expect(result.current.current).toBe(0);
    expect(result.current.answers).toEqual([]);
  });

  it("restores saved answers and elapsed times", () => {
    const { result } = renderHook(() => useQuizLogic(questions));
    const answers = questions.slice(0, 3).map(question => question.answer);
    const seconds = [8, 12, 20];

    act(() => result.current.restoreQuiz(answers, seconds, 3));

    expect(result.current.answers).toEqual(answers);
    expect(result.current.seconds).toEqual(seconds);
    expect(result.current.current).toBe(3);
    expect(result.current.categoryStats.find(stat => stat.category === "Lógico")?.value).toBe(14);
  });

  it("advances to next question on answer", () => {
    const { result } = renderHook(() => useQuizLogic(questions));
    act(() => result.current.startQuiz());
    act(() => result.current.answerQuestion(0));
    expect(result.current.current).toBe(1);
    expect(result.current.answers).toHaveLength(1);
  });

  it("computes result after answering all questions", () => {
    const { result } = renderHook(() => useQuizLogic(questions));
    act(() => result.current.startQuiz());
    for (let i = 0; i < questions.length; i++) {
      act(() => result.current.answerQuestion(questions[i].answer));
    }
    expect(result.current.current).toBeGreaterThanOrEqual(questions.length);
    expect(result.current.answers).toHaveLength(questions.length);
    expect(result.current.result).toBeGreaterThanOrEqual(70);
    expect(result.current.result).toBeLessThanOrEqual(145);
  });

  it("computes category stats", () => {
    const { result } = renderHook(() => useQuizLogic(questions));
    act(() => result.current.startQuiz());
    expect(result.current.categoryStats).toHaveLength(4);
    expect(result.current.categoryStats[0].category).toBe("Lógico");
  });

  it("computes dominant category", () => {
    const { result } = renderHook(() => useQuizLogic(questions));
    expect(result.current.dominantCategory).toBe("Lógico");
  });

  it("computes profile for dominant category", () => {
    const { result } = renderHook(() => useQuizLogic(questions));
    expect(result.current.profile.title).toBeDefined();
    expect(result.current.profile.primaryCategory).toBe("Lógico");
  });
});
