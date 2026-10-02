export type Lang = "pl" | "en";

export const paths = {
  pl: { home: "/", privacy: "/privacy", content: "tresc" },
  en: { home: "/en", privacy: "/en/privacy", content: "content" },
} as const;
