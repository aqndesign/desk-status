import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react';
import { Dialog } from 'radix-ui';
import { Badge, Box, Flex, Heading, IconButton, Text, Theme } from '@radix-ui/themes';
import { EVALUATION } from '../data/policy';
import { answer, suggestions, type Reply, type Viewer } from '../lib/assistant';
import { MOBILE_QUERY, useMediaQuery } from '../lib/breakpoints';
import { BottomSheet } from './BottomSheet';
import { Icon } from './ui/Icon';

interface CampusAssistantProps {
  /** The employee asking */
  viewer: Viewer;
}

type Message =
  | { id: number; from: 'you'; text: string }
  | { id: number; from: 'assistant'; reply: Reply };

// How long the assistant "thinks" before answering, so replies don't snap in
const THINK_MS = 650;

/** Follows the pointer with the gradient's pink end, as Org Space Manager's assistant button does */
function trackGradient(event: PointerEvent<HTMLButtonElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  event.currentTarget.style.setProperty(
    '--assistant-gradient',
    `radial-gradient(circle at ${x.toFixed(1)}% ${y.toFixed(1)}%, #CF3897 0%, #2657E8 140%)`,
  );
}

function ReplyBody({ reply }: { reply: Reply }) {
  return (
    <>
      {reply.restricted && (
        <Badge size="1" color="gray" variant="surface" radius="full" className="ca-restricted">
          <Icon name="lock" size={11} />
          Org leaders only
        </Badge>
      )}
      {reply.blocks.map((block, i) => block.kind === 'text'
        ? <p key={i}>{block.text}</p>
        : (
          <ul key={i}>
            {block.items.map(item => <li key={item}>{item}</li>)}
          </ul>
        ))}
    </>
  );
}

/**
 * A floating button that opens the Campus assistant: on larger screens the
 * button grows into a popover anchored to its corner, on phones it opens a
 * bottom sheet. The conversation lives here rather than in either surface, so
 * it survives closing, reopening and a switch between the two; remount the
 * component (via `key`) to start a fresh one.
 */
