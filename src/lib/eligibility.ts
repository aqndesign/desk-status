import { CRITERIA_GROUPS, EVALUATION, type GroupId, type StatusDays } from '../data/policy';

export interface GroupResult {
  id: GroupId;
  /** Days logged under the group's statuses */
  logged: number;
  /** Days that count toward the minimum, after the group's cap */
  counted: number;
  cap?: number;
}

export interface Evaluation {
  /** Qualifying days — what the desk decision is made on */
  counted: number;
  qualified: boolean;
  groups: GroupResult[];
  /** Days logged past a group's cap; they don't count */
  overCap: number;
  /** Days of the period with no qualifying status */
  unqualified: number;
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** Applies the desk-assignment policy to an employee's logged days. */
export function evaluate(days: StatusDays): Evaluation {
  const groups = CRITERIA_GROUPS.map<GroupResult>(group => {
    const logged = sum(group.statuses.map(id => days[id]));
    return {
      id: group.id,
      logged,
      counted: group.cap === undefined ? logged : Math.min(logged, group.cap),
      cap: group.cap,
    };
  });

  const counted = sum(groups.map(group => group.counted));
  const logged = sum(groups.map(group => group.logged));

  return {
    counted,
    qualified: counted >= EVALUATION.minimumDays,
    groups,
    overCap: logged - counted,
    unqualified: Math.max(0, EVALUATION.totalDays - logged),
  };
}
