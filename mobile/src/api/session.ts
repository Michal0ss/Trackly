import { createApi } from './client';

export function developmentApi() {
  if (!__DEV__) return null;
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const token = process.env.EXPO_PUBLIC_DEV_TOKEN?.trim();
  if (!baseUrl || !token) return null;
  try {
    const url = new URL(baseUrl);
    const local = /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(url.hostname);
    if (!local || !['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null;
    return createApi(baseUrl, token);
  } catch {
    return null;
  }
}
