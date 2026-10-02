import Image from "next/image";
import CountUp from "@/components/CountUp";
import Demo from "@/components/Demo";
import PhoneDemo from "@/components/PhoneDemo";
import Reveal from "@/components/Reveal";
import SiteShell from "@/components/SiteShell";
import site from "@/components/site.module.css";
import teaser from "@/components/teaser.module.css";
import WaitlistForm from "@/components/WaitlistForm";
import { paths, type Lang } from "@/lib/locale";
import { storeUrl } from "@/lib/site";
import styles from "@/app/home.module.css";

const COPY = {
  pl: {
    ids: { install: "instalacja", how: "jak-to-dziala", panel: "panel", privacy: "prywatnosc", app: "aplikacja" },
    titleLine: "Wszystkie subskrypcje",
    titleAccent: "w jednym miejscu",
    lede: "Trackly rozpoznaje subskrypcję w chwili, gdy ją kupujesz, i pokazuje Ci koszty oraz daty odnowień - zanim zaskoczy Cię przelew.",
    storeCta: "Dodaj do Chrome za darmo",
    howCta: "Zobacz, jak działa",
    note: "Wtyczka do przeglądarki. Wykrywanie działa lokalnie na Twoim komputerze.",
    howEyebrow: "Jak to działa",
    howTitle: "Trzy kroki, z czego dwa robi wtyczka",
    howLead:
      "Nie musisz niczego wpisywać z pamięci ani pilnować terminów. Trackly włącza się dokładnie wtedy, kiedy powstaje nowa subskrypcja.",
    steps: [
      {
        title: "Przeglądasz serwis",
        text: "Na stronie z cennikiem jednego z ponad 35 serwisów Trackly rozpoznaje nazwę, plan, cenę i cykl rozliczenia, a potem pokazuje dyskretne powiadomienie.",
      },
      {
        title: "Potwierdzasz",
        text: "Klikasz Dodaj w powiadomieniu albo przycisk zakupu w serwisie. Formularz jest już wypełniony - poprawiasz, co trzeba, i zapisujesz.",
      },
      {
        title: "Masz wszystko pod ręką",
        text: "Koszty, daty odnowień i pełna lista czekają w panelu, zawsze o jedno kliknięcie od paska narzędzi.",
      },
    ],
    visual: {
      url: "serwis.com/premium",
      price: "26,99 zł / miesiąc",
      detected: "Wykryto: Serwis",
      detectedSub: "Premium · 26,99 PLN / miesiąc",
      notNow: "Nie teraz",
      add: "Dodaj",
      monthly: "Koszt miesięczny",
      monthlyValue: "88,97 PLN",
      service: "Serwis",
      renews: "odnowienie 22.10",
    },
    panelEyebrow: "Panel",
    panelTitle: "Liczby, które faktycznie coś znaczą",
    panelLead:
      "Subskrypcje miesięczne i roczne pokazujemy osobno, zamiast dzielić roczne przez dwanaście. Widzisz to, co realnie schodzi z konta.",
    stats: {
      heading: "Twoje subskrypcje",
      monthly: "Koszt miesięczny",
      yearly: "Koszt roczny",
      total: "Rocznie łącznie",
      values: [88.97, 199, 1266.64],
      unit: "zł",
      locale: "pl-PL",
    },
    features: [
      {
        title: "Wkrótce odnawiane",
        text: "Osobna sekcja pokazuje subskrypcje, które odnowią się w najbliższych dniach.",
      },
      {
        title: "Rezygnujesz bez szukania",
        text: "Przy większości serwisów jedno kliknięcie otwiera stronę, na której zmienisz albo anulujesz plan.",
      },
      {
        title: "Kilka walut naraz",
        text: "Złotówki, euro i dolary liczone osobno, bez zmyślonych przeliczników.",
      },
      {
        title: "Dodajesz i poprawiasz",
        text: "Subskrypcje sprzed instalacji wpiszesz sam, a każdy wpis poprawisz albo usuniesz w kilka sekund.",
      },
    ],
    privacyEyebrow: "Prywatność",
    privacyTitle: "Treść stron nie opuszcza Twojej przeglądarki",
    privacyText: [
      "Rozpoznawanie subskrypcji dzieje się w całości na Twoim komputerze. Trackly nie wysyła nigdzie tego, co przeglądasz - ani adresów stron, ani ich zawartości.",
      "Na serwer trafia wyłącznie to, co sam świadomie zapiszesz: nazwa serwisu, plan, cena i data odnowienia.",
    ],
    flow: [
      {
        allowed: true,
        content: (
          <>
            Wykrywanie subskrypcji&nbsp;- <strong>lokalnie w przeglądarce</strong>
          </>
        ),
      },
      { allowed: true, content: "Zapisane subskrypcje - na serwerze, dostępne z każdego urządzenia" },
      { allowed: true, content: "Logowanie przez Google - tylko adres e-mail i numer konta" },
      { allowed: false, content: "Historia przeglądania" },
      { allowed: false, content: "Treść odwiedzanych stron" },
      { allowed: false, content: "Reklamy i sprzedaż danych" },
    ],
    app: {
      eyebrow: "Wkrótce",
      title: "Nowa odsłona Trackly",
      lead: "Pracujemy nad aplikacją na iPhone'a i Androida. Wtyczka pilnuje subskrypcji, a aplikacja zajmie się wszystkimi stałymi płatnościami, od czynszu i rat po abonamenty.",
      points: [
        {
          title: "Rozmowa zamiast formularzy",
          text: "Napisz albo powiedz „zapłaciłem 2400 zł za czynsz”, a Trackly sam zapisze płatność.",
        },
        {
          title: "Wszystkie stałe płatności razem",
          text: "Czynsz, raty, rachunki i subskrypcje w jednym miejscu, z sumą na każdy miesiąc.",
        },
        {
          title: "Przypomnienia przed terminem",
          text: "Dowiesz się o płatności, zanim zejdzie z konta.",
        },
      ],
      stores: "Wkrótce w",
    },
    ctaTitle: "Wszystkie subskrypcje w jednym miejscu",
  },
  en: {
    ids: { install: "install", how: "how-it-works", panel: "dashboard", privacy: "privacy", app: "app" },
    titleLine: "All your subscriptions",
    titleAccent: "in one place",
    lede: "Trackly spots a subscription the moment you buy it and shows you what it costs and when it renews, before a charge catches you off guard.",
    storeCta: "Add to Chrome, it's free",
    howCta: "See how it works",
    note: "A browser extension. Detection runs locally on your computer.",
    howEyebrow: "How it works",
    howTitle: "Three steps, and the extension does two of them",
    howLead:
      "No typing things in from memory, no keeping an eye on dates. Trackly steps in exactly when a new subscription starts.",
    steps: [
      {
        title: "You browse a service",
        text: "On the pricing page of one of more than 35 services, Trackly reads the name, plan, price and billing cycle, then shows a small prompt.",
      },
      {
        title: "You confirm",
        text: "Click Add in the prompt or the service's own buy button. The form is already filled in, so you fix whatever needs fixing and save.",
      },
      {
        title: "Everything at hand",
        text: "Costs, renewal dates and the full list wait in the panel, always one click away in your toolbar.",
      },
    ],
    visual: {
      url: "service.com/premium",
      price: "$9.99 / month",
      detected: "Detected: Service",
      detectedSub: "Premium · 9.99 USD / month",
      notNow: "Not now",
      add: "Add",
      monthly: "Monthly cost",
      monthlyValue: "37.97 USD",
      service: "Service",
      renews: "renews Oct 22",
    },
    panelEyebrow: "Dashboard",
    panelTitle: "Numbers that actually mean something",
    panelLead:
      "Monthly and yearly subscriptions are shown separately instead of dividing the yearly ones by twelve. You see what really leaves your account.",
    stats: {
      heading: "Your subscriptions",
      monthly: "Monthly cost",
      yearly: "Yearly cost",
      total: "Total per year",
      values: [37.97, 84.99, 540.63],
      unit: "USD",
      locale: "en-US",
    },
    features: [
      {
        title: "Renewing soon",
        text: "A separate section shows the subscriptions that renew in the next few days.",
      },
      {
        title: "Cancel without searching",
        text: "For most services, one click opens the page where you change or cancel your plan.",
      },
      {
        title: "Several currencies",
        text: "Dollars, euros, pounds and złoty are counted separately, with no made-up exchange rates.",
      },
      {
        title: "Add and edit",
        text: "Add the subscriptions you had before installing it, and fix or delete any entry in seconds.",
      },
    ],
    privacyEyebrow: "Privacy",
    privacyTitle: "Page content never leaves your browser",
    privacyText: [
      "Subscriptions are recognised entirely on your computer. Trackly doesn't send what you browse anywhere, neither page addresses nor their content.",
      "The server only gets what you choose to save: the service name, plan, price and renewal date.",
    ],
    flow: [
      {
        allowed: true,
        content: (
          <>
            Subscription detection: <strong>locally in your browser</strong>
          </>
        ),
      },
      { allowed: true, content: "Saved subscriptions: on the server, available on any device" },
      { allowed: true, content: "Google sign-in: only your email address and account ID" },
      { allowed: false, content: "Browsing history" },
      { allowed: false, content: "Content of the pages you visit" },
      { allowed: false, content: "Ads and selling data" },
    ],
    app: {
      eyebrow: "Coming soon",
      title: "The new Trackly",
      lead: "We're building an app for iPhone and Android. The extension keeps an eye on subscriptions, and the app will handle every regular payment, from rent and loans to memberships.",
      points: [
        {
          title: "Chat instead of forms",
          text: "Type or say “paid $1,850 for rent” and Trackly saves it for you.",
        },
        {
          title: "Every regular payment together",
          text: "Rent, loans, bills and subscriptions in one place, with a total for each month.",
        },
        {
          title: "Reminders before the due date",
          text: "Know about a payment before it leaves your account.",
        },
      ],
      stores: "Coming to",
    },
    ctaTitle: "All your subscriptions in one place",
  },
};

