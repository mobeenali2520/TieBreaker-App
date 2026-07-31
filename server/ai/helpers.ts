/**
 * Clean and parse JSON from LLM output (handles codeblocks, leading/trailing whitespace, etc.)
 */
export function parseJsonFromLlmText(text: string): any {
  if (!text) return null;
  let cleaned = text.trim();
  
  // Remove markdown code fence wrapper if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }
  
  // Handle case where text might contain extra narrative outside brackets
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse JSON from LLM output:", err, "Raw snippet:", text.slice(0, 200));
    return null;
  }
}

export function buildIntakePrompt(dilemma: string, rawOptions?: string[]): string {
  return `You are the Question Generation Engine for "The Tiebreaker".
Your job is to gather the minimum information necessary to produce an accurate, highly personalized decision analysis.

Core Rules:
1. NEVER ask generic or repetitive questions.
2. NEVER reuse the same generic template questions for every decision.
3. Understand what the user is trying to decide and generate adaptive follow-up questions tailored specifically to their decision domain.

Step 1 — Detect Decision Category:
Automatically infer the category of the user's decision (e.g., University Selection, Career Decision, Job Offer, Higher Education, Buying a Product, Financial Investment, Business Strategy, Travel, Health & Fitness, Relationships, Technology, Programming, AI Tools, Lifestyle, Real Estate, Vehicle Purchase, Hiring, Team Management, etc.).

Step 2 — Detect Compared Options:
Identify Option A, Option B, etc., if mentioned or implied (e.g. User: "PIEAS or NUST?" -> Option A = PIEAS, Option B = NUST; User: "React vs Next.js" -> Option A = React, Option B = Next.js).

Step 3 — Generate Adaptive Questions:
Generate EXACTLY 3 intelligent, domain-specific clarifying questions that maximize useful information.
Avoid simple yes/no questions unless unavoidable. Ask only what materially affects the decision recommendation and criteria weighting.

Step 4 — Personalize Questions with Component Types:
Assign appropriate interactive UI component types to each question. Supported types:
- "single_select" (Provide 4-5 relevant choices)
- "multi_select" (Provide 4-5 choices that can be combined)
- "dropdown" (Provide select options)
- "slider" (Provide min, max, step, e.g., min: 1, max: 10, step: 1)
- "budget_range" (Provide budget options or range)
- "priority_ranking" (Provide key dimensions to rank)
- "date_picker" (Provide timeframe choices)
- "text_input" (Provide clear placeholder text)

User Decision Request: "${dilemma}"
${rawOptions && rawOptions.length > 0 ? `User Provided Candidate Choices: ${rawOptions.join(", ")}` : ""}

Return ONLY a valid JSON object matching this schema:
{
  "category": "Detected Category (e.g. University Selection, Programming, Vehicle Purchase, etc.)",
  "options": ["Option A Name", "Option B Name"],
  "questions": [
    {
      "id": "q1",
      "question": "Domain-specific, intelligent question 1?",
      "type": "single_select",
      "contextNote": "1-sentence explanation of why this question matters for criteria weighting",
      "placeholder": "Helpful placeholder text...",
      "options": ["Choice 1", "Choice 2", "Choice 3", "Choice 4", "Choice 5"]
    },
    {
      "id": "q2",
      "question": "Domain-specific, intelligent question 2?",
      "type": "single_select",
      "contextNote": "1-sentence explanation of why this question matters for criteria weighting",
      "placeholder": "Helpful placeholder text...",
      "options": ["Choice 1", "Choice 2", "Choice 3", "Choice 4", "Choice 5"]
    },
    {
      "id": "q3",
      "question": "Domain-specific, intelligent question 3?",
      "type": "single_select",
      "contextNote": "1-sentence explanation of why this question matters for criteria weighting",
      "placeholder": "Helpful placeholder text...",
      "options": ["Choice 1", "Choice 2", "Choice 3", "Choice 4", "Choice 5"]
    }
  ]
}`;
}

