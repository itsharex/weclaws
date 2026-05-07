import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      className={cn(
        'flex h-11 w-full rounded-[var(--radius-control)] border border-input bg-[color:var(--surface-elevated)] px-4 py-2 text-sm text-foreground shadow-[inset_0_1px_0_var(--control-highlight)] transition-[border-color,box-shadow,background-color] placeholder:text-[color:var(--text-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      type={type}
      {...props}
    />
  )
);

Input.displayName = 'Input';
