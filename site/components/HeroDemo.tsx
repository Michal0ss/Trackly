"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// 0 strona serwisu, 1 toast, 2 klikniecie, 3 zapisano, 4 panel, 5 przytrzymanie
const TIMINGS = [1600, 2000, 550, 950, 3200, 900];

export default function HeroDemo() {
  const [step, setStep] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      setStep(4);
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

  const toastVisible = step >= 1 && step <= 3;
  const saved = step >= 3;
  const panelVisible = step >= 4;

  return (
    <div
      className="demo"
      role="img"
      aria-label="Pokaz działania Trackly: na stronie serwisu pojawia się powiadomienie o wykrytej subskrypcji, po zatwierdzeniu subskrypcja trafia do panelu wtyczki"
    >
      <div className="demo-bar">
        <span className="demo-dot" />
        <span className="demo-dot" />
        <span className="demo-dot" />
        <div className="demo-url">spotify.com/premium</div>
        <div className={saved ? "demo-ext is-alert" : "demo-ext"}>
          <Image src="/icon.png" alt="" width={128} height={128} />
          {saved && <span className="demo-badge">1</span>}
        </div>
      </div>

      <div className="demo-stage">
        <div className="demo-site">
          <p className="demo-site-label">Plan</p>
          <p className="demo-site-plan">Premium Individual</p>
          <p className="demo-site-price">
            26,99 zł <span>/ miesiąc</span>
          </p>
          <div className={step === 2 ? "demo-site-cta is-pressed" : "demo-site-cta"}>
            Kup Premium Individual
          </div>
        </div>

        {toastVisible && (
          <div className="demo-toast" key={saved ? "saved" : "prompt"}>
            <Image
              className="demo-toast-logo"
              src="/wordmark.png"
              alt="Trackly"
              width={588}
              height={210}
            />
            {saved ? (
              <>
                <p className="demo-toast-title">Zapisano ✓</p>
                <p className="demo-toast-sub">Otwórz Trackly, aby dokończyć.</p>
              </>
            ) : (
              <>
                <p className="demo-toast-title">Wykryto: Spotify</p>
                <p className="demo-toast-sub">Premium · 26,99 PLN / miesiąc</p>
                <div className="demo-toast-actions">
                  <span className="demo-tbtn">Nie teraz</span>
                  <span
                    className={
                      step === 2 ? "demo-tbtn is-primary is-pressed" : "demo-tbtn is-primary"
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
          <div className="demo-panel">
            <Image
              className="demo-panel-logo"
              src="/wordmark.png"
              alt="Trackly"
              width={588}
              height={210}
            />
            <p className="demo-panel-title">Twoje subskrypcje</p>

            <div className="demo-tiles">
              <div className="demo-tile demo-tile-wide">
                <span>Aktywne subskrypcje</span>
                <strong>4</strong>
              </div>
              <div className="demo-tile">
                <span>Koszt miesięczny</span>
                <strong>88,97 zł</strong>
              </div>
              <div className="demo-tile">
                <span>Koszt roczny</span>
                <strong>199,00 zł</strong>
              </div>
            </div>

            <div className="demo-row is-new">
              <div>
                <strong>Spotify</strong>
                <p>Premium · 26,99 zł</p>
              </div>
              <span className="demo-pill">Aktywna</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
