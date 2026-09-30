import { useEffect, useState } from 'react';

interface CountUpProps {
  to: number;
  /** Starting value; pass a larger number than `to` to count down */
  from?: number;
  /** Milliseconds the count takes */
  duration?: number;
  /** Milliseconds to hold at `from` before counting */
  delay?: number;
}

/** Animates a whole number from `from` to `to`, easing out as it lands. */
export function CountUp({ to, from = 0, duration = 800, delay = 0 }: CountUpProps) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to);
      return;
    }

    let frame = 0;
    let start: number | undefined;
    const tick = (now: number) => {
      start ??= now;
      const progress = Math.min(1, Math.max(0, (now - start - delay) / duration));
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, from, duration, delay]);

  return <>{value}</>;
}
