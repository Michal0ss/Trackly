import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Polityka prywatności - Trackly",
  description:
    "Jakie dane zbiera rozszerzenie Trackly, po co i co się z nimi dzieje.",
};

export default function Privacy() {
  return (
    <>
      <header className="topbar">
        <div className="shell topbar-inner">
          <a href="/" aria-label="Trackly - strona główna">
            <Image
              src="/wordmark.png"
              alt="Trackly"
              width={588}
              height={210}
              className="topbar-logo"
            />
          </a>
        </div>
      </header>

      <main className="shell doc" id="tresc">
        <a className="doc-back" href="/">
          ← Wróć na stronę główną
        </a>

        <h1>Polityka prywatności</h1>
        <p className="doc-updated">Ostatnia aktualizacja: 26 sierpnia 2026</p>

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
            w całości na Twoim komputerze - tekst strony nigdy nie opuszcza przeglądarki.
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
          datę odnowienia, adres strony, z której pochodzi wpis, oraz informację, czy odnawia
          się automatycznie. Nic ponadto.
        </p>
        <p>
          <strong>Dane przechowywane lokalnie w przeglądarce.</strong> Token sesji, informacje
          o wykrytych subskrypcjach czekających na potwierdzenie oraz zapis, dla których
          serwisów już pytaliśmy. Te dane nie trafiają na nasz serwer i znikają przy usunięciu
          rozszerzenia.
        </p>

        <h2>Dlaczego rozszerzenie prosi o uprawnienia</h2>
        <ul>
          <li>
            <strong>Dostęp do wybranych stron</strong> - rozszerzenie działa tylko na liście
            konkretnych serwisów subskrypcyjnych, a nie na wszystkich stronach. Jest to
            potrzebne, żeby rozpoznać subskrypcję w momencie zakupu.
          </li>
          <li>
            <strong>Pamięć lokalna</strong> - do przechowania sesji i danych między
            otwarciami przeglądarki.
          </li>
          <li>
            <strong>Tożsamość</strong> - do logowania przez konto Google.
          </li>
        </ul>

        <h2>Komu przekazujemy dane</h2>
        <p>
          Jedynym podmiotem zewnętrznym jest <strong>Google</strong>, które obsługuje
          logowanie. Weryfikujemy u niego, że token logowania jest prawdziwy, i otrzymujemy
          adres e-mail. Nie korzystamy z narzędzi analitycznych ani reklamowych.
        </p>

        <h2>Jak długo przechowujemy dane</h2>
        <p>
          Twoje subskrypcje przechowujemy tak długo, jak korzystasz z konta. Możesz w każdej
          chwili usunąć pojedynczą subskrypcję w panelu rozszerzenia.
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
          <strong>kontakt@trackly.pl</strong>.
        </p>
      </main>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <p className="footer-note">Trackly</p>
          <nav className="footer-links" aria-label="Stopka">
            <a href="/">Strona główna</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
