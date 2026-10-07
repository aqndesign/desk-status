import {
  lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState,
  type CSSProperties, type FormEvent, type KeyboardEvent, type PointerEvent,
} from 'react';
import { Dialog } from 'radix-ui';
import { Badge, Box, Flex, IconButton, Text, Theme } from '@radix-ui/themes';
import { EVALUATION } from '../data/policy';
import { answer, suggestions, type Reply, type Viewer } from '../lib/assistant';
import { MOBILE_QUERY, useMediaQuery } from '../lib/breakpoints';
import { BottomSheet } from './BottomSheet';
import { Icon } from './ui/Icon';

// The mascot brings the Lottie player with it, so it loads as its own chunk,
// fetched ahead of time: shortly after the page settles, or as soon as the
// button is pointed at or focused
const loadMascot = () => import('./illustrations/BuddyMascot');
const BuddyMascot = lazy(loadMascot);

interface CampusBuddyProps {
  /** The employee asking */
  viewer: Viewer;
}

type Message =
  | { id: number; from: 'you'; text: string }
  | { id: number; from: 'assistant'; reply: Reply };

/** What the panel needs to know at the moment it opens */
interface Opening {
  /** Messages already in the thread: 0 means a fresh conversation, which gets the mascot intro */
  messages: number;
  /** Suggestions on offer, which sets when the composer follows them in */
  prompts: number;
  /** The button's resting size: where the popover's morph starts and ends */
  width: number;
  height: number;
  /** How far the hover lift had raised the button, so the morph starts where it was */
  lift: number;
  /** The button's gradient at that moment, pointer highlight included */
  face: string;
}

// How long Campus Buddy "thinks" before answering, so replies don't snap in
const THINK_MS = 650;

/** Follows the pointer with the gradient's pink end, as Org Space Manager's Campus Buddy button does */
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
        <Badge size="1" color="gray" variant="surface" radius="full" className="cb-restricted">
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
 * A floating button that opens Campus Buddy: on larger screens the button
 * morphs into a popover anchored to its corner, on phones it opens a bottom
 * sheet. The conversation lives here rather than in either surface, so it
 * survives closing, reopening and a switch between the two; remount the
 * component (via `key`) to start a fresh one.
 *
 * The motion is all CSS (globals.css, "Campus Buddy"), so Radix can wait for
 * the closing sequence before it unmounts the popover.
 */
