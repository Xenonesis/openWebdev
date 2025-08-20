import { BaseProvider, getOpenAILikeModel } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';

export default class ChutesProvider extends BaseProvider {
  name = 'Chutes';
  getApiKeyLink = 'https://llm.chutes.ai/';
  labelForGetApiKey = 'Get Chutes API Key';
  icon = 'i-ph:rocket-launch';

  config = {
    baseUrl: 'https://llm.chutes.ai/v1',
    baseUrlKey: 'CHUTES_API_BASE_URL',
    apiTokenKey: 'CHUTES_API_KEY',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'zai-org/GLM-4.5-Air',
      label: 'GLM-4.5-Air',
      provider: 'Chutes',
      maxTokenAllowed: 8000,
    },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: 'CHUTES_API_BASE_URL',
      defaultApiTokenKey: 'CHUTES_API_KEY',
    });

    if (!baseUrl || !apiKey) {
      return [];
    }

    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const res = (await response.json()) as any;

      if (!res.data || !Array.isArray(res.data)) {
        return [];
      }

      const staticModelIds = this.staticModels.map((m) => m.name);

      return res.data
        .filter((model: any) => !staticModelIds.includes(model.id))
        .map((model: any) => ({
          name: model.id,
          label: model.id,
          provider: this.name,
          maxTokenAllowed: model.context_length || 8000,
        }));
    } catch (error) {
      console.error('Error fetching Chutes dynamic models:', error);
      return [];
    }
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: 'CHUTES_API_BASE_URL',
      defaultApiTokenKey: 'CHUTES_API_KEY',
    });

    if (!baseUrl || !apiKey) {
      throw new Error(`Missing configuration for ${this.name} provider`);
    }

    return getOpenAILikeModel(baseUrl, apiKey, model);
  }
}
