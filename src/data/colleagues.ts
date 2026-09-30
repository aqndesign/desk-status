export interface OrgMember {
  id: string;
  name: string;
  /** In-office days logged during the evaluation period */
  days: number;
}

/** Mock data: teammates in the employee's org whose evaluation is already in. */
export const COLLEAGUES: OrgMember[] = [
  { id: 'maya-okafor', name: 'Maya Okafor', days: 112 },
  { id: 'liam-novak', name: 'Liam Novak', days: 104 },
  { id: 'priya-raman', name: 'Priya Raman', days: 97 },
  { id: 'diego-alvarez', name: 'Diego Alvarez', days: 91 },
  { id: 'hana-sato', name: 'Hana Sato', days: 79 },
  { id: 'noah-williams', name: 'Noah Williams', days: 76 },
  { id: 'fatima-rahman', name: 'Fatima Rahman', days: 61 },
  { id: 'oliver-berg', name: 'Oliver Berg', days: 48 },
  { id: 'chloe-martin', name: 'Chloe Martin', days: 39 },
];
