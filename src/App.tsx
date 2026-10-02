import { lazy, Suspense, useState } from 'react';
import {
  Theme,
  Flex,
  Box,
  Text,
  Heading,
  Button,
  SegmentedControl,
  Grid,
} from '@radix-ui/themes';
import { BottomSheet } from './components/BottomSheet';
import { CampusAssistant } from './components/CampusAssistant';
import { CriteriaBreakdown } from './components/CriteriaBreakdown';
import { DeskGauge } from './components/GaugeChart';
import { Leaderboard } from './components/Leaderboard';
import { COLLEAGUES, type OrgMember } from './data/colleagues';
import { EMPLOYEES } from './data/employees';
import { EVALUATION } from './data/policy';
import type { Self, Viewer } from './lib/assistant';
import { evaluate } from './lib/eligibility';
import { Icon } from './components/ui/Icon';

// Each illustration loads as its own chunk (the Lottie player is shared between
// them), so an employee only downloads the animation for their own placement
const DeskIllustration = lazy(() => import('./components/illustrations/DeskIllustration'));
const CoworkingIllustration = lazy(() => import('./components/illustrations/CoworkingIllustration'));

const { totalDays: TOTAL_DAYS, minimumDays: THRESHOLD_DAYS } = EVALUATION;

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

// The policy applied to each preview employee's logged days
const EVALUATED = EMPLOYEES.map(employee => ({ ...employee, evaluation: evaluate(employee.statusDays) }));

// Everyone in the org whose evaluation is in, including the preview employees
const ORG_MEMBERS: OrgMember[] = [
  ...COLLEAGUES,
  ...EVALUATED.map(({ id, name, evaluation }) => ({ id, name, days: evaluation.counted })),
];

export default function App() {
  const [selectedId, setSelectedId] = useState<string>('qualified');
  const employee = EVALUATED.find(e => e.id === selectedId)!;
  const { evaluation } = employee;
  const { qualified } = evaluation;

  const self: Self = { id: employee.id, name: employee.name, office: employee.office, statusDays: employee.statusDays, evaluation };
  const viewer: Viewer = { role: 'employee', self };
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

      {/* Main */}
      {/* A message with a benefits list is long enough to need the whole first screen on phones */}
      <main className={hero.benefits ? 'ds-main ds-main--long' : 'ds-main'}>
        {/* Scenario selector */}
        <div className="ds-scenario-bar">
          <div className="ds-scenario-group">
            <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Preview scenario
            </Text>
            <SegmentedControl.Root
              size="1"
              value={selectedId}
              onValueChange={setSelectedId}
              aria-label="Preview scenario"
            >
              {EVALUATED.map(e => (
                <SegmentedControl.Item key={e.id} value={e.id}>
                  <Flex align="center" gap="2">
                    <Box
                      width="7px" height="7px"
                      style={{ borderRadius: '50%', background: e.evaluation.qualified ? '#22C55E' : '#F97316', flexShrink: 0 }}
                    />
                    {e.name}
                  </Flex>
                </SegmentedControl.Item>
              ))}
            </SegmentedControl.Root>
          </div>
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
                description={`Assigned desks go to teammates with ${THRESHOLD_DAYS} or more qualifying days in the evaluation period. Here's where you landed.`}
              >
                {/* Custom SVG gauge — see GaugeChart.tsx. Mounts with the sheet, so the fill animates on every open. */}
                <Box className="card-tile ds-gauge-card">
                  <DeskGauge
                    currentDays={evaluation.counted}
                    totalDays={TOTAL_DAYS}
                    thresholdDays={THRESHOLD_DAYS}
                    qualified={qualified}
                  />
                </Box>

                <CriteriaBreakdown days={employee.statusDays} evaluation={evaluation} />

                <Box className="card-tile ds-info-card">
                  <Grid className="ds-info-grid">
                    <Box className="ds-info-cell">
                      <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Evaluation period
                      </Text>
                      <Text size="2" weight="medium">{EVALUATION.period}</Text>
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
                      <Text size="2" weight="medium">
                        {THRESHOLD_DAYS} qualifying days{' '}
                        <Text color="gray" weight="regular">({Math.round((THRESHOLD_DAYS / TOTAL_DAYS) * 100)}%)</Text>
                      </Text>
                    </Box>
                    <Box className="ds-info-cell">
                      <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Assigned office
                      </Text>
                      <Text size="2" weight="medium">{employee.office}</Text>
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
                description={`Ranked by qualifying days among the ${ORG_MEMBERS.length} teammates in your org evaluated so far.`}
              >
                <Leaderboard members={ORG_MEMBERS} currentId={employee.id} totalDays={TOTAL_DAYS} />
              </BottomSheet>
            </Flex>
          </Flex>
        </Box>

        <Text size="1" color="gray" align="center" as="p" className="ds-footnote">
          Desk assignments are based on qualifying days in the {EVALUATION.half} evaluation period.
          Contact your office manager with questions.
        </Text>
      </main>

      {/* A fresh conversation for each person */}
      <CampusAssistant key={employee.id} viewer={viewer} />
    </Theme>
  );
}
