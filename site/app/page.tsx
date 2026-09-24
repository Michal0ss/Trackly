import Image from "next/image";
import CountUp from "@/components/CountUp";
import HeroDemo from "@/components/HeroDemo";
import Reveal from "@/components/Reveal";
import { storeUrl } from "@/lib/site";

const STEPS = [
  {
    num: "1",
    title: "Przeglądasz serwis",
    text: "Na stronie z cennikiem Trackly rozpoznaje nazwę, plan, cenę i cykl rozliczenia, a potem pokazuje dyskretne powiadomienie.",
  },
  {
    num: "2",
    title: "Potwierdzasz",
    text: "Klikasz Dodaj w powiadomieniu albo przycisk zakupu w serwisie. Formularz jest już wypełniony - poprawiasz, co trzeba, i zapisujesz.",
  },
  {
    num: "3",
    title: "Masz wszystko pod ręką",
    text: "Koszty, daty odnowień i pełna lista czekają w panelu, zawsze o jedno kliknięcie od paska narzędzi.",
  },
];

const FEATURES = [
  {
    title: "Wkrótce odnawiane",
    text: "Osobna sekcja pokazuje subskrypcje, które odnowią się w najbliższych dniach.",
  },
  {
    title: "Edytujesz i usuwasz",
    text: "Cena poszła w górę albo rezygnujesz? Poprawiasz wpis w kilka sekund.",
  },
  {
    title: "Kilka walut naraz",
    text: "Złotówki, euro i dolary liczone osobno, bez zmyślonych przeliczników.",
  },
  {
    title: "Dodajesz ręcznie",
    text: "Subskrypcje sprzed instalacji wpiszesz sam, w tym samym formularzu.",
  },
];

export default function Home() {
  return (
    <>
      <header className="topbar">
        <div className="shell topbar-inner">
          <Image src="/wordmark.png" alt="Trackly" width={588} height={210} className="topbar-logo" priority />
          <nav>
            <a href="#jak-to-dziala">Jak to działa</a>
            <a href="#panel">Panel</a>
            <a href="#prywatnosc">Prywatność</a>
            <a className="btn btn-primary" href="#instalacja">
              Wypróbuj
            </a>
          </nav>
        </div>
      </header>

      <main id="tresc">
        <section className="hero">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <h1>Wszystkie subskrypcje w jednym miejscu</h1>
              <p className="hero-lede">
                Trackly rozpoznaje subskrypcję w chwili, gdy ją kupujesz, i pokazuje Ci koszty
                oraz daty odnowień - zanim zaskoczy Cię przelew.
              </p>
              <div className="hero-actions" id="instalacja">
                <a className="btn btn-primary" href="#jak-to-dziala">
                  Zobacz, jak działa
                </a>
                <a className="btn btn-ghost" href={storeUrl} target="_blank" rel="noopener noreferrer">
                  Zobacz w Chrome Web Store
                </a>
              </div>
              <p className="hero-note">
                <span className="dot-live" aria-hidden="true" />
                Wtyczka do przeglądarki. Wykrywanie działa lokalnie na Twoim komputerze.
              </p>
            </div>

            <div className="hero-demo-wrap">
              <HeroDemo />
            </div>
          </div>
        </section>

        <section className="band" id="jak-to-dziala">
          <div className="shell">
            <Reveal>
              <div className="band-head">
                <h2>Trzy kroki, z czego dwa robi wtyczka</h2>
                <p>
                  Nie musisz niczego wpisywać z pamięci ani pilnować terminów. Trackly włącza się
                  dokładnie wtedy, kiedy powstaje nowa subskrypcja.
                </p>
              </div>
            </Reveal>

            <div className="steps">
              {STEPS.map((step, index) => (
                <Reveal key={step.num} delay={index * 110}>
                  <article className="step">
                    <span className="step-num">{step.num}</span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="band" id="panel">
          <div className="shell">
            <Reveal>
              <div className="band-head">
                <h2>Liczby, które faktycznie coś znaczą</h2>
                <p>
                  Subskrypcje miesięczne i roczne pokazujemy osobno, zamiast dzielić roczne przez
                  dwanaście. Widzisz to, co realnie schodzi z konta.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="stats">
                <div className="stat">
                  <p className="stat-label">Koszt miesięczny</p>
                  <p className="stat-value">
                    <CountUp to={88.97} /> <span>zł</span>
                  </p>
                </div>
                <div className="stat">
                  <p className="stat-label">Koszt roczny</p>
                  <p className="stat-value">
                    <CountUp to={199} /> <span>zł</span>
                  </p>
                </div>
                <div className="stat stat-accent">
                  <p className="stat-label">Rocznie łącznie</p>
                  <p className="stat-value">
                    <CountUp to={1266.64} /> <span>zł</span>
                  </p>
                </div>
              </div>
            </Reveal>

            <div className="features">
              {FEATURES.map((feature, index) => (
                <Reveal key={feature.title} delay={index * 90}>
                  <div className="feature">
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="band" id="prywatnosc">
          <div className="shell privacy-grid">
            <Reveal>
              <div>
                <h2>Treść stron nie opuszcza Twojej przeglądarki</h2>
                <p className="privacy-text">
                  Rozpoznawanie subskrypcji dzieje się w całości na Twoim komputerze. Trackly nie
                  wysyła nigdzie tego, co przeglądasz - ani adresów stron, ani ich zawartości.
                </p>
                <p className="privacy-text">
                  Na serwer trafia wyłącznie to, co sam świadomie zapiszesz: nazwa serwisu, plan,
                  cena i data odnowienia.
                </p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="flow">
                <div className="flow-row yes">
                  <span aria-hidden="true">✓</span>
                  <span>
                    Wykrywanie subskrypcji - <strong>lokalnie w przeglądarce</strong>
                  </span>
                </div>
                <div className="flow-row yes">
                  <span aria-hidden="true">✓</span>
                  <span>Zapisane subskrypcje - na serwerze, dostępne z każdego urządzenia</span>
                </div>
                <div className="flow-row yes">
                  <span aria-hidden="true">✓</span>
                  <span>Logowanie przez Google - tylko adres e-mail i numer konta</span>
                </div>
                <div className="flow-row no">
                  <span aria-hidden="true">✕</span>
                  <span>Historia przeglądania</span>
                </div>
                <div className="flow-row no">
                  <span aria-hidden="true">✕</span>
                  <span>Treść odwiedzanych stron</span>
                </div>
                <div className="flow-row no">
                  <span aria-hidden="true">✕</span>
                  <span>Reklamy i sprzedaż danych</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <div>
            <Image src="/wordmark.png" alt="Trackly" width={588} height={210} className="footer-logo" />
            <p className="footer-note">
              Projekt tworzony przez dwie osoby. Trackly nie jest powiązane z serwisami, których
              subskrypcje pomaga śledzić.
            </p>
          </div>
          <nav className="footer-links" aria-label="Stopka">
            <a href="/privacy">Polityka prywatności</a>
            <a href="mailto:kontakt@tracklyapp.pl">Kontakt</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
