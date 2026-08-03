import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';

function cleanJsonContent(content: string): string {
  let cleaned = content.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
}

function isQuotaOrRateLimitError(err: any): boolean {
  if (!err) return false;
  if (err.status === 429 || err.statusCode === 429) return true;
  const msg = (err.message || String(err)).toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('rate_limit_exceeded') ||
    msg.includes('resource_exhausted')
  );
}

async function generateWith3TierAiFallback(prompt: string): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  const sambaApiKey = process.env.SAMBANOVA_API_KEY || process.env.VITE_SAMBANOVA_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  // -------------------------------------------------------------
  // TIER 1: Groq API (llama-3.3-70b-versatile)
  // -------------------------------------------------------------
  if (groqApiKey) {
    try {
      console.log('[AI Service] Tier 1: Attempting Groq API (llama-3.3-70b-versatile)...');
      const groq = new Groq({ apiKey: groqApiKey });
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are "The Tiebreaker", an expert decision analysis AI. Always output valid raw JSON without commentary or wrapper text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '{}';
      return cleanJsonContent(content);
    } catch (groqErr: any) {
      console.warn(
        '[AI Service] Primary Groq API failed (rate limit/network/auth). Retrying with Secondary Provider (SambaNova Cloud)...',
        groqErr?.message || groqErr
      );
    }
  } else {
    console.warn('[AI Service] Tier 1 Groq API key missing. Trying secondary provider (SambaNova)...');
  }

  // -------------------------------------------------------------
  // TIER 2: SambaNova Cloud API (Meta-Llama-3.3-70B-Instruct)
  // -------------------------------------------------------------
  if (sambaApiKey) {
    try {
      console.log('[AI Service] Tier 2: Attempting SambaNova Cloud API (Meta-Llama-3.3-70B-Instruct)...');
      const response = await fetch('https://api.sambanova.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sambaApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'Meta-Llama-3.3-70B-Instruct',
          messages: [
            {
              role: 'system',
              content: 'You are "The Tiebreaker", an expert decision analysis AI. Always output valid raw JSON without commentary or wrapper text.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`SambaNova API returned HTTP ${response.status}: ${errBody}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '{}';
      return cleanJsonContent(content);
    } catch (sambaErr: any) {
      console.warn(
        '[AI Service] Secondary SambaNova Cloud API failed. Retrying with Tertiary Provider (Google Gemini API)...',
        sambaErr?.message || sambaErr
      );
    }
  } else {
    console.warn('[AI Service] Tier 2 SambaNova API key missing. Trying tertiary provider (Google Gemini)...');
  }

  // -------------------------------------------------------------
  // TIER 3: Google Gemini API (gemini-3.6-flash)
  // -------------------------------------------------------------
  if (geminiApiKey) {
    try {
      console.log('[AI Service] Tier 3: Attempting Google Gemini API (gemini-3.6-flash)...');
      const ai = new GoogleGenAI({ 
        apiKey: geminiApiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      const aiRes = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      return cleanJsonContent(aiRes.text || '{}');
    } catch (geminiErr: any) {
      console.error(
        '[AI Service] Tertiary Google Gemini API failed:',
        geminiErr?.message || geminiErr
      );
    }
  } else {
    console.warn('[AI Service] Tier 3 Google Gemini API key missing.');
  }

  // -------------------------------------------------------------
  // ALL PROVIDERS FAILED
  // -------------------------------------------------------------
  console.error('[AI Service] All 3 AI providers failed (Groq, SambaNova, Google Gemini).');
  const allFailedErr: any = new Error('All AI services are currently busy. Please try again in a few moments.');
  allFailedErr.isQuotaError = true;
  allFailedErr.status = 429;
  throw allFailedErr;
}

function expressApiPlugin(): Plugin {
  return {
    name: 'express-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {};

            // 1. AI Intake - Generates 3 intelligent clarifying questions
            if (req.url === '/api/ai-intake') {
              const { dilemma, rawOptions } = parsedBody;
              const prompt = `You are a "Socratic Consultant", a world-class executive coach helping a user with a crucial decision.
The user wants to evaluate this dilemma: "${dilemma}".
Provided options (if any): ${JSON.stringify(rawOptions || [])}.

Your goal is NOT just to gather data, but to aggressively challenge the user's core assumptions. Generate EXACTLY 3 brilliant, probing, non-obvious clarifying questions that a human expert would ask to expose true trade-offs, hidden constraints, and psychological biases. Make the user think "Wow, this person really understands my situation."

Return raw JSON matching this schema:
{
  "questions": [
    {
      "id": "q1",
      "question": "Probing, expert-level, non-obvious question 1?",
      "contextNote": "Short explanation of why an expert asks this",
      "placeholder": "e.g. My primary priority is work-life balance and long-term career growth...",
      "options": ["Highly specific choice A", "Nuanced choice B", "Expert-level choice C", "Pragmatic choice D"]
    },
    {
      "id": "q2",
      "question": "Probing, expert-level, non-obvious question 2?",
      "contextNote": "Short explanation of why an expert asks this",
      "placeholder": "e.g. Budget cap, minimum salary, max commuting time...",
      "options": ["Highly specific choice A", "Nuanced choice B", "Expert-level choice C"]
    },
    {
      "id": "q3",
      "question": "Probing, expert-level, non-obvious question 3?",
      "contextNote": "Short explanation of why an expert asks this",
      "placeholder": "e.g. Prefer stability vs high upside potential...",
      "options": ["Highly specific choice A", "Nuanced choice B", "Expert-level choice C"]
    }
  ]
}
Return ONLY valid raw JSON.`;

              const jsonString = await generateWith3TierAiFallback(prompt);
              res.setHeader('Content-Type', 'application/json');
              res.end(jsonString);
              return;
            }

            // 2. AI Analyze Full - Generates complete matrix, SWOT, blind spots, devil's advocate, 10-10-10, and verdict
            if (req.url === '/api/ai-analyze-full') {
              const { dilemma, answers, optionsList } = parsedBody;
              const prompt = `You are "The Tiebreaker", a senior decision consultant AI.
User Dilemma: "${dilemma}"
User Clarifications: ${JSON.stringify(answers || {})}
User Option Candidates: ${JSON.stringify(optionsList || [])}

Perform a deep structured multi-criteria decision analysis.

Return raw JSON matching this exact structure:
{
  "title": "Concise 3-5 word title for the decision",
  "category": "career | housing | finance | travel | tech | personal | business | general",
  "description": "Short summary of the dilemma context",
  "options": [
    { "id": "opt_1", "name": "Option A Name", "description": "Brief description", "color": "#6366f1" },
    { "id": "opt_2", "name": "Option B Name", "description": "Brief description", "color": "#10b981" }
  ],
  "criteria": [
    { "id": "crit_1", "name": "Criterion Name", "weight": 8, "isPositive": true, "description": "Explanation" },
    { "id": "crit_2", "name": "Total Cost / Expense", "weight": 7, "isPositive": false, "description": "Lower cost is better" }
  ],
  "scores": {
    "opt_1_crit_1": 8,
    "opt_1_crit_2": 6,
    "opt_2_crit_1": 7,
    "opt_2_crit_2": 9
  },
  "swot": {
    "opt_1": { "strengths": ["..."], "weaknesses": ["..."], "opportunities": ["..."], "threats": ["..."] },
    "opt_2": { "strengths": ["..."], "weaknesses": ["..."], "opportunities": ["..."], "threats": ["..."] }
  },
  "blindSpots": [
    { "id": "bs1", "title": "Opportunity Cost", "description": "Hidden risk or oversight...", "severity": "high", "mitigation": "Action step to mitigate..." },
    { "id": "bs2", "title": "Confirmation Bias", "description": "Hidden emotional bias...", "severity": "medium", "mitigation": "How to verify..." }
  ],
  "devilsAdvocate": {
    "targetOptionId": "opt_1",
    "targetOptionName": "Option A Name",
    "counterArgument": "The strongest logical case against Option A...",
    "keyRisks": ["Risk 1", "Risk 2"],
    "challengingQuestions": ["Question 1?", "Question 2?"]
  },
  "tenTenTen": {
    "tenMinutes": "Immediate emotional reaction & immediate setup steps...",
    "tenMonths": "Mid-term adaptation, challenges, and realistic trajectory...",
    "tenYears": "Long-term career, financial, and personal lifestyle impact..."
  },
  "verdict": {
    "executiveSummary": "Clear 2-3 sentence executive recommendation summarizing trade-offs.",
    "recommendedOptionId": "opt_1",
    "recommendedOptionName": "Option A Name",
    "confidenceScore": 86,
    "keyReasons": ["Reason 1", "Reason 2", "Reason 3"],
    "primaryRisks": ["Primary risk 1", "Primary risk 2"],
    "suggestedNextSteps": ["Next step 1", "Next step 2"]
  }
}

Ensure all weights are 1-10, scores are 1-10, confidenceScore is 0-100, and criteria includes at least 4-6 balanced factors (both positive and negative cost/risk factors). Return ONLY valid raw JSON.`;

              const jsonString = await generateWith3TierAiFallback(prompt);
              res.setHeader('Content-Type', 'application/json');
              res.end(jsonString);
              return;
            }

            // 3. AI Suggest - Auto-generate matrix setup
            if (req.url === '/api/ai-suggest') {
              const { topic, options, criteria } = parsedBody;
              const prompt = `You are "The Tiebreaker", an AI decision matrix generator.
Topic: "${topic}"
Existing options: ${JSON.stringify(options || [])}
Existing criteria: ${JSON.stringify(criteria || [])}

Generate suggested evaluation options, criteria with weights (1-10), and brief strategic advice.

Return raw JSON matching this schema:
{
  "suggestedOptions": ["Option A", "Option B", "Option C"],
  "suggestedCriteria": [
    { "name": "Criterion Name", "weight": 8, "isPositive": true, "description": "Short explanation" },
    { "name": "Cost & Expense", "weight": 7, "isPositive": false, "description": "Lower cost is preferable" }
  ],
  "briefAdvice": "Concise 1-2 sentence recommendation on how to approach this decision."
}
Return ONLY valid raw JSON.`;

              const jsonString = await generateWith3TierAiFallback(prompt);
              res.setHeader('Content-Type', 'application/json');
              res.end(jsonString);
              return;
            }

            // 4. AI Analyze - Executive Matrix Insight
            if (req.url === '/api/ai-analyze') {
              const { matrixData } = parsedBody;
              const prompt = `You are "The Tiebreaker" executive decision consultant.
Analyze this decision project dataset: ${JSON.stringify(matrixData || {})}

Return raw JSON with key insights:
{
  "winnerSummary": "Concise summary of top recommended option and why it won.",
  "keyTradeoffs": [
    "Tradeoff 1",
    "Tradeoff 2"
  ],
  "sensitivityWarning": "Observation on which criteria weight change would flip the winner.",
  "tieBreakerQuestion": "A provocative gut-check question to break remaining psychological hesitation."
}
Return ONLY valid raw JSON.`;

              const jsonString = await generateWith3TierAiFallback(prompt);
              res.setHeader('Content-Type', 'application/json');
              res.end(jsonString);
              return;
            }

            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Endpoint not found' }));
          } catch (err: any) {
            console.error('API Middleware Error:', err);
            const isQuota = isQuotaOrRateLimitError(err) || err?.isQuotaError || err?.status === 429;
            res.statusCode = isQuota ? 429 : 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              error: isQuota ? 'quota_exceeded' : 'server_error',
              isQuotaError: isQuota,
              message: err.message || 'All AI services are currently busy. Please try again in a few moments.'
            }));
          }
        });
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), expressApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      cssCodeSplit: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-recharts': ['recharts'],
            'vendor-lucide': ['lucide-react'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      host: '0.0.0.0',
      port: 3000,
    },
  };
});
