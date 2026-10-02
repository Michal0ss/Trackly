import type { Metadata } from "next";
import HomePage from "@/components/HomePage";

const title = "Trackly - all your subscriptions in one place";
const description =
  "Trackly spots a subscription the moment you buy it and keeps costs and renewal dates in one place. Detection runs locally in your browser.";
const shareDescription = "Spots a subscription the moment you buy it. Costs and renewal dates in one place.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/en",
    languages: { pl: "/", en: "/en", "x-default": "/" },
  },
  openGraph: {
    title,
    description: shareDescription,
    url: "/en",
    siteName: "Trackly",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-en.png",
        width: 1200,
        height: 630,
        alt: "Trackly - all your subscriptions in one place",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: shareDescription,
    images: ["/og-en.png"],
  },
};

export default function HomeEn() {
  return <HomePage lang="en" />;
}
