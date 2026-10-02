import { COLLEAGUES } from '../data/colleagues';
import { EMPLOYEES } from '../data/employees';
import { EVALUATION, STATUSES, type StatusDays, type StatusId } from '../data/policy';
import { canAccess, type Topic } from './access';
import type { Evaluation } from './eligibility';

/**
 * The Campus assistant's answers, worked out from the policy and the viewer's
 * own days. It's rule-based: each question is sorted into a topic, checked
 * against lib/access.ts, then answered with the viewer's numbers.
 */

/** The person asking, and their evaluation */
export interface Self {
  id: string;
  name: string;
  office: string;
  statusDays: StatusDays;
  evaluation: Evaluation;
}

/**
 * Who is asking. This assistant serves employees only (org leaders get theirs
 * in Org Space Manager), and it's never handed org data: a question on a
 * leader-only topic is refused by the access check in `answer`.
 */
export interface Viewer {
  role: 'employee';
  self: Self;
}

export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'list'; items: string[] };

export interface Reply {
  blocks: Block[];
  /** Set when the question was refused because the viewer's role can't see the topic */
  restricted?: Topic;
}

const { totalDays, minimumDays, limitedCap, period, half } = EVALUATION;
const WEEKS = totalDays / 5;

const days = (n: number) => (n === 1 ? '1 day' : `${n} days`);
const text = (t: string): Block => ({ kind: 'text', text: t });
const list = (items: (string | false)[]): Block => ({ kind: 'list', items: items.filter(Boolean) as string[] });

// ─── Classifying a question ──────────────────────────────────────────────────

// Everyone the assistant might hear named. Names alone aren't sensitive (the
// leaderboard shows them); what's restricted is anything about their desks or days.
const PEOPLE = [...COLLEAGUES, ...EMPLOYEES].map(({ id, name }) => ({ id, name }));

const OTHERS = /\b(team(mates?)?|colleagues?|co-?workers?|peers|others|other people|every(one|body)|any(one|body)|people|employees|my (org|organi[sz]ation|reports|manager)|the (org|organi[sz]ation)|direct reports)\b/;
const ABOUT_DESKS = /\b(desks?|days?|qualif\w*|ipt|badg\w*|coworking|eligib\w*|attendance|office|compar\w*|rank\w*|ahead|behind|than)\b/;

const UTILIZATION = /utili[sz]|occupan|how (busy|full|empty|crowded)|\b(peak|busiest|quietest)\b|(desk|seat|space|floor|building|office) (usage|use)\b|usage (rate|data)|attendance (rate|data|across|for)|badge (data|rates?)|how many (people|desks|seats)\b.*\b(used|in|come|came|show)|\b(using|used)\b.*\b(desks|seats|space)\b/;
const DECISIONS = /\bwho\b.*\bdesk|which (people|employees|teammates|colleagues)|how many (people|employees|teammates|of us|desks)|assignment (decisions?|list|results)|\boverride|exception|waive|(lower|raise|change|adjust) (the )?(minimum|threshold|policy|criteria|limit|cap)|(give|assign|grant|reserve|allocate) (me |them |him |her |someone )?(an? )?(assigned )?desk|\ballocat/;

const WHY = /\bwhy\b|\breason|how did i (earn|get|qualify|end up)|what happened|didn'?t (i )?(get|qualify|make|earn)|not (get|eligible|qualify)|\bmy (days|numbers|breakdown|stats|result|outcome)\b|how many days (did|have) i/;
const PLAN = /next (half|time|period|evaluation|cycle)|\bplan\b|optimi[sz]|improve|on track|\bper week\b|a week\b|target|(how|what) (can|could|do|should|would) i\b.*\b(get|earn|qualify|keep|reach|make|improve|do)|\bkeep (my )?desk|batch|badg(e|ing) in/;
const FINAL = /\bfinal\b|appeal|dispute|reconsider|change (my|the) (outcome|result|decision|status|ipt)|update (my )?(ipt|status)|fix (my )?(ipt|status|days)|mistake|wrong|incorrect|missing days?/;
const LIMIT = /\blimit|\bcap\b|\b15\b|shared/;
const POLICY = /what counts|how many (qualifying )?days|count(s|ed)? (toward|towards|for)|qualifying (days|statuses)|which statuses|criteria|\bminimum\b|threshold|how (are|is) (desks?|it|this) (assigned|decided|calculated|worked out)|how does (this|it) work|\bpolicy\b/;
const PERIOD = /\bwhen\b|evaluation period|which (dates|days)|\bdates\b|how long/;
const HELP = /^(hi|hello|hey)\b|\bhelp\b|what can (you|i) (do|ask)|who are you/;

