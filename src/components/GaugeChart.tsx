import { useEffect, useRef, useState } from 'react';

interface DeskGaugeProps {
  currentDays: number;
  totalDays: number;
  thresholdDays: number;
  qualified: boolean;
}

const ARC_WIDTH = 26;
// How far the threshold tick extends past the arc on each side
const TICK_OVERHANG = 8;
// Room above the arc for the tick + its white halo
const TOP_PAD = 14;
// Horizontal inset so the tick halo never clips at the container edge
const SIDE_PAD = 12;

function daysToAngle(days: number, total: number): number {
  // 0 days → 180° (left), total → 0° (right)
  return 180 - (days / total) * 180;
}

function polarXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

export function DeskGauge({ currentDays, totalDays, thresholdDays, qualified }: DeskGaugeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [animate, setAnimate] = useState(false);
  const measured = width > 0;

  useEffect(() => {
    if (!wrapperRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, []);

  // Kick off the fill animation one frame after first measurement
  useEffect(() => {
    if (!measured) return;
    const raf = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(raf);
  }, [measured]);

  const r = width / 2 - SIDE_PAD;
  const cx = width / 2;
  const cy = TOP_PAD + r;
  const svgHeight = cy + 32;

  const rMid = r - ARC_WIDTH / 2;
  const arcLength = Math.PI * rMid;
  const fillFraction = Math.max(0, Math.min(1, currentDays / totalDays));
  const arcPath = `M ${(cx - rMid).toFixed(1)} ${cy.toFixed(1)} A ${rMid.toFixed(1)} ${rMid.toFixed(1)} 0 0 1 ${(cx + rMid).toFixed(1)} ${cy.toFixed(1)}`;
  const fillColor = qualified ? '#16A34A' : '#EA580C';

  const thresholdAngle = daysToAngle(thresholdDays, totalDays);
  const tickInner = polarXY(cx, cy, r - ARC_WIDTH - TICK_OVERHANG, thresholdAngle);
  const tickOuter = polarXY(cx, cy, r + TICK_OVERHANG, thresholdAngle);

  return (
    <div className="ds-gauge-wrap" ref={wrapperRef}>
      {measured && (
        <svg
          className="ds-gauge-svg"
          width={width}
          height={svgHeight}
          role="img"
          aria-label={`${currentDays} of ${totalDays} days in office — minimum ${thresholdDays}`}
        >
          {/* Track */}
          <path d={arcPath} fill="none" stroke="#E8E8EC" strokeWidth={ARC_WIDTH} />

          {/* Value arc — animated via dash offset */}
          <path
            d={arcPath}
            fill="none"
            stroke={fillColor}
            strokeWidth={ARC_WIDTH}
            strokeDasharray={`${arcLength} ${arcLength}`}
            strokeDashoffset={animate ? arcLength * (1 - fillFraction) : arcLength}
            style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.25, 0.8, 0.25, 1)' }}
          />

          {/* Threshold tick — white halo + dark line for contrast on any arc color */}
          <line
            x1={tickInner.x.toFixed(1)} y1={tickInner.y.toFixed(1)}
            x2={tickOuter.x.toFixed(1)} y2={tickOuter.y.toFixed(1)}
            stroke="white" strokeWidth="7" strokeLinecap="round"
          />
          <line
            x1={tickInner.x.toFixed(1)} y1={tickInner.y.toFixed(1)}
            x2={tickOuter.x.toFixed(1)} y2={tickOuter.y.toFixed(1)}
            stroke="#1E293B" strokeWidth="3" strokeLinecap="round"
          />

          {/* Value number */}
          <text
            x={cx.toFixed(1)} y={(cy - 4).toFixed(1)}
            textAnchor="middle"
            fill="#1C2024"
            fontSize="52"
            fontWeight="700"
            fontFamily="var(--font-sora), system-ui, sans-serif"
            letterSpacing="-0.02em"
          >
            {currentDays}
          </text>

          {/* Scale endpoint labels, centered under the arc ends */}
          <text
            x={(cx - rMid).toFixed(1)} y={(cy + 24).toFixed(1)}
            textAnchor="middle"
            fill="#94A3B8" fontSize="11"
            fontFamily="var(--font-source-sans-3), system-ui, sans-serif"
          >
            0
          </text>
          <text
            x={(cx + rMid).toFixed(1)} y={(cy + 24).toFixed(1)}
            textAnchor="middle"
            fill="#94A3B8" fontSize="11"
            fontFamily="var(--font-source-sans-3), system-ui, sans-serif"
          >
            {totalDays}
          </text>
        </svg>
      )}

      {/* Minimum label below gauge */}
      <div className="ds-gauge-minimum">
        <span className="ds-gauge-minimum-tick" />
        <span className="ds-gauge-minimum-text">{thresholdDays} days minimum</span>
      </div>
    </div>
  );
}
