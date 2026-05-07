import type { HTMLAttributes, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorNoticeProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function ErrorNotice({ children, className, ...props }: ErrorNoticeProps) {
  return (
    <p
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 rounded-[1.2rem] border border-[color:var(--status-danger)]/16 bg-[color:var(--status-danger-soft)] px-4 py-3 text-sm leading-6 text-[color:var(--status-danger)]',
        className
      )}
      role="alert"
      {...props}
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