const FEATURE_ICONS = [
  <svg key="clock" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>,
  <svg key="globe" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>,
  <svg key="layers" viewBox="0 0 24 24">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>,
  <svg key="plus" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>,
];

const APP_ICONS = [
  <svg key="chat" viewBox="0 0 24 24">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>,
  <svg key="repeat" viewBox="0 0 24 24">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>,
  <svg key="bell" viewBox="0 0 24 24">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>,
];

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function StepVisual({ index, visual }: { index: number; visual: (typeof COPY)["pl"]["visual"] }) {
  if (index === 0) {
    return (
      <div className={styles.mini}>
        <span className={styles.scan} />
        <p className={styles.miniLabel}>{visual.url}</p>
        <span className={styles.miniStrong}>Premium</span>
        <p className={styles.miniMuted}>{visual.price}</p>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className={`${styles.mini} ${styles.miniToast}`}>
        <span className={styles.miniStrong}>{visual.detected}</span>
        <p className={styles.miniMuted}>{visual.detectedSub}</p>
        <div className={styles.miniActions}>
          <span>{visual.notNow}</span>
          <span>{visual.add}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mini}>
      <p className={styles.miniLabel}>{visual.monthly}</p>
      <span className={styles.miniStrong}>{visual.monthlyValue}</span>
      <div className={styles.miniRow}>
        <strong>{visual.service}</strong>
        <span>{visual.renews}</span>
      </div>
    </div>
  );
}

