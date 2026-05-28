import { useState } from 'react';
import {
  Theme,
  Card,
  Flex,
  Box,
  Text,
  Heading,
  Button,
  Badge,
  Avatar,
  Callout,
  Separator,
} from '@radix-ui/themes';
import { DeskGauge } from './components/GaugeChart';

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
      {/* Header */}
      <header className="ds-header">
        <div className="ds-header-inner">
          <Flex align="center" gap="2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="2" y="14" width="20" height="7" rx="1.5" fill="#3B82F6" />
              <rect x="6" y="9" width="12" height="6" rx="1" fill="#60A5FA" />
              <rect x="9" y="4" width="6" height="6" rx="1" fill="#93C5FD" />
              <rect x="6" y="19" width="3" height="2" rx="0.5" fill="#1D4ED8" />
              <rect x="15" y="19" width="3" height="2" rx="0.5" fill="#1D4ED8" />
            </svg>
            <Heading size="3" style={{ fontFamily: 'var(--font-ibm-plex-sans), system-ui, sans-serif' }}>
              Desk Status
            </Heading>
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
          <Flex gap="1" p="1" style={{ background: 'white', borderRadius: '10px', border: '1px solid var(--gray-4)' }}>
            {EMPLOYEES.map(e => {
              const isQual = e.days >= THRESHOLD_DAYS;
              const isActive = selectedId === e.id;
              return (
                <Button
                  key={e.id}
                  size="1"
                  variant={isActive ? 'solid' : 'ghost'}
                  color={isActive ? 'gray' : 'gray'}
                  highContrast={isActive}
                  onClick={() => setSelectedId(e.id)}
                >
                  <Box
                    width="7px" height="7px"
                    style={{ borderRadius: '50%', background: isQual ? '#22C55E' : '#F97316', flexShrink: 0 }}
                  />
                  {e.name}
                </Button>
              );
            })}
          </Flex>
        </div>

        {/* Status card */}
        <Card size="3" style={{ borderRadius: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.07)' }}>
          {/* Employee row */}
          <Flex align="center" gap="3" mb="1">
            <Avatar
              size="3"
              radius="medium"
              fallback={employee.initials}
              color={qualified ? 'green' : 'orange'}
              variant="soft"
            />
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="4" weight="bold" as="div">
                {employee.name}
              </Text>
              <Text size="2" color="gray" as="div" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {employee.role} · {employee.department}
              </Text>
            </Box>
            <Badge
              color={qualified ? 'green' : 'orange'}
              variant="soft"
              size="2"
              radius="full"
            >
              {qualified ? '✓ Assigned Desk' : 'Coworking Space'}
            </Badge>
          </Flex>

          {/* Carbon Charts gauge */}
          <DeskGauge
            key={selectedId}
            currentDays={employee.days}
            totalDays={TOTAL_DAYS}
            thresholdDays={THRESHOLD_DAYS}
            qualified={qualified}
          />

          {/* "days in office" subtitle under gauge number */}
          <div className="ds-gauge-label">
            <Text size="2" color="gray">days in office</Text>
          </div>

          {/* Progress callout */}
          <Callout.Root color={qualified ? 'green' : 'orange'} variant="soft" mb="4" style={{ borderRadius: '10px' }}>
            <Callout.Text>
              {qualified
                ? <><Text weight="bold">{delta} days</Text> above the minimum — desk assigned</>
                : <><Text weight="bold">{delta} days</Text> below the minimum — coworking placement</>
              }
            </Callout.Text>
          </Callout.Root>

          {/* Info grid */}
          <div className="ds-info-grid">
            <div className="ds-info-cell">
              <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Evaluation period
              </Text>
              <Text size="2" weight="medium">Apr 1 – Jun 30, 2025</Text>
            </div>
            <div className="ds-info-cell">
              <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Period length
              </Text>
              <Text size="2" weight="medium">{TOTAL_DAYS} days total</Text>
            </div>
            <div className="ds-info-cell">
              <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Min. requirement
              </Text>
              <Text size="2" weight="medium">{THRESHOLD_DAYS} days in office</Text>
            </div>
            <div className="ds-info-cell">
              <Text size="1" color="gray" weight="medium" style={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Days logged
              </Text>
              <Text size="2" weight="medium" color={qualified ? 'green' : 'orange'}>
                {employee.days} / {TOTAL_DAYS} days
              </Text>
            </div>
          </div>
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
