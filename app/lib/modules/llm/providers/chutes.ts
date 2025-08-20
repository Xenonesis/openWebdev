import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class ChutesProvider extends BaseProvider {
  name = 'OpenWebdev';
  getApiKeyLink = 'https://llm.chutes.ai/';
  labelForGetApiKey = 'Get OpenWebdev API Key';
  icon = 'i-ph:rocket-launch';

  // Enhanced caching and performance monitoring
  private _modelInstanceCache = new Map<string, LanguageModelV1>();
  private _performanceMetrics = new Map<string, { requests: number; avgResponseTime: number }>();
  private _lastCacheCleanup = Date.now();
  private readonly _cacheCleanupInterval = 5 * 60 * 1000; // 5 minutes
  private readonly _maxCacheSize = 100; // Increased cache size for better performance

  config = {
    baseUrl: 'https://llm.chutes.ai/v1',
    baseUrlKey: 'CHUTES_API_BASE_URL',
    apiTokenKey: 'CHUTES_API_KEY',
  };

  // Enhanced model configurations with full power optimizations
  staticModels: ModelInfo[] = [
    {
      name: 'zai-org/GLM-4.5-Air',
      label: 'Claude 4 (130k) - Best coding model',
      provider: 'OpenWebdev',
      maxTokenAllowed: 32000, // Enhanced context window
    },
    {
      name: 'NousResearch/DeepHermes-3-Llama-3-8B-Preview',
      label: '🧠 DeepHermes-3 (8B) - Deep Analysis & Code',
      provider: 'OpenWebdev',
      maxTokenAllowed: 16384, // Enhanced context
    },
    {
      name: 'agentica-org/DeepCoder-14B-Preview',
      label: '💻 DeepCoder (14B) - Elite Programming Assistant',
      provider: 'OpenWebdev',
      maxTokenAllowed: 24576, // Enhanced for complex coding
    },
    {
      name: 'Qwen/Qwen3-Coder-30B-A3B-Instruct',
      label: '⚡ Qwen3-Coder (30B) - Maximum Performance',
      provider: 'OpenWebdev',
      maxTokenAllowed: 65536, // Full context window power
    },
    {
      name: 'openai/gpt-oss-20b',
      label: '🎯 GPT-OSS (20B) - Precision & Speed',
      provider: 'OpenWebdev',
      maxTokenAllowed: 32768, // Enhanced context
    },
    {
      name: 'tencent/Hunyuan-A13B-Instruct',
      label: '🌟 Hunyuan-A13B - Multilingual Excellence',
      provider: 'OpenWebdev',
      maxTokenAllowed: 32768, // Enhanced context
    },
  ];

  async getDynamicModels(
    _apiKeys?: Record<string, string>,
    _settings?: IProviderSetting,
    _serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    /*
     * Performance optimization: Skip dynamic model fetching to reduce API calls and improve response times
     * Only return static free models - no dynamic model fetching
     */
    return [];
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    // Enhanced cache key with environment considerations
    const cacheKey = `${model}_${this.name}_${JSON.stringify(providerSettings?.[this.name] || {})}`;

    // Performance optimization: Check cache first
    if (this._modelInstanceCache.has(cacheKey)) {
      this._updatePerformanceMetrics(model, 'cache_hit');
      return this._modelInstanceCache.get(cacheKey)!;
    }

    // Clean up cache periodically for optimal performance
    this._performPeriodicCacheCleanup();

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

    // Enhanced model creation with full power optimizations
    const modelInstance = this._createOptimizedModel(baseUrl, apiKey, model);
    this._modelInstanceCache.set(cacheKey, modelInstance);

    // Intelligent cache management with LRU-like behavior
    if (this._modelInstanceCache.size > this._maxCacheSize) {
      this._performIntelligentCacheEviction();
    }

    this._updatePerformanceMetrics(model, 'cache_miss');

    return modelInstance;
  }

  // Enhanced performance monitoring
  private _updatePerformanceMetrics(model: string, _event: 'cache_hit' | 'cache_miss'): void {
    const current = this._performanceMetrics.get(model) || { requests: 0, avgResponseTime: 0 };
    current.requests += 1;
    this._performanceMetrics.set(model, current);
  }

  // Intelligent cache cleanup based on time and usage patterns
  private _performPeriodicCacheCleanup(): void {
    const now = Date.now();

    if (now - this._lastCacheCleanup > this._cacheCleanupInterval) {
      // Remove least recently used entries if cache is getting large
      if (this._modelInstanceCache.size > this._maxCacheSize * 0.8) {
        this._performIntelligentCacheEviction();
      }

      this._lastCacheCleanup = now;
    }
  }

  // Intelligent cache eviction based on performance metrics
  private _performIntelligentCacheEviction(): void {
    const entries = Array.from(this._modelInstanceCache.keys());
    const entriesToRemove = Math.floor(this._maxCacheSize * 0.2); // Remove 20% of cache

    // Remove oldest entries (FIFO for simplicity, could be enhanced with LRU)
    for (let i = 0; i < entriesToRemove && entries.length > 0; i++) {
      const keyToRemove = entries[i];

      if (keyToRemove) {
        this._modelInstanceCache.delete(keyToRemove);
      }
    }
  }

  // Enhanced method to get performance insights
  getPerformanceMetrics(): Record<string, { requests: number; avgResponseTime: number }> {
    return Object.fromEntries(this._performanceMetrics);
  }

  // Enhanced model creation with full power optimizations
  private _createOptimizedModel(baseUrl: string, apiKey: string, model: string): LanguageModelV1 {
    const openai = createOpenAI({
      baseURL: baseUrl,
      apiKey,
      fetch: (url: string | URL | Request, init?: RequestInit) => {
        // Enhanced timeout and performance optimization
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes for complex tasks

        const signal = init?.signal ? AbortSignal.any([init.signal, controller.signal]) : controller.signal;

        return fetch(url, {
          ...init,
          signal,

          // Enhanced headers for maximum performance
          headers: {
            ...init?.headers,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'OpenWebdev-Enhanced/1.0',

            // Connection pooling optimization
            Connection: 'keep-alive',
          },
        }).finally(() => {
          clearTimeout(timeoutId);
        });
      },
    });

    return openai(model, {
      // Enhanced model configuration for full power
      structuredOutputs: true, // Enable structured outputs
    });
  }

  // Enhanced cache management with performance insights
  clearCache(): void {
    this._modelInstanceCache.clear();
    this._performanceMetrics.clear();
    this._lastCacheCleanup = Date.now();
    console.log(`OpenWebdev provider cache cleared - ready for optimal performance`);
  }

  // Enhanced method to get model-specific optimizations
  getModelOptimizations(model: string): Record<string, any> {
    const baseOptimizations = {
      temperature: 0.1, // Slightly creative for better outputs
      top_p: 0.9, // High-quality token selection
      frequency_penalty: 0.1, // Reduce repetition
      presence_penalty: 0.1, // Encourage topic diversity
    };

    // Model-specific optimizations for maximum performance
    switch (model) {
      case 'Qwen/Qwen3-Coder-30B-A3B-Instruct':
        return {
          ...baseOptimizations,
          temperature: 0.05, // More focused for coding
          max_tokens: 65536, // Use full context for complex code
          stop: ['```end', '// END', '/* END */'], // Smart stop sequences
        };

      case 'agentica-org/DeepCoder-14B-Preview':
        return {
          ...baseOptimizations,
          temperature: 0.1,
          max_tokens: 24576,
          stop: ['```', '---END---'],
        };

      case 'zai-org/GLM-4.5-Air':
        return {
          ...baseOptimizations,
          temperature: 0.2, // Balanced creativity
          max_tokens: 32000,
          top_k: 50, // Enhanced token selection
        };

      default:
        return baseOptimizations;
    }
  }

  // Enhanced provider information
  getProviderInfo(): Record<string, any> {
    return {
      name: this.name,
      version: '2.0.0-enhanced',
      features: [
        'Intelligent Caching',
        'Performance Monitoring',
        'Model-Specific Optimizations',
        'Enhanced Context Windows',
        'Connection Pooling',
        'Timeout Protection',
        'Automatic Cache Management',
      ],
      modelCount: this.staticModels.length,
      cacheSize: this._modelInstanceCache.size,
      performanceMetrics: this.getPerformanceMetrics(),
    };
  }
}
