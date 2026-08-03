import { z } from 'zod';

/**
 * Clean and parse JSON from LLM output (handles codeblocks, leading/trailing whitespace, etc.)
 */
export function cleanLlmJsonText(text: string): string {
  if (!text) return "";
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

  return cleaned;
}

export function parseJsonFromLlmText(text: string): any {
  try {
    return JSON.parse(cleanLlmJsonText(text));
  } catch (err) {
    console.error("Failed to parse JSON from LLM output:", err, "Raw snippet:", text.slice(0, 200));
    return null;
  }
}

export function parseAndValidateJson<T>(text: string, schema: z.ZodType<T>, providerName: string): T {
  const cleaned = cleanLlmJsonText(text);
  
  let parsedJson;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch (err) {
    console.error(`[${providerName}] Invalid JSON format.`, err);
    throw new Error(`The AI returned an invalid response format that could not be read.`);
  }

  const result = schema.safeParse(parsedJson);
  if (!result.success) {
    console.error(`[${providerName}] Zod Schema Validation Failed:`, result.error.format());
    console.error("Invalid Payload Shape:", JSON.stringify(parsedJson, null, 2).slice(0, 500));
    throw new Error(`The AI response was missing required information. Please try again.`);
  }

  return result.data;
}

export function buildIntakePrompt(dilemma: string, rawOptions?: string[]): string {
  return `You are an expert Socratic Decision Consultant helping a user evaluate a crucial decision with absolute truthfulness and ZERO FABRICATION.
User Request / Dilemma: "${dilemma}"
Provided options (if any): ${rawOptions && rawOptions.length > 0 ? JSON.stringify(rawOptions) : "None explicitly provided"}.

==================================================
MANDATORY WORKFLOW & INSTRUCTIONS
==================================================

1. CLASSIFY DECISION DOMAIN & STRUCTURE:
- Infer the domain category (e.g., "University Selection", "Laptop & Hardware", "Career & Job Offer", "Programming & Tech Stack", "Business & Investment", "Finance", "Relocation", "Lifestyle", etc.).
- CASE A (Options Provided): If the user explicitly provided choices (e.g. "PIEAS or NUST", "MacBook vs XPS", "Job Offer A vs Offer B"), set "options" to those choices.
- CASE B (Open-Ended Query): If the user asked an open-ended question without specifying choices (e.g., "Which university is best in Pakistan?", "What laptop should I buy?", "Should I take a new job?"), DO NOT randomly invent options like PIEAS vs NUST! Set "options" to [] (empty array). In question contextNotes, explain that there isn't one universally best choice, as it depends on field, goals, priorities, and constraints.

2. INSPECT USER INPUT FIRST:
- Look closely at what the user ALREADY stated in their prompt.
- If the user ALREADY specified their major (e.g., "for Computer Science"), DO NOT ask "What is your major?".
- If the user ALREADY specified a budget (e.g., "under $1000"), DO NOT ask "What is your budget?".
- Ask ONLY about missing uncertainties necessary to understand user requirements or select candidates.

3. GENERATE EXACTLY 3 DYNAMIC, SPECIFIC QUESTIONS:
- For Open-Ended queries: Ask questions to identify (1) field/discipline, (2) primary post-decision goal/outcome, and (3) key criteria/constraints (multi_select or single_select).
- For Direct Comparisons: Ask questions that probe core trade-offs, priority weighting, and non-negotiables between those choices.

4. SUPPORTED UI COMPONENT TYPES:
- "single_select" (Provide 4-5 realistic, domain-specific choices)
- "multi_select" (Provide 4-5 nuanced, combinable choices)
- "dropdown" (Provide dropdown choices)
- "slider" (Provide min: 1, max: 10, step: 1)
- "budget_range" (Provide budget options)
- "priority_ranking" (Provide dimensions to rank)
- "text_input" (Provide placeholder)

Return ONLY a valid JSON object matching this schema:
{
  "category": "Detected Category",
  "options": ["Option A Name", "Option B Name"], // OR [] if open-ended
  "questions": [
    {
      "id": "q1",
      "question": "Probing, domain-specific question 1?",
      "type": "single_select",
      "contextNote": "1-sentence explanation of why an expert asks this",
      "placeholder": "Helpful placeholder text...",
      "options": ["Specific choice A", "Nuanced choice B", "Expert choice C", "Pragmatic choice D"]
    },
    {
      "id": "q2",
      "question": "Probing, domain-specific question 2?",
      "type": "multi_select",
      "contextNote": "1-sentence explanation of why an expert asks this",
      "placeholder": "Helpful placeholder text...",
      "options": ["Specific choice A", "Nuanced choice B", "Expert choice C", "Pragmatic choice D"]
    },
    {
      "id": "q3",
      "question": "Probing, domain-specific question 3?",
      "type": "single_select",
      "contextNote": "1-sentence explanation of why an expert asks this",
      "placeholder": "Helpful placeholder text...",
      "options": ["Specific choice A", "Nuanced choice B", "Expert choice C", "Pragmatic choice D"]
    }
  ]
}`;
}

