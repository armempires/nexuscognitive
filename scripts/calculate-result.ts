import { questions } from "../client/src/data/questions";
import { calculateClientScore, classify, getCategoryStats, calculateDetailedProfile } from "../shared/qi-score";

function calculateAllPossibilities() {
  console.log("🧠 Nexus Cognitive Insight - Possibilidades de Resultado\n");
  console.log("Teste de 32 questões | Score mínimo: 70 | Score máximo: 145\n");

  const totalQuestions = questions.length;
  const categories = ["Lógico", "Visual", "Verbal", "Padrões"];
  const categoryCount = categories.map(cat => 
    questions.filter(q => q.category === cat).length
  );

  console.log("Distribuição das questões:");
  categories.forEach((cat, i) => {
    console.log(`  ${cat}: ${categoryCount[i]} questões`);
  });

  console.log("\n=== FÓRMULA DE CÁLCULO ===");
  console.log("Score = 70 + (acertos × 1.45) + (balanceamento_categorias × 12) + (velocidade)");
  console.log("- Mínimo: 70 pontos");
  console.log("- Máximo: 145 pontos");
  console.log("- Cada acerto: +1.45 pontos");
  console.log("- Balanceamento entre categorias: até +12 pontos");
  console.log("- Velocidade (até 32 × 0.7): até +22.4 pontos");

  console.log("\n=== POSSIBILIDADES DE SCORE ===");
  console.log("Acertos | Score Aproximado | Classificação");
  console.log("--------|------------------|----------------");

  for (let correct = 0; correct <= totalQuestions; correct++) {
    const dummyAnswers = Array(totalQuestions).fill(0);
    const dummySeconds = Array(totalQuestions).fill(15);

    const correctPerCategory = Math.floor(correct / 4);
    categories.forEach((cat, catIndex) => {
      const categoryQuestions = questions
        .map((q, idx) => (q.category === cat ? idx : -1))
        .filter(idx => idx >= 0);
      
      for (let i = 0; i < correctPerCategory && i < categoryQuestions.length; i++) {
        const qIndex = categoryQuestions[i];
        if (qIndex !== undefined && dummyAnswers[qIndex] === 0) {
          dummyAnswers[qIndex] = questions[qIndex].answer;
        }
      }
    });

    const remaining = correct - correctPerCategory * 4;
    if (remaining > 0) {
      const categoryQuestions = questions
        .map((q, idx) => (q.category === categories[0] ? idx : -1))
        .filter(idx => idx >= 0);
      
      for (let i = 0; i < remaining && i < categoryQuestions.length; i++) {
        const qIndex = categoryQuestions[i];
        if (qIndex !== undefined && dummyAnswers[qIndex] === 0) {
          dummyAnswers[qIndex] = questions[qIndex].answer;
        }
      }
    }

    const score = calculateClientScore(dummyAnswers, dummySeconds, questions);
    const band = classify(score);

    const bar = "█".repeat(Math.floor(correct / 2)) + "░".repeat(16 - Math.floor(correct / 2));
    console.log(`  ${String(correct).padStart(2)}/32  | ${String(score).padStart(3)} pts          | ${band.label} ${bar}`);
  }

  console.log("\n=== EXEMPLOS DE PERFIS POR ACERTOS ===");

  const examples = [0, 8, 16, 24, 32];
  examples.forEach(correct => {
    const dummyAnswers = Array(totalQuestions).fill(0);
    const dummySeconds = Array(totalQuestions).fill(15);

    const correctPerCategory = Math.floor(correct / 4);
    categories.forEach((cat, catIndex) => {
      const categoryQuestions = questions
        .map((q, idx) => (q.category === cat ? idx : -1))
        .filter(idx => idx >= 0);
      
      for (let i = 0; i < correctPerCategory && i < categoryQuestions.length; i++) {
        const qIndex = categoryQuestions[i];
        if (qIndex !== undefined && dummyAnswers[qIndex] === 0) {
          dummyAnswers[qIndex] = questions[qIndex].answer;
        }
      }
    });

    const remaining = correct - correctPerCategory * 4;
    if (remaining > 0) {
      const categoryQuestions = questions
        .map((q, idx) => (q.category === categories[0] ? idx : -1))
        .filter(idx => idx >= 0);
      
      for (let i = 0; i < remaining && i < categoryQuestions.length; i++) {
        const qIndex = categoryQuestions[i];
        if (qIndex !== undefined && dummyAnswers[qIndex] === 0) {
          dummyAnswers[qIndex] = questions[qIndex].answer;
        }
      }
    }

    const score = calculateClientScore(dummyAnswers, dummySeconds, questions);
    const categoryStats = getCategoryStats(questions, dummyAnswers);
    const profile = calculateDetailedProfile(categoryStats, dummySeconds);
    const band = classify(score);

    console.log(`\n${correct} acertos (${Math.round(correct/32*100)}%):`);
    console.log(`  Score: ${score} pts - ${band.label}`);
    console.log(`  Perfil: ${profile.title}`);
    console.log(`  Categorias: ${categoryStats.map(s => `${s.category}: ${s.value}%`).join(", ")}`);
  });

  console.log("\n=== COMO MELHORAR SEU SCORE ===");
  console.log("1. Acerte mais questões (+1.45 pts por acerto)");
  console.log("2. Tenha desempenho equilibrado nas 4 categorias (+ até 12 pts)");
  console.log("3. Responda rapidamente (até 12s por questão = +0.7 pts cada)");
  console.log("\nDica: Cada acerto vale mais que velocidade. Foco em acerto > velocidade.");
}

calculateAllPossibilities();
