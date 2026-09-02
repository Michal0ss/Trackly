"use client";

import { useEffect, useRef, useState } from "react";

export default function CountUp({
  to,
  decimals = 2,
}: {
  to: number;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // Startujemy od wartosci docelowej, nie od zera. Strona jest generowana
  // statycznie, wiec to ona ladzie w wysylanym HTML - bez tego kazdy, kto ma
  // wylaczony JavaScript, i kazdy robot indeksujacy widzi "0,00 zl".
  // Zerujemy dopiero w efekcie, czyli gdy juz wiemy, ze animacja ruszy.
  const [value, setValue] = useState(to);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const duration = 1200;
        const started = performance.now();

        const tick = (now: number) => {
          const progress = Math.min((now - started) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(to * eased);
          if (progress < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );

    setValue(0);
    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to]);

  return (
    <span ref={ref}>
      {value.toLocaleString("pl-PL", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}
