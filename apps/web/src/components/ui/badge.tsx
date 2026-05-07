import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/10 text-primary',
        neutral: 'border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] text-muted-foreground',
        success: 'border-transparent bg-[color:var(--status-success-soft)] text-[color:var(--status-success)]',
        warning: 'border-transparent bg-[color:var(--status-attention-soft)] text-[color:var(--status-attention)]',
        danger: 'border-transparent bg-[color:var(--status-danger-soft)] text-[color:var(--status-danger)]',
        outline: 'border-[color:var(--border-soft)] bg-transparent text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
