import { lazy, Suspense, useState } from 'react';
import {
  Theme,
  Flex,
  Box,
  Text,
  Heading,
  Badge,
  Button,
  Separator,
  SegmentedControl,
  Grid,
} from '@radix-ui/themes';
import { BottomSheet } from './components/BottomSheet';
import { DeskGauge } from './components/GaugeChart';

// The Lottie player and animation data are ~350 KB, so they load as their own chunk
const HeroIllustration = lazy(() =>
  import('./components/HeroIllustration').then(m => ({ default: m.HeroIllustration })),
);
import { Icon } from './components/ui/Icon';

const TOTAL_DAYS = 125;
const THRESHOLD_DAYS = 75;
// Within this many days of the threshold, the coworking message calls out how close they were
const NEAR_MISS_DAYS = 5;

type Placement = 'desk' | 'coworking-close' | 'coworking';

function getPlacement(days: number): Placement {
  if (days >= THRESHOLD_DAYS) return 'desk';
  if (THRESHOLD_DAYS - days <= NEAR_MISS_DAYS) return 'coworking-close';
  return 'coworking';
}

function pluralDays(n: number): string {
  return n === 1 ? '1 day' : `${n} days`;
}

function getHeroMessage(placement: Placement, delta: number) {
  switch (placement) {
    case 'desk':
      return {
        title: "Solid work badging in! You've earned yourself a desk.",
        body: "We'll take a fresh look next half, so keep up the great rhythm and this desk stays yours.",
      };
    case 'coworking-close':
      return {
        title: "You'll be set up in the coworking area this time.",
        body: `You're only ${pluralDays(delta)} away from earning a desk — so close! In the meantime, the coworking areas are well-equipped to help you do your best work, and you'll get a fresh shot next half.`,
      };
    case 'coworking':
      return {
        title: "You'll be set up in the coworking area.",
        body: "Don't worry — the coworking areas are well-equipped to help you do your best work, and you'll get a fresh shot at a desk next half.",
      };
  }
}

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

export default function App() {
  const [selectedId, setSelectedId] = useState<string>('qualified');
  const employee = EMPLOYEES.find(e => e.id === selectedId)!;
  const qualified = employee.days >= THRESHOLD_DAYS;
  const delta = Math.abs(employee.days - THRESHOLD_DAYS);
  const hero = getHeroMessage(getPlacement(employee.days), delta);

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
      <main className="ds-main">
        {/* Scenario selector */}
        <div className="ds-scenario-bar">
          <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Preview scenario
          </Text>
          <SegmentedControl.Root size="1" value={selectedId} onValueChange={setSelectedId}>
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
          <Flex direction="column" align="center" gap="2" className="card-tile ds-hero-card">
            {/* Fallback reserves the same box, so nothing shifts when the chunk arrives */}
            <Suspense fallback={<div className="ds-hero-illustration" aria-hidden="true" />}>
              <HeroIllustration />
            </Suspense>
            <Heading as="h2" size="6" align="center">{hero.title}</Heading>
            <Text as="p" size="3" color="gray" align="center" className="ds-hero-body">
              {hero.body}
            </Text>

            <BottomSheet
              trigger={<Button size="3" className="ds-hero-action">See qualifying details</Button>}
              title="Qualifying details"
              description={`How your Q2 attendance measured up against the ${THRESHOLD_DAYS}-day minimum.`}
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
          </Flex>
        </Box>

        <Separator size="4" my="4" style={{ background: 'transparent' }} />

        <Text size="1" color="gray" align="center" as="p" style={{ lineHeight: '1.6', paddingInline: '8px' }}>
          Desk assignments are based on Q2 2025 in-office attendance.
          Contact your office manager with questions.
        </Text>
      </main>
    </Theme>
  );
}
