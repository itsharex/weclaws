// @vitest-environment jsdom

import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { renderWithLocale } from '@/test/render';
import { BotBasicInfoCard } from '../bot-basic-info-card';

const fetchMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

it('submits a bot name update and emits the updated bot detail', async () => {
  const updatedBot = {
    ...createBotDetail(),
    name: 'Renamed Bot',
    updatedAt: '2026-04-08T10:05:00.000Z',
  };
  const onBotUpdated = vi.fn();

  fetchMock.mockResolvedValue(new Response(JSON.stringify({
    data: updatedBot,
    error: null,
  }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);

  renderWithLocale(
    <BotBasicInfoCard bot={createBotDetail()} onBotUpdated={onBotUpdated} />,
    { locale: 'en' },
  );

  await userEvent.clear(screen.getByLabelText('Bot Name'));
  await userEvent.type(screen.getByLabelText('Bot Name'), 'Renamed Bot');
  await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

  expect(fetchMock).toHaveBeenCalledWith('/api/bots/bot_1', {
    body: JSON.stringify({ name: 'Renamed Bot' }),
    headers: {
      'content-type': 'application/json',
    },
    method: 'PATCH',
  });
  await waitFor(() => {
    expect(onBotUpdated).toHaveBeenCalledWith(updatedBot);
  });
});

it('shows an inline error when a bot name update fails', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({
    data: null,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid bot update payload.',
    },
  }), { status: 400 }));
  vi.stubGlobal('fetch', fetchMock);

  renderWithLocale(
    <BotBasicInfoCard bot={createBotDetail()} onBotUpdated={vi.fn()} />,
    { locale: 'en' },
  );

  await userEvent.clear(screen.getByLabelText('Bot Name'));
  await userEvent.type(screen.getByLabelText('Bot Name'), 'Broken Bot');
  await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid bot update payload.');
});

function createBotDetail() {
  return {
    createdAt: '2026-04-08T09:30:00.000Z',
    desiredState: 'running' as const,
    heartbeatAt: '2026-04-08T10:02:00.000Z',
    id: 'bot_1',
    lastErrorCode: null,
    lastErrorMessage: null,
    lastQrCodeId: null,
    lastQrCodeUrl: null,
    llmConfigId: 'profile_1',
    llmProfileName: 'Primary',
    model: 'claude-opus-4-6',
    name: 'Alpha',
    processPid: 12345,
    processStartedAt: '2026-04-08T10:00:00.000Z',
    provider: 'anthropic',
    restartRequestedAt: null,
    status: 'running' as const,
    updatedAt: '2026-04-08T10:02:00.000Z',
    weixinAccountId: 'wx_alpha',
    workspaceId: 'workspace_alpha',
  };
}
