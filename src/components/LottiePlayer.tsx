import { useEffect, useRef } from 'react';
// SVG-only build: about half the size of the full player. It drops the canvas
// renderer and After Effects expressions, neither of which our animations use.
import lottie from 'lottie-web/build/player/lottie_light';

interface LottiePlayerProps {
  animationData: object;
  className?: string;
  /** Describe the illustration when it carries meaning; omit when decorative */
  label?: string;
  /** Frame shown, paused, for users who prefer reduced motion */
  stillFrame?: number;
}

export function LottiePlayer({ animationData, className, label, stillFrame = 0 }: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // Lottie is driven by JS, so the global reduced-motion CSS rule can't pause it
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animation = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: !reduceMotion,
      autoplay: !reduceMotion,
      animationData,
    });
    if (reduceMotion) {
      animation.addEventListener('DOMLoaded', () => animation.goToAndStop(stillFrame, true));
    }

    return () => animation.destroy();
  }, [animationData, stillFrame]);

  return (
    <div
      ref={containerRef}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
