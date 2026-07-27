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
  return `You are a strategic decision consultant. A user is facing the following critical decision:
"${dilemma}"
${rawOptions && rawOptions.length > 0 ? `User mentioned these initial candidate choices: ${rawOptions.join(", ")}` : ""}

Formulate exactly 3 highly specific, probing clarifying questions to extract their underlying priorities, budget/constraints, and risk tolerance for evaluating this decision.

Return ONLY a valid JSON object matching this schema:
{
  "questions": [
    {
      "id": "q1",
      "question": "Clear, concise question statement",
      "contextNote": "Brief 1-sentence note on why this matters for criteria weighting",
      "placeholder": "Helpful input placeholder example",
      "options": ["Option Choice 1", "Option Choice 2", "Option Choice 3", "Option Choice 4"]
    },
    {
      "id": "q2",
      "question": "Clear, concise question statement",
      "contextNote": "Brief 1-sentence note on why this matters for criteria weighting",
      "placeholder": "Helpful input placeholder example",
      "options": ["Option Choice 1", "Option Choice 2", "Option Choice 3", "Option Choice 4"]
    },
    {
      "id": "q3",
      "question": "Clear, concise question statement",
      "contextNote": "Brief 1-sentence note on why this matters for criteria weighting",
      "placeholder": "Helpful input placeholder example",
      "options": ["Option Choice 1", "Option Choice 2", "Option Choice 3", "Option Choice 4"]
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
