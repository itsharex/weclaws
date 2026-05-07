'use client';

import type { ChangeEvent } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StatusOption {
  label: string;
  value: string;
}

interface BotFilterBarProps {
  onSearchQueryChange(nextValue: string): void;
  onStatusFilterChange(nextValue: string): void;
  searchQuery: string;
  statusFilter: string;
  statusOptions: StatusOption[];
}

export function BotFilterBar({
  onSearchQueryChange,
  onStatusFilterChange,
  searchQuery,
  statusFilter,
  statusOptions,
}: BotFilterBarProps) {
  const { t } = useLocale();

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchQueryChange(event.target.value);
  };

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onStatusFilterChange(event.target.value);
  };

  return (
    <section className="grid gap-4 rounded-[1.65rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)]/88 p-4 shadow-[var(--shadow-soft)] md:grid-cols-[minmax(0,1fr)_16rem]">
      <Label className="grid gap-2.5 text-sm font-medium text-foreground">
        {t((messages) => messages.botsList.searchLabel)}
        <Input
          name="search"
          onChange={handleSearchChange}
          placeholder={t((messages) => messages.botsList.searchPlaceholder)}
          type="search"
          value={searchQuery}
        />
      </Label>

      <Label className="grid gap-2.5 text-sm font-medium text-foreground">
        {t((messages) => messages.botsList.statusLabel)}
        <select
          className="flex h-11 w-full rounded-[var(--radius-control)] border border-input bg-[color:var(--surface-elevated)] px-4 py-2 text-sm text-foreground shadow-[inset_0_1px_0_var(--control-highlight)] transition-[border-color,box-shadow,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          name="status"
          onChange={handleStatusChange}
          value={statusFilter}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Label>
    </section>
  );
}
