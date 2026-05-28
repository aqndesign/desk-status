import { useEffect, useRef, useState } from 'react';
import { GaugeChart } from '@carbon/charts-react';

interface DeskGaugeProps {
  currentDays: number;
  totalDays: number;
  thresholdDays: number;
  qualified: boolean;
}

// Carbon semi-gauge geometry (from source):
//   radius = Math.min(svgWidth / 2, svgHeight)
//   arcCenter = (svgWidth / 2, svgHeight)
// Height of 300 ensures the threshold label (at ~sin(72°)×R above center)
// stays within the SVG viewport for typical card widths (~540px → R≈270).
const CHART_HEIGHT = 300;

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
  const [containerWidth, setContainerWidth] = useState(400);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, []);

  // Match Carbon's radius formula for semi gauge
  const R = Math.min(containerWidth / 2, CHART_HEIGHT);
  const arcWidth = 26;
  const cx = containerWidth / 2;
  const cy = CHART_HEIGHT;

  const thresholdAngle = daysToAngle(thresholdDays, totalDays);
  // Span from just inside the inner arc edge to just outside the outer edge
  const tickInner = polarXY(cx, cy, R - arcWidth - 8, thresholdAngle);
  const tickOuter = polarXY(cx, cy, R + 8, thresholdAngle);
  const labelPt = polarXY(cx, cy, R + 22, thresholdAngle);

  const fillColor = qualified ? '#16A34A' : '#EA580C';

  const data = [{ group: 'value', value: (currentDays / totalDays) * 100 }];
  const options = {
    gauge: {
      type: 'semi' as const,
      arcWidth,
      showPercentageSymbol: false,
      numberFormatter: (v: number) => String(Math.round((v / 100) * totalDays)),
      valueFontSize: () => 52,
      deltaArrow: { enabled: false },
    },
    color: {
      scale: { value: fillColor },
    },
    height: `${CHART_HEIGHT}px`,
    toolbar: { enabled: false },
    animations: true,
  };

  return (
    <div className="ds-gauge-wrap" ref={wrapperRef}>
      <GaugeChart data={data} options={options} />

      {/* Threshold annotation overlay — coordinate space matches Carbon's internal SVG */}
      <svg
        className="ds-gauge-overlay"
        width={containerWidth}
        height={CHART_HEIGHT}
        aria-hidden="true"
      >
        {/* Scale endpoint labels — offset inward so they stay within SVG bounds */}
        <text
          x="10" y={(cy - 10).toFixed(1)}
          textAnchor="start"
          fill="#94A3B8" fontSize="11"
          fontFamily="var(--font-source-sans-3), system-ui, sans-serif"
        >
          0
        </text>
        <text
          x={(containerWidth - 10).toFixed(1)} y={(cy - 10).toFixed(1)}
          textAnchor="end"
          fill="#94A3B8" fontSize="11"
          fontFamily="var(--font-source-sans-3), system-ui, sans-serif"
        >
          {totalDays}
        </text>

        {/* Threshold tick — spans the full arc width with a white halo for contrast on any arc color */}
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
      </svg>

      {/* Minimum label below gauge */}
      <div className="ds-gauge-minimum">
        <span className="ds-gauge-minimum-tick" />
        <span className="ds-gauge-minimum-text">{thresholdDays} days minimum</span>
      </div>
    </div>
  );
}
