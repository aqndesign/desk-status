/**
 * The desk-assignment policy: which IPT statuses count toward an assigned
 * desk, and how. Mirrors the "Desk assignment criteria" and "Status
 * definitions" panels in the reference design.
 */

export type StatusId =
  | 'assigned-office'
  | 'walkable-office'
  | 'ipt-other'
  | 'wfh-unforeseen'
  | 'pto-choice-sick'
  | 'global-travel'
  | 'drive'
  | 'fly'
  | 'non-meta-business';

/** Days logged under each status during the evaluation period */
export type StatusDays = Record<StatusId, number>;

export interface StatusDefinition {
  id: StatusId;
  /** Short label, as it appears on a day in the status history */
  tag: string;
  /** Full name of the status */
  name: string;
  /** What the status covers */
  definition: string;
  /** Uicons name */
  icon: string;
}

export type GroupId = 'always' | 'unlimited' | 'limited';

export interface CriteriaGroup {
  id: GroupId;
  title: string;
  /** Name for the group's days where the title would read as a rule, e.g. in a legend */
  label: string;
  /** How days in this group count, in one line */
  rule: string;
  /** Uicons name */
  icon: string;
  statuses: StatusId[];
  /** Most days from the group that can count toward the minimum */
  cap?: number;
}

export const EVALUATION = {
  /** Which half of the year, for the header */
  half: "H2 '25",
  period: 'Jul 6 – Dec 27, 2025',
  /** Working days in the period */
  totalDays: 125,
  /** Qualifying days needed for an assigned desk */
  minimumDays: 75,
  /** Days the limited-usage statuses can contribute between them */
  limitedCap: 15,
} as const;

export const STATUSES: Record<StatusId, StatusDefinition> = {
  'assigned-office': {
    id: 'assigned-office',
    tag: 'Assigned office',
    name: 'Work from assigned office',
    definition:
      'Working at your assigned Meta building. A building within a connected group of buildings counts as your assigned building; for example MPK10–18 and MPK20–21.',
    icon: 'office-building',
  },
  'walkable-office': {
    id: 'walkable-office',
    tag: 'Walkable office',
    name: 'Work from a walkable office',
    definition:
      'Working at another walkable Meta office within your assigned site, such as MPK; 50HY/Farley; NY770; Sunnyvale; Burlingame; Fremont; Bellevue; Redmond; or Seattle (excludes Stadium).',
    icon: 'walk',
  },
  'ipt-other': {
    id: 'ipt-other',
    tag: 'IPT others',
    name: 'Miscellaneous IPT statuses',
    definition:
      'Other qualifying IPT statuses, including family sick time, PTO – statutory entitlement, voting time off, bereavement (hourly), jury or witness duty, calendar block (non-work day) and holidays.',
    icon: 'list-checkmark',
  },
  'wfh-unforeseen': {
    id: 'wfh-unforeseen',
    tag: 'Unforeseen circumstances',
    name: 'Work from home (unforeseen circumstances)',
    definition:
      'For example, recovering from illness, dangerous commute conditions, or caring for a family member.',
    icon: 'home',
  },
  'pto-choice-sick': {
    id: 'pto-choice-sick',
    tag: 'PTO + Choice + Sick',
    name: 'PTO, Choice days and sick time',
    definition:
      'Paid time off, Choice days and personal sick time are counted together as non-working time.',
    icon: 'umbrella',
  },
  'global-travel': {
    id: 'global-travel',
    tag: 'Global travel days',
    name: 'Global travel days',
    definition:
      'International: personal travel days spent working in another unrestricted country where you have work authorization. Domestic: personal travel days spent working from a location outside your assigned office region.',
    icon: 'globe',
  },
  drive: {
    id: 'drive',
    tag: 'Drive',
    name: 'Work from a drivable Meta office',
    definition:
      'A Meta location within drivable distance: in the same state and with the same region code as your assigned office.',
    icon: 'car',
  },
  fly: {
    id: 'fly',
    tag: 'Fly',
    name: 'Work from a fly-in Meta office',
    definition:
      "A Meta location that isn't your assigned building, site or a geographically colocated site — somewhere you would fly to — for a business reason.",
    icon: 'airplane',
  },
  'non-meta-business': {
    id: 'non-meta-business',
    tag: 'Non-Meta location (business)',
    name: 'Non-Meta location (business reason)',
    definition:
      'For example, attending a client event, travelling for work, or when your assigned office is closed or temporarily unavailable.',
    icon: 'briefcase',
  },
};

export const CRITERIA_GROUPS: CriteriaGroup[] = [
  {
    id: 'always',
    title: 'Always qualify',
    label: 'Always qualify',
    rule: 'Office days, plus holidays and similar leave. Every one counts.',
    icon: 'calendar-tick',
    statuses: ['assigned-office', 'walkable-office', 'ipt-other'],
  },
  {
    id: 'unlimited',
    title: 'Unlimited usage',
    label: 'Unlimited usage',
    rule: 'Time away that still counts, with no cap.',
    icon: 'infinity',
    statuses: ['wfh-unforeseen', 'pto-choice-sick', 'global-travel'],
  },
  {
    id: 'limited',
    title: `Shared limit of ${EVALUATION.limitedCap} days`,
    label: 'Limited usage',
    rule: `Up to ${EVALUATION.limitedCap} days count across all three.`,
    icon: 'calendar-clock',
    statuses: ['drive', 'fly', 'non-meta-business'],
    cap: EVALUATION.limitedCap,
  },
];
