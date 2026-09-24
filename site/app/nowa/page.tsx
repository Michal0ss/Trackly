import type { Metadata } from "next";
import Image from "next/image";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import { storeUrl } from "@/lib/site";
import Demo from "./Demo";
import styles from "./nowa.module.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
};

const STEPS = [
  {
    num: "01",
    title: "Przeglądasz serwis",
    text: "Na stronie z cennikiem Trackly rozpoznaje nazwę, plan, cenę i cykl rozliczenia, a potem pokazuje dyskretne powiadomienie.",
  },
  {
    num: "02",
    title: "Potwierdzasz",
    text: "Klikasz Dodaj w powiadomieniu albo przycisk zakupu w serwisie. Formularz jest już wypełniony - poprawiasz, co trzeba, i zapisujesz.",
  },
  {
    num: "03",
    title: "Masz wszystko pod ręką",
    text: "Koszty, daty odnowień i pełna lista czekają w panelu, zawsze o jedno kliknięcie od paska narzędzi.",
  },
];

const FEATURES = [
  {
    title: "Wkrótce odnawiane",
    text: "Osobna sekcja pokazuje subskrypcje, które odnowią się w najbliższych dniach.",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Edytujesz i usuwasz",
    text: "Cena poszła w górę albo rezygnujesz? Poprawiasz wpis w kilka sekund.",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
  },
  {
    title: "Kilka walut naraz",
    text: "Złotówki, euro i dolary liczone osobno, bez zmyślonych przeliczników.",
    icon: (
      <svg viewBox="0 0 24 24">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    title: "Dodajesz ręcznie",
    text: "Subskrypcje sprzed instalacji wpiszesz sam, w tym samym formularzu.",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
];

const FLOW = [
  {
    allowed: true,
    content: (
      <>
        Wykrywanie subskrypcji - <strong>lokalnie w przeglądarce</strong>
      </>
    ),
  },
  { allowed: true, content: "Zapisane subskrypcje - na serwerze, dostępne z każdego urządzenia" },
  { allowed: true, content: "Logowanie przez Google - tylko adres e-mail i numer konta" },
  { allowed: false, content: "Historia przeglądania" },
  { allowed: false, content: "Treść odwiedzanych stron" },
  { allowed: false, content: "Reklamy i sprzedaż danych" },
];

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function StepVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className={styles.mini}>
        <span className={styles.scan} />
        <p className={styles.miniLabel}>spotify.com/premium</p>
        <span className={styles.miniStrong}>Premium Individual</span>
        <p className={styles.miniMuted}>26,99 zł / miesiąc</p>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className={`${styles.mini} ${styles.miniToast}`}>
        <span className={styles.miniStrong}>Wykryto: Spotify</span>
        <p className={styles.miniMuted}>Premium · 26,99 PLN / miesiąc</p>
        <div className={styles.miniActions}>
          <span>Nie teraz</span>
          <span>Dodaj</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mini}>
      <p className={styles.miniLabel}>Koszt miesięczny</p>
      <span className={styles.miniStrong}>88,97 PLN</span>
      <div className={styles.miniRow}>
        <strong>Spotify</strong>
        <span>odnowienie 22.10</span>
      </div>
    </div>
  );
}

