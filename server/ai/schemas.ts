import { z } from 'zod';

export const IntakeQuestionsSchema = z.object({
  category: z.enum(['career', 'housing', 'finance', 'travel', 'tech', 'personal', 'business', 'general']).optional(),
  options: z.array(z.string()).optional(),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      contextNote: z.string().optional(),
      placeholder: z.string().optional(),
      options: z.array(z.string()).optional()
    })
  ).min(1).max(5)
});

export const FullAnalysisSchema = z.object({
  title: z.string(),
  category: z.enum(['career', 'housing', 'finance', 'travel', 'tech', 'personal', 'business', 'general']),
  description: z.string(),
  options: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      color: z.string()
    })
  ),
  criteria: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      weight: z.number().min(1).max(10),
      isPositive: z.boolean(),
      category: z.string().optional(),
      description: z.string().optional()
    })
  ),
  scores: z.record(z.string(), z.number()),
  swot: z.record(
    z.string(),
    z.object({
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      opportunities: z.array(z.string()),
      threats: z.array(z.string())
    })
  ),
  blindSpots: z.array(
    z.object({
      id: z.string(),
      category: z.string().optional(),
      title: z.string(),
      description: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
      mitigation: z.string()
    })
  ).optional(),
  devilsAdvocate: z.object({
    targetOptionId: z.string(),
    targetOptionName: z.string(),
    counterSeverity: z.number().optional(),
    counterTitle: z.string().optional(),
    counterArgument: z.string(),
    keyRisks: z.array(z.string()).optional(),
    challengingQuestions: z.array(z.string()).optional(),
    unexaminedAssumptions: z.array(z.string()).optional()
  }).optional(),
  tenTenTen: z.object({
    tenMinutes: z.string(),
    tenMonths: z.string(),
    tenYears: z.string()
  }).optional(),
  verdict: z.object({
    executiveSummary: z.string(),
    recommendedOptionId: z.string(),
    recommendedOptionName: z.string(),
    confidenceScore: z.number(),
    keyReasons: z.array(z.string()),
    primaryRisks: z.array(z.string()),
    suggestedNextSteps: z.array(z.string())
  })
});

export const SuggestionsSchema = z.object({
  suggestedOptions: z.array(z.string()),
  suggestedCriteria: z.array(
    z.object({
      name: z.string(),
      weight: z.number(),
      isPositive: z.boolean(),
      description: z.string().optional()
    })
  ),
  briefAdvice: z.string()
});

export const MatrixAnalysisSchema = z.object({
  winnerSummary: z.string(),
  keyTradeoffs: z.array(z.string()),
  sensitivityWarning: z.string(),
  tieBreakerQuestion: z.string()
});
