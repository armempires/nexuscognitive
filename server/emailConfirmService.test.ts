import { describe, expect, it, vi, beforeEach } from "vitest";
import { generateConfirmationCode, generateConfirmationId } from "./emailConfirmService";

describe("emailConfirmService", () => {
  describe("generateConfirmationCode", () => {
    it("generates a 6-digit numeric string", () => {
      const code = generateConfirmationCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    it("generates different codes on multiple calls", () => {
      const codes = new Set(Array.from({ length: 10 }, () => generateConfirmationCode()));
      expect(codes.size).toBeGreaterThan(1);
    });
  });

  describe("generateConfirmationId", () => {
    it("generates a valid UUID string", () => {
      const id = generateConfirmationId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });
});