/** Status keywords, so "does PTO count?" lands on the right status */
const STATUS_WORDS: [StatusId, RegExp][] = [
  ['non-meta-business', /non-?meta|client|conference|offsite|off-site|business (trip|travel|reason)|customer/],
  ['fly', /\bfly|flight|flew|fly-in/],
  ['drive', /\bdriv/],
  ['walkable-office', /walkable|another (meta )?(office|building)|other (office|building)/],
  ['global-travel', /global travel|international|abroad|another country|travel(l)?ing (for (personal|fun)|personally)|personal travel/],
  ['ipt-other', /holiday|jury|witness|bereave|voting|\bvote\b|family sick|calendar block/],
  ['pto-choice-sick', /\bpto\b|vacation|time off|choice days?|\bsick\b|\bleave\b/],
  ['wfh-unforeseen', /work(ing)? from home|\bwfh\b|remote(ly)?|unforeseen|from home/],
  ['assigned-office', /assigned (office|building)|my (own )?office\b/],
];

type Intent =
  | { topic: 'workspace-utilization' }
  | { topic: 'desk-decisions' }
  | { topic: 'own-outcome'; kind: 'why' | 'plan' | 'final' | 'status'; status?: StatusId }
  | { topic: 'policy'; kind: 'limit' | 'counts' | 'period' | 'help' | 'unknown' };

function mentionedPerson(q: string, selfId: string) {
  return PEOPLE.find(({ id, name }) => {
    if (id === selfId) return false;
    const [first] = name.toLowerCase().split(' ');
    return new RegExp(`\\b(${name.toLowerCase()}|${first})\\b`).test(q);
  });
}

export function classify(question: string, selfId: string): Intent {
  const q = question.toLowerCase().replace(/[’]/g, "'");

  // Restricted topics are checked first, so a question about someone else's
  // desk never falls through to an answer about the viewer's own
  const person = mentionedPerson(q, selfId);
  if (person) return { topic: 'desk-decisions' };
  if (UTILIZATION.test(q)) return { topic: 'workspace-utilization' };
  if (DECISIONS.test(q) || (OTHERS.test(q) && ABOUT_DESKS.test(q))) return { topic: 'desk-decisions' };

  if (FINAL.test(q)) return { topic: 'own-outcome', kind: 'final' };
  const status = STATUS_WORDS.find(([, words]) => words.test(q))?.[0];
  if (status) return { topic: 'own-outcome', kind: 'status', status };
  if (LIMIT.test(q)) return { topic: 'policy', kind: 'limit' };
  if (WHY.test(q)) return { topic: 'own-outcome', kind: 'why' };
  if (PLAN.test(q)) return { topic: 'own-outcome', kind: 'plan' };
  if (POLICY.test(q)) return { topic: 'policy', kind: 'counts' };
  if (PERIOD.test(q)) return { topic: 'policy', kind: 'period' };
  if (HELP.test(q)) return { topic: 'policy', kind: 'help' };
  return { topic: 'policy', kind: 'unknown' };
}

// ─── Answers anyone can get ──────────────────────────────────────────────────

function groupsOf({ evaluation }: Self) {
  const [always, unlimited, limited] = evaluation.groups;
  return { always, unlimited, limited };
}

