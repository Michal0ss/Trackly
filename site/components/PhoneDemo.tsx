"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/locale";
import styles from "./teaser.module.css";

const TIMINGS = [1400, 950, 1700, 450, 1000, 850, 3600, 600];
const FINAL_STEP = 6;
const RESET_STEP = 7;

const COPY = {
  pl: {
    label:
      "Podgląd aplikacji Trackly: piszesz, co zapłaciłeś, a asystent zapisuje płatność i pokazuje sumę na ten miesiąc",
    month: "Październik",
    before: "814 zł",
    after: "3 214 zł",
    user: "Zapłaciłem 2400 zł za czynsz",
    question: "Zapisać jako stałą płatność?",
    entryName: "Czynsz",
    entryMeta: "2 400 zł · 10. dnia miesiąca",
    save: "Zapisz",
    edit: "Zmień",
    saved: "Zapisano ✓",
    summary: "Gotowe. W październiku stałe płatności to 3 214 zł. Najbliższa: internet, jutro.",
    input: "Napisz albo powiedz…",
  },
  en: {
    label:
      "Preview of the Trackly app: you type what you paid, and the assistant saves the payment and shows this month's total",
    month: "October",
    before: "$586",
    after: "$2,436",
    user: "Paid $1,850 for rent today",
    question: "Save it as a monthly payment?",
    entryName: "Rent",
    entryMeta: "$1,850 · monthly, on the 1st",
    save: "Save",
    edit: "Edit",
    saved: "Saved ✓",
    summary: "Done. Your fixed payments this month come to $2,436. Next up: internet, tomorrow.",
    input: "Type or say it…",
  },
};

export default function PhoneDemo({ lang }: { lang: Lang }) {
  const copy = COPY[lang];
  const [tick, setTick] = useState(0);
  const [reduced, setReduced] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const step = reduced ? FINAL_STEP : tick % TIMINGS.length;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
    }
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = setTimeout(() => setTick((current) => current + 1), TIMINGS[step]);
    return () => clearTimeout(id);
  }, [tick, step, reduced]);

  useEffect(() => {
    const chat = chatRef.current;
    chat?.scrollTo({ top: chat.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [step, reduced]);

  const saved = step >= 4;

  return (
    <div className={styles.phoneWrap}>
      <div className={styles.phone} role="img" aria-label={copy.label}>
        <div className={styles.screen}>
          <span className={styles.island} />
          <div className={styles.statusBar} aria-hidden="true">
            <span>9:41</span>
            <span className={styles.statusIcons}>
              <svg viewBox="0 0 18 11">
                <rect x="0" y="7" width="3" height="4" rx="1" />
                <rect x="5" y="5" width="3" height="6" rx="1" />
                <rect x="10" y="2.5" width="3" height="8.5" rx="1" />
                <rect x="15" y="0" width="3" height="11" rx="1" />
              </svg>
              <svg viewBox="0 0 26 11">
                <rect x="0.5" y="0.5" width="22" height="10" rx="3" fill="none" stroke="currentColor" opacity="0.5" />
                <rect x="2" y="2" width="16" height="7" rx="1.6" />
                <rect x="23.5" y="3.5" width="2" height="4" rx="1" opacity="0.5" />
              </svg>
            </span>
          </div>

          <div className={styles.appBar} aria-hidden="true">
            <Image className={styles.appLogo} src="/wordmark.png" alt="" width={588} height={210} />
            <span className={styles.monthPill}>
              {copy.month}
              <strong key={saved ? "after" : "before"} className={saved ? styles.pillChanged : styles.pillValue}>
                {saved ? copy.after : copy.before}
              </strong>
            </span>
          </div>

          <div
            key={Math.floor(tick / TIMINGS.length)}
            ref={chatRef}
            className={step === RESET_STEP ? `${styles.chat} ${styles.chatFading}` : styles.chat}
            aria-hidden="true"
          >
            <p className={`${styles.bubble} ${styles.user}`}>{copy.user}</p>
            {step === 1 && (
              <span className={styles.typing}>
                <i />
                <i />
                <i />
              </span>
            )}
            {step >= 2 && (
              <>
                <p className={`${styles.bubble} ${styles.bot}`}>{copy.question}</p>
                <div className={styles.entry}>
                  <div className={styles.entryRow}>
                    <span className={styles.entryIcon}>
                      <svg viewBox="0 0 24 24">
                        <path d="M3 10.5 12 3l9 7.5" />
                        <path d="M5 9.5V21h14V9.5" />
                        <path d="M10 21v-6h4v6" />
                      </svg>
                    </span>
                    <div>
                      <p className={styles.entryName}>{copy.entryName}</p>
                      <p className={styles.entryMeta}>{copy.entryMeta}</p>
                    </div>
                  </div>
                  {saved ? (
                    <p className={styles.entrySaved}>{copy.saved}</p>
                  ) : (
                    <div className={styles.entryActions}>
                      <span className={`${styles.entryButton} ${styles.entryEdit}`}>{copy.edit}</span>
                      <span
                        className={
                          step === 3
                            ? `${styles.entryButton} ${styles.entrySave} ${styles.entryPressed}`
                            : `${styles.entryButton} ${styles.entrySave}`
                        }
                      >
                        {copy.save}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
            {step === 5 && (
              <span className={styles.typing}>
                <i />
                <i />
                <i />
              </span>
            )}
            {step >= FINAL_STEP && <p className={`${styles.bubble} ${styles.bot}`}>{copy.summary}</p>}
          </div>

          <div className={styles.inputBar} aria-hidden="true">
            {copy.input}
            <span className={styles.mic}>
              <svg viewBox="0 0 24 24">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" y1="18" x2="12" y2="22" />
              </svg>
            </span>
          </div>
          <span className={styles.homeIndicator} />
        </div>
      </div>
    </div>
  );
}
