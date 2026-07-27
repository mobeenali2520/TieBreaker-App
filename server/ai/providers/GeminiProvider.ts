import { GoogleGenAI } from "@google/genai";
import { AIProvider, IntakeQuestionsResult, FullAnalysisResult, SuggestionsResult, MatrixAnalysisResult } from "../types";
import { parseJsonFromLlmText, buildIntakePrompt, buildFullAnalysisPrompt, buildSuggestionsPrompt, buildMatrixAnalysisPrompt } from "../helpers";

export class GeminiProvider implements AIProvider {
  name: string;
  priority: number;
  private modelName: string;
  private useSearchGrounding: boolean;

  constructor(modelName: string = "gemini-3.6-flash", priority: number = 10, useSearchGrounding: boolean = true) {
    this.modelName = modelName;
    this.name = `Google Gemini (${modelName})`;
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

  async generateIntakeQuestions(dilemma: string, rawOptions?: string[]): Promise<IntakeQuestionsResult> {
    const ai = this.getClient();
    if (!ai) throw new Error(`${this.name} API key not configured`);

    const prompt = buildIntakePrompt(dilemma, rawOptions);
    const config: any = {
      responseMimeType: "application/json",
    };
    if (this.useSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config,
      });
    } catch (err: any) {
      if (this.useSearchGrounding) {
        console.warn(`[GeminiProvider] Search-grounded generation failed for ${this.modelName}: ${err?.message || err}. Retrying without grounding...`);
        response = await ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
      } else {
        throw err;
      }
    }

    const parsed = parseJsonFromLlmText(response.text || "");
    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error(`Invalid or empty response structure from ${this.name}`);
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return {
      questions: parsed.questions,
      groundingSources: groundingChunks || [],
      providerUsed: this.name,
    };
  }

  async generateFullAnalysis(dilemma: string, answers: Record<string, string>, optionsList?: string[]): Promise<FullAnalysisResult> {
    const ai = this.getClient();
    if (!ai) throw new Error(`${this.name} API key not configured`);

    const prompt = buildFullAnalysisPrompt(dilemma, answers, optionsList);
    const config: any = {
      responseMimeType: "application/json",
    };
    if (this.useSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config,
      });
    } catch (err: any) {
      if (this.useSearchGrounding) {
        console.warn(`[GeminiProvider] Search-grounded analysis failed for ${this.modelName}: ${err?.message || err}. Retrying without grounding...`);
        response = await ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
      } else {
        throw err;
      }
    }

    const parsed = parseJsonFromLlmText(response.text || "");
    if (!parsed || !parsed.options || !parsed.criteria) {
      throw new Error(`Invalid or missing options/criteria in response from ${this.name}`);
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return {
      ...parsed,
      groundingSources: groundingChunks || [],
      providerUsed: this.name,
    };
  }

  async generateSuggestions(topic: string, options?: string[], criteria?: string[]): Promise<SuggestionsResult> {
    const ai = this.getClient();
    if (!ai) throw new Error(`${this.name} API key not configured`);

    const prompt = buildSuggestionsPrompt(topic, options, criteria);
    const response = await ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = parseJsonFromLlmText(response.text || "");
    if (!parsed || !Array.isArray(parsed.suggestedOptions)) {
      throw new Error(`Invalid suggestions payload from ${this.name}`);
    }

    return {
      ...parsed,
      providerUsed: this.name,
    };
  }

  async generateMatrixAnalysis(matrixData: any): Promise<MatrixAnalysisResult> {
    const ai = this.getClient();
    if (!ai) throw new Error(`${this.name} API key not configured`);

    const prompt = buildMatrixAnalysisPrompt(matrixData);
    const response = await ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = parseJsonFromLlmText(response.text || "");
    if (!parsed || !parsed.winnerSummary) {
      throw new Error(`Invalid matrix analysis payload from ${this.name}`);
    }

    return {
      ...parsed,
      providerUsed: this.name,
    };
  }
}
