import type { ReactNode } from 'react';
import { Dialog } from 'radix-ui';
import { Theme, Flex, Box, Heading, Text, IconButton } from '@radix-ui/themes';
import { Icon } from './ui/Icon';

interface BottomSheetProps {
  /** The control that opens the sheet; focus returns to it on close */
  trigger: ReactNode;
  title: ReactNode;
  description: string;
  children: ReactNode;
  /** Pinned under the scrolling body, e.g. a message composer */
  footer?: ReactNode;
  /** Extra class on the sheet, for variants such as a fixed height */
  className?: string;
  /** Where focus goes on open; call `event.preventDefault()` to move it yourself */
  onOpenAutoFocus?: (event: Event) => void;
}

/* Radix Themes has no sheet, so this builds on the Dialog primitive, which
   supplies the focus trap, Escape / outside-click dismissal, scroll lock and
   ARIA wiring. Styling lives in globals.css under "Bottom sheet". */
export function BottomSheet({ trigger, title, description, children, footer, className, onOpenAutoFocus }: BottomSheetProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="bottom-sheet-overlay" />
        {/* The portal renders outside the app's <Theme>, so the sheet is a
            <Theme> itself to get the tokens and fonts back. It has to be the
            content element rather than a wrapper around it: the portal only
            waits for an exit animation on its direct children. */}
        <Dialog.Content asChild onOpenAutoFocus={onOpenAutoFocus}>
          <Theme className={className ? `bottom-sheet ${className}` : 'bottom-sheet'}>
            <Flex justify="between" align="start" gap="4" className="bottom-sheet-header">
              <Box>
                <Dialog.Title asChild>
                  <Heading as="h2" size="4">{title}</Heading>
                </Dialog.Title>
                <Dialog.Description asChild>
                  <Text as="p" size="2" color="gray">{description}</Text>
                </Dialog.Description>
              </Box>
              <Dialog.Close asChild>
                <IconButton variant="soft" color="gray" size="2">
                  <Icon name="close" label="Close" />
                </IconButton>
              </Dialog.Close>
            </Flex>
            <div className="bottom-sheet-body">{children}</div>
            {footer && <div className="bottom-sheet-footer">{footer}</div>}
          </Theme>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