export function buildFullAnalysisPrompt(dilemma: string, answers: Record<string, string>, optionsList?: string[]): string {
  const formattedAnswers = Object.entries(answers || {})
    .map(([qId, ans]) => `- Question ${qId}: ${ans}`)
    .join("\n");

  return `You are an elite decision analyst and game theorist. Conduct a comprehensive, data-driven multi-criteria decision analysis for:
DILEMMA: "${dilemma}"
USER PREFERENCES & CONSTRAINTS:
${formattedAnswers}
USER-PROVIDED OPTIONS: ${optionsList && optionsList.length > 0 ? optionsList.join(", ") : "None specified (infer 2-4 optimal distinct choices)"}

Return ONLY a valid JSON object strictly matching this schema:
{
  "title": "Short punchy project title",
  "category": "general",
  "description": "Clear 2-sentence breakdown of the decision context",
  "options": [
    {
      "id": "opt_1",
      "name": "Full Option Name",
      "color": "#6366f1",
      "description": "1-sentence summary of this path grounded in real facts"
    }
  ],
  "criteria": [
    {
      "id": "crit_1",
      "name": "Criterion Name",
      "weight": 8,
      "isPositive": true,
      "category": "STRATEGIC",
      "description": "Explanation of what this measures"
    }
  ],
  "scores": {
    "opt_1_crit_1": 8
  },
  "swot": {
    "opt_1": {
      "strengths": ["Strength 1...", "Strength 2..."],
      "weaknesses": ["Weakness 1...", "Weakness 2..."],
      "opportunities": ["Opportunity 1...", "Opportunity 2..."],
      "threats": ["Threat 1...", "Threat 2..."]
    }
  },
  "blindSpots": [
    {
      "id": "bs1",
      "category": "OPPORTUNITY COST",
      "title": "Clear Blindspot Title",
      "description": "Specific unexamined risk based on current real-world data",
      "severity": "high",
      "mitigation": "Actionable, practical mitigation strategy"
    }
  ],
  "devilsAdvocate": {
    "targetOptionId": "opt_1",
    "targetOptionName": "Full Option Name",
    "counterSeverity": 78,
    "counterTitle": "Strong Counter-Argument Title",
    "counterArgument": "Detailed 2-3 sentence stress-test critique",
    "unexaminedAssumptions": [
      "Assumption 1",
      "Assumption 2",
      "Assumption 3"
    ]
  },
  "tenTenTen": {
    "tenMinutes": "How it feels in 10 minutes",
    "tenMonths": "Where things stand in 10 months",
    "tenYears": "The 10-year strategic perspective"
  },
  "verdict": {
    "executiveSummary": "Comprehensive executive summary citing top recommendation",
    "recommendedOptionId": "opt_1",
    "recommendedOptionName": "Full Option Name",
    "confidenceScore": 88,
    "keyReasons": ["Reason 1", "Reason 2", "Reason 3"],
    "primaryRisks": ["Risk 1", "Risk 2"],
    "suggestedNextSteps": ["Next step 1", "Next step 2", "Next step 3"]
  }
}`;
}

export function buildSuggestionsPrompt(topic: string, options?: string[], criteria?: string[]): string {
  return `Topic: "${topic}"
Existing options: ${options?.join(", ") || "None"}
Existing criteria: ${criteria?.join(", ") || "None"}

Return ONLY a valid JSON object matching this schema:
{
  "suggestedOptions": ["New Option 1", "New Option 2"],
  "suggestedCriteria": [
    {
      "name": "New Criterion",
      "weight": 8,
      "isPositive": true,
      "description": "Why this dimension matters"
    }
  ],
  "briefAdvice": "2-sentence strategic tip based on current data"
}`;
}

export function buildMatrixAnalysisPrompt(matrixData: any): string {
  return `Analyze this decision matrix data:
Title: "${matrixData?.title}"
Options: ${JSON.stringify(matrixData?.options)}
Criteria: ${JSON.stringify(matrixData?.criteria)}
Scores: ${JSON.stringify(matrixData?.scores)}

Return ONLY a valid JSON object matching this schema:
{
  "winnerSummary": "Detailed summary of top choice based on math and real market context",
  "keyTradeoffs": ["Trade-off 1", "Trade-off 2", "Trade-off 3"],
  "sensitivityWarning": "Note on which weight shifts could flip the outcome",
  "tieBreakerQuestion": "One critical question to ask yourself if scores are close"
}`;
}
