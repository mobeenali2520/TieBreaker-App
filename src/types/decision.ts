/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Option {
  id: string;
  name: string;
  color: string;
  description?: string;
  notes?: string;
}

export interface Criterion {
  id: string;
  name: string;
  weight: number; // 1 to 10
  isPositive: boolean; // true if higher is better, false if lower/cost is better
  description?: string;
  category?: string;
}

// Map key: `${optionId}_${criterionId}` -> score (1-10)
export type ScoreMap = Record<string, number>;

export interface ClarifyingQuestion {
  id: string;
  question: string;
  contextNote?: string;
  placeholder?: string;
  options?: string[]; // Optional quick select choices
  answer?: string;
}

export interface SwotItem {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface BlindSpot {
  id: string;
  category?: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface DevilsAdvocate {
  targetOptionId: string;
  targetOptionName: string;
  counterSeverity?: number;
  counterTitle?: string;
  counterArgument: string;
  keyRisks?: string[];
  challengingQuestions?: string[];
  unexaminedAssumptions?: string[];
}

export interface TenTenTen {
  tenMinutes: string;
  tenMonths: string;
  tenYears: string;
}

export interface FinalVerdict {
  executiveSummary: string;
  recommendedOptionId: string;
  recommendedOptionName: string;
  confidenceScore: number; // 0 - 100
  keyReasons: string[];
  primaryRisks: string[];
  suggestedNextSteps: string[];
}

export interface GroundingSource {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface DecisionProject {
  id: string;
  title: string;
  description: string;
  category: 'career' | 'housing' | 'finance' | 'travel' | 'tech' | 'personal' | 'business' | 'general';
  options: Option[];
  criteria: Criterion[];
  scores: ScoreMap;
  
  // AI Workflow Data
  intakeQuestions?: ClarifyingQuestion[];
  swot?: Record<string, SwotItem>; // optionId -> SwotItem
  blindSpots?: BlindSpot[];
  devilsAdvocate?: DevilsAdvocate;
  tenTenTen?: TenTenTen;
  verdict?: FinalVerdict;
  groundingSources?: GroundingSource[];
  
  // App state
  isFavorite?: boolean;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface OptionResult {
  option: Option;
  rawScore: number;
  maxPossibleRawScore: number;
  normalizedPercentage: number; // 0 - 100%
  rank: number;
  isWinner: boolean;
  isTie: boolean;
  criterionContributions: {
    criterionId: string;
    criterionName: string;
    weight: number;
    score: number;
    weightedContribution: number;
    maxContribution: number;
    percentageOfTotal: number;
  }[];
  topStrengths: { criterionName: string; score: number }[];
  topWeaknesses: { criterionName: string; score: number }[];
}

export interface SensitivityPoint {
  weight: number;
  optionScores: Record<string, number>; // optionId -> normalized percentage
}

export interface SensitivityAnalysisResult {
  criterionId: string;
  criterionName: string;
  points: SensitivityPoint[];
  rankChanges: {
    weightThreshold: number;
    newLeaderId: string;
    newLeaderName: string;
  }[];
}

export interface DecisionTemplate {
  id: string;
  title: string;
  description: string;
  category: DecisionProject['category'];
  icon: string;
  options: Omit<Option, 'id'>[];
  criteria: Omit<Criterion, 'id'>[];
  defaultScores?: Record<string, number>;
}