export default function Nowa() {
  return (
    <div className={styles.site}>
      <div className={`${styles.shell} ${styles.navWrap}`}>
        <header className={styles.nav}>
          <Image
            src="/wordmark.png"
            alt="Trackly"
            width={588}
            height={210}
            className={styles.navLogo}
            loading="eager"
          />
          <nav className={styles.navLinks} aria-label="Nawigacja">
            <a className={styles.navLink} href="#jak-to-dziala">
              Jak to działa
            </a>
            <a className={styles.navLink} href="#panel">
              Panel
            </a>
            <a className={styles.navLink} href="#prywatnosc">
              Prywatność
            </a>
            <a
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall} ${styles.navCta}`}
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.labelLong}>Zobacz w Chrome Web Store</span>
              <span className={styles.labelShort}>Chrome Web Store</span>
            </a>
          </nav>
        </header>
      </div>

      <main id="tresc">
        <section className={`${styles.shell} ${styles.hero}`}>
          <p className={`${styles.badgePill} ${styles.rise}`}>
            <span className={styles.liveDot} aria-hidden="true" />
            Wtyczka do przeglądarki
          </p>
          <h1 className={`${styles.heroTitle} ${styles.rise} ${styles.delay1}`}>
            Wszystkie subskrypcje
            <br />
            <span className={styles.accent}>w jednym miejscu</span>
          </h1>
          <p className={`${styles.heroLede} ${styles.rise} ${styles.delay2}`}>
            Trackly rozpoznaje subskrypcję w chwili, gdy ją kupujesz, i pokazuje Ci koszty oraz daty
            odnowień - zanim zaskoczy Cię przelew.
          </p>
          <div className={`${styles.heroActions} ${styles.rise} ${styles.delay3}`} id="instalacja">
            <a
              className={`${styles.btn} ${styles.btnPrimary}`}
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Zobacz w Chrome Web Store
              <StoreIcon />
            </a>
            <a className={`${styles.btn} ${styles.btnGhost}`} href="#jak-to-dziala">
              Zobacz, jak działa
            </a>
          </div>
          <p className={`${styles.heroNote} ${styles.rise} ${styles.delay3}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Wykrywanie działa lokalnie na Twoim komputerze.
          </p>

          <div className={`${styles.demoWrap} ${styles.rise} ${styles.delay4}`}>
            <Demo />
          </div>
        </section>

        <section className={`${styles.section} ${styles.anchor}`} id="jak-to-dziala">
          <div className={styles.shell}>
            <Reveal>
              <div className={`${styles.sectionHead} ${styles.center}`}>
                <span className={styles.eyebrow}>Jak to działa</span>
                <h2 className={styles.h2}>Trzy kroki, z czego dwa robi wtyczka</h2>
                <p className={styles.lead}>
                  Nie musisz niczego wpisywać z pamięci ani pilnować terminów. Trackly włącza się
                  dokładnie wtedy, kiedy powstaje nowa subskrypcja.
                </p>
              </div>
            </Reveal>

            <div className={styles.steps}>
              {STEPS.map((step, index) => (
                <Reveal key={step.num} delay={index * 110}>
                  <article className={`${styles.card} ${styles.step}`}>
                    <span className={styles.stepNum}>{step.num}</span>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepText}>{step.text}</p>
                    <div className={styles.stepVisual} aria-hidden="true">
                      <StepVisual index={index} />
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.anchor}`} id="panel">
          <div className={styles.shell}>
            <Reveal>
              <div className={styles.sectionHead}>
                <span className={styles.eyebrow}>Panel</span>
                <h2 className={styles.h2}>Liczby, które faktycznie coś znaczą</h2>
                <p className={styles.lead}>
                  Subskrypcje miesięczne i roczne pokazujemy osobno, zamiast dzielić roczne przez
                  dwanaście. Widzisz to, co realnie schodzi z konta.
                </p>
              </div>
            </Reveal>

            <div className={styles.bento}>
              <Reveal className={styles.statsCell}>
                <div className={`${styles.card} ${styles.statsCard}`}>
                  <div className={styles.statsHead}>
                    <Image src="/icon.png" alt="" width={128} height={128} />
                    <span>Twoje subskrypcje</span>
                  </div>
                  <div className={styles.statsGrid}>
                    <div className={styles.stat}>
                      <p className={styles.statLabel}>Koszt miesięczny</p>
                      <p className={styles.statValue}>
                        <CountUp to={88.97} />
                        <small>zł</small>
                      </p>
                    </div>
                    <div className={styles.stat}>
                      <p className={styles.statLabel}>Koszt roczny</p>
                      <p className={styles.statValue}>
                        <CountUp to={199} />
                        <small>zł</small>
                      </p>
                    </div>
                    <div className={`${styles.stat} ${styles.statAccent}`}>
                      <p className={styles.statLabel}>Rocznie łącznie</p>
                      <p className={styles.statValue}>
                        <CountUp to={1266.64} />
                        <small>zł</small>
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>

              {FEATURES.map((feature, index) => (
                <Reveal key={feature.title} delay={(index + 1) * 90}>
                  <div className={`${styles.card} ${styles.feature}`}>
                    <span className={styles.featureIcon} aria-hidden="true">
                      {feature.icon}
                    </span>
                    <h3 className={styles.featureTitle}>{feature.title}</h3>
                    <p className={styles.featureText}>{feature.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.anchor}`} id="prywatnosc">
          <div className={`${styles.shell} ${styles.privacy}`}>
            <Reveal>
              <div>
                <span className={styles.eyebrow}>Prywatność</span>
                <h2 className={styles.h2}>Treść stron nie opuszcza Twojej przeglądarki</h2>
                <p className={styles.privacyText}>
                  Rozpoznawanie subskrypcji dzieje się w całości na Twoim komputerze. Trackly nie
                  wysyła nigdzie tego, co przeglądasz - ani adresów stron, ani ich zawartości.
                </p>
                <p className={styles.privacyText}>
                  Na serwer trafia wyłącznie to, co sam świadomie zapiszesz: nazwa serwisu, plan,
                  cena i data odnowienia.
                </p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className={`${styles.card} ${styles.flow}`}>
                {FLOW.map((row, index) => (
                  <div
                    key={index}
                    className={`${styles.flowRow} ${row.allowed ? styles.flowYes : styles.flowNo}`}
                  >
                    <span className={styles.flowIcon} aria-hidden="true">
                      {row.allowed ? (
                        <svg viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                    </span>
                    <span>{row.content}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.shell}>
            <Reveal>
              <div className={styles.cta}>
                <Image className={styles.ctaIcon} src="/icon.png" alt="" width={128} height={128} />
                <h2 className={styles.ctaTitle}>Wszystkie subskrypcje w jednym miejscu</h2>
                <p className={styles.ctaNote}>
                  Wtyczka do przeglądarki. Wykrywanie działa lokalnie na Twoim komputerze.
                </p>
                <div className={styles.ctaActions}>
                  <a
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    href={storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Zobacz w Chrome Web Store
                    <StoreIcon />
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerInner}`}>
          <div>
            <Image
              src="/wordmark.png"
              alt="Trackly"
              width={588}
              height={210}
              className={styles.footerLogo}
            />
            <p className={styles.footerNote}>
              Projekt tworzony przez dwie osoby. Trackly nie jest powiązane z serwisami, których
              subskrypcje pomaga śledzić.
            </p>
          </div>
          <nav className={styles.footerLinks} aria-label="Stopka">
            <a href={storeUrl} target="_blank" rel="noopener noreferrer">
              Chrome Web Store
            </a>
            <a href="/privacy">Polityka prywatności</a>
            <a href="mailto:kontakt@tracklyapp.pl">Kontakt</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