export function CampusBuddy({ viewer }: CampusBuddyProps) {
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
  const [opening, setOpening] = useState<Opening>({ messages: 0, prompts: 0, width: 0, height: 0, lift: 0, face: '' });
  // The same count, readable while the panel mounts (see threadRef)
  const openedWith = useRef(0);

  const { qualified } = viewer.self.evaluation;
  const lastQuestionId = [...messages].reverse().find(m => m.from === 'you')?.id;
  const asked = new Set(messages.flatMap(m => (m.from === 'you' ? [m.text] : [])));
  const prompts = useMemo(() => suggestions(viewer), [viewer]).filter(p => !asked.has(p));
  const fresh = opening.messages === 0;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    const preload = window.setTimeout(loadMascot, 1500);
    return () => window.clearTimeout(preload);
  }, []);

  /** Brings the latest question to the top of the thread, so its answer reads from the start */
  function scrollToLatest(behavior: ScrollBehavior) {
    const question = lastQuestionRef.current;
    // message → thread → the scrolling body, which is the message's offset parent
    const scroller = question?.parentElement?.parentElement;
    if (!question || !scroller) return;
    // Measured from layout, not the screen, so the panel's entrance
    // transforms don't throw the position off
    scroller.scrollTo({ top: question.offsetTop - 4, behavior });
  }

  // A long answer would otherwise leave the thread scrolled to its end
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollToLatest(reduceMotion ? 'auto' : 'smooth');
  }, [messages]);

  // Reopening mid-conversation picks up at the latest question, not the greeting
  const threadRef = useCallback((thread: HTMLDivElement | null) => {
    if (thread && openedWith.current > 0) scrollToLatest('auto');
  }, []);

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
  // screens focus stays on the panel, so the keyboard doesn't cover the
  // greeting the moment it opens. preventScroll: the composer is still out of
  // view while the panel grows.
  function onOpenAutoFocus(event: Event) {
    if (window.matchMedia('(pointer: fine)').matches) {
      event.preventDefault();
      inputRef.current?.focus({ preventScroll: true });
    }
  }

  function onOpenChange(open: boolean) {
    if (open) {
      const fab = fabRef.current;
      const hovering = !!fab && window.matchMedia('(hover: hover)').matches && fab.matches(':hover');
      openedWith.current = messages.length;
      setOpening({
        messages: messages.length,
        prompts: prompts.length,
        // offsetWidth ignores the hover lift's transform, matching the button's resting box
        width: fab?.offsetWidth ?? 0,
        height: fab?.offsetHeight ?? 0,
        lift: hovering ? 2 : 0,
        face: fab?.style.getPropertyValue('--assistant-gradient') ?? '',
      });
    }
    setPopoverOpen(open);
  }

  const subtitle = qualified
    ? `Ask me how you earned your desk in ${EVALUATION.half}, or how to keep it next half.`
    : `Ask me why you're in the coworking spaces this half, or how to plan your days for an assigned desk next half.`;
  const description = 'Answers about your own desk outcome, worked out from your days.';

  // Timing inputs for the entrance, fixed for as long as the panel is open
  const surfaceClass = `cb-surface ${fresh ? 'cb-fresh' : 'cb-resumed'}`;
  const surfaceStyle = {
    '--cb-prompts': Math.max(1, opening.prompts),
    '--cb-fab-w': `${opening.width}px`,
    '--cb-fab-h': `${opening.height}px`,
    '--cb-fab-lift': `${opening.lift}px`,
    ...(opening.face && { '--cb-face': opening.face }),
  } as CSSProperties;

  const footer = (
    <>
      {prompts.length > 0 && (
        <div className="cb-prompts" role="group" aria-label="Suggested questions">
          {prompts.map((prompt, i) => (
            <button
              key={prompt}
              type="button"
              className="cb-prompt"
              style={{ '--i': i } as CSSProperties}
              onClick={() => send(prompt)}
              disabled={thinking}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
      <form className="cb-composer" onSubmit={onSubmit}>
        <div className="cb-composer-surface">
          <textarea
            ref={inputRef}
            className="cb-input"
            rows={1}
            placeholder="Ask about your desk outcome…"
            aria-label="Ask Campus Buddy"
            value={draft}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <IconButton type="submit" size="2" radius="full" className="cb-send" disabled={!draft.trim() || thinking}>
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
      className="cb-fab"
      aria-label="Open Campus Buddy"
      onPointerEnter={loadMascot}
      onFocus={loadMascot}
      onPointerMove={trackGradient}
      onPointerLeave={event => event.currentTarget.style.removeProperty('--assistant-gradient')}
    >
      <Icon name="message-ai" className="cb-fab-icon" />
      <span className="cb-fab-label">Campus Buddy</span>
    </button>
  );

  const thread = (
    <div ref={threadRef} className="cb-thread" role="log" aria-live="polite" aria-label="Conversation">
      <div className="cb-intro">
        <div className="cb-mascot" aria-hidden="true">
          <Suspense fallback={null}>
            <BuddyMascot className="cb-mascot-art" />
          </Suspense>
        </div>
        <div className="cb-greeting">
          <p className="cb-greeting-title">
            <span className="cb-gradient-text">Hi, I'm your Campus Buddy!</span>
          </p>
          <Text as="p" size="2" color="gray" className="cb-greeting-subtitle">{subtitle}</Text>
          <Text as="p" size="1" color="gray" className="cb-intro-scope">
            <Icon name="lock" size={11} style={{ display: 'inline' }} />
            Workspace utilization and desk assignment decisions are for org leaders only.
          </Text>
        </div>
      </div>

      {messages.map((message, i) => (
        <div
          key={message.id}
          ref={message.id === lastQuestionId ? lastQuestionRef : undefined}
          // Messages already here when the panel opened arrive with the thread
          className={`cb-message cb-message--${message.from}${i >= opening.messages ? ' cb-message--new' : ''}`}
        >
          <div className="cb-bubble">
            {message.from === 'you' ? message.text : <ReplyBody reply={message.reply} />}
          </div>
        </div>
      ))}

      {thinking && (
        <div className="cb-message cb-message--assistant cb-message--new">
          <Box className="cb-bubble cb-thinking" aria-label="Campus Buddy is thinking">
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
        <div className="cb-dock-scrim" aria-hidden="true" />
        <BottomSheet
          trigger={fab}
          title={(
            <Flex align="center" gap="2" asChild>
              <span>
                <Icon name="message-ai" className="cb-glyph" />
                Campus Buddy
              </span>
            </Flex>
          )}
          description={description}
          footer={footer}
          className={`bottom-sheet--buddy ${surfaceClass}`}
          style={surfaceStyle}
          onOpenChange={onOpenChange}
          onOpenAutoFocus={onOpenAutoFocus}
        >
          {thread}
        </BottomSheet>
      </>
    );
  }

  // Non-modal: the page stays usable, and a click outside or Escape closes it
  return (
    <Dialog.Root open={popoverOpen} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Trigger asChild>{fab}</Dialog.Trigger>
      <Dialog.Portal>
        {/* A <Theme> for the tokens and fonts the portal leaves behind, as the
            content element itself so its exit sequence runs (see BottomSheet) */}
        <Dialog.Content asChild onOpenAutoFocus={onOpenAutoFocus}>
          <Theme className={`cb-popover ${surfaceClass}`} style={surfaceStyle}>
            {/* The button's gradient, dissolving into the panel as it grows */}
            <div className="cb-popover-face" aria-hidden="true" />

            {/* Laid out at full size from the start and pinned to the growing
                box's top-left corner, so the title travels with it */}
            <div className="cb-popover-layout">
              <div className="cb-popover-header">
                {/* The button's own icon and label, recoloured as they become the title */}
                <Dialog.Title asChild>
                  <h2 className="cb-popover-title">
                    <Icon name="message-ai" className="cb-popover-title-icon" />
                    <span className="cb-popover-title-label">Campus Buddy</span>
                  </h2>
                </Dialog.Title>
                <Dialog.Description asChild>
                  <Text as="p" size="1" color="gray" className="cb-popover-sublabel">{description}</Text>
                </Dialog.Description>
                <Dialog.Close asChild>
                  <IconButton variant="soft" color="gray" size="2" className="cb-popover-close">
                    <Icon name="close" label="Close" />
                  </IconButton>
                </Dialog.Close>
              </div>
              <div className="cb-popover-body">{thread}</div>
              <div className="cb-popover-footer">{footer}</div>
            </div>
          </Theme>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
