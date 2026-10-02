import type { StatusDays } from './policy';

export interface Employee {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: string;
  /** The office the employee is assigned to */
  office: string;
  statusDays: StatusDays;
}

/**
 * Mock data: one employee per outcome. The qualifying-day totals (83, 72, 67)
 * fall out of the policy in lib/eligibility.ts, so each breakdown is tuned to
 * land on its total: Sam's limited-usage days run 7 over the shared cap, which
 * is what leaves them 3 short of a desk.
 */
export const EMPLOYEES: Employee[] = [
  {
    id: 'qualified',
    name: 'Alex Chen',
    initials: 'AC',
    role: 'Senior Product Designer',
    department: 'Design',
    office: 'MPK',
    statusDays: {
      'assigned-office': 52,
      'walkable-office': 4,
      'ipt-other': 3,
      'wfh-unforeseen': 3,
      'pto-choice-sick': 7,
      'global-travel': 2,
      drive: 6,
      fly: 4,
      'non-meta-business': 2,
    },
  },
  {
    id: 'near-miss',
    name: 'Sam Patel',
    initials: 'SP',
    role: 'Software Engineer',
    department: 'Engineering',
    office: 'NY770',
    statusDays: {
      'assigned-office': 38,
      'walkable-office': 2,
      'ipt-other': 2,
      'wfh-unforeseen': 4,
      'pto-choice-sick': 9,
      'global-travel': 2,
      drive: 11,
      fly: 6,
      'non-meta-business': 5,
    },
  },
  {
    id: 'coworking',
    name: 'Jordan Lee',
    initials: 'JL',
    role: 'Data Analyst',
    department: 'Analytics',
    office: 'SEA',
    statusDays: {
      'assigned-office': 41,
      'walkable-office': 0,
      'ipt-other': 1,
      'wfh-unforeseen': 5,
      'pto-choice-sick': 8,
      'global-travel': 0,
      drive: 7,
      fly: 3,
      'non-meta-business': 2,
    },
  },
];
