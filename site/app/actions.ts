"use server";

import { apiUrl } from "@/lib/site";

export type WaitlistState = {
  status: "idle" | "success" | "invalid" | "consent" | "error";
  email?: string;
  consent?: boolean;
};

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function joinWaitlist(_state: WaitlistState, formData: FormData): Promise<WaitlistState> {
  const email = String(formData.get("email") ?? "").trim();
  const language = formData.get("language") === "en" ? "en" : "pl";
  const consent = formData.get("consent") === "on";
  const website = String(formData.get("website") ?? "");

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return { status: "invalid", email, consent };
  }

  if (!consent) {
    return { status: "consent", email, consent };
  }

  try {
    const response = await fetch(`${apiUrl}/api/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, language, consent, website }),
      cache: "no-store",
    });

    if (response.status === 422) {
      return { status: "invalid", email, consent };
    }

    return response.ok ? { status: "success" } : { status: "error", email, consent };
  } catch {
    return { status: "error", email, consent };
  }
}
