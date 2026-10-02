import { useEffect, useRef, type CSSProperties } from 'react';
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
  /**
   * Where the artwork sits inside the comp, as an SVG viewBox ("x y width height").
   * The view is cropped to it, so the art's edges are the box's edges: text
   * laid out to the box's width lines up with the drawing, not its empty margins.
   */
  artBounds?: string;
}

export function LottiePlayer({ animationData, className, label, stillFrame = 0, artBounds }: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { w: compWidth = 500, h: compHeight = 500 } = animationData as { w?: number; h?: number };
  const view = artBounds ?? `0 0 ${compWidth} ${compHeight}`;
  const [, , viewWidth, viewHeight] = view.split(' ').map(Number);

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

    // Lottie builds its <svg> asynchronously; cover both orders
    const applyView = () => container.querySelector('svg')?.setAttribute('viewBox', view);
    animation.addEventListener('DOMLoaded', applyView);
    applyView();

    return () => animation.destroy();
  }, [animationData, stillFrame, view]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        // Lets CSS size the box to the cropped art before the animation mounts,
        // and convert screen pixels into the comp's own units (see the entry animation)
        '--lottie-aspect': `${viewWidth} / ${viewHeight}`,
        '--lottie-view-width': viewWidth,
      } as CSSProperties}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
