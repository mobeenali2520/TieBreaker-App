import { AIProvider, IntakeQuestionsResult, FullAnalysisResult, SuggestionsResult, MatrixAnalysisResult } from "../types";
import { parseAndValidateJson, buildIntakePrompt, buildFullAnalysisPrompt, buildSuggestionsPrompt, buildMatrixAnalysisPrompt } from "../helpers";
import { IntakeQuestionsSchema, FullAnalysisSchema, SuggestionsSchema, MatrixAnalysisSchema } from "../schemas";

export class OpenAICompatibleProvider implements AIProvider {
  name: string;
  priority: number;
  private apiKeyEnvVar: string;
  private apiEndpoint: string;
  private modelName: string;

  constructor(
    name: string,
    apiKeyEnvVar: string,
    apiEndpoint: string = "https://api.openai.com/v1/chat/completions",
    modelName: string = "gpt-4o-mini",
    priority: number = 30
  ) {
    this.name = name;
    this.apiKeyEnvVar = apiKeyEnvVar;
    this.apiEndpoint = apiEndpoint;
    this.modelName = modelName;
    this.priority = priority;
  }

  private getApiKey(): string | null {
    const key = process.env[this.apiKeyEnvVar];
    if (!key || key.startsWith("MY_") || key.trim() === "") {
      return null;
    }
    return key.trim();
  }

  isConfigured(): boolean {
    return this.getApiKey() !== null;
  }

  private async callApi(userPrompt: string, systemPrompt?: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error(`${this.name} API key (${this.apiKeyEnvVar}) not configured`);

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: userPrompt });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelName,
          messages,
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`${this.name} API returned HTTP ${response.status}: ${errorText.slice(0, 150)}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error(`${this.name} API returned empty completion content`);
      }
      return content;
    } catch (err: any) {
      clearTimeout(timeout);
      throw new Error(`${this.name} request failed: ${err.message || err}`);
    }
  }

  async generateIntakeQuestions(dilemma: string, rawOptions?: string[]): Promise<IntakeQuestionsResult> {
    const prompt = buildIntakePrompt(dilemma, rawOptions);
    const content = await this.callApi(
      prompt,
      "You are an expert decision analyst. Respond strictly with a valid JSON object."
    );
    const parsed = parseAndValidateJson(content, IntakeQuestionsSchema, this.name);
    return {
      category: parsed.category,
      options: parsed.options,
      questions: parsed.questions,
      providerUsed: this.name,
    };
  }

  async generateFullAnalysis(dilemma: string, answers: Record<string, string>, optionsList?: string[]): Promise<FullAnalysisResult> {
    const prompt = buildFullAnalysisPrompt(dilemma, answers, optionsList);
    const content = await this.callApi(
      prompt,
      "You are an elite game theorist and strategic analyst. Output valid JSON adhering strictly to the schema provided."
    );
    const parsed = parseAndValidateJson(content, FullAnalysisSchema, this.name);
    return {
      ...parsed,
      providerUsed: this.name,
    };
  }

  async generateSuggestions(topic: string, options?: string[], criteria?: string[]): Promise<SuggestionsResult> {
    const prompt = buildSuggestionsPrompt(topic, options, criteria);
    const content = await this.callApi(
      prompt,
      "You are a strategic brainstorming assistant. Output valid JSON adhering strictly to the schema provided."
    );
    const parsed = parseAndValidateJson(content, SuggestionsSchema, this.name);
    return {
      ...parsed,
      providerUsed: this.name,
    };
  }

  async generateMatrixAnalysis(matrixData: any): Promise<MatrixAnalysisResult> {
    const prompt = buildMatrixAnalysisPrompt(matrixData);
    const content = await this.callApi(
      prompt,
      "You are a decision matrix analyst. Output valid JSON adhering strictly to the schema provided."
    );
    const parsed = parseAndValidateJson(content, MatrixAnalysisSchema, this.name);
    return {
      ...parsed,
      providerUsed: this.name,
    };
  }
}
