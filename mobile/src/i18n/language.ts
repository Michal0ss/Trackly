export type Language = 'pl' | 'en';
export type LanguagePreference = Language | 'system';

export function parseLanguagePreference(value: unknown): LanguagePreference {
  return value === 'pl' || value === 'en' ? value : 'system';
}

export function resolveLanguage(
  preference: LanguagePreference,
  languageTags: readonly string[],
): Language {
  if (preference !== 'system') return preference;

  for (const tag of languageTags) {
    const language = tag.toLowerCase().split(/[-_]/)[0];
    if (language === 'pl' || language === 'en') return language;
  }

  return 'en';
}

export function formatMonth(date: Date, language: Language): string {
  return new Intl.DateTimeFormat(language === 'pl' ? 'pl-PL' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}
