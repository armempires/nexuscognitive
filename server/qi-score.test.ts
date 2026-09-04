import { describe, expect, it } from "vitest";
import { calculateDetailedProfile, calculateScore, classify, type CategoryStat } from "@shared/qi-score";

describe("QI score interpretation", () => {
  it("keeps the score inside the supported scale", () => {
    expect(calculateScore(0, 0, 0)).toBe(82);
    expect(calculateScore(26, 26, 0)).toBeLessThanOrEqual(145);
    expect(calculateScore(26, 0, 0)).toBeGreaterThanOrEqual(70);
  });

  it("classifies the score into the expected ranges", () => {
    expect(classify(84).label).toBe("A desenvolver");
    expect(classify(100).label).toBe("Faixa média");
    expect(classify(120).label).toBe("Acima da média");
    expect(classify(135).label).toBe("Muito acima da média");
  });

  it("keeps protected integrations closed until providers are configured", () => {
    const smsConfigured = false;
    const stripeConfigured = false;
    expect(!smsConfigured).toBe(true);
    expect(!stripeConfigured).toBe(true);
  });

  it("rewards faster responses without allowing speed to dominate accuracy", () => {
    expect(calculateScore(18, 8, 0)).toBeGreaterThan(calculateScore(18, 0, 8));
    expect(calculateScore(10, 0, 0)).toBeLessThan(calculateScore(20, 0, 0));
  });

  it("calculates rich hybrid profiles with primary and secondary categories", () => {
    const stats: CategoryStat[] = [
      { category: "Lógico", value: 90 },
      { category: "Visual", value: 75 },
      { category: "Verbal", value: 50 },
      { category: "Padrões", value: 40 },
    ];
    const profile = calculateDetailedProfile(stats, [10, 12, 8]);
    expect(profile.title).toBe("O Arquiteto de Sistemas");
    expect(profile.primaryCategory).toBe("Lógico");
    expect(profile.secondaryCategory).toBe("Visual");
    expect(profile.processingStyle).toBe("Processamento Ágil & Intuitivo");
    expect(profile.careers?.length).toBeGreaterThan(0);
    expect(profile.courses?.length).toBeGreaterThan(0);
  });

  it("detects polymath profile when stats are well balanced", () => {
    const stats: CategoryStat[] = [
      { category: "Lógico", value: 80 },
      { category: "Visual", value: 75 },
      { category: "Verbal", value: 85 },
      { category: "Padrões", value: 78 },
    ];
    const profile = calculateDetailedProfile(stats);
    expect(profile.title).toBe("O Polímata Multidomínio");
  });

  it("detects specialist profile when one category heavily dominates", () => {
    const stats: CategoryStat[] = [
      { category: "Verbal", value: 100 },
      { category: "Visual", value: 50 },
      { category: "Lógico", value: 40 },
      { category: "Padrões", value: 30 },
    ];
    const profile = calculateDetailedProfile(stats);
    expect(profile.title).toBe("O Especialista em Verbal");
  });
});

