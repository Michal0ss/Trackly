// Adres produkcyjny strony. Vercel podstawia swoj wlasny automatycznie, a gdy
// bedzie juz wlasna domena, wystarczy ustawic NEXT_PUBLIC_SITE_URL w panelu
// Vercela. Bez tego Next nie umie zbudowac bezwzglednego adresu obrazka
// podgladu, ktory portale spolecznosciowe pokazuja przy wklejonym linku.
//
// Stala siedzi w osobnym pliku, a nie w layout.tsx, zeby sitemap.ts i robots.ts
// mogly ja czytac bez wciagania calego komponentu ukladu strony.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
