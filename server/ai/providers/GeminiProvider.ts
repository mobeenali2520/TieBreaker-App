import { GoogleGenAI } from "@google/genai";
import { AIProvider, IntakeQuestionsResult, FullAnalysisResult, SuggestionsResult, MatrixAnalysisResult } from "../types";
import { parseAndValidateJson, buildIntakePrompt, buildFullAnalysisPrompt, buildSuggestionsPrompt, buildMatrixAnalysisPrompt } from "../helpers";
import { IntakeQuestionsSchema, FullAnalysisSchema, SuggestionsSchema, MatrixAnalysisSchema } from "../schemas";

export class GeminiProvider implements AIProvider {
  name: string;
  priority: number;
  private modelName: string;
  private useSearchGrounding: boolean;

  constructor(modelName: string = "gemini-3.6-flash", priority: number = 10, useSearchGrounding: boolean = false) {
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
    let parsed;
    let attempts = 0;
    
    while (attempts < 2) {
      attempts++;
      try {
        response = await ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config,
        });
        parsed = parseAndValidateJson(response.text || "", IntakeQuestionsSchema, this.name);
        break;
      } catch (err: any) {
        if (this.useSearchGrounding && err.message?.includes("grounding") && attempts === 1) {
          console.warn(`[GeminiProvider] Search-grounded generation failed for ${this.modelName}: ${err?.message || err}. Retrying without grounding...`);
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

    return {
      category: parsed.category,
      options: parsed.options,
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
    let parsed;
    let attempts = 0;

    while (attempts < 2) {
      attempts++;
      try {
        response = await ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config,
        });
        parsed = parseAndValidateJson(response.text || "", FullAnalysisSchema, this.name);
        break;
      } catch (err: any) {
        if (this.useSearchGrounding && err.message?.includes("grounding") && attempts === 1) {
          console.warn(`[GeminiProvider] Search-grounded analysis failed for ${this.modelName}: ${err?.message || err}. Retrying without grounding...`);
          config.tools = undefined;
          continue;
        }
        if (attempts < 2 && err.message?.includes("missing required information")) {
          console.warn(`[GeminiProvider] Validation failed. Retrying (attempt ${attempts + 1})...`);
          continue;
        }
        if (attempts >= 2) throw err;
      }
    }

    const groundingChunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;

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
    const config: any = {
      responseMimeType: "application/json",
    };

    let response;
    let parsed;
    let attempts = 0;

    while (attempts < 2) {
      attempts++;
      try {
        response = await ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config,
        });
        parsed = parseAndValidateJson(response.text || "", SuggestionsSchema, this.name);
        break;
      } catch (err: any) {
        if (attempts < 2 && err.message?.includes("missing required information")) {
          console.warn(`[GeminiProvider] Validation failed. Retrying (attempt ${attempts + 1})...`);
          continue;
        }
        if (attempts >= 2) throw err;
      }
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
    const config: any = {
      responseMimeType: "application/json",
    };

    let response;
    let parsed;
    let attempts = 0;

    while (attempts < 2) {
      attempts++;
      try {
        response = await ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config,
        });
        parsed = parseAndValidateJson(response.text || "", MatrixAnalysisSchema, this.name);
        break;
      } catch (err: any) {
        if (attempts < 2 && err.message?.includes("missing required information")) {
          console.warn(`[GeminiProvider] Validation failed. Retrying (attempt ${attempts + 1})...`);
          continue;
        }
        if (attempts >= 2) throw err;
      }
    }

    return {
      ...parsed,
      providerUsed: this.name,
    };
  }
}
