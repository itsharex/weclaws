import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  description?: ReactNode;
  headerClassName?: string;
  title?: ReactNode;
}

export function SectionCard({
  children,
  className,
  contentClassName,
  description,
  headerClassName,
  title,
}: SectionCardProps) {
  return (
    <Card className={cn('border-[color:var(--border-soft)] bg-[color:var(--surface)]/92', className)}>
      {title || description ? (
        <CardHeader className={cn('gap-3 border-b border-[color:var(--border-soft)]/60 pb-5', headerClassName)}>
          {title ? <CardTitle className="text-[1.04rem]">{title}</CardTitle> : null}
          {description ? <p className="m-0 text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn(title || description ? 'p-6 pt-5' : 'p-6', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
