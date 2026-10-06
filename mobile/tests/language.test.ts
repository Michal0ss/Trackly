import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatMonth, parseLanguagePreference, resolveLanguage } from '../src/i18n/language.ts';
import { translations } from '../src/i18n/translations.ts';

test('a saved language takes priority over the phone language', () => {
  assert.equal(resolveLanguage('pl', ['en-US']), 'pl');
  assert.equal(resolveLanguage('en', ['pl-PL']), 'en');
});

test('the first supported phone language is used', () => {
  assert.equal(resolveLanguage('system', ['de-DE', 'pl-PL', 'en-US']), 'pl');
  assert.equal(resolveLanguage('system', ['en-GB', 'pl-PL']), 'en');
});

test('regional variants and locale separators are accepted', () => {
  assert.equal(resolveLanguage('system', ['PL_pl']), 'pl');
  assert.equal(resolveLanguage('system', ['en-AU']), 'en');
});

test('unsupported or missing phone languages fall back to English', () => {
  assert.equal(resolveLanguage('system', ['de-DE', 'fr-FR']), 'en');
  assert.equal(resolveLanguage('system', []), 'en');
});

test('missing or invalid saved preferences fall back to the phone setting', () => {
  for (const value of [null, undefined, '', 'de', 'PL', '{}', 1]) {
    assert.equal(parseLanguagePreference(value), 'system');
  }
});

test('explicit preferences survive storage and switching back to system', () => {
  for (const preference of ['pl', 'en', 'system'] as const) {
    assert.equal(parseLanguagePreference(preference), preference);
  }
  assert.equal(resolveLanguage(parseLanguagePreference('system'), ['pl-PL']), 'pl');
});

test('month headings use the selected language and the given year', () => {
  const date = new Date(2026, 9, 6, 12);
  assert.equal(formatMonth(date, 'pl'), 'październik 2026');
  assert.equal(formatMonth(date, 'en'), 'October 2026');
});

test('month headings follow the local calendar across a year boundary', () => {
  assert.equal(formatMonth(new Date(2026, 11, 31, 23, 59), 'en'), 'December 2026');
  assert.equal(formatMonth(new Date(2027, 0, 1, 0, 1), 'pl'), 'styczeń 2027');
});

test('both languages provide nonempty text for every screen', () => {
  assert.deepEqual(Object.keys(translations.pl).sort(), Object.keys(translations.en).sort());
  for (const copy of Object.values(translations)) {
    for (const text of Object.values(copy)) assert.ok(text.trim().length > 0);
  }
});

test('polish one-letter words stay on the same line as the next word', () => {
  for (const text of Object.values(translations.pl)) {
    assert.doesNotMatch(text, /(^|\s)[aiouwz] /i);
  }
  assert.equal(translations.pl.overviewTitle, 'Spokojnie. Wszystko w\u00a0jednym miejscu.');
});
