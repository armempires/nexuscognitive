import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PaymentPage } from "@/pages/PaymentPage";

global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ hasApiKey: false, environment: "sandbox", isConfigured: false }),
  } as Response)
);

describe("PaymentPage", () => {
  it("renders product information and offer title", () => {
    render(
      <PaymentPage
        onConfirm={() => {}}
        soundEnabled={false}
        onSoundClick={() => {}}
        onSoundSuccess={() => {}}
      />
    );
    expect(screen.getByText("Relatório Nexus Completo")).toBeDefined();
    expect(screen.getAllByText(/19,90/i).length).toBeGreaterThan(0);
  });

  it("renders payment methods PIX and Credit Card", () => {
    render(
      <PaymentPage
        onConfirm={() => {}}
        soundEnabled={false}
        onSoundClick={() => {}}
        onSoundSuccess={() => {}}
      />
    );
    expect(screen.getAllByText(/PIX Instantâneo/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Cartão de Crédito/i).length).toBeGreaterThan(0);
  });

  it("displays Asaas Gateway badge", () => {
    render(
      <PaymentPage
        onConfirm={() => {}}
        soundEnabled={false}
        onSoundClick={() => {}}
        onSoundSuccess={() => {}}
      />
    );
    expect(screen.getAllByText(/Asaas/i).length).toBeGreaterThan(0);
  });

  it("allows tab switching between PIX and Credit Card", () => {
    render(
      <PaymentPage
        onConfirm={() => {}}
        soundEnabled={false}
        onSoundClick={() => {}}
        onSoundSuccess={() => {}}
      />
    );
    const cardTab = screen.getAllByText(/Cartão de Crédito/i)[0];
    fireEvent.click(cardTab);
    expect(screen.getByPlaceholderText("COMO IMPRESSO NO CARTÃO")).toBeDefined();
  });

  it("renders Asaas branding in header", () => {
    render(
      <PaymentPage
        onConfirm={() => {}}
        soundEnabled={false}
        onSoundClick={() => {}}
        onSoundSuccess={() => {}}
      />
    );
    expect(screen.getAllByText(/Pagamento Seguro via Asaas/i).length).toBeGreaterThan(0);
  });
});