export function buildFullAnalysisPrompt(dilemma: string, answers: Record<string, string>, optionsList?: string[]): string {
  const formattedAnswers = Object.entries(answers || {})
    .map(([qId, ans]) => `- Answer for ${qId}: ${ans}`)
    .join("\n");

  return `You are an elite strategic decision analyst. Conduct an evidence-grounded multi-criteria decision analysis for:
DILEMMA: "${dilemma}"
USER STATED ANSWERS & PREFERENCES:
${formattedAnswers || "No explicit answers provided."}
CANDIDATE OPTIONS: ${optionsList && optionsList.length > 0 ? JSON.stringify(optionsList) : "None provided (open-ended decision)"}

==================================================
ABSOLUTE MANDATORY RULES - ZERO FABRICATION
==================================================

1. NEVER INVENT USER INFORMATION:
- NEVER write "Based on your stated priority of...", "Given your 10-month goals...", "Because you specified a $100k budget..." UNLESS the user explicitly selected or wrote that in their answers above!
- If a priority or goal was NOT explicitly stated by the user, DO NOT pretend they said it.
- Clearly distinguish between:
  - User-stated choices (e.g. "You selected Computer Science and Research Quality")
  - AI inferences (e.g. "AI inference based on software industry standards")
  - Evidence-based facts (e.g. "NUST has strong tech industry connections in Pakistan")

2. CANDIDATE SELECTION FOR OPEN-ENDED DECISIONS:
- If no explicit options were provided originally, select 2 to 4 top candidate choices BASED STRICTLY ON THE USER'S STATED FIELD, GOALS, AND PRIORITIES in their answers.
- In each option's description, explain WHY it was selected for comparison based on the user's field and preferences.

3. TRANSPARENT CRITERIA, WEIGHTS & SCORES:
- Derive criteria weights (1 to 10) directly from user preferences. Give higher weight (8-10) to user's top priorities.
- Score options (1 to 10) on each criterion using verifiable domain facts and logical analysis.
- For cost or risk criteria (isPositive = false), assign scores consistently where lower score = higher cost/risk.
- The final verdict MUST mathematically follow the weighted matrix calculations.

4. HONEST MATCH & CONFIDENCE SCORE:
- Confidence score (1-100) must reflect information completeness (e.g. 75-85% for standard intake). Explain the basis of confidence in the verdict.
- Do NOT generate fake 99% certainty.

5. CONTEXTUAL DEVIL'S ADVOCATE, BLIND SPOTS, AND 10-10-10:
- Blind Spots: 2-3 genuine risks relevant strictly to this decision domain.
- Devil's Advocate: Real counter-arguments challenging the recommended path based on actual trade-offs.
- 10-10-10 Framework:
  - 10 Minutes: Immediate emotional/practical reaction.
  - 10 Months: Realistic potential 10-month outcome (labeled as "Potential outcome", NOT "your stated 10-month goal").
  - 10 Years: Strategic long-term perspective.

Return ONLY a valid JSON object strictly matching this schema:
{
  "title": "Short punchy decision title",
  "category": "Detected Category",
  "description": "Clear 2-sentence breakdown of the decision context",
  "options": [
    {
      "id": "opt_1",
      "name": "Full Option Name",
      "color": "#6366f1",
      "description": "1-sentence summary grounded in real facts and user fit"
    }
  ],
  "criteria": [
    {
      "id": "crit_1",
      "name": "Criterion Name",
      "weight": 9,
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
      "strengths": ["Fact-grounded strength 1", "Fact-grounded strength 2"],
      "weaknesses": ["Real weakness 1", "Real weakness 2"],
      "opportunities": ["Real opportunity 1"],
      "threats": ["Real threat 1"]
    }
  },
  "blindSpots": [
    {
      "id": "bs1",
      "category": "OPPORTUNITY COST",
      "title": "Clear Blindspot Title",
      "description": "Specific unexamined risk based on real-world data",
      "severity": "high",
      "mitigation": "Actionable, practical mitigation strategy"
    }
  ],
  "devilsAdvocate": {
    "targetOptionId": "opt_1",
    "targetOptionName": "Full Option Name",
    "counterSeverity": 75,
    "counterTitle": "Key Trade-off Challenge",
    "counterArgument": "Detailed 2-3 sentence stress-test critique",
    "keyRisks": ["Risk 1", "Risk 2"],
    "challengingQuestions": ["Probing question 1?", "Probing question 2?"],
    "unexaminedAssumptions": ["Assumption 1", "Assumption 2"]
  },
  "tenTenTen": {
    "tenMinutes": "Immediate emotional/practical reaction",
    "tenMonths": "Potential 10-month trajectory",
    "tenYears": "The 10-year strategic outlook"
  },
  "verdict": {
    "executiveSummary": "Honest summary citing top choice based on user's stated answers and matrix math",
    "recommendedOptionId": "opt_1",
    "recommendedOptionName": "Full Option Name",
    "confidenceScore": 82,
    "keyReasons": ["Grounding reason 1", "Grounding reason 2"],
    "primaryRisks": ["Primary risk 1", "Primary risk 2"],
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
