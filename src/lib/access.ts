/**
 * Who may ask the Campus assistant about what.
 *
 * Employees get answers about their own outcome and the policy that produced
 * it. Anything about the wider org — how its space is used, and who was
 * assigned a desk — is for org leaders only. The assistant checks every
 * question against this table before answering, and an employee's assistant
 * is never handed org data in the first place (see `Viewer` in assistant.ts).
 */

export type Role = 'employee' | 'org-leader';

export type Topic =
  /** The viewer's own days, outcome and how to plan for next half */
  | 'own-outcome'
  /** How the policy works: what counts, the shared limit, the evaluation period */
  | 'policy'
  /** How the org's desks and spaces are used */
  | 'workspace-utilization'
  /** Who was assigned a desk, other people's days, and changes to the policy */
  | 'desk-decisions';

const ACCESS: Record<Topic, readonly Role[]> = {
  'own-outcome': ['employee', 'org-leader'],
  policy: ['employee', 'org-leader'],
  'workspace-utilization': ['org-leader'],
  'desk-decisions': ['org-leader'],
};

export function canAccess(role: Role, topic: Topic): boolean {
  return ACCESS[topic].includes(role);
}
