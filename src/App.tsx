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
              background: '#2657E8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 10px rgba(62, 99, 221, 0.4)',
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="18" height="18" style={{ color: 'white' }}>
                <path fill="currentColor" d="M10.627 1.25A3.25 3.25 0 0 0 7.42 3.98l-1.03 6.355c-.076.468-.121.94-.135 1.415h11.492a10.762 10.762 0 0 0-.135-1.415l-1.03-6.355a3.25 3.25 0 0 0-3.208-2.73h-2.746Z"/>
                <path fill="currentColor" d="M6.909 14.97a2.258 2.258 0 0 1-.193-.22H4.25a1.5 1.5 0 0 1-1.5-1.5v-2.5H2a.75.75 0 0 1 0-1.5h.75a1.5 1.5 0 0 1 1.5 1.5v2.5h15.5v-2.5a1.5 1.5 0 0 1 1.5-1.5H22a.75.75 0 0 1 0 1.5h-.75v2.5a1.5 1.5 0 0 1-1.5 1.5h-2.466a2.26 2.26 0 0 1-.193.22L15.97 16.09a2.25 2.25 0 0 1-1.591.659H12.75v2.064c.096.023.191.053.284.089l3.539 1.376c.71.276 1.177.96 1.177 1.721a.75.75 0 0 1-1.5 0 .346.346 0 0 0-.22-.323l-3.28-1.275V22a.75.75 0 0 1-1.5 0v-1.598l-3.28 1.275a.346.346 0 0 0-.22.323.75.75 0 0 1-1.5 0c0-.762.467-1.445 1.177-1.72l3.539-1.377c.093-.036.188-.066.284-.09V16.75H9.621a2.25 2.25 0 0 1-1.59-.659L6.908 14.97Z"/>
              </svg>
            </Box>
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
          {/* Carbon Charts gauge */}
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
