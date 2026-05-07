// @vitest-environment jsdom

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { BotEventsList } from '../bot-events-list';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

it('renders compact paginated event rows and resets to the first page when new events arrive', async () => {
  const initialEvents = Array.from({ length: 12 }, (_, index) => createEvent(index + 1));
  const user = userEvent.setup();
  const { rerender } = render(
    <LocaleProvider initialLocale="en">
      <BotEventsList events={initialEvents} />
    </LocaleProvider>
  );

  expect(screen.getByText('Recent Events')).toBeInTheDocument();
  expect(document.querySelectorAll('[data-event-row]')).toHaveLength(10);
  expect(screen.getByText('1 / 2')).toBeInTheDocument();
  expect(screen.getByText('event.1')).toBeInTheDocument();
  expect(screen.getByText('event.10')).toBeInTheDocument();
  expect(screen.queryByText('event.11')).not.toBeInTheDocument();
  expect(screen.queryByText('event.12')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Next page' }));

  expect(screen.getByText('2 / 2')).toBeInTheDocument();
  expect(document.querySelectorAll('[data-event-row]')).toHaveLength(2);
  expect(screen.getByText('event.11')).toBeInTheDocument();
  expect(screen.getByText('event.12')).toBeInTheDocument();
  expect(screen.queryByText('event.1')).not.toBeInTheDocument();

  rerender(
    <LocaleProvider initialLocale="en">
      <BotEventsList
        events={[
          {
            rowId: 99,
            id: 'evt_99',
            botInstanceId: 'bot_1',
            type: 'event.99',
            message: 'Newest event',
            payloadJson: {},
            createdAt: '2026-04-01T00:30:00.000Z',
          },
          ...initialEvents,
        ]}
      />
    </LocaleProvider>
  );

  expect(screen.getByText('1 / 2')).toBeInTheDocument();
  expect(document.querySelectorAll('[data-event-row]')).toHaveLength(10);
  expect(screen.getByText('event.99')).toBeInTheDocument();
  expect(screen.queryByText('event.12')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
});

function createEvent(index: number) {
  return {
    rowId: index,
    id: `evt_${index}`,
    botInstanceId: 'bot_1',
    type: `event.${index}`,
    message: `Event message ${index}`,
    payloadJson: {},
    createdAt: `2026-04-01T00:${String(index).padStart(2, '0')}:00.000Z`,
  };
}