/** "38 at NY770, 2 at a walkable office…", leaving out statuses with no days */
function parts(entries: [number, string][]) {
  return entries.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}`).join(', ');
}

function why(self: Self): Block[] {
  const { counted, qualified, overCap, unqualified } = self.evaluation;
  const { always, unlimited, limited } = groupsOf(self);
  const d = self.statusDays;
  const margin = counted - minimumDays;

  const opening = qualified
    ? `You logged ${counted} qualifying days, ${margin === 0 ? 'right at' : `${days(margin)} past`} the ${minimumDays}-day minimum, so you've earned an assigned desk at ${self.office}.`
    : `You logged ${counted} qualifying days and the minimum is ${minimumDays}, so you came up ${days(-margin)} short. That's why you're in the coworking spaces this half.`;

  const breakdown = list([
    `Always qualify: ${days(always.counted)} (${parts([[d['assigned-office'], `at ${self.office}`], [d['walkable-office'], 'at a walkable office'], [d['ipt-other'], 'holidays and similar']])})`,
    `Unlimited usage: ${days(unlimited.counted)} (${parts([[d['pto-choice-sick'], 'PTO, Choice and sick'], [d['wfh-unforeseen'], 'work from home for unforeseen reasons'], [d['global-travel'], 'global travel']])})`,
    overCap > 0
      ? `Shared limit: ${limitedCap} of the ${limited.logged} drive, fly and non-Meta days you logged. The other ${overCap} went past the ${limitedCap}-day limit and didn't count.`
      : `Shared limit: ${days(limited.counted)} of ${limitedCap} (drive, fly and non-Meta days)`,
    unqualified > 0 && `${days(unqualified)} were logged under statuses that don't count, such as regular work from home`,
  ]);

  if (qualified) return [text(opening), breakdown];

  const short = -margin;
  const unusedLimit = Math.max(0, limitedCap - limited.logged);
  const lever = overCap >= short
    ? `The quickest fix would have been small: ${short} of those ${overCap} over-limit days spent at ${self.office} instead would have closed the gap.`
    : unusedLimit >= short
      ? `You had ${days(unusedLimit)} of the shared limit unused, so ${short} more drive, fly or non-Meta days would have closed the gap.`
      : `${days(short)} more at ${self.office} would have closed the gap.`;

  return [text(opening), breakdown, text(`${lever} Ask me how to plan next half if you'd like a target.`)];
}

function plan(self: Self): Block[] {
  const { counted, qualified, overCap, unqualified } = self.evaluation;
  const { unlimited, limited } = groupsOf(self);
  const margin = counted - minimumDays;

  // Days at the office still needed if leave and limited-use days repeat this half's pattern
  const officeDays = Math.max(0, minimumDays - unlimited.counted - Math.min(limitedCap, limited.logged));
  const perWeek = Math.round((officeDays / WEEKS) * 2) / 2;
  const unusedLimit = Math.max(0, limitedCap - limited.logged);

  const opening = qualified
    ? `You cleared the minimum by ${days(margin)} this half. To keep your desk next half, you'll need ${minimumDays} qualifying days again: about ${minimumDays / WEEKS} a week across the ${WEEKS} weeks.`
    : `Next half you'll need ${minimumDays} qualifying days: about ${minimumDays / WEEKS} a week across the ${WEEKS} weeks. Based on how your days fell this half, here's how to get there:`;

  return [
    text(opening),
    list([
      `Spend about ${perWeek} ${perWeek === 1 ? 'day' : 'days'} a week at ${self.office} or a walkable office (${officeDays} over the half). That assumes your leave and travel look like this half.`,
      overCap > 0
        ? `Keep drive, fly and non-Meta days to ${limitedCap} across the half. You logged ${limited.logged}, and the ${overCap} past the limit didn't count, so swap extra ones for days at ${self.office}.`
        : unusedLimit > 0 && `You have room for ${days(unusedLimit)} more of drive, fly or non-Meta work. They count until the shared limit of ${limitedCap}.`,
      'PTO, Choice days and sick time count in full, so there’s no need to make them up in the office.',
      unqualified > 0 && 'If you work from home because you’re unwell, the commute is unsafe or you’re caring for family, log it as unforeseen circumstances so it counts. Regular work-from-home days don’t.',
      `Check in every five weeks: ${minimumDays / 5} qualifying days by then keeps you on pace.`,
    ]),
  ];
}

const GROUP_OF: Record<StatusId, 'always' | 'unlimited' | 'limited'> = {
  'assigned-office': 'always',
  'walkable-office': 'always',
  'ipt-other': 'always',
  'wfh-unforeseen': 'unlimited',
  'pto-choice-sick': 'unlimited',
  'global-travel': 'unlimited',
  drive: 'limited',
  fly: 'limited',
  'non-meta-business': 'limited',
};

function status(self: Self, id: StatusId): Block[] {
  const s = STATUSES[id];
  const logged = self.statusDays[id];

  // Working from home is the one status that only sometimes counts
  const verdict = id === 'wfh-unforeseen'
    ? 'Only when it’s for unforeseen circumstances, like being unwell, an unsafe commute or caring for family. Those days count with no cap; regular work-from-home days don’t count.'
    : {
      always: 'Yes, it always counts toward the minimum.',
      unlimited: 'Yes, it counts toward the minimum, with no cap.',
      limited: `Yes, up to a point: it shares a ${limitedCap}-day limit with the other drive, fly and non-Meta days, and days past the limit don't count.`,
    }[GROUP_OF[id]];

  return [
    text(verdict),
    text(`${s.name}: ${s.definition}`),
    text(`You logged ${days(logged)} under this status in ${half}.`),
  ];
}

