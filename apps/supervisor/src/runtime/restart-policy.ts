import {
  MAX_CONSECUTIVE_RESTARTS,
  RESTART_BACKOFF_DELAYS_MS,
} from '@weclaws/shared';

export interface RestartPlanRestart {
  kind: 'restart';
  restartBackoffUntil: Date;
  restartCount: number;
}

export interface RestartPlanFailed {
  kind: 'failed';
  restartBackoffUntil: null;
  restartCount: number;
}

export type RestartPlan = RestartPlanRestart | RestartPlanFailed;

export function calculateRestartPlan(currentRestartCount: number, observedAt: Date): RestartPlan {
  const nextRestartCount = currentRestartCount + 1;

  if (nextRestartCount >= MAX_CONSECUTIVE_RESTARTS) {
    return {
      kind: 'failed',
      restartBackoffUntil: null,
      restartCount: nextRestartCount,
    };
  }

  const delayMs = RESTART_BACKOFF_DELAYS_MS[Math.min(currentRestartCount, RESTART_BACKOFF_DELAYS_MS.length - 1)];

  return {
    kind: 'restart',
    restartBackoffUntil: new Date(observedAt.getTime() + delayMs),
    restartCount: nextRestartCount,
  };
}
