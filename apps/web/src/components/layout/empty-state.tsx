import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  action?: ReactNode;
  className?: string;
  description: ReactNode;
  title: ReactNode;
}

export function EmptyState({ action, className, description, title }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'grid gap-4 rounded-[1.65rem] border border-dashed border-[color:var(--border-strong)]/80 bg-[color:var(--surface-muted)]/78 px-6 py-8 text-center shadow-[var(--shadow-soft)]',
        className
      )}
    >
      <div className="grid gap-2">
        <h3 className="m-0 text-xl font-semibold tracking-[-0.02em] text-foreground">{title}</h3>
        <div className="text-sm leading-6 text-muted-foreground">{description}</div>
      </div>
      {action ? <div className="flex justify-center">{action}</div> : null}
    </div>
  );
}
