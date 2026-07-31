import { ClarifyingQuestion, DecisionProject, GroundingSource } from '../../src/types/decision';

export interface IntakeQuestionsResult {
  category?: string;
  options?: string[];
  questions: ClarifyingQuestion[];
  groundingSources?: GroundingSource[];
  providerUsed?: string;
}

export interface FullAnalysisResult extends Partial<DecisionProject> {
  groundingSources?: GroundingSource[];
  providerUsed?: string;
}

export interface SuggestionsResult {
  suggestedOptions: string[];
  suggestedCriteria: Array<{
    name: string;
    weight: number;
    isPositive: boolean;
    description?: string;
  }>;
  briefAdvice: string;
  providerUsed?: string;
}

export interface MatrixAnalysisResult {
  winnerSummary: string;
  keyTradeoffs: string[];
  sensitivityWarning: string;
  tieBreakerQuestion: string;
  providerUsed?: string;
}

export interface AIProvider {
  name: string;
  priority: number;
  isConfigured(): boolean;
  generateIntakeQuestions(dilemma: string, rawOptions?: string[]): Promise<IntakeQuestionsResult>;
  generateFullAnalysis(dilemma: string, answers: Record<string, string>, optionsList?: string[]): Promise<FullAnalysisResult>;
  generateSuggestions(topic: string, options?: string[], criteria?: string[]): Promise<SuggestionsResult>;
  generateMatrixAnalysis(matrixData: any): Promise<MatrixAnalysisResult>;
}
