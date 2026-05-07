export const SUPPORTED_LLM_API_TYPES = [
  'anthropic-messages',
  'openai-completions',
  'openai-responses',
  'google-generative-ai',
] as const;

export const DEFAULT_LLM_API_TYPE = 'openai-completions';

export type SupportedLlmApiType = (typeof SUPPORTED_LLM_API_TYPES)[number];
