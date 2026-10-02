import Image from "next/image";
import { paths, type Lang } from "@/lib/locale";
import { storeUrl } from "@/lib/site";
import styles from "./site.module.css";

const COPY = {
  pl: {
    skip: "Przejdź do treści",
    home: "Trackly - strona główna",
    nav: [
      { href: "/#jak-to-dziala", label: "Jak to działa" },
      { href: "/#panel", label: "Panel" },
      { href: "/#prywatnosc", label: "Prywatność" },
      { href: "/#aplikacja", label: "Aplikacja" },
    ],
    navLabel: "Nawigacja",
    languageLabel: "Język",
    ctaLong: "Zobacz w Chrome Web Store",
    note: "Projekt tworzony przez dwie osoby. Trackly nie jest powiązane z serwisami, których subskrypcje pomaga śledzić.",
    footerLabel: "Stopka",
    privacy: "Polityka prywatności",
    contact: "Kontakt",
  },
  en: {
    skip: "Skip to content",
    home: "Trackly home",
    nav: [
      { href: "/en#how-it-works", label: "How it works" },
      { href: "/en#dashboard", label: "Dashboard" },
      { href: "/en#privacy", label: "Privacy" },
      { href: "/en#app", label: "Mobile app" },
    ],
    navLabel: "Navigation",
    languageLabel: "Language",
    ctaLong: "Get it on the Chrome Web Store",
    note: "Built by two people. Trackly isn't affiliated with any of the services whose subscriptions it helps track.",
    footerLabel: "Footer",
    privacy: "Privacy policy",
    contact: "Contact",
  },
};

export default function SiteShell({
  lang,
  alternateHref,
  children,
}: {
  lang: Lang;
  alternateHref: string;
  children: React.ReactNode;
}) {
  const copy = COPY[lang];
  const languages: { code: Lang; label: string }[] = [
    { code: "pl", label: "PL" },
    { code: "en", label: "EN" },
  ];

  return (
    <>
      <a className="skip" href={`#${paths[lang].content}`} lang={lang}>
        {copy.skip}
      </a>
      <div className={styles.site} lang={lang}>
        <div className={`${styles.shell} ${styles.navWrap}`}>
          <header className={styles.nav}>
            <a className={styles.navHome} href={paths[lang].home} aria-label={copy.home}>
              <Image
                src="/wordmark.png"
                alt="Trackly"
                width={588}
                height={210}
                className={styles.navLogo}
                loading="eager"
              />
            </a>
            <nav className={styles.navLinks} aria-label={copy.navLabel}>
              {copy.nav.map((link) => (
                <a key={link.href} className={styles.navLink} href={link.href}>
                  {link.label}
                </a>
              ))}
              <div className={styles.langSwitch} role="group" aria-label={copy.languageLabel}>
                {languages.map((language) =>
                  language.code === lang ? (
                    <span key={language.code} className={styles.langActive} aria-current="true">
                      {language.label}
                    </span>
                  ) : (
                    <a
                      key={language.code}
                      className={styles.langLink}
                      href={alternateHref}
                      hrefLang={language.code}
                      lang={language.code}
                    >
                      {language.label}
                    </a>
                  ),
                )}
              </div>
              <a
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall} ${styles.navCta}`}
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.labelLong}>{copy.ctaLong}</span>
                <span className={styles.labelShort}>Chrome Web Store</span>
              </a>
            </nav>
          </header>
        </div>

        {children}

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
              <p className={styles.footerNote}>{copy.note}</p>
            </div>
            <nav className={styles.footerLinks} aria-label={copy.footerLabel}>
              <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                Chrome Web Store
              </a>
              <a href={paths[lang].privacy}>{copy.privacy}</a>
              <a href="mailto:kontakt@tracklyapp.pl">{copy.contact}</a>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
