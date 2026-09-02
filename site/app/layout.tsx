import type { Metadata } from "next";
import { Manrope, Source_Sans_3 } from "next/font/google";
import { siteUrl } from "@/lib/site";
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

const title = "Trackly - wszystkie subskrypcje w jednym miejscu";
const description =
  "Trackly rozpoznaje subskrypcję w chwili zakupu i pokazuje koszty oraz daty odnowień w jednym miejscu. Wykrywanie działa lokalnie w Twojej przeglądarce.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "Trackly",
  alternates: { canonical: "/" },
  icons: { icon: "/icon.png" },
  openGraph: {
    title,
    description:
      "Rozpoznaje subskrypcję w chwili zakupu. Koszty i daty odnowień w jednym miejscu.",
    url: "/",
    siteName: "Trackly",
    locale: "pl_PL",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Trackly - wszystkie subskrypcje w jednym miejscu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description:
      "Rozpoznaje subskrypcję w chwili zakupu. Koszty i daty odnowień w jednym miejscu.",
    images: ["/og.png"],
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
        <a className="skip" href="#tresc">
          Przejdź do treści
        </a>
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
