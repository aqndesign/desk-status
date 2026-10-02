import { useState, type CSSProperties } from 'react';
import { Accordion } from 'radix-ui';
import { Badge, Box, Flex, Heading, Text } from '@radix-ui/themes';
import {
  CRITERIA_GROUPS,
  EVALUATION,
  STATUSES,
  type CriteriaGroup,
  type GroupId,
  type StatusDays,
} from '../data/policy';
import type { Evaluation, GroupResult } from '../lib/eligibility';
import { CountUp } from './ui/CountUp';
import { Icon } from './ui/Icon';

interface CriteriaBreakdownProps {
  days: StatusDays;
  evaluation: Evaluation;
}

// Group colours: brand blue, the brand gradient's magenta and a teal. None of
// them repeats the gauge's green/orange, which mean qualified/not qualified, and
// the three stay apart under colour-vision deficiency (checked with the dataviz
// palette validator; the magenta was chosen over a violet for that reason).
const GROUP_COLOR: Record<GroupId, string> = {
  always: 'var(--color-accent)',
  unlimited: '#95008A',
  limited: '#0D9488',
};

const days = (n: number) => (n === 1 ? '1 day' : `${n} days`);

/** One run of the composition bar */
interface Segment {
  key: string;
  label: string;
  n: number;
  color: string;
  /** Whether the days counted; `over` and `none` are the two ways they didn't */
  kind: 'counted' | 'over' | 'none';
}

/** A day count with the unit set lighter, as in the leaderboard */
function DayCount({ n, countUp = false }: { n: number; countUp?: boolean }) {
  return (
    <Text size="2" color="gray" className="ds-crit-days">
      <Text weight="bold" highContrast>{countUp ? <CountUp to={n} /> : n}</Text>{' '}
      {n === 1 ? 'day' : 'days'}
    </Text>
  );
}

