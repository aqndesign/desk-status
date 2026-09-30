import { lazy, Suspense, useState } from 'react';
import {
  Theme,
  Flex,
  Box,
  Text,
  Heading,
  Badge,
  Button,
  SegmentedControl,
  Grid,
} from '@radix-ui/themes';
import { BottomSheet } from './components/BottomSheet';
import { DeskGauge } from './components/GaugeChart';
import { Leaderboard } from './components/Leaderboard';
import { COLLEAGUES, type OrgMember } from './data/colleagues';
import { Icon } from './components/ui/Icon';

// Each illustration loads as its own chunk (the Lottie player is shared between
// them), so an employee only downloads the animation for their own placement
const DeskIllustration = lazy(() => import('./components/illustrations/DeskIllustration'));
const CoworkingIllustration = lazy(() => import('./components/illustrations/CoworkingIllustration'));

const TOTAL_DAYS = 125;
const THRESHOLD_DAYS = 75;

type Placement = 'desk' | 'coworking';

interface HeroMessage {
  title: string;
  /** Primary button, phrased as the question the employee is likely asking */
  question: string;
  body: string;
  /** Perks listed under the body; `icon` is a Uicons name */
  benefits?: { icon: string; title: string; text: string }[];
}

// The coworking message sells the space on its own merits. It deliberately says
// nothing about attendance or how close the employee came to a desk — those
// numbers live behind the primary button for anyone who wants them.
const HERO: Record<Placement, HeroMessage> = {
  desk: {
    title: "Solid work badging in! You've earned yourself a desk.",
    question: 'How did I earn my desk?',
    body: "We'll take a fresh look next half, so keep up the great rhythm and this desk stays yours.",
  },
  coworking: {
    title: "You'll be seated in the coworking spaces.",
    question: 'Can I get an assigned desk?',
    body: "Settle in wherever suits your day. Here's what's waiting for you:",
    benefits: [
      {
        icon: 'monitor',
        title: 'Desks that come fully equipped',
        text: 'Coworking desks now come with monitors and ergonomic equipment, like chairs and other items you can order from the online store.',
      },
      {
        icon: 'headset',
        title: 'Setup help whenever you want it',
        text: 'Ergonomics specialists can come by and set up your desk for you. Just request a visit.',
      },
      {
        icon: 'location-pin',
        title: 'Sit wherever you like',
        text: "Spaces are first come, first served, so you're free to work anywhere within your assigned building or campus.",
      },
    ],
  },
};

interface Employee {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  days: number;
}

const EMPLOYEES: Employee[] = [
  {
    id: 'qualified',
    name: 'Alex Chen',
    initials: 'AC',
    role: 'Senior Product Designer',
    department: 'Design',
    days: 83,
  },
  {
    id: 'near-miss',
    name: 'Sam Patel',
    initials: 'SP',
    role: 'Software Engineer',
    department: 'Engineering',
    days: 72,
  },
  {
    id: 'coworking',
    name: 'Jordan Lee',
    initials: 'JL',
    role: 'Data Analyst',
    department: 'Analytics',
    days: 67,
  },
];

// Everyone in the org whose evaluation is in, including the preview employees
const ORG_MEMBERS: OrgMember[] = [
  ...COLLEAGUES,
  ...EMPLOYEES.map(({ id, name, days }) => ({ id, name, days })),
];

