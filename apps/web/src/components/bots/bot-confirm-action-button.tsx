'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BotConfirmActionButtonProps {
  actionLabel: string;
  cancelLabel: string;
  confirmLabel: string;
  description?: ReactNode;
  disabled?: boolean;
  isPending?: boolean;
  onConfirm(): void;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
}

export function BotConfirmActionButton({
  actionLabel,
  cancelLabel,
  confirmLabel,
  description,
  disabled = false,
  isPending = false,
  onConfirm,
  size = 'sm',
  variant = 'outline',
}: BotConfirmActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} size={size} type="button" variant={variant}>
          {isPending ? `${actionLabel}...` : actionLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[min(92vw,32rem)]">
        <div className="grid gap-2 pr-8">
          <DialogTitle>{confirmLabel}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <DialogClose asChild>
            <Button disabled={isPending} type="button" variant="outline">
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            disabled={isPending}
            onClick={() => {
              setIsOpen(false);
              onConfirm();
            }}
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
