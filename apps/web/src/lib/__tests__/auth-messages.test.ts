import { describe, expect, it } from 'vitest';
import { messages } from '../messages';

describe('auth marketing copy', () => {
  it('describes multiple assistants and Weixin automation in both locales', () => {
    expect(messages['zh-CN'].auth.heroTitle).toContain('多个不同的 AI 助手');
    expect(messages['zh-CN'].auth.heroDescription).toContain('微信');
    expect(messages['zh-CN'].auth.heroDescription).toContain('语音');
    expect(messages.en.auth.heroTitle).toContain('multiple AI assistants');
    expect(messages.en.auth.heroDescription).toContain('Weixin');
    expect(messages.en.auth.heroDescription).toContain('voice');
  });

  it('provides concise auth hero highlight labels in both locales', () => {
    expect(messages['zh-CN'].auth.heroFeatureMultiAssistant).toContain('多个');
    expect(messages['zh-CN'].auth.heroFeatureWeixin).toContain('微信');
    expect(messages.en.auth.heroFeatureMultiAssistant).toContain('Multiple');
    expect(messages.en.auth.heroFeatureWeixin).toContain('Weixin');
  });
});
