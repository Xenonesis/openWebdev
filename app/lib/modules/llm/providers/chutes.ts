import { BaseProvider, getOpenAILikeModel } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';

export default class ChutesProvider extends BaseProvider {
  name = 'OpenWebdev';
  getApiKeyLink = 'https://llm.chutes.ai/';
  labelForGetApiKey = 'Get OpenWebdev API Key';
  icon = 'i-ph:rocket-launch';

  config = {
    baseUrl: 'https://llm.chutes.ai/v1',
    baseUrlKey: 'CHUTES_API_BASE_URL',
    apiTokenKey: 'CHUTES_API_KEY',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'zai-org/GLM-4.5-Air',
      label: 'Claude 4',
      provider: 'OpenWebdev',
      maxTokenAllowed: 8000,
    },
    {
      name: 'NousResearch/DeepHermes-3-Llama-3-8B-Preview',
      label: 'DeepHermes-3-Llama-3-8B-Preview',
      provider: 'OpenWebdev',
      maxTokenAllowed: 8192,
    },
    {
      name: 'agentica-org/DeepCoder-14B-Preview',
      label: 'DeepCoder-14B-Preview',
      provider: 'OpenWebdev',
      maxTokenAllowed: 8192,
    },
    {
      name: 'Qwen/Qwen3-Coder-30B-A3B-Instruct',
      label: 'Qwen3-Coder-30B-A3B-Instruct',
      provider: 'OpenWebdev',
      maxTokenAllowed: 32768,
    },
    {
      name: 'openai/gpt-oss-20b',
      label: 'GPT-OSS-20B',
      provider: 'OpenWebdev',
      maxTokenAllowed: 8192,
    },
    {
      name: 'tencent/Hunyuan-A13B-Instruct',
      label: 'Hunyuan-A13B-Instruct',
      provider: 'OpenWebdev',
      maxTokenAllowed: 8192,
    },
  ];

  async getDynamicModels(
    _apiKeys?: Record<string, string>,
    _settings?: IProviderSetting,
    _serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    // Only return static free models - no dynamic model fetching
    return [];
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
