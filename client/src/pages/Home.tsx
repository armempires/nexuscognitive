import { useEffect, useMemo, useState } from "react";
import { Brain, ShieldCheck } from "lucide-react";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { useQuizLogic } from "@/hooks/useQuizLogic";
import { useAudio } from "@/components/audio/useAudio";
import { questions } from "@/data/questions";
import type { Category, Question } from "@/data/questions";
import { LandingPage } from "@/pages/LandingPage";
import { QuizPage } from "@/pages/QuizPage";
import { LeadFormPage } from "@/pages/LeadFormPage";
import { EmailConfirmPage } from "@/pages/EmailConfirmPage";
import { PaymentPage } from "@/pages/PaymentPage";
import { ResultPage } from "@/pages/ResultPage";

type Stage = "landing" | "quiz" | "lead" | "email_confirm" | "payment" | "result";

interface StoredSession {
  stage?: Stage;
  current?: number;
  answers?: number[];
  seconds?: number[];
  name?: string;
  email?: string;
  phone?: string;
  smsCode?: string;
  phoneConfirmed?: boolean;
  emailConfirmed?: boolean;
  questionStarted?: number;
  startedAt?: number;
}

const categoryColors: Record<Category, string> = {
  Lógico: "#9f8cff",
  Visual: "#5bd6c5",
  Verbal: "#f6c66a",
  Padrões: "#ff8da1",
};

