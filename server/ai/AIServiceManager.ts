import { AIProvider, IntakeQuestionsResult, FullAnalysisResult, SuggestionsResult, MatrixAnalysisResult } from "./types";
import { GeminiProvider } from "./providers/GeminiProvider";
import { OpenAICompatibleProvider } from "./providers/OpenAICompatibleProvider";
import { AnthropicProvider } from "./providers/AnthropicProvider";
import { HeuristicFallbackProvider } from "./providers/HeuristicFallbackProvider";

export class AIServiceManager {
  private providers: AIProvider[] = [];

  constructor() {
    this.registerProviders();
  }

  private registerProviders() {
    this.providers = [
      // Priority 1: Gemini 3.6 Flash
      new GeminiProvider("gemini-3.6-flash", 10, false),

      // Priority 2: Groq Llama 3.3 70B
      new OpenAICompatibleProvider(
        "Groq (Llama-3.3-70b)",
        "GROQ_API_KEY",
        "https://api.groq.com/openai/v1/chat/completions",
        "llama-3.3-70b-versatile",
        30
      ),

      // Priority 4: OpenAI GPT-4o-mini
      new OpenAICompatibleProvider(
        "OpenAI (GPT-4o-mini)",
        "OPENAI_API_KEY",
        "https://api.openai.com/v1/chat/completions",
        "gpt-4o-mini",
        40
      ),

      // Priority 5: SambaNova Cloud
      new OpenAICompatibleProvider(
        "SambaNova (Llama-3.3-70b)",
        "SAMBANOVA_API_KEY",
        "https://api.sambanova.ai/v1/chat/completions",
        "Meta-Llama-3.3-70B-Instruct",
        50
      ),

      // Priority 6: Anthropic Claude 3.5 Haiku
      new AnthropicProvider("claude-3-5-haiku-20241022", 60),

      // Priority 7 (Ultimate Fallback): Local Heuristic Engine (100% Guaranteed Success)
      new HeuristicFallbackProvider(),
    ];

    // Sort providers by priority ascending
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Returns list of currently active & configured provider names
   */
  getAvailableProviders(): string[] {
    return this.providers
      .filter((p) => p.isConfigured())
      .map((p) => p.name);
  }

  /**
   * Generic provider execution loop with automatic failover
   */
  private async executeWithFailover<T>(
    actionName: string,
    operation: (provider: AIProvider) => Promise<T>
  ): Promise<T> {
    const configuredProviders = this.providers.filter((p) => p.isConfigured());

    if (configuredProviders.length === 0) {
      console.warn(`[AI Failover System] No external AI keys configured. Using Heuristic Fallback Engine.`);
      const fallback = new HeuristicFallbackProvider();
      return await operation(fallback);
    }

    const errors: Array<{ provider: string; error: string }> = [];

    for (const provider of configuredProviders) {
      try {
        console.log(`[AI Failover System] Attempting "${actionName}" via provider: ${provider.name}`);
        const result = await operation(provider);
        console.log(`[AI Failover System] "${actionName}" succeeded using provider: ${provider.name}`);
        return result;
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        console.warn(`[AI Failover System] Provider "${provider.name}" failed for "${actionName}": ${errorMsg}`);
        errors.push({ provider: provider.name, error: errorMsg });
      }
    }

    // If every configured provider failed, failover to Heuristic Engine
    console.warn(`[AI Failover System] All ${configuredProviders.length} configured providers failed for "${actionName}". Executing local Heuristic Fallback Engine.`);
    const fallbackProvider = new HeuristicFallbackProvider();
    return await operation(fallbackProvider);
  }

  async generateIntakeQuestions(dilemma: string, rawOptions?: string[]): Promise<IntakeQuestionsResult> {
    return this.executeWithFailover("generateIntakeQuestions", (provider) =>
      provider.generateIntakeQuestions(dilemma, rawOptions)
    );
  }

  async generateFullAnalysis(
    dilemma: string,
    answers: Record<string, string>,
    optionsList?: string[]
  ): Promise<FullAnalysisResult> {
    return this.executeWithFailover("generateFullAnalysis", (provider) =>
      provider.generateFullAnalysis(dilemma, answers, optionsList)
    );
  }

  async generateSuggestions(
    topic: string,
    options?: string[],
    criteria?: string[]
  ): Promise<SuggestionsResult> {
    return this.executeWithFailover("generateSuggestions", (provider) =>
      provider.generateSuggestions(topic, options, criteria)
    );
  }

  async generateMatrixAnalysis(matrixData: any): Promise<MatrixAnalysisResult> {
    return this.executeWithFailover("generateMatrixAnalysis", (provider) =>
      provider.generateMatrixAnalysis(matrixData)
    );
  }
}

// Singleton instance export
export const aiServiceManager = new AIServiceManager();
