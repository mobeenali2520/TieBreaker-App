import { GoogleGenAI } from "@google/genai";
import { AIProvider, IntakeQuestionsResult, FullAnalysisResult, SuggestionsResult, MatrixAnalysisResult } from "../types";
import { parseAndValidateJson, buildIntakePrompt, buildFullAnalysisPrompt, buildSuggestionsPrompt, buildMatrixAnalysisPrompt } from "../helpers";
import { IntakeQuestionsSchema, FullAnalysisSchema, SuggestionsSchema, MatrixAnalysisSchema } from "../schemas";

export class GeminiProvider implements AIProvider {
  name: string;
  priority: number;
  private useSearchGrounding: boolean;

  constructor(priority: number = 10, useSearchGrounding: boolean = false) {
    this.name = `Google Gemini (Dynamic Routing)`;
    this.priority = priority;
    this.useSearchGrounding = useSearchGrounding;
  }

  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  isConfigured(): boolean {
    return this.getClient() !== null;
  }

  private async executeWithModel(
    modelName: string,
    prompt: string,
    schema: any,
    useThinking: boolean = false
  ) {
    const ai = this.getClient();
    if (!ai) throw new Error(`${this.name} API key not configured`);

    const config: any = {
      responseMimeType: "application/json",
    };
    if (this.useSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }
    if (useThinking) {
      config.thinkingConfig = { thinkingLevel: "HIGH" };
    }

    let response;
    let parsed;
    let attempts = 0;
    
    while (attempts < 2) {
      attempts++;
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config,
        });
        parsed = parseAndValidateJson(response.text || "", schema, this.name);
        break;
      } catch (err: any) {
        if (this.useSearchGrounding && err.message?.includes("grounding") && attempts === 1) {
          console.warn(`[GeminiProvider] Search-grounded generation failed for ${modelName}: ${err?.message || err}. Retrying without grounding...`);
          config.tools = undefined;
          continue; // retry
        }
        if (attempts < 2 && err.message?.includes("missing required information")) {
          console.warn(`[GeminiProvider] Validation failed. Retrying (attempt ${attempts + 1})...`);
          continue;
        }
        if (attempts >= 2) throw err;
      }
    }

    const groundingChunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    return { parsed, groundingChunks };
  }

  async generateIntakeQuestions(dilemma: string, rawOptions?: string[]): Promise<IntakeQuestionsResult> {
    const prompt = buildIntakePrompt(dilemma, rawOptions);
    // Fast task
    const { parsed, groundingChunks } = await this.executeWithModel("gemini-3.1-flash-lite", prompt, IntakeQuestionsSchema, false);
    
    return {
      category: parsed.category,
      options: parsed.options,
      questions: parsed.questions,
      groundingSources: groundingChunks || [],
      providerUsed: `Google Gemini (gemini-3.1-flash-lite)`,
    };
  }

  async generateFullAnalysis(dilemma: string, answers: Record<string, string>, optionsList?: string[]): Promise<FullAnalysisResult> {
    const prompt = buildFullAnalysisPrompt(dilemma, answers, optionsList);
    // Complex task
    const { parsed, groundingChunks } = await this.executeWithModel("gemini-3.1-pro-preview", prompt, FullAnalysisSchema, true);

    return {
      ...parsed,
      groundingSources: groundingChunks || [],
      providerUsed: `Google Gemini (gemini-3.1-pro-preview + Thinking)`,
    };
  }

  async generateSuggestions(topic: string, options?: string[], criteria?: string[]): Promise<SuggestionsResult> {
    const prompt = buildSuggestionsPrompt(topic, options, criteria);
    // General task
    const { parsed } = await this.executeWithModel("gemini-3.5-flash", prompt, SuggestionsSchema, false);

    return {
      ...parsed,
      providerUsed: `Google Gemini (gemini-3.5-flash)`,
    };
  }

  async generateMatrixAnalysis(matrixData: any): Promise<MatrixAnalysisResult> {
    const prompt = buildMatrixAnalysisPrompt(matrixData);
    // Complex task
    const { parsed } = await this.executeWithModel("gemini-3.1-pro-preview", prompt, MatrixAnalysisSchema, true);

    return {
      ...parsed,
      providerUsed: `Google Gemini (gemini-3.1-pro-preview + Thinking)`,
    };
  }
}
