import { useState } from 'react';
import { Popover, RadioGroup } from 'radix-ui';
import { Text, Theme } from '@radix-ui/themes';
import { Icon } from './ui/Icon';

export interface Scenario {
  id: string;
  name: string;
  role: string;
  /** Qualifying days, and whether they reached the minimum */
  counted: number;
  qualified: boolean;
}

interface DebugScenarioSwitcherProps {
  scenarios: Scenario[];
  value: string;
  onValueChange: (id: string) => void;
}

const STORAGE_KEY = 'desk-status:debug';

/**
 * Whether to show the debug tools. Always on the dev server; anywhere else
 * only after visiting with `?debug` (remembered in this browser, `?debug=0`
 * forgets it). It hides the tools from everyone else; it isn't access control.
 */
function debugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  const param = new URLSearchParams(window.location.search).get('debug');
  try {
    if (param === '0') window.localStorage.removeItem(STORAGE_KEY);
    else if (param !== null) window.localStorage.setItem(STORAGE_KEY, '1');
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // Storage blocked: honour the parameter for this visit only
    return param !== null && param !== '0';
  }
}

/** A floating debug button, bottom left, that switches between the preview use cases. */
export function DebugScenarioSwitcher({ scenarios, value, onValueChange }: DebugScenarioSwitcherProps) {
  const [enabled] = useState(debugEnabled);
  if (!enabled) return null;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className="dbg-fab" aria-label="Debug: switch use case">
          <Icon name="bug" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        {/* A <Theme> for the tokens the portal leaves behind, as the content
            element itself so its exit animation runs (see BottomSheet) */}
        <Popover.Content asChild side="top" align="start" sideOffset={10} collisionPadding={16}>
          <Theme className="dbg-popover">
            <div className="dbg-head">
              <Text as="p" size="1" weight="bold" className="dbg-title">Use cases</Text>
              <Text as="p" size="1" color="gray">Debug tools · only visible to you</Text>
            </div>
            <RadioGroup.Root value={value} onValueChange={onValueChange} aria-label="Use case" className="dbg-options">
              {scenarios.map(s => (
                <RadioGroup.Item key={s.id} value={s.id} className="dbg-option">
                  <span className="dbg-dot" data-qualified={s.qualified || undefined} aria-hidden="true" />
                  <span className="dbg-option-text">
                    <Text as="span" size="2" weight="medium">{s.name}</Text>
                    <Text as="span" size="1" color="gray">
                      {s.qualified ? 'Assigned desk' : 'Coworking'} · {s.counted} qualifying days
                    </Text>
                  </span>
                  <RadioGroup.Indicator className="dbg-check">
                    <Icon name="checkmark" size={14} />
                  </RadioGroup.Indicator>
                </RadioGroup.Item>
              ))}
            </RadioGroup.Root>
          </Theme>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
