import type { ComponentPropsWithoutRef } from 'react';

type IconProps = ComponentPropsWithoutRef<'i'> & {
  /** Uicons icon name from the bundle, e.g. "search", "chevron-down" */
  name: string;
  /** Fill style; defaults to "solid". Only override when the project specifies it. */
  fill?: 'solid' | 'outline';
  /** Weight; defaults to "regular". Only override when the project specifies it. */
  weight?: 'light' | 'regular' | 'medium' | 'bold';
  /** Font-size in px; defaults to 1em so it tracks the surrounding text */
  size?: number | string;
  /** Provide when the icon is not accompanied by visible text */
  label?: string;
};

export function Icon({
  name,
  fill = 'solid',
  weight = 'regular',
  size,
  label,
  className = '',
  style,
  ...rest
}: IconProps) {
  return (
    <i
      className={`uic uic-round-${fill}-${weight} uic-${name} ${className}`.trim()}
      style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', ...style }}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      {...rest}
    />
  );
}
