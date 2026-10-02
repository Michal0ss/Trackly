import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import site from "@/components/site.module.css";
import { paths } from "@/lib/locale";
import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "Polityka prywatności - Trackly",
  description:
    "Jakie dane zbiera rozszerzenie Trackly, po co i co się z nimi dzieje.",
  alternates: {
    canonical: "/privacy",
    languages: { pl: "/privacy", en: "/en/privacy", "x-default": "/privacy" },
  },
};

export default function Privacy() {
  return (
    <SiteShell lang="pl" alternateHref={paths.en.privacy}>
      <main className={site.main} id={paths.pl.content}>
        <div className={site.shell}>
          <div className={styles.doc}>
            <a className={styles.back} href="/">
              ← Wróć na stronę główną
            </a>

            <h1 className={styles.title}>Polityka prywatności</h1>
            <p className={styles.updated}>Ostatnia aktualizacja: 1 października 2026</p>

            <div className={styles.body}>
              <p>
                Trackly to rozszerzenie do przeglądarki, które pomaga śledzić subskrypcje.
                Ten dokument opisuje, jakie dane zbieramy, po co i co się z nimi dzieje. Staraliśmy
                się napisać go językiem, który da się przeczytać bez prawnika.
              </p>

              <h2>Czego nie zbieramy</h2>
              <p>Zaczynamy od tego, bo to najważniejsze:</p>
              <ul>
                <li>
                  <strong>Nie zbieramy historii przeglądania.</strong> Nie wiemy, jakie strony
                  odwiedzasz.
                </li>
                <li>
                  <strong>Nie wysyłamy treści stron.</strong> Rozpoznawanie subskrypcji odbywa się
                  w całości na Twoim komputerze&nbsp;- tekst strony nigdy nie opuszcza przeglądarki.
                </li>
                <li>
                  <strong>Nie zbieramy danych płatniczych.</strong> Trackly nie ma dostępu do
                  numerów kart ani do Twoich kont w serwisach.
                </li>
                <li>
                  <strong>Nie sprzedajemy danych</strong> i nie udostępniamy ich reklamodawcom.
                </li>
              </ul>

              <h2>Jakie dane zbieramy</h2>
              <p>
                <strong>Adres e-mail i identyfikator konta Google.</strong> Otrzymujemy je, gdy
                logujesz się przez Google. Służą wyłącznie do rozpoznania, że to Ty, i powiązania
                Twoich subskrypcji z kontem. Nie pobieramy zdjęcia profilowego, listy kontaktów ani
                niczego innego z konta Google.
              </p>
              <p>
                <strong>Subskrypcje, które sam zapiszesz.</strong> Gdy potwierdzisz dodanie
                subskrypcji, zapisujemy nazwę serwisu, nazwę planu, cenę, walutę, cykl rozliczenia,
                datę odnowienia oraz informację, czy odnawia się automatycznie. Nic ponadto. Adres
                strony, na której wykryliśmy subskrypcję, zostaje w Twojej przeglądarce.
              </p>
              <p>
                <strong>Dane przechowywane lokalnie w przeglądarce.</strong> Token sesji, kopia Twojej
                listy subskrypcji, dzięki której panel otwiera się od razu, informacje o wykrytych
                subskrypcjach czekających na potwierdzenie, zapis, dla których serwisów już
                pytaliśmy, oraz ustawienia przypomnień. Na serwer trafia z nich tylko token, dołączany
                do zapytań, żeby serwer wiedział, że to Ty. Token i kopia listy znikają po
                wylogowaniu, a wszystko razem przy usunięciu rozszerzenia.
              </p>
              <p>
                <strong>Przypomnienia.</strong> Jeśli je włączysz, rozszerzenie raz dziennie pobiera
                Twoją listę subskrypcji z naszego serwera i samo sprawdza, czy coś zbliża się do
                odnowienia. Powiadomienie wyświetla przeglądarka na Twoim komputerze, bez udziału
                zewnętrznych usług.
              </p>

              <h2>Dlaczego rozszerzenie prosi o uprawnienia</h2>
              <ul>
                <li>
                  <strong>Dostęp do wybranych stron</strong>&nbsp;- rozszerzenie działa tylko na liście
                  konkretnych serwisów subskrypcyjnych, a nie na wszystkich stronach. Jest to
                  potrzebne, żeby rozpoznać subskrypcję w momencie zakupu.
                </li>
                <li>
                  <strong>Pamięć lokalna</strong>&nbsp;- do przechowania sesji i danych między
                  otwarciami przeglądarki.
                </li>
                <li>
                  <strong>Tożsamość</strong>&nbsp;- do logowania przez konto Google.
                </li>
                <li>
                  <strong>Alarmy</strong>&nbsp;- do codziennego sprawdzenia, czy zbliża się
                  odnowienie, gdy przypomnienia są włączone.
                </li>
                <li>
                  <strong>Powiadomienia</strong>&nbsp;- o to uprawnienie prosimy dopiero wtedy, gdy
                  włączysz przypomnienia.
                </li>
              </ul>

              <h2 id="lista">Lista oczekujących na aplikację</h2>
              <p>
                Na tracklyapp.pl możesz zapisać się na listę osób, które chcą dostać wiadomość
                o premierze aplikacji Trackly na telefon. Zapisujemy wtedy adres e-mail, język strony
                i datę zapisu. Robimy to na podstawie Twojej zgody i używamy tych danych wyłącznie do
                wysłania informacji o premierze aplikacji oraz zaproszenia do wcześniejszego dostępu.
              </p>
              <p>
                Zgodę możesz wycofać w każdej chwili, pisząc na adres podany niżej albo odpowiadając
                na naszą wiadomość. Wycofanie zgody nie wpływa na zgodność z prawem wcześniejszego
                przetwarzania.
              </p>

              <h2>Komu przekazujemy dane</h2>
              <p>Korzystamy z trzech zewnętrznych usług:</p>
              <ul>
                <li>
                  <strong>Google</strong>&nbsp;- obsługuje logowanie. Weryfikujemy u niego, że token
                  logowania jest prawdziwy, i otrzymujemy adres e-mail.
                </li>
                <li>
                  <strong>Vercel</strong>&nbsp;- utrzymuje stronę i serwer aplikacji, przez który
                  przechodzą zapytania z rozszerzenia i formularza zapisu na liście oczekujących.
                </li>
                <li>
                  <strong>Supabase</strong>&nbsp;- przechowuje bazę danych z Twoim kontem, zapisanymi
                  subskrypcjami i listą oczekujących.
                </li>
              </ul>
              <p>
                Vercel i Supabase przetwarzają dane tylko po to, żeby Trackly działało. Ich serwery
                mogą znajdować się poza Europejskim Obszarem Gospodarczym. Nie korzystamy
                z narzędzi analitycznych ani reklamowych.
              </p>

              <h2>Jak długo przechowujemy dane</h2>
              <p>
                Twoje subskrypcje przechowujemy tak długo, jak korzystasz z konta. Możesz w każdej
                chwili usunąć pojedynczą subskrypcję w panelu rozszerzenia.
              </p>
              <p>
                Adres z listy oczekujących usuwamy po wysłaniu wiadomości o premierze aplikacji albo
                wcześniej, jeśli wycofasz zgodę.
              </p>

              <h2>Twoje prawa</h2>
              <p>
                Możesz poprosić o dostęp do swoich danych, ich poprawienie lub usunięcie całego
                konta. Wystarczy napisać na adres podany niżej. Odpowiadamy najszybciej, jak
                potrafimy.
              </p>

              <h2>Zmiany w tym dokumencie</h2>
              <p>
                Jeśli zmienimy sposób przetwarzania danych, zaktualizujemy tę stronę i zmienimy datę
                na górze.
              </p>

              <h2>Kontakt</h2>
              <p>
                Pytania dotyczące prywatności kieruj na{" "}
                <a href="mailto:kontakt@tracklyapp.pl">kontakt@tracklyapp.pl</a>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
