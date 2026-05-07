import { describe, expect, it } from 'vitest';
import { isAdminEmail, parseAdminEmails } from '../admin';

describe('admin helpers', () => {
  it('parses admin email allowlists by trimming spaces and skipping empties', () => {
    expect(parseAdminEmails(' admin@example.com, ,ops@example.com , ')).toEqual([
      'admin@example.com',
      'ops@example.com',
    ]);
  });

  it('returns false when the email is missing or not allowlisted', () => {
    const allowlist = ['admin@example.com'];

    expect(isAdminEmail(null, allowlist)).toBe(false);
    expect(isAdminEmail('user@example.com', allowlist)).toBe(false);
    expect(isAdminEmail('admin@example.com', allowlist)).toBe(true);
  });
});