export default function App() {
  const [selectedId, setSelectedId] = useState<string>('qualified');
  const employee = EMPLOYEES.find(e => e.id === selectedId)!;
  const qualified = employee.days >= THRESHOLD_DAYS;
  const hero = HERO[qualified ? 'desk' : 'coworking'];
  const illustrationClass = qualified
    ? 'ds-hero-illustration'
    : 'ds-hero-illustration ds-hero-illustration--coworking';

  return (
    <Theme accentColor="blue" grayColor="slate" radius="full" scaling="100%" appearance="light">
      <div className="ds-blob-bg" aria-hidden="true">
        <div className="ds-blob ds-blob-1" />
        <div className="ds-blob ds-blob-2" />
        <div className="ds-blob ds-blob-3" />
      </div>

      {/* Header */}
      <header className="ds-header">
        <div className="ds-header-inner">
          <Flex align="center" gap="3">
            <Box style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--accent-9)',
              color: 'var(--accent-contrast)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 10px color-mix(in srgb, var(--accent-9) 40%, transparent)',
            }}>
              <Icon name="desk-chair" size={18} />
            </Box>
            <Heading size="3">Desk Status</Heading>
          </Flex>
          <Badge color="blue" variant="soft" radius="full">
            Q2 '25 Evaluation
          </Badge>
        </div>
      </header>

      {/* Main */}
      {/* A message with a benefits list is long enough to need the whole first screen on phones */}
      <main className={hero.benefits ? 'ds-main ds-main--long' : 'ds-main'}>
        {/* Scenario selector */}
        <div className="ds-scenario-bar">
          <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Preview scenario
          </Text>
          <SegmentedControl.Root
            size="1"
            value={selectedId}
            onValueChange={setSelectedId}
            aria-label="Preview scenario"
          >
            {EMPLOYEES.map(e => {
              const isQual = e.days >= THRESHOLD_DAYS;
              return (
                <SegmentedControl.Item key={e.id} value={e.id}>
                  <Flex align="center" gap="2">
                    <Box
                      width="7px" height="7px"
                      style={{ borderRadius: '50%', background: isQual ? '#22C55E' : '#F97316', flexShrink: 0 }}
                    />
                    {e.name}
                  </Flex>
                </SegmentedControl.Item>
              );
            })}
          </SegmentedControl.Root>
        </div>

        {/* Status card */}
        <Box className="card-glass ds-status-card">
          <Flex direction="column" gap="2" className="card-tile ds-hero-card">
            {/* Fallback reserves the same box, so nothing shifts when the chunk arrives */}
            <Suspense fallback={<div className={illustrationClass} aria-hidden="true" />}>
              {qualified
                ? <DeskIllustration className={illustrationClass} />
                : <CoworkingIllustration className={illustrationClass} />}
            </Suspense>
            {/* One step down the type scale on phones (below Radix's `xs`) */}
            <Heading as="h2" size={{ initial: '5', xs: '6' }}>{hero.title}</Heading>
            <Text as="p" size={{ initial: '2', xs: '3' }} color="gray" className="ds-hero-body">
              {hero.body}
            </Text>

            {hero.benefits && (
              <Flex asChild direction="column" gap={{ initial: '3', xs: '4' }} className="ds-benefits">
                <ul>
                  {hero.benefits.map(benefit => (
                    <Flex asChild key={benefit.title} gap="3" align="start">
                      <li>
                        <Flex align="center" justify="center" className="ds-benefit-icon">
                          <Icon name={benefit.icon} />
                        </Flex>
                        <Box>
                          <Text as="p" size="2" weight="bold">{benefit.title}</Text>
                          <Text as="p" size="2" color="gray">{benefit.text}</Text>
                        </Box>
                      </li>
                    </Flex>
                  ))}
                </ul>
              </Flex>
            )}

            <Flex direction="column" gap="2" className="ds-hero-actions">
              <BottomSheet
                trigger={<Button size="3">{hero.question}</Button>}
                title="How desks are assigned"
                description={`Assigned desks go to teammates with ${THRESHOLD_DAYS} or more in-office days in the evaluation period. Here's where you landed.`}
              >
                {/* Custom SVG gauge — see GaugeChart.tsx. Mounts with the sheet, so the fill animates on every open. */}
                <Box className="card-tile ds-gauge-card">
                  <DeskGauge
                    currentDays={employee.days}
                    totalDays={TOTAL_DAYS}
                    thresholdDays={THRESHOLD_DAYS}
                    qualified={qualified}
                  />
                </Box>

                <Box className="card-tile ds-info-card">
                  <Grid className="ds-info-grid">
                    <Box className="ds-info-cell">
                      <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Evaluation period
                      </Text>
                      <Text size="2" weight="medium">Apr 1 – Jun 30, 2025</Text>
                    </Box>
                    <Box className="ds-info-cell">
                      <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Period length
                      </Text>
                      <Text size="2" weight="medium">{TOTAL_DAYS} days total</Text>
                    </Box>
                    <Box className="ds-info-cell">
                      <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Min. requirement
                      </Text>
                      <Text size="2" weight="medium">{THRESHOLD_DAYS} days in office</Text>
                    </Box>
                    <Box className="ds-info-cell">
                      <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Days logged
                      </Text>
                      <Text size="2" weight="medium" color={qualified ? 'green' : 'orange'}>
                        {employee.days} / {TOTAL_DAYS} days
                      </Text>
                    </Box>
                  </Grid>
                </Box>
              </BottomSheet>

              <BottomSheet
                trigger={
                  <Button size="3" variant="soft" color="gray" highContrast>
                    <Icon name="winners-podium" />
                    See how you rank
                  </Button>
                }
                title="Badge-in leaderboard"
                description={`Ranked by in-office days among the ${ORG_MEMBERS.length} teammates in your org evaluated so far.`}
              >
                <Leaderboard members={ORG_MEMBERS} currentId={employee.id} totalDays={TOTAL_DAYS} />
              </BottomSheet>
            </Flex>
          </Flex>
        </Box>

        <Text size="1" color="gray" align="center" as="p" className="ds-footnote">
          Desk assignments are based on Q2 2025 in-office attendance.
          Contact your office manager with questions.
        </Text>
      </main>
    </Theme>
  );
}