export function CampusAssistant({ viewer }: CampusAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const nextId = useRef(0);
  const timer = useRef<number>(undefined);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastQuestionRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const isPhone = useMediaQuery(MOBILE_QUERY);
  const [popoverOpen, setPopoverOpen] = useState(false);
  // The button's size when the popover opens: where its morph starts and ends
  const [fabSize, setFabSize] = useState({ width: 177, height: 48 });

  const { qualified } = viewer.self.evaluation;
  const lastQuestionId = [...messages].reverse().find(m => m.from === 'you')?.id;
  const asked = new Set(messages.flatMap(m => (m.from === 'you' ? [m.text] : [])));
  const prompts = useMemo(() => suggestions(viewer), [viewer]).filter(p => !asked.has(p));

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Bring the latest question to the top of the thread, so its answer reads
  // from the start; a long answer would otherwise open scrolled to its end
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    lastQuestionRef.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [messages]);

  function send(question: string) {
    const text = question.trim();
    if (!text || thinking) return;
    setMessages(m => [...m, { id: nextId.current++, from: 'you', text }]);
    setDraft('');
    setThinking(true);
    timer.current = window.setTimeout(() => {
      setMessages(m => [...m, { id: nextId.current++, from: 'assistant', reply: answer(text, viewer) }]);
      setThinking(false);
    }, THINK_MS);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(draft);
  }

  // Enter sends; Shift+Enter starts a new line
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(draft);
    }
  }

  // With a mouse or trackpad, open straight into the composer. On touch
  // screens focus stays on the sheet, so the keyboard doesn't cover the
  // greeting the moment it opens.
  function onOpenAutoFocus(event: Event) {
    if (window.matchMedia('(pointer: fine)').matches) {
      event.preventDefault();
      inputRef.current?.focus();
    }
  }

  function onPopoverOpenChange(open: boolean) {
    const fab = fabRef.current;
    // offsetWidth ignores the hover lift's transform, matching the button's resting box
    if (open && fab) setFabSize({ width: fab.offsetWidth, height: fab.offsetHeight });
    setPopoverOpen(open);
  }

  const subtitle = qualified
    ? `Ask me how you earned your desk in ${EVALUATION.half}, or how to keep it next half.`
    : `Ask me why you're in the coworking spaces this half, or how to plan your days for an assigned desk next half.`;
  const description = 'Answers about your own desk outcome, worked out from your days.';

  const footer = (
    <>
      {prompts.length > 0 && (
        <div className="ca-prompts" role="group" aria-label="Suggested questions">
          {prompts.map(prompt => (
            <button key={prompt} type="button" className="ca-prompt" onClick={() => send(prompt)} disabled={thinking}>
              {prompt}
            </button>
          ))}
        </div>
      )}
      <form className="ca-composer" onSubmit={onSubmit}>
        <div className="ca-composer-surface">
          <textarea
            ref={inputRef}
            className="ca-input"
            rows={1}
            placeholder="Ask about your desk outcome…"
            aria-label="Ask the Campus assistant"
            value={draft}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <IconButton type="submit" size="2" radius="full" className="ca-send" disabled={!draft.trim() || thinking}>
            <Icon name="paper-plane" size={15} label="Send" />
          </IconButton>
        </div>
      </form>
    </>
  );

  const fab = (
    <button
      ref={fabRef}
      type="button"
      className="ca-fab"
      aria-label="Open Campus assistant"
      onPointerMove={trackGradient}
      onPointerLeave={event => event.currentTarget.style.removeProperty('--assistant-gradient')}
    >
      <Icon name="message-ai" className="ca-fab-icon" />
      <span className="ca-fab-label">Campus assistant</span>
    </button>
  );

  const title = (
    <Flex align="center" gap="2" asChild>
      <span>
        <Icon name="message-ai" className="ca-glyph" />
        Campus assistant
      </span>
    </Flex>
  );

  const thread = (
    <div className="ca-thread" role="log" aria-live="polite" aria-label="Conversation">
      <Flex direction="column" align="center" gap="2" className="ca-intro">
        <Text as="p" size="5" weight="bold" align="center" className="ca-intro-title">
          <span className="ca-gradient-text">Hi, I'm your Campus assistant!</span>
        </Text>
        <Text as="p" size="2" color="gray" align="center" className="ca-intro-subtitle">{subtitle}</Text>
        <Text as="p" size="1" color="gray" className="ca-intro-scope">
          <Icon name="lock" size={11} style={{ display: 'inline' }} />
          Workspace utilization and desk assignment decisions are for org leaders only.
        </Text>
      </Flex>

      {messages.map(message => (
        <div
          key={message.id}
          ref={message.id === lastQuestionId ? lastQuestionRef : undefined}
          className={`ca-message ca-message--${message.from}`}
        >
          <div className="ca-bubble">
            {message.from === 'you' ? message.text : <ReplyBody reply={message.reply} />}
          </div>
        </div>
      ))}

      {thinking && (
        <div className="ca-message ca-message--assistant">
          <Box className="ca-bubble ca-thinking" aria-label="Campus assistant is thinking">
            <span /><span /><span />
          </Box>
        </div>
      )}
    </div>
  );

  if (isPhone) {
    return (
      <>
        {/* Fades content that scrolls through the button's dock */}
        <div className="ca-dock-scrim" aria-hidden="true" />
        <BottomSheet
          trigger={fab}
          title={title}
          description={description}
          footer={footer}
          className="bottom-sheet--assistant"
          onOpenAutoFocus={onOpenAutoFocus}
        >
          {thread}
        </BottomSheet>
      </>
    );
  }

  // Non-modal: the page stays usable, and a click outside or Escape closes it
  return (
    <Dialog.Root open={popoverOpen} onOpenChange={onPopoverOpenChange} modal={false}>
      <Dialog.Trigger asChild>{fab}</Dialog.Trigger>
      <Dialog.Portal>
        {/* A <Theme> for the tokens and fonts the portal leaves behind, as the
            content element itself so its exit morph runs (see BottomSheet) */}
        <Dialog.Content asChild onOpenAutoFocus={onOpenAutoFocus}>
          <Theme
            className="ca-popover"
            style={{ '--ca-fab-w': `${fabSize.width}px`, '--ca-fab-h': `${fabSize.height}px` } as CSSProperties}
          >
            {/* A copy of the button's face, fading out as the panel grows from it */}
            <div className="ca-popover-face" aria-hidden="true">
              <span className="ca-popover-face-label">
                <Icon name="message-ai" className="ca-fab-icon" />
                Campus assistant
              </span>
            </div>

            <div className="ca-popover-panel">
              <Flex justify="between" align="start" gap="4" className="ca-popover-header">
                <Box>
                  <Dialog.Title asChild>
                    <Heading as="h2" size="3">{title}</Heading>
                  </Dialog.Title>
                  <Dialog.Description asChild>
                    <Text as="p" size="1" color="gray">{description}</Text>
                  </Dialog.Description>
                </Box>
                <Dialog.Close asChild>
                  <IconButton variant="soft" color="gray" size="2">
                    <Icon name="close" label="Close" />
                  </IconButton>
                </Dialog.Close>
              </Flex>
              <div className="ca-popover-body">{thread}</div>
              <div className="ca-popover-footer">{footer}</div>
            </div>
          </Theme>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