function final(): Block[] {
  return [
    text(`Desk decisions for ${half} are final, and changing a past IPT status won't change the outcome.`),
    text('If you think a day was recorded wrong, your office manager can look into it so it’s right for the next evaluation.'),
  ];
}

function limit(self: Self): Block[] {
  const { overCap } = self.evaluation;
  const { limited } = groupsOf(self);
  return [
    text(`Drive, fly and non-Meta (business reason) days share one limit: up to ${limitedCap} of them count across the half, however they're split.`),
    text(overCap > 0
      ? `You logged ${limited.logged}, so ${limitedCap} counted and the other ${overCap} didn't.`
      : `You logged ${limited.logged}, so all of them counted, with ${days(limitedCap - limited.logged)} of the limit unused.`),
  ];
}

function counts(): Block[] {
  return [
    text(`You need ${minimumDays} qualifying days out of the ${totalDays} working days in the half. Three kinds of status count:`),
    list([
      'Always qualify: your assigned office, a walkable office, and holidays or similar leave like jury duty',
      'Unlimited usage: PTO, Choice and sick days, working from home for unforeseen reasons, and global travel days',
      `Shared limit of ${limitedCap} days: drivable or fly-in Meta offices, and non-Meta locations for a business reason`,
    ]),
    text('Any other status, such as regular work from home, doesn’t count.'),
  ];
}

function periodInfo(): Block[] {
  return [text(`The ${half} evaluation covered ${period} (${totalDays} working days). The next evaluation looks at the following half.`)];
}

function capabilities(viewer: Viewer): Block[] {
  return [
    text('I can help you understand your desk outcome and plan for the next one. Try asking:'),
    list([
      viewer.self.evaluation.qualified ? 'How did I earn my desk?' : 'Why didn’t I get a desk?',
      viewer.self.evaluation.qualified ? 'How do I keep my desk next half?' : 'How can I get a desk next half?',
      'Does PTO count?',
      'How does the 15-day shared limit work?',
    ]),
  ];
}

// ─── Answering ───────────────────────────────────────────────────────────────

const REFUSAL: Partial<Record<Topic, string>> = {
  'workspace-utilization': 'Workspace utilization is only available to org leaders, so I can’t share how your org or office uses its space.',
  'desk-decisions': 'Desk assignment decisions, including who got a desk and anyone else’s days, are only available to org leaders.',
};

export function answer(question: string, viewer: Viewer): Reply {
  const intent = classify(question, viewer.self.id);

  if (!canAccess(viewer.role, intent.topic)) {
    return {
      restricted: intent.topic,
      blocks: [
        text(REFUSAL[intent.topic]!),
        text(viewer.self.evaluation.qualified
          ? 'I can still help with your own outcome: how you earned your desk, or how to keep it next half.'
          : 'I can still help with your own outcome: why you landed where you did, or how to plan your days for a desk next half.'),
      ],
    };
  }

  const { self } = viewer;
  if (intent.topic === 'own-outcome') {
    if (intent.kind === 'why') return { blocks: why(self) };
    if (intent.kind === 'plan') return { blocks: plan(self) };
    if (intent.kind === 'final') return { blocks: final() };
    return { blocks: status(self, intent.status!) };
  }
  if (intent.topic === 'policy') {
    if (intent.kind === 'limit') return { blocks: limit(self) };
    if (intent.kind === 'counts') return { blocks: counts() };
    if (intent.kind === 'period') return { blocks: periodInfo() };
    if (intent.kind === 'help') return { blocks: capabilities(viewer) };
  }
  return {
    blocks: [
      text('I’m not sure I can answer that one.'),
      ...capabilities(viewer),
    ],
  };
}

/** Starter questions for the prompt row, in the order they're most useful */
export function suggestions(viewer: Viewer): string[] {
  const { qualified } = viewer.self.evaluation;
  return [
    qualified ? 'How did I earn my desk?' : 'Why didn’t I get a desk?',
    qualified ? 'How do I keep my desk next half?' : 'How can I get a desk next half?',
    'How does the 15-day shared limit work?',
    'Does working from home count?',
    'Does PTO count?',
  ];
}
