type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}

function rgbToHex(rgb: ArrayLike<number>): string {
  const channel = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
  return `#${channel(rgb[0])}${channel(rgb[1])}${channel(rgb[2])}`.toUpperCase();
}

/** Returns `hex` with its HSL lightness moved by `delta` (-1..1), hue and saturation kept. */
export function shiftLightness(hex: string, delta: number): string {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }

  // h is in sextants (0–6) and can be negative coming out of the red branch
  const hue = ((h % 6) + 6) % 6;
  const l2 = Math.min(1, Math.max(0, l + delta));
  const c = (1 - Math.abs(2 * l2 - 1)) * s;
  const x = c * (1 - Math.abs((hue % 2) - 1));
  const m = l2 - c / 2;
  const [r2, g2, b2] = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ][Math.floor(hue)];
  return rgbToHex([r2 + m, g2 + m, b2 + m]);
}

/**
 * Returns a copy of a Lottie animation with fill and stroke colors swapped
 * according to `colorMap` (source hex → target hex). Covers both static colors
 * and every keyframe of animated ones; alpha is left untouched.
 */
export function recolorLottie<T>(animationData: T, colorMap: Record<string, string>): T {
  const targets = new Map(
    Object.entries(colorMap).map(([from, to]) => [from.toUpperCase(), hexToRgb(to)]),
  );

  const swap = (rgba: number[]) => {
    const target = targets.get(rgbToHex(rgba));
    if (target) [rgba[0], rgba[1], rgba[2]] = target;
  };

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== 'object') return;

    const item = node as { ty?: unknown; c?: { k?: unknown } };
    const k = (item.ty === 'fl' || item.ty === 'st') && item.c?.k;
    if (Array.isArray(k)) {
      if (typeof k[0] === 'number') {
        swap(k as number[]);
      } else {
        // Animated color: each keyframe carries a start (and, in older exports, end) value
        for (const keyframe of k as { s?: number[]; e?: number[] }[]) {
          if (keyframe.s) swap(keyframe.s);
          if (keyframe.e) swap(keyframe.e);
        }
      }
    }
    Object.values(node).forEach(visit);
  };

  const copy = structuredClone(animationData);
  visit(copy);
  return copy;
}
