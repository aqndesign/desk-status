import { useMemo } from 'react';
import coworkingAnimation from '../../assets/lottie/coworking-office.json';
import { readAccent } from '../../lib/brand';
import { hexToHsl, hslToHex, recolorLottie, type Hsl } from '../../lib/lottieColors';
import { LottiePlayer } from '../LottiePlayer';

// Skin is drawn with these two solid fills only, so they are safe to exempt
const SKIN = new Set(['#F3A4A3', '#F39392']);

// Hue and saturation of Meta's cool grays (#CBD2D9, #67788A)
const NEUTRAL = { h: 210, s: 0.16 };

const isCool = ({ h, s }: Hsl) => s > 0.12 && h >= 150 && h <= 260;
const isMint = ({ h, s }: Hsl) => s > 0.12 && h >= 150 && h < 190;
const isRed = ({ h, s }: Hsl) => s > 0.35 && (h >= 335 || h <= 15);

// How far mint ramps move toward white once they turn blue
const MINT_LIFT = 0.35;

/**
 * Brings the source palette (navy, cyan, mint, red) onto Meta's: brand blue
 * with cool grays and white.
 *   cool hues         → the brand blue's hue, keeping their own lightness, so
 *                       the navy/cyan/mint ramps become one family of blues
 *   mint ramps        → also lifted toward white. Mint was the light accent
 *                       against the dark floor (plants, clothing, desk trim);
 *                       at the floor's own hue it needs to be paler to keep
 *                       standing apart from it.
 *   warm object ramps → cool gray (beanbags, shirts, lampshade). A ramp counts
 *                       when any of its stops is red or pink, which takes the
 *                       ramp's pale peach end with it.
 *   everything else   → unchanged: skin, white, black, and the warm lamp light
 *                       (as gray it would read as a shadow, not light)
 */
function toMetaPalette(brandHue: number) {
  return (hex: string, ramp: readonly string[]) => {
    if (SKIN.has(hex)) return undefined;
    const color = hexToHsl(hex);
    const stops = ramp.map(hexToHsl);
    if (isCool(color)) {
      const l = stops.some(isMint) ? color.l + (1 - color.l) * MINT_LIFT : color.l;
      return hslToHex({ h: brandHue, s: color.s, l });
    }
    if (color.s > 0.12 && stops.some(isRed)) {
      return hslToHex({ ...NEUTRAL, l: color.l });
    }
    return undefined;
  };
}

// The scene spans nearly the full width of its 1080×1080 frame (measured
// extremes, so the card's text can align to them) but only the middle three
// quarters of its height
const ART_BOUNDS = '8 131 1064 825';

/** Shown when the employee will be seated in the coworking spaces. */
export default function CoworkingIllustration({ className }: { className: string }) {
  const animationData = useMemo(
    () => recolorLottie(coworkingAnimation, toMetaPalette(hexToHsl(readAccent()).h)),
    [],
  );

  return <LottiePlayer animationData={animationData} className={className} artBounds={ART_BOUNDS} />;
}
