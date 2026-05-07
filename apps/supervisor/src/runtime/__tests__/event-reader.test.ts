import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { createFastAgentEventReader } from '../event-reader';

describe('createFastAgentEventReader', () => {
  it('parses valid JSONL events including chunked lines', () => {
    const onEvent = vi.fn();
    const onInvalidLine = vi.fn();
    const reader = createFastAgentEventReader({
      onEvent,
      onInvalidLine,
    });

    reader.push(
      '{"type":"process_started","timestamp":"2026-03-30T00:00:00.000Z","pid":123,"message":"IM runtime process start',
    );
    reader.push(
      'ed","data":{"channel":"weixin"},"agentId":"bot_123"}\n{"type":"running","timestamp":"2026-03-30T00:00:05.000Z","pid":123,"message":"Running","data":{"accountId":"wx_acc_1"},"agentId":"bot_123"}\n',
    );

    expect(onInvalidLine).not.toHaveBeenCalled();
    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent).toHaveBeenNthCalledWith(1, expect.objectContaining({
      agentId: 'bot_123',
      pid: 123,
      type: 'process_started',
    }));
    expect(onEvent).toHaveBeenNthCalledWith(2, expect.objectContaining({
      type: 'running',
    }));
  });

  it('reports malformed JSON and unknown event types without throwing', () => {
    const onEvent = vi.fn();
    const onInvalidLine = vi.fn();
    const reader = createFastAgentEventReader({
      onEvent,
      onInvalidLine,
    });

    expect(() => {
      reader.push('{"type":"process_started"\n');
      reader.push(
        '{"type":"unknown_event","timestamp":"2026-03-30T00:00:00.000Z","pid":123,"message":"bad","data":{}}\n',
      );
      reader.flush();
    }).not.toThrow();

    expect(onEvent).not.toHaveBeenCalled();
    expect(onInvalidLine).toHaveBeenCalledTimes(2);
    expect(onInvalidLine).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        line: '{"type":"process_started"',
      }),
    );
    expect(onInvalidLine).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        line: '{"type":"unknown_event","timestamp":"2026-03-30T00:00:00.000Z","pid":123,"message":"bad","data":{}}',
      }),
    );
  });

  it.each([
    {
      eventTypes: ['process_started', 'runtime_error', 'stopped'],
      fixtureName: 'fastagent-cli-runtime-error.sample.jsonl',
    },
    {
      eventTypes: ['process_started', 'running', 'stopping', 'stopped'],
      fixtureName: 'fastagent-cli-restored-running.sample.jsonl',
    },
    {
      eventTypes: ['process_started', 'qr_code', 'stopping', 'stopped'],
      fixtureName: 'fastagent-cli-fresh-qr.sample.jsonl',
    },
    {
      eventTypes: ['process_started', 'qr_code', 'login_confirmed', 'running'],
      fixtureName: 'fastagent-cli-login-confirmed.sample.jsonl',
    },
  ])('parses saved real standalone samples from $fixtureName without invalid lines', async ({
    eventTypes,
    fixtureName,
  }) => {
    const onEvent = vi.fn();
    const onInvalidLine = vi.fn();
    const reader = createFastAgentEventReader({
      onEvent,
      onInvalidLine,
    });

    reader.push(await readFile(getFixturePath(fixtureName), 'utf8'));
    reader.flush();

    expect(onInvalidLine).not.toHaveBeenCalled();
    expect(onEvent).toHaveBeenCalledTimes(eventTypes.length);

    for (const [index, eventType] of eventTypes.entries()) {
      expect(onEvent).toHaveBeenNthCalledWith(index + 1, expect.objectContaining({
        type: eventType,
      }));
    }
  });
});

function getFixturePath(fixtureName: string) {
  return fileURLToPath(
    new URL(`../../../../../tests/fixtures/${fixtureName}`, import.meta.url),
  );
}