export default function HomePage({ lang }: { lang: Lang }) {
  const copy = COPY[lang];
  const other: Lang = lang === "pl" ? "en" : "pl";
  const statLabels = [copy.stats.monthly, copy.stats.yearly, copy.stats.total];

  return (
    <SiteShell lang={lang} alternateHref={paths[other].home}>
      <main id={paths[lang].content} className={site.main}>
        <section className={`${site.shell} ${styles.hero}`}>
          <h1 className={`${styles.heroTitle} ${styles.rise}`}>
            {copy.titleLine}
            <br />
            <span className={styles.accent}>{copy.titleAccent}</span>
          </h1>
          <p className={`${styles.heroLede} ${styles.rise} ${styles.delay1}`}>{copy.lede}</p>
          <div className={`${styles.heroActions} ${styles.rise} ${styles.delay2}`} id={copy.ids.install}>
            <a
              className={`${site.btn} ${site.btnPrimary}`}
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy.storeCta}
              <StoreIcon />
            </a>
            <a className={`${site.btn} ${site.btnGhost}`} href={`#${copy.ids.how}`}>
              {copy.howCta}
            </a>
          </div>
          <p className={`${styles.heroNote} ${styles.rise} ${styles.delay2}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            {copy.note}
          </p>

          <div className={`${styles.demoWrap} ${styles.appear} ${styles.delay3}`}>
            <Demo lang={lang} />
          </div>
        </section>

        <section className={`${styles.section} ${styles.anchor}`} id={copy.ids.how}>
          <div className={site.shell}>
            <Reveal>
              <div className={`${styles.sectionHead} ${styles.center}`}>
                <span className={styles.eyebrow}>{copy.howEyebrow}</span>
                <h2 className={styles.h2}>{copy.howTitle}</h2>
                <p className={styles.lead}>{copy.howLead}</p>
              </div>
            </Reveal>

            <div className={styles.steps}>
              {copy.steps.map((step, index) => (
                <Reveal key={step.title} delay={index * 110}>
                  <article className={`${styles.card} ${styles.step}`}>
                    <span className={styles.stepNum}>{`0${index + 1}`}</span>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepText}>{step.text}</p>
                    <div className={styles.stepVisual} aria-hidden="true">
                      <StepVisual index={index} visual={copy.visual} />
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.anchor}`} id={copy.ids.panel}>
          <div className={site.shell}>
            <Reveal>
              <div className={styles.sectionHead}>
                <span className={styles.eyebrow}>{copy.panelEyebrow}</span>
                <h2 className={styles.h2}>{copy.panelTitle}</h2>
                <p className={styles.lead}>{copy.panelLead}</p>
              </div>
            </Reveal>

            <div className={styles.bento}>
              <Reveal className={styles.statsCell}>
                <div className={`${styles.card} ${styles.statsCard}`}>
                  <div className={styles.statsHead}>
                    <Image src="/icon.png" alt="" width={128} height={128} />
                    <span>{copy.stats.heading}</span>
                  </div>
                  <div className={styles.statsGrid}>
                    {statLabels.map((label, index) => (
                      <div
                        key={label}
                        className={index === 2 ? `${styles.stat} ${styles.statAccent}` : styles.stat}
                      >
                        <p className={styles.statLabel}>{label}</p>
                        <p className={styles.statValue}>
                          <CountUp to={copy.stats.values[index]} locale={copy.stats.locale} />
                          <small>{copy.stats.unit}</small>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              {copy.features.map((feature, index) => (
                <Reveal key={feature.title} delay={(index + 1) * 90}>
                  <div className={`${styles.card} ${styles.feature}`}>
                    <span className={styles.featureIcon} aria-hidden="true">
                      {FEATURE_ICONS[index]}
                    </span>
                    <h3 className={styles.featureTitle}>{feature.title}</h3>
                    <p className={styles.featureText}>{feature.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.anchor}`} id={copy.ids.privacy}>
          <div className={`${site.shell} ${styles.privacy}`}>
            <Reveal>
              <div>
                <span className={styles.eyebrow}>{copy.privacyEyebrow}</span>
                <h2 className={styles.h2}>{copy.privacyTitle}</h2>
                {copy.privacyText.map((text) => (
                  <p key={text} className={styles.privacyText}>
                    {text}
                  </p>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className={`${styles.card} ${styles.flow}`}>
                {copy.flow.map((row, index) => (
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

        <section className={`${styles.section} ${styles.anchor}`} id={copy.ids.app}>
          <div className={site.shell}>
            <Reveal fade>
              <div className={teaser.teaser}>
                <div className={teaser.copy}>
                  <span className={styles.eyebrow}>{copy.app.eyebrow}</span>
                  <h2 className={styles.h2}>{copy.app.title}</h2>
                  <p className={teaser.lead}>{copy.app.lead}</p>
                  <ul className={teaser.points}>
                    {copy.app.points.map((point, index) => (
                      <li key={point.title} className={teaser.point}>
                        <span className={teaser.pointIcon} aria-hidden="true">
                          {APP_ICONS[index]}
                        </span>
                        <div>
                          <p className={teaser.pointTitle}>{point.title}</p>
                          <p className={teaser.pointText}>{point.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <WaitlistForm lang={lang} />
                  <div className={teaser.stores}>
                    <span>{copy.app.stores}</span>
                    <span className={teaser.store}>App Store</span>
                    <span className={teaser.store}>Google Play</span>
                  </div>
                </div>
                <PhoneDemo lang={lang} />
              </div>
            </Reveal>
          </div>
        </section>

        <section className={styles.section}>
          <div className={site.shell}>
            <Reveal fade>
              <div className={styles.cta}>
                <Image className={styles.ctaIcon} src="/icon.png" alt="" width={128} height={128} />
                <h2 className={styles.ctaTitle}>{copy.ctaTitle}</h2>
                <p className={styles.ctaNote}>{copy.note}</p>
                <div className={styles.ctaActions}>
                  <a
                    className={`${site.btn} ${site.btnPrimary}`}
                    href={storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {copy.storeCta}
                    <StoreIcon />
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
