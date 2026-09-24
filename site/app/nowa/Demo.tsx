"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./nowa.module.css";

const TIMINGS = [1400, 1500, 950, 450, 1300, 950, 450, 3800, 700];
const PANEL_STEP = 7;
const RESET_STEP = 8;
const CURSOR_TIP = { x: 4.5, y: 2.5 };

type Anchor = "rest" | "add" | "icon";
type Point = { x: number; y: number };

export default function Demo() {
  const [step, setStep] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [cursor, setCursor] = useState<Point | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const anchorRef = useRef<Anchor>("rest");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      setStep(PANEL_STEP);
    }
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = setTimeout(
      () => setStep((current) => (current + 1) % TIMINGS.length),
      TIMINGS[step],
    );
    return () => clearTimeout(id);
  }, [step, reduced]);

  useLayoutEffect(() => {
    if (step === 2) anchorRef.current = "add";
    if (step === 5) anchorRef.current = "icon";
    if (step === RESET_STEP) anchorRef.current = "rest";

    const place = () => {
      const root = rootRef.current;
      if (!root) return;

      const box = root.getBoundingClientRect();
      const anchor = anchorRef.current;

      if (anchor === "rest") {
        setCursor({ x: box.width * 0.3, y: box.height * 0.8 });
        return;
      }

      const target = anchor === "add" ? addRef.current : iconRef.current;
      if (!target) return;

      const rect = target.getBoundingClientRect();
      setCursor({
        x: rect.left - box.left + rect.width * 0.55 - CURSOR_TIP.x,
        y: rect.top - box.top + rect.height * 0.6 - CURSOR_TIP.y,
      });
    };

    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [step]);

  const toastVisible = step >= 1 && step <= 6;
  const saved = step >= 4 && step <= 6;
  const panelVisible = step === PANEL_STEP || step === RESET_STEP;
  const pressing = step === 3 || step === 6;

  return (
    <div
      ref={rootRef}
      className={styles.browser}
      role="img"
      aria-label="Pokaz działania Trackly: na stronie serwisu pojawia się powiadomienie o wykrytej subskrypcji, po zatwierdzeniu subskrypcja trafia do panelu wtyczki"
    >
      <div className={styles.browserBar}>
        <div className={styles.lights}>
          <span />
          <span />
          <span />
        </div>
        <div className={styles.urlBar}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          spotify.com/premium
        </div>
        <span
          ref={iconRef}
          className={
            step === 6 || panelVisible ? `${styles.extSlot} ${styles.extSlotActive}` : styles.extSlot
          }
        >
          <Image src="/icon.png" alt="" width={128} height={128} />
          {saved && <span className={styles.extBadge}>1</span>}
        </span>
      </div>

      <div className={styles.stage}>
        <div className={styles.svcArt} />
        <p className={styles.svcLabel}>Plan</p>
        <p className={styles.svcPlan}>Premium Individual</p>
        <p className={styles.svcPrice}>
          26,99 zł <span>/ miesiąc</span>
        </p>
        <span className={styles.svcCta}>Kup Premium Individual</span>
        <div className={styles.svcLines}>
          <i />
          <i />
          <i />
        </div>

        {toastVisible && (
          <div className={styles.toast} key={saved ? "saved" : "prompt"}>
            <Image className={styles.toastLogo} src="/wordmark.png" alt="" width={588} height={210} />
            {saved ? (
              <>
                <p className={styles.toastTitle}>Zapisaliśmy Spotify</p>
                <p className={styles.toastSub}>Otwórz Trackly z paska narzędzi, aby dokończyć.</p>
              </>
            ) : (
              <>
                <p className={styles.toastTitle}>Wykryto: Spotify</p>
                <p className={styles.toastSub}>Premium · 26,99 PLN / miesiąc</p>
                <div className={styles.toastActions}>
                  <span className={styles.tbtn}>Nie teraz</span>
                  <span
                    ref={addRef}
                    className={
                      step === 3
                        ? `${styles.tbtn} ${styles.tbtnPrimary} ${styles.pressed}`
                        : `${styles.tbtn} ${styles.tbtnPrimary}`
                    }
                  >
                    Dodaj
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {panelVisible && (
          <div
            className={step === RESET_STEP ? `${styles.panel} ${styles.panelClosing}` : styles.panel}
          >
            <Image className={styles.panelLogo} src="/wordmark.png" alt="" width={588} height={210} />
            <p className={styles.panelTitle}>Twoje subskrypcje</p>
            <div className={styles.tiles}>
              <div className={`${styles.tile} ${styles.tileWide}`}>
                <span>Aktywne subskrypcje</span>
                <strong>4</strong>
              </div>
              <div className={styles.tile}>
                <span>Koszt miesięczny</span>
                <strong>88,97 PLN</strong>
              </div>
              <div className={styles.tile}>
                <span>Koszt roczny</span>
                <strong>199 PLN</strong>
              </div>
            </div>
            <div className={styles.panelRow}>
              <div>
                <strong>Spotify</strong>
                <p>Premium · 26,99 PLN</p>
              </div>
              <span className={styles.statusPill}>Aktywna</span>
            </div>
          </div>
        )}
      </div>

      {cursor && !reduced && (
        <span
          className={step === RESET_STEP ? `${styles.cursor} ${styles.cursorHidden}` : styles.cursor}
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24">
            <path
              d="M5 3v16l4.3-3.9 2.8 6.1 2.7-1.2-2.7-6H18z"
              fill="#f8fafc"
              stroke="#0b1220"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          {pressing && <span className={styles.ripple} key={step} />}
        </span>
      )}
    </div>
  );
}
