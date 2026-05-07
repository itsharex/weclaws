export type LlmConfigSource = 'env' | 'missing' | 'user';

export interface LlmConfigFields {
  apiKey: string | null;
  apiType: string | null;
  baseUrl: string | null;
  model: string | null;
  provider: string | null;
}

export interface ResolvedProviderScopedLlmConfig extends LlmConfigFields {
  source: Record<keyof LlmConfigFields, LlmConfigSource>;
}

export function resolveProviderScopedLlmConfig(input: {
  customConfig: LlmConfigFields;
  defaultConfig: LlmConfigFields;
}): ResolvedProviderScopedLlmConfig {
  const provider = input.customConfig.provider ?? input.defaultConfig.provider;
  const canUseDefaultProviderBundle = (
    provider !== null
    && input.defaultConfig.provider !== null
    && provider === input.defaultConfig.provider
  );

  return {
    apiKey: resolveFieldValue(
      input.customConfig.apiKey,
      input.defaultConfig.apiKey,
      canUseDefaultProviderBundle,
    ),
    apiType: resolveFieldValue(
      input.customConfig.apiType,
      input.defaultConfig.apiType,
      canUseDefaultProviderBundle,
    ),
    baseUrl: resolveFieldValue(
      input.customConfig.baseUrl,
      input.defaultConfig.baseUrl,
      canUseDefaultProviderBundle,
    ),
    model: resolveFieldValue(
      input.customConfig.model,
      input.defaultConfig.model,
      canUseDefaultProviderBundle,
    ),
    provider,
    source: {
      apiKey: resolveFieldSource(
        input.customConfig.apiKey,
        input.defaultConfig.apiKey,
        canUseDefaultProviderBundle,
      ),
      apiType: resolveFieldSource(
        input.customConfig.apiType,
        input.defaultConfig.apiType,
        canUseDefaultProviderBundle,
      ),
      baseUrl: resolveFieldSource(
        input.customConfig.baseUrl,
        input.defaultConfig.baseUrl,
        canUseDefaultProviderBundle,
      ),
      model: resolveFieldSource(
        input.customConfig.model,
        input.defaultConfig.model,
        canUseDefaultProviderBundle,
      ),
      provider: resolveFieldSource(
        input.customConfig.provider,
        input.defaultConfig.provider,
        true,
      ),
    },
  };
}

function resolveFieldValue(
  customValue: string | null,
  defaultValue: string | null,
  allowDefaultFallback: boolean,
): string | null {
  if (customValue !== null) {
    return customValue;
  }

  return allowDefaultFallback ? defaultValue : null;
}

function resolveFieldSource(
  customValue: string | null,
  defaultValue: string | null,
  allowDefaultFallback: boolean,
): LlmConfigSource {
  if (customValue !== null) {
    return 'user';
  }

  if (allowDefaultFallback && defaultValue !== null) {
    return 'env';
  }

  return 'missing';
}