export default function Home() {
  const [stage, setStage] = useState<Stage>("landing");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const { soundEnabled, toggleSound, playSynth } = useAudio();
  const quiz = useQuizLogic(questions);

  useEffect(() => {
    const saved = localStorage.getItem("nexus-quiz-session");
    if (!saved) return;
    try {
      const data = JSON.parse(saved) as StoredSession;
      const resumable = data.stage === "quiz" || data.stage === "lead" || data.stage === "email_confirm" || data.stage === "payment";
      if (resumable) {
        const cleaned: StoredSession = { ...data };
        if ("phone" in cleaned) delete cleaned.phone;
        if ("smsCode" in cleaned) delete cleaned.smsCode;
        if ("phoneConfirmed" in cleaned) delete cleaned.phoneConfirmed;
        localStorage.setItem("nexus-quiz-session", JSON.stringify(cleaned));
        setStage(data.stage as Stage);
      }
      quiz.restoreQuiz(data.answers || [], data.seconds || [], data.current || 0, data.startedAt);
      setName(data.name || "");
      setEmail(data.email || "");
      setEmailConfirmed(data.emailConfirmed || false);
    } catch {
      localStorage.removeItem("nexus-quiz-session");
    }
  }, []);

  useEffect(() => {
    const data: StoredSession = {
      stage,
      current: quiz.current,
      answers: quiz.answers,
      seconds: quiz.seconds,
      name,
      email,
      emailConfirmed: emailConfirmed,
      questionStarted: quiz.questionStarted,
      startedAt: quiz.startedAt,
    };
    localStorage.setItem("nexus-quiz-session", JSON.stringify(data));
  }, [stage, quiz.current, quiz.answers, quiz.seconds, name, email, emailConfirmed, quiz.questionStarted]);

  const stageIndex = { landing: 0, quiz: 1, lead: 2, email_confirm: 3, payment: 4, result: 5 }[stage] ?? 0;

  const shell = (content: React.ReactNode) => (
    <main className="min-h-screen overflow-hidden bg-[#0c0c12] text-[#f8f6f1]">
      {/* Background: layered radial gradients + animated orbs */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(ellipse 60% 50% at 15% 15%, rgba(159,140,255,.18), transparent)",
            "radial-gradient(ellipse 50% 40% at 85% 20%, rgba(91,214,197,.14), transparent)",
            "radial-gradient(ellipse 40% 60% at 50% 80%, rgba(246,198,106,.07), transparent)",
          ].join(","),
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 animate-orb opacity-60"
        style={{
          background: "radial-gradient(circle 300px at 70% 60%, rgba(255,141,161,0.07), transparent)",
        }}
      />

      {/* Grid noise texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.018]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Crect x='0' y='0' width='1' height='1'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto min-h-screen max-w-7xl px-5 pb-10 sm:px-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 py-6">
          <button
            onClick={() => setStage("landing")}
            className="flex items-center gap-3 text-left rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9f8cff] transition-opacity hover:opacity-80"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#9f8cff] text-[#12111a] animate-pulse-glow">
              <Brain size={21} />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-[.2em]">NEXUS</span>
              <span className="block text-[10px] uppercase tracking-[.26em] text-white/40">
                cognitive insight
              </span>
            </span>
          </button>
          
          <div className="flex items-center gap-4">
            {/* Stage step dots (visible during quiz flow) */}
            {stageIndex > 0 && (
              <div className="hidden items-center gap-1.5 sm:flex">
                {["quiz","lead","email_confirm","payment","result"].map((s, i) => (
                  <div
                    key={s}
                    className="rounded-full transition-all duration-400"
                    style={{
                      width: stageIndex - 1 === i ? 20 : 6,
                      height: 6,
                      backgroundColor:
                        stageIndex - 1 > i
                          ? "#9f8cff"
                          : stageIndex - 1 === i
                          ? "#c4b5ff"
                          : "rgba(255,255,255,0.12)",
                      boxShadow: stageIndex - 1 === i ? "0 0 8px rgba(159,140,255,0.7)" : "none",
                    }}
                  />
                ))}
              </div>
            )}

            <div className="hidden items-center gap-6 text-xs text-white/50 sm:flex">
              <span>26 desafios</span>
              <span>≈ 6 minutos</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#5bd6c5]" /> experiência privada
              </span>
            </div>
            <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
          </div>
        </header>

        {content}

        <footer className="mt-8 flex justify-between border-t border-white/[.07] py-5 text-xs text-white/25">
          <span>© 2026 Nexus Cognitive Insight</span>
          <span>Privacidade · Uso responsável</span>
        </footer>
      </div>
    </main>
  );


  if (stage === "landing") {
    return shell(
      <LandingPage
        onStart={() => {
          playSynth("click");
          quiz.startQuiz();
          setStage("quiz");
        }}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />
    );
  }

  if (stage === "quiz") {
    const currentQuestion = questions[quiz.current];
    if (!currentQuestion) {
      setStage("lead");
      return null;
    }
    return shell(
      <QuizPage
        current={quiz.current}
        total={questions.length}
        question={currentQuestion}
        onAnswer={(option) => {
          playSynth("select");
          const isLast = quiz.current === questions.length - 1;
          quiz.answerQuestion(option);
          if (isLast) {
            playSynth("success");
            setStage("lead");
          } else {
            playSynth("whoosh");
          }
        }}
        soundEnabled={soundEnabled}
        onSoundSelect={() => playSynth("select")}
      />
    );
  }

  if (stage === "lead") {
    return shell(
      <LeadFormPage
        name={name}
        email={email}
        onNameChange={setName}
        onEmailChange={setEmail}
        onContinue={() => {
          playSynth("click");
          setStage("email_confirm");
        }}
        soundEnabled={soundEnabled}
        onSoundClick={() => playSynth("click")}
      />
    );
  }

  if (stage === "email_confirm") {
    return shell(
      <EmailConfirmPage
        email={email}
        onConfirmed={() => {
          setEmailConfirmed(true);
          setStage("payment");
        }}
        soundEnabled={soundEnabled}
        onSoundClick={() => playSynth("click")}
      />
    );
  }

  if (stage === "payment") {
    return shell(
      <PaymentPage
        name={name}
        email={email}
        onConfirm={() => {
          playSynth("reveal");
          setStage("result");
        }}
        soundEnabled={soundEnabled}
        onSoundClick={() => playSynth("click")}
        onSoundSuccess={() => playSynth("success")}
      />
    );
  }

  return shell(
    <ResultPage
      name={name}
      email={email}
      result={quiz.result}
      band={quiz.band}
      categoryStats={quiz.categoryStats}
      profile={quiz.profile}
      onRestart={() => {
        localStorage.removeItem("nexus-quiz-session");
        quiz.startQuiz();
        setName("");
        setEmail("");
        setStage("landing");
      }}
      soundEnabled={soundEnabled}
      onSoundReveal={() => playSynth("reveal")}
    />
  );
}
