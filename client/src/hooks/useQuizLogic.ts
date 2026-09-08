import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category, Question } from "@/data/questions";
import {
  calculateClientScore,
  calculateDetailedProfile,
  calculateScore,
  classify,
  type CategoryStat,
  type Profile,
  type ScoreBand,
} from "@shared/qi-score";

export function useQuizLogic(questions: Question[]) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [seconds, setSeconds] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [questionStarted, setQuestionStarted] = useState(Date.now());
  const [startedAt, setStartedAt] = useState(Date.now());

  const startQuiz = useCallback(() => {
    setCurrent(0);
    setAnswers([]);
    setSeconds([]);
    setStartedAt(Date.now());
    setQuestionStarted(Date.now());
  }, []);

  const restoreQuiz = useCallback(
    (
      savedAnswers: number[],
      savedSeconds: number[],
      savedCurrent: number,
      savedStartedAt?: number,
    ) => {
      setAnswers(savedAnswers);
      setSeconds(savedSeconds);
      setCurrent(savedCurrent);
      setStartedAt(savedStartedAt || Date.now());
      setQuestionStarted(Date.now());
    },
    []
  );

  const answerQuestion = useCallback(
    (option: number) => {
      const nextAnswers = [...answers, option];
      const nextSeconds = [
        ...seconds,
        Math.max(1, Math.round((Date.now() - questionStarted) / 1000)),
      ];
      setAnswers(nextAnswers);
      setSeconds(nextSeconds);
      if (current === questions.length - 1) {
        setCurrent(questions.length);
      } else {
        setCurrent(current + 1);
        setQuestionStarted(Date.now());
      }
    },
    [answers, seconds, current, questionStarted, questions.length]
  );

  const result = useMemo(() => calculateClientScore(answers, seconds, questions), [answers, seconds, questions]);
  const band: ScoreBand = classify(result);
  const progress = Math.round((current / questions.length) * 100);

  const categoryStats: CategoryStat[] = useMemo(
    () =>
      (Object.keys({ Lógico: 1, Visual: 1, Verbal: 1, Padrões: 1 }) as Category[]).map(
        category => {
          const indexes = questions
            .map((question, index) => (question.category === category ? index : -1))
            .filter(index => index >= 0);
          const hits = indexes.filter(
            index => answers[index] === questions[index]?.answer
          ).length;
          return { category, value: Math.round((hits / indexes.length) * 100) || 0 };
        }
      ),
    [questions, answers]
  );

  const dominantCategory: Category = useMemo(
    () =>
      [...categoryStats].sort((a, b) => b.value - a.value)[0]?.category || "Lógico",
    [categoryStats]
  );

  const profile: Profile = useMemo(
    () => calculateDetailedProfile(categoryStats, seconds),
    [categoryStats, seconds]
  );

  return {
    answers,
    seconds,
    current,
    questionStarted,
    startedAt,
    startQuiz,
    restoreQuiz,
    answerQuestion,
    result,
    band,
    progress,
    categoryStats,
    dominantCategory,
    profile,
    setCurrent,
  };
}

export { calculateScore, classify };
