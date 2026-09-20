import { useMemo } from 'react';
import developerAnimation from '../assets/lottie/developer.json';
import { recolorLottie, shiftLightness } from '../lib/lottieColors';
import { LottiePlayer } from './LottiePlayer';

const FALLBACK_ACCENT = '#0064E0';

// Same token the app icon uses, so the illustration follows the brand colour
function readAccent(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
  return /^#[0-9a-f]{6}$/i.test(value) ? value : FALLBACK_ACCENT;
}

export function HeroIllustration() {
  const animationData = useMemo(() => {
    const accent = readAccent();
    return recolorLottie(developerAnimation, {
      '#7450E9': accent,
      // The laptop glow pulses through a lighter and a deeper tint of the
      // source purple; keep the same lightness offsets around the accent
      '#9477F3': shiftLightness(accent, 0.1),
      '#4914F4': shiftLightness(accent, -0.09),
    });
  }, []);

  return <LottiePlayer animationData={animationData} className="ds-hero-illustration" />;
}
