"use client";

import Link from "next/link";
import { useActionState, useId, useState, type FormEvent } from "react";
import { joinWaitlist, type WaitlistState } from "@/app/actions";
import site from "@/components/site.module.css";
import { paths, type Lang } from "@/lib/locale";
import styles from "./teaser.module.css";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Problem = "invalid" | "consent" | "error";

const COPY = {
  pl: {
    intro:
      "Zostaw e-mail, a napiszemy, gdy aplikacja pojawi się w App Store i Google Play. Osoby z listy dostaną ją jako pierwsze.",
    emailLabel: "Adres e-mail",
    placeholder: "twoj@email.pl",
    submit: "Zapisz mnie",
    pending: "Zapisuję…",
    consent: "Zgadzam się na e-maile o premierze aplikacji Trackly, w tym zaproszenie do wcześniejszego dostępu. Zgodę mogę wycofać w każdej chwili.",
    details: "Szczegóły w",
    privacy: "polityce prywatności",
    problems: {
      invalid: "Wpisz poprawny adres e-mail.",
      consent: "Zaznacz zgodę, żebyśmy mogli napisać do Ciebie o premierze.",
      error: "Nie udało się zapisać. Spróbuj ponownie za chwilę.",
    },
    successTitle: "Jesteś na liście!",
    successText: "Napiszemy, gdy aplikacja będzie gotowa do pobrania.",
  },
  en: {
    intro:
      "Leave your email and we'll let you know when the app lands on the App Store and Google Play. People on the list get it first.",
    emailLabel: "Email address",
    placeholder: "your@email.com",
    submit: "Join the list",
    pending: "Joining…",
    consent: "I agree to receive emails about the Trackly app launch, including an early access invite. I can withdraw my consent at any time.",
    details: "Details in our",
    privacy: "privacy policy",
    problems: {
      invalid: "Enter a valid email address.",
      consent: "Tick the box so we can email you about the launch.",
      error: "Something went wrong. Please try again in a moment.",
    },
    successTitle: "You're on the list!",
    successText: "We'll email you as soon as the app is ready to download.",
  },
};

const initialState: WaitlistState = { status: "idle" };

export default function WaitlistForm({ lang }: { lang: Lang }) {
  const copy = COPY[lang];
  const id = useId();
  const [state, formAction, pending] = useActionState(joinWaitlist, initialState);
  const [localProblem, setLocalProblem] = useState<Problem | null>(null);

  if (state.status === "success") {
    return (
      <div className={styles.success} role="status">
        <span className={styles.successIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <div>
          <p className={styles.successTitle}>{copy.successTitle}</p>
          <p className={styles.successText}>{copy.successText}</p>
        </div>
      </div>
    );
  }

  const serverProblem = state.status === "idle" ? null : state.status;
  const problem = pending ? null : (localProblem ?? serverProblem);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    const consent = form.elements.namedItem("consent") as HTMLInputElement;

    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      event.preventDefault();
      setLocalProblem("invalid");
      (form.elements.namedItem("email") as HTMLInputElement).focus();
      return;
    }

    if (!consent.checked) {
      event.preventDefault();
      setLocalProblem("consent");
      consent.focus();
      return;
    }

    setLocalProblem(null);
  }

  return (
    <form className={styles.form} action={formAction} onSubmit={handleSubmit} noValidate>
      <p className={styles.formLabel} id={`${id}-intro`}>
        {copy.intro}
      </p>
      <input type="hidden" name="language" value={lang} />
      <div className={styles.honeypot} aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className={styles.formRow}>
        <input
          className={styles.input}
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          placeholder={copy.placeholder}
          aria-label={copy.emailLabel}
          aria-describedby={`${id}-intro ${id}-message`}
          aria-invalid={problem === "invalid" || undefined}
          defaultValue={state.email}
          onChange={() => setLocalProblem(null)}
          required
        />
        <button className={`${site.btn} ${site.btnPrimary} ${styles.submit}`} type="submit" disabled={pending}>
          {pending ? copy.pending : copy.submit}
        </button>
      </div>
      <label className={styles.consent}>
        <input
          type="checkbox"
          name="consent"
          defaultChecked={state.consent}
          aria-invalid={problem === "consent" || undefined}
          onChange={() => setLocalProblem(null)}
        />
        <span>
          {copy.consent} {copy.details}{" "}
          <Link href={`${paths[lang].privacy}#${lang === "pl" ? "lista" : "waitlist"}`}>{copy.privacy}</Link>.
        </span>
      </label>
      <p className={styles.message} id={`${id}-message`} aria-live="polite">
        {problem ? copy.problems[problem] : ""}
      </p>
    </form>
  );
}
