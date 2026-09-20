import type { ReactNode } from 'react';
import { Dialog } from 'radix-ui';
import { Theme, Flex, Box, Heading, Text, IconButton } from '@radix-ui/themes';
import { Icon } from './ui/Icon';

interface BottomSheetProps {
  /** The control that opens the sheet; focus returns to it on close */
  trigger: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}

/* Radix Themes has no sheet, so this builds on the Dialog primitive, which
   supplies the focus trap, Escape / outside-click dismissal, scroll lock and
   ARIA wiring. Styling lives in globals.css under "Bottom sheet". */
export function BottomSheet({ trigger, title, description, children }: BottomSheetProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        {/* The portal renders outside the app's <Theme>; re-enter it for tokens and fonts */}
        <Theme>
          <Dialog.Overlay className="bottom-sheet-overlay" />
          <Dialog.Content className="bottom-sheet">
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
          </Dialog.Content>
        </Theme>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
