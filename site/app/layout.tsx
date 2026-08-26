import type { Metadata } from "next";
import { Manrope, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const display = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const body = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Trackly - wszystkie subskrypcje w jednym miejscu",
  description:
    "Trackly rozpoznaje subskrypcję w chwili zakupu i pokazuje koszty oraz daty odnowień w jednym miejscu. Rozszerzenie do Chrome, które wykrywa lokalnie w Twojej przeglądarce.",
  icons: { icon: "/icon.png" },
  openGraph: {
    title: "Trackly - wszystkie subskrypcje w jednym miejscu",
    description:
      "Rozpoznaje subskrypcję w chwili zakupu. Koszty i daty odnowień w jednym miejscu.",
    locale: "pl_PL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className={`${display.variable} ${body.variable}`}>
      <body style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}>
        <div className="aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="page">{children}</div>
      </body>
    </html>
  );
}
