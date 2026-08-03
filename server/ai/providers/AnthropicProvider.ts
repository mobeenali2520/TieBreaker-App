import { AIProvider, IntakeQuestionsResult, FullAnalysisResult, SuggestionsResult, MatrixAnalysisResult } from "../types";
import { ClarifyingQuestion } from "../../../src/types/decision";
import { parseAndValidateJson, buildIntakePrompt, buildFullAnalysisPrompt, buildSuggestionsPrompt, buildMatrixAnalysisPrompt } from "../helpers";
import { IntakeQuestionsSchema, FullAnalysisSchema, SuggestionsSchema, MatrixAnalysisSchema } from "../schemas";

export class AnthropicProvider implements AIProvider {
  name: string;
  priority: number;
  private modelName: string;

  constructor(modelName: string = "claude-3-5-haiku-20241022", priority: number = 40) {
    this.modelName = modelName;
    this.name = `Anthropic Claude (${modelName})`;
    this.priority = priority;
  }

  private getApiKey(): string | null {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key || key.startsWith("MY_") || key.trim() === "") {
      return null;
    }
    return key.trim();
  }

  isConfigured(): boolean {
    return this.getApiKey() !== null;
  }

  private async callApi(prompt: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error(`${this.name} API key not configured`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.modelName,
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`${this.name} API returned HTTP ${response.status}: ${errText.slice(0, 150)}`);
      }

      const data = await response.json();
      const text = data?.content?.[0]?.text;
      if (!text) {
        throw new Error(`${this.name} API returned empty completion text`);
      }
      return text;
    } catch (err: any) {
      clearTimeout(timeout);
      throw new Error(`${this.name} request failed: ${err.message || err}`);
    }
  }

  async generateIntakeQuestions(dilemma: string, rawOptions?: string[]): Promise<IntakeQuestionsResult> {
    const prompt = buildIntakePrompt(dilemma, rawOptions);
    const text = await this.callApi(prompt);
    const parsed = parseAndValidateJson(text, IntakeQuestionsSchema, this.name);
    return {
      category: parsed.category,
      options: parsed.options,
      questions: parsed.questions as ClarifyingQuestion[],
      providerUsed: this.name,
    };
  }

  async generateFullAnalysis(dilemma: string, answers: Record<string, string>, optionsList?: string[]): Promise<FullAnalysisResult> {
    const prompt = buildFullAnalysisPrompt(dilemma, answers, optionsList);
    const text = await this.callApi(prompt);
    const parsed = parseAndValidateJson(text, FullAnalysisSchema, this.name);
    return {
      ...parsed,
      category: (parsed.category || 'general') as any,
      providerUsed: this.name,
    };
  }

  async generateSuggestions(topic: string, options?: string[], criteria?: string[]): Promise<SuggestionsResult> {
    const prompt = buildSuggestionsPrompt(topic, options, criteria);
    const text = await this.callApi(prompt);
    const parsed = parseAndValidateJson(text, SuggestionsSchema, this.name);
    return {
      ...parsed,
      providerUsed: this.name,
    };
  }

  async generateMatrixAnalysis(matrixData: any): Promise<MatrixAnalysisResult> {
    const prompt = buildMatrixAnalysisPrompt(matrixData);
    const text = await this.callApi(prompt);
    const parsed = parseAndValidateJson(text, MatrixAnalysisSchema, this.name);
    return {
      ...parsed,
      providerUsed: this.name,
    };
  }
}
