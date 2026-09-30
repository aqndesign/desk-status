type Rgb = [number, number, number];

/** h in degrees (0–360), s and l as 0–1 */
export interface Hsl {
  h: number;
  s: number;
  l: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const channel = (v: number) => Math.round(clamp01(v) * 255).toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

export function hexToHsl(hex: string): Hsl {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };

  const s = d / (1 - Math.abs(2 * l - 1));
  let sextant: number;
  if (max === r) sextant = ((g - b) / d) % 6;
  else if (max === g) sextant = (b - r) / d + 2;
  else sextant = (r - g) / d + 4;
  return { h: ((sextant * 60) + 360) % 360, s, l };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const sextant = (((h % 360) + 360) % 360) / 60;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((sextant % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ][Math.floor(sextant) % 6];
  return rgbToHex(r + m, g + m, b + m);
}

/** Returns `hex` with its HSL lightness moved by `delta` (-1..1), hue and saturation kept. */
export function shiftLightness(hex: string, delta: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, l: clamp01(hsl.l + delta) });
}

/**
 * How to recolor: either a lookup of source hex → target hex, or a rule that
 * receives each source hex and returns its replacement (undefined = keep).
 * The rule also gets the color's ramp — every stop of the gradient it belongs
 * to, or just itself for a solid — so it can tell, say, the pale end of a red
 * ramp from an unrelated color of the same hue.
 */
export type Recolor =
  | Record<string, string>
  | ((hex: string, ramp: readonly string[]) => string | undefined);

/**
 * Returns a copy of a Lottie animation with its colors remapped. Covers solid
 * fills and strokes, every stop of gradient fills and strokes, and each
 * keyframe of animated colors. Alpha is left untouched.
 */
export function recolorLottie<T>(animationData: T, recolor: Recolor): T {
  const rule =
    typeof recolor === 'function'
      ? recolor
      : ((table) => (hex: string) => table.get(hex))(
          new Map(Object.entries(recolor).map(([from, to]) => [from.toUpperCase(), to])),
        );

  const hexAt = (values: number[], at: number) =>
    rgbToHex(values[at], values[at + 1], values[at + 2]);

  // An illustration reuses a small palette thousands of times over
  const cache = new Map<string, Rgb | null>();
  const swap = (values: number[], at: number, ramp?: readonly string[]) => {
    const hex = hexAt(values, at);
    const key = ramp ? `${hex}|${ramp.join()}` : hex;
    let target = cache.get(key);
    if (target === undefined) {
      const replacement = rule(hex, ramp ?? [hex]);
      target = replacement ? hexToRgb(replacement) : null;
      cache.set(key, target);
    }
    if (target) [values[at], values[at + 1], values[at + 2]] = target;
  };

  // A property is either one value or a list of keyframes carrying a start
  // (and, in older exports, end) value
  const eachValue = (k: unknown, apply: (values: number[]) => void) => {
    if (!Array.isArray(k)) return;
    if (typeof k[0] === 'number') {
      apply(k as number[]);
      return;
    }
    for (const keyframe of k as { s?: number[]; e?: number[] }[]) {
      if (keyframe.s) apply(keyframe.s);
      if (keyframe.e) apply(keyframe.e);
    }
  };

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== 'object') return;

    const item = node as {
      ty?: unknown;
      c?: { k?: unknown };
      g?: { p?: number; k?: { k?: unknown } };
    };
    if (item.ty === 'fl' || item.ty === 'st') {
      eachValue(item.c?.k, (rgba) => swap(rgba, 0));
    } else if (item.ty === 'gf' || item.ty === 'gs') {
      // Stops are packed as [offset, r, g, b] × count, followed by alpha stops
      const count = item.g?.p ?? 0;
      eachValue(item.g?.k?.k, (stops) => {
        const ramp = Array.from({ length: count }, (_, i) => hexAt(stops, i * 4 + 1));
        for (let i = 0; i < count; i++) swap(stops, i * 4 + 1, ramp);
      });
    }
    Object.values(node).forEach(visit);
  };

  const copy = structuredClone(animationData);
  visit(copy);
  return copy;
}
