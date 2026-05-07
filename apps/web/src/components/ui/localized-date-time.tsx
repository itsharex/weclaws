'use client';

import { useEffect, useState } from 'react';

interface LocalizedDateTimeProps {
  locale: string;
  unavailableLabel?: string | null;
  value: string | null;
}

export function LocalizedDateTime({
  locale,
  unavailableLabel = null,
  value,
}: LocalizedDateTimeProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!value) {
    return unavailableLabel;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const text = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...(isHydrated ? {} : { timeZone: 'UTC' }),
  }).format(parsed);

  return <time dateTime={parsed.toISOString()}>{text}</time>;
}
