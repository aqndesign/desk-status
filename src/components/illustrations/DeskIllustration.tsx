import { useMemo } from 'react';
import developerAnimation from '../../assets/lottie/developer.json';
import { readAccent } from '../../lib/brand';
import { recolorLottie, shiftLightness } from '../../lib/lottieColors';
import { LottiePlayer } from '../LottiePlayer';

// The scene fills most of its 500×500 frame. Left and right are the drawing's
// measured extremes over the loop (the swaying plant and the tower), so the
// card's text can align to them.
const ART_BOUNDS = '13 22 460 460';

/** Shown when the employee has an assigned desk. */
export default function DeskIllustration({ className }: { className: string }) {
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

  return <LottiePlayer animationData={animationData} className={className} artBounds={ART_BOUNDS} />;
}
