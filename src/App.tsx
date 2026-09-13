import { useState } from 'react';
import {
  Theme,
  Card,
  Flex,
  Box,
  Text,
  Heading,
  Badge,
  Callout,
  Separator,
  SegmentedControl,
  Grid,
} from '@radix-ui/themes';
import { DeskGauge } from './components/GaugeChart';
import { Icon } from './components/ui/Icon';

const TOTAL_DAYS = 125;
const THRESHOLD_DAYS = 75;

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
        <Card size="3" className="card-glass">
          {/* Custom SVG gauge — see GaugeChart.tsx */}
          <DeskGauge
            key={selectedId}
            currentDays={employee.days}
            totalDays={TOTAL_DAYS}
            thresholdDays={THRESHOLD_DAYS}
            qualified={qualified}
          />

          {/* "days in office" subtitle under gauge number */}
          <div className="ds-gauge-label" style={{ marginBottom: 16 }}>
            <Text size="2" color="gray">days in office</Text>
          </div>

          {/* Progress callout */}
          <Callout.Root color={qualified ? 'green' : 'orange'} variant="soft" mb="4" style={{ borderRadius: '10px' }}>
            <Callout.Icon>
              <Icon name={qualified ? 'check-circle' : 'alert-triangle'} />
            </Callout.Icon>
            <Callout.Text>
              {qualified
                ? <><Text weight="bold">{delta} days</Text> above the minimum — desk assigned</>
                : <><Text weight="bold">{delta} days</Text> below the minimum — coworking placement</>
              }
            </Callout.Text>
          </Callout.Root>

          {/* Info grid */}
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
        </Card>

        <Separator size="4" my="4" style={{ background: 'transparent' }} />

        <Text size="1" color="gray" align="center" as="p" style={{ lineHeight: '1.6', paddingInline: '8px' }}>
          Desk assignments are based on Q2 2025 in-office attendance.
          Contact your office manager with questions.
        </Text>
      </main>
    </Theme>
  );
}
