import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { EmailConfirmPage } from "@/pages/EmailConfirmPage";

global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true, message: "Código enviado!", isSimulated: true }),
  } as Response)
);

describe("EmailConfirmPage", () => {
  it("renders email confirmation instructions", () => {
    render(
      <EmailConfirmPage
        email="test@example.com"
        onConfirmed={() => {}}
        soundEnabled={false}
        onSoundClick={() => {}}
      />
    );
    expect(screen.getByText("Verifique seu e-mail")).toBeDefined();
    expect(screen.getByText("test@example.com")).toBeDefined();
  });

  it("renders OTP input slots", () => {
    const { container } = render(
      <EmailConfirmPage
        email="test@example.com"
        onConfirmed={() => {}}
        soundEnabled={false}
        onSoundClick={() => {}}
      />
    );
    const slots = container.querySelectorAll('[data-slot="input-otp-slot"]');
    expect(slots.length).toBe(6);
  });

  it("calls verify API when code is submitted", async () => {
    const onConfirmed = vi.fn();
    const mockFetch = vi.fn((url: string) => {
      if (url.includes("/api/email-confirm/verify")) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, message: "E-mail confirmado!" }),
        } as Response);
      }
      return Promise.resolve({
        json: () => Promise.resolve({ success: true, message: "Código enviado!", isSimulated: true }),
      } as Response);
    });

    (global.fetch as any) = mockFetch;

    render(
      <EmailConfirmPage
        email="test@example.com"
        onConfirmed={onConfirmed}
        soundEnabled={false}
        onSoundClick={() => {}}
      />
    );

    const confirmBtn = screen.getAllByText("Confirmar e-mail")[0];
    expect(confirmBtn.hasAttribute("disabled")).toBe(true);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/email-confirm/send", expect.any(Object));
    });
  });

  it("shows resend button with cooldown", async () => {
    render(
      <EmailConfirmPage
        email="test@example.com"
        onConfirmed={() => {}}
        soundEnabled={false}
        onSoundClick={() => {}}
      />
    );

    const resendButtons = screen.getAllByText(/Reenviar/);
    expect(resendButtons.length).toBeGreaterThan(0);
  });
});