function Group({ group, result, days: logged }: { group: CriteriaGroup; result: GroupResult; days: StatusDays }) {
  const over = result.logged - result.counted;
  const left = result.cap === undefined ? 0 : Math.max(0, result.cap - result.logged);

  return (
    <section className="ds-crit-group" style={{ '--seg': GROUP_COLOR[group.id] } as CSSProperties}>
      <Flex align="start" gap="3" className="ds-crit-head">
        <Flex align="center" justify="center" className="ds-crit-icon">
          <Icon name={group.icon} />
        </Flex>
        <Box minWidth="0" flexGrow="1">
          <Heading as="h4" size="2">{group.title}</Heading>
          <Text as="p" size="1" color="gray">{group.rule}</Text>
        </Box>
        <Box className="ds-crit-total">
          <DayCount n={result.counted} countUp />
          {result.cap !== undefined && result.logged !== result.counted && (
            <Text as="p" size="1" color="gray">of {result.logged} logged</Text>
          )}
        </Box>
      </Flex>

      {/* The shared cap: how much of it has been used, and what fell outside it */}
      {result.cap !== undefined && (
        <div className="ds-crit-cap">
          <div className="ds-crit-cap-track" aria-hidden="true">
            <div
              className="ds-crit-cap-fill"
              style={{ '--fill': Math.min(1, result.logged / result.cap) } as CSSProperties}
            />
          </div>
          <Flex align="center" justify="between" gap="3" wrap="wrap">
            <Text size="1" color="gray">
              {over > 0
                ? `${days(result.logged)} logged against a ${result.cap}-day limit`
                : `${result.logged} of ${result.cap} limit days used`}
            </Text>
            {over > 0
              ? <Badge size="1" color="red" variant="soft" radius="full">{days(over)} over the limit didn't count</Badge>
              : <Badge size="1" color="gray" variant="soft" radius="full">{days(left)} of the limit unused</Badge>}
          </Flex>
        </div>
      )}

      <Accordion.Root type="multiple" className="ds-crit-list">
        {group.statuses.map(id => {
          const status = STATUSES[id];
          return (
            <Accordion.Item key={id} value={id} className="ds-crit-row">
              <Accordion.Header asChild>
                <h5 className="ds-crit-row-head">
                  <Accordion.Trigger className="ds-crit-trigger">
                    <Icon name={status.icon} className="ds-crit-row-icon" />
                    <Text size="2" weight="medium">{status.name}</Text>
                    {/* The space keeps the name and count apart in the button's accessible name */}
                    {' '}
                    <DayCount n={logged[id]} />
                    <Icon name="chevron-down" size={14} />
                  </Accordion.Trigger>
                </h5>
              </Accordion.Header>
              <Accordion.Content className="ds-crit-def">
                <div className="ds-crit-def-inner">
                  <Text as="p" size="2" color="gray">{status.definition}</Text>
                </div>
              </Accordion.Content>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>
    </section>
  );
}

/**
 * Where an employee's days went, and how many of them counted toward a desk:
 * a bar across the whole period, then each criteria group with its statuses.
 * Status rows expand to the policy's definition.
 */
export function CriteriaBreakdown({ days: logged, evaluation }: CriteriaBreakdownProps) {
  const { totalDays, minimumDays } = EVALUATION;
  const margin = evaluation.counted - minimumDays;
  const fraction = (n: number) => n / totalDays;

  // Hovering a bar segment or its legend entry highlights both
  const [hovered, setHovered] = useState<string | null>(null);
  const hoverProps = (key: string) => ({
    onMouseEnter: () => setHovered(key),
    onMouseLeave: () => setHovered(null),
  });

  // Bar segments in the order they stack: counted days first, then days that didn't
  const segments: Segment[] = [
    ...evaluation.groups.map<Segment>(group => ({
      key: group.id,
      label: CRITERIA_GROUPS.find(g => g.id === group.id)!.label,
      n: group.counted,
      color: GROUP_COLOR[group.id],
      kind: 'counted',
    })),
    { key: 'over', label: 'Limited usage, over the limit', n: evaluation.overCap, color: 'var(--gray-8)', kind: 'over' },
    { key: 'none', label: 'Other statuses', n: evaluation.unqualified, color: 'var(--gray-4)', kind: 'none' },
  ];

  // Only segments with days are drawn. Each one's midpoint decides which way its
  // tooltip hangs, so a tooltip near either end stays over the bar.
  let start = 0;
  const shown = segments.filter(s => s.n > 0).map(s => {
    const mid = start + fraction(s.n) / 2;
    start += fraction(s.n);
    return { ...s, align: mid < 0.2 ? 'start' : mid > 0.8 ? 'end' : 'center' };
  });

  const barLabel = `${evaluation.counted} of ${totalDays} days counted toward the ${minimumDays}-day minimum: ` +
    shown.map(s => `${s.label}: ${days(s.n)}`).join('; ');

  return (
    <Box className="card-tile ds-criteria-card">
      <Heading as="h3" size="3">What counted toward your desk</Heading>
      <Text as="p" size="2" color="gray" mt="1">
        Every day in the period is logged under a status. Three kinds of status count toward
        the {minimumDays}-day minimum; any other status doesn't.
      </Text>

      {/* Composition of the period, with the minimum marked on it */}
      <div className="ds-comp" style={{ '--at': fraction(minimumDays) } as CSSProperties}>
        {/* The bar is one image to assistive tech; the tooltips repeat what the legend says */}
        <div
          className="ds-comp-track"
          role="img"
          aria-label={barLabel}
          data-hovering={hovered !== null || undefined}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="ds-comp-fill">
            {shown.map(s => (
              <span
                key={s.key}
                className="ds-comp-seg"
                data-kind={s.kind}
                data-hovered={hovered === s.key || undefined}
                style={{ '--w': fraction(s.n), '--seg': s.color } as CSSProperties}
                {...hoverProps(s.key)}
              >
                <span className="ds-comp-tip" data-align={s.align}>
                  <strong>{days(s.n)}</strong>
                  {s.label}
                </span>
              </span>
            ))}
          </div>
        </div>
        <span className="ds-comp-min" aria-hidden="true" />
        <span className="ds-comp-min-label" aria-hidden="true">{minimumDays} minimum</span>
        <span className="ds-comp-end" aria-hidden="true">{totalDays}</span>
      </div>

      <ul className="ds-comp-legend" data-hovering={hovered !== null || undefined}>
        {shown.map(s => {
          const muted = s.kind !== 'counted';
          return (
            <li
              key={s.key}
              className="ds-comp-key"
              data-kind={s.kind}
              data-hovered={hovered === s.key || undefined}
              style={{ '--seg': s.color } as CSSProperties}
              {...hoverProps(s.key)}
            >
              <span className="ds-comp-swatch" data-kind={s.kind} aria-hidden="true" />
              <Text size="1" color={muted ? 'gray' : undefined} truncate>{s.label}</Text>
              <Text size="1" weight="bold" color={muted ? 'gray' : undefined} className="ds-crit-days">
                <CountUp to={s.n} />
              </Text>
            </li>
          );
        })}
      </ul>

      {CRITERIA_GROUPS.map((group, i) => (
        <Group key={group.id} group={group} result={evaluation.groups[i]} days={logged} />
      ))}

      {/* The remainder of the period, which no group accounts for */}
      {evaluation.unqualified > 0 && (
        <Text as="p" size="1" color="gray" className="ds-crit-other">
          The other {days(evaluation.unqualified)} were logged under statuses that don't count toward
          a desk, such as regular work-from-home days.
        </Text>
      )}

      <Flex align="center" justify="between" gap="3" wrap="wrap" className="ds-crit-sum">
        <Box>
          <Text as="p" size="2" weight="bold">Counted toward your desk</Text>
          <Text as="p" size="1" color="gray">
            {evaluation.groups.map(g => g.counted).join(' + ')} days
          </Text>
        </Box>
        <Flex align="center" gap="2">
          <Text size="4" weight="bold" className="ds-crit-days">
            <CountUp to={evaluation.counted} />
          </Text>
          <Badge size="1" radius="full" variant="soft" color={evaluation.qualified ? 'green' : 'orange'}>
            {margin > 0 && `${days(margin)} past the minimum`}
            {margin === 0 && 'Right at the minimum'}
            {margin < 0 && `${days(-margin)} short of the minimum`}
          </Badge>
        </Flex>
      </Flex>
    </Box>
  );
}
