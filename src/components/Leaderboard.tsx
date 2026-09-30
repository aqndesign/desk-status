import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { Avatar, Badge, Box, Flex, Text } from '@radix-ui/themes';
import type { OrgMember } from '../data/colleagues';
import { CountUp } from './ui/CountUp';
import { Icon } from './ui/Icon';

interface LeaderboardProps {
  members: OrgMember[];
  /** The employee viewing the board */
  currentId: string;
  /** Length of the evaluation period; a full bar means every day in office */
  totalDays: number;
}

// Rows cascade in one after another; bars and counts follow their own row
const ROW_STAGGER_MS = 45;
const BARS_START_MS = 300;

const firstName = (name: string) => name.split(' ')[0];
const initials = (name: string) => name.split(' ').map(part => part[0]).join('');
const days = (n: number) => (n === 1 ? '1 day' : `${n} days`);

function ordinal(n: number): string {
  const rule = new Intl.PluralRules('en', { type: 'ordinal' }).select(n);
  return `${n}${{ one: 'st', two: 'nd', few: 'rd' }[rule as string] ?? 'th'}`;
}

/** A playful title for where the employee landed. Every tier is a compliment. */
function tierFor(rank: number, total: number): { title: string; icon: string } {
  if (rank === 1) return { title: 'Office Legend', icon: 'crown' };
  if (rank <= 3) return { title: 'Podium Finisher', icon: 'trophy' };
  const position = (rank - 1) / Math.max(1, total - 1);
  if (position <= 0.5) return { title: 'Desk Regular', icon: 'flame' };
  if (position <= 0.8) return { title: 'Familiar Face', icon: 'hand-waving' };
  return { title: 'Free Spirit', icon: 'compass' };
}

export function Leaderboard({ members, currentId, totalDays }: LeaderboardProps) {
  const ranked = useMemo(() => [...members].sort((a, b) => b.days - a.days), [members]);
  const index = ranked.findIndex(member => member.id === currentId);
  const rank = index + 1;
  const you = ranked[index];
  const ahead = ranked[index - 1];
  const behindCount = ranked.length - rank;
  const tier = tierFor(rank, ranked.length);

  // Once the cascade is under way, bring the employee's own row into view
  const youRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => {
      youRef.current?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  let nudge: string;
  if (!ahead) {
    nudge = 'Nobody badged in more than you. Take a bow!';
  } else {
    const gap = `${days(ahead.days - you.days)} behind ${firstName(ahead.name)} in ${ordinal(rank - 1)}`;
    nudge = behindCount > 0
      ? `Just ${gap}, and ahead of ${behindCount} ${behindCount === 1 ? 'teammate' : 'teammates'}.`
      : `Just ${gap}. A fresh board starts next half!`;
  }

  return (
    <>
      <Flex align="center" gap="4" className="card-tile lb-summary">
        <Box className="lb-summary-rank" aria-label={`You are ranked ${ordinal(rank)} of ${ranked.length}`}>
          <span aria-hidden="true">
            #<CountUp from={ranked.length} to={rank} duration={900} delay={200} />
          </span>
          <Text as="div" size="1" color="gray" weight="medium" aria-hidden="true">
            of {ranked.length}
          </Text>
        </Box>
        <Box>
          <Flex align="center" gap="2" mb="1">
            <Flex align="center" justify="center" className="lb-tier-icon">
              <Icon name={tier.icon} size={14} />
            </Flex>
            <Text size="3" weight="bold">{tier.title}</Text>
          </Flex>
          <Text as="p" size="2" color="gray">{nudge}</Text>
        </Box>
      </Flex>

      <ol
        className="card-tile lb-list"
        style={{ '--lb-stagger': `${ROW_STAGGER_MS}ms`, '--lb-bars-start': `${BARS_START_MS}ms` } as CSSProperties}
      >
        {ranked.map((member, i) => {
          const isYou = member.id === currentId;
          const position = i + 1;
          return (
            <li
              key={member.id}
              ref={isYou ? youRef : undefined}
              className={isYou ? 'lb-row is-you' : 'lb-row'}
              style={{ '--i': i, '--fill': member.days / totalDays } as CSSProperties}
            >
              <span
                className="lb-rank"
                data-medal={position <= 3 ? position : undefined}
                aria-label={`${ordinal(position)} place`}
              >
                {position}
              </span>
              <span className="lb-avatar">
                <Avatar
                  size="2"
                  radius="full"
                  variant={isYou ? 'solid' : 'soft'}
                  color={isYou ? undefined : 'gray'}
                  fallback={initials(member.name)}
                />
                {position === 1 && <Icon name="crown" size={14} className="lb-crown" />}
              </span>
              <Box className="lb-main">
                <Flex justify="between" align="baseline" gap="3">
                  <Flex align="center" gap="2" minWidth="0">
                    <Text size="2" weight={isYou ? 'bold' : 'medium'} truncate>{member.name}</Text>
                    {isYou && <Badge size="1" radius="full">You</Badge>}
                  </Flex>
                  <Text size="2" color="gray" className="lb-days">
                    <Text weight="bold" highContrast>
                      <CountUp to={member.days} delay={BARS_START_MS + i * ROW_STAGGER_MS} />
                    </Text>{' '}
                    days
                  </Text>
                </Flex>
                <div className="lb-bar" aria-hidden="true">
                  <div className="lb-bar-fill" />
                </div>
              </Box>
            </li>
          );
        })}
      </ol>
    </>
  );
}
