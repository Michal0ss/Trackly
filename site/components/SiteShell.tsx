import Image from "next/image";
import { storeUrl } from "@/lib/site";
import styles from "./site.module.css";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.site}>
      <div className={`${styles.shell} ${styles.navWrap}`}>
        <header className={styles.nav}>
          <a className={styles.navHome} href="/" aria-label="Trackly - strona główna">
            <Image
              src="/wordmark.png"
              alt="Trackly"
              width={588}
              height={210}
              className={styles.navLogo}
              loading="eager"
            />
          </a>
          <nav className={styles.navLinks} aria-label="Nawigacja">
            <a className={styles.navLink} href="/#jak-to-dziala">
              Jak to działa
            </a>
            <a className={styles.navLink} href="/#panel">
              Panel
            </a>
            <a className={styles.navLink} href="/#prywatnosc">
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
