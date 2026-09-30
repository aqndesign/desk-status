import { useEffect, useRef, type CSSProperties } from 'react';
// SVG-only build: about half the size of the full player. It drops the canvas
// renderer and After Effects expressions, neither of which our animations use.
import lottie from 'lottie-web/build/player/lottie_light';
import { MOBILE_QUERY } from '../lib/breakpoints';

interface LottiePlayerProps {
  animationData: object;
  className?: string;
  /** Describe the illustration when it carries meaning; omit when decorative */
  label?: string;
  /** Frame shown, paused, for users who prefer reduced motion */
  stillFrame?: number;
  /**
   * Where the artwork sits inside the comp, as an SVG viewBox ("x y width height").
   * On phones the view is cropped to it, so the art fills its box instead of
   * spending scarce height on the comp's empty margins.
   */
  artBounds?: string;
}

export function LottiePlayer({ animationData, className, label, stillFrame = 0, artBounds }: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { w: compWidth = 500, h: compHeight = 500 } = animationData as { w?: number; h?: number };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Lottie is driven by JS, so the global reduced-motion CSS rule can't pause it
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: !reduceMotion,
      autoplay: !reduceMotion,
      animationData,
    });
    if (reduceMotion) {
      animation.addEventListener('DOMLoaded', () => animation.goToAndStop(stillFrame, true));
    }

    const phone = window.matchMedia(MOBILE_QUERY);
    const applyView = () => {
      const view = artBounds && phone.matches ? artBounds : `0 0 ${compWidth} ${compHeight}`;
      container.querySelector('svg')?.setAttribute('viewBox', view);
    };
    // Lottie builds its <svg> asynchronously; cover both orders
    animation.addEventListener('DOMLoaded', applyView);
    applyView();
    phone.addEventListener('change', applyView);

    return () => {
      phone.removeEventListener('change', applyView);
      animation.destroy();
    };
  }, [animationData, stillFrame, artBounds, compWidth, compHeight]);

  return (
    <div
      ref={containerRef}
      className={className}
      // Lets CSS convert screen pixels into the comp's own units (see the entry animation)
      style={{ '--lottie-comp-width': compWidth } as CSSProperties}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
