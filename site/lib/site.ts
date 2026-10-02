export const storeUrl =
  "https://chromewebstore.google.com/detail/trackly/mflggeobolhmojbgmniglaogbehggiap";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const apiUrl =
  process.env.TRACKLY_API_URL ?? "https://trackly-api-git-main-michal-team00.vercel.app";
