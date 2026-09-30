const FALLBACK_ACCENT = '#0064E0';

/** The brand blue from `--color-accent` — the token the app icon uses — as a hex string. */
export function readAccent(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
  return /^#[0-9a-f]{6}$/i.test(value) ? value : FALLBACK_ACCENT;
}
