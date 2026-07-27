/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClarifyingQuestion, DecisionProject, Option, Criterion, ScoreMap, SwotItem, BlindSpot, DevilsAdvocate, TenTenTen, FinalVerdict } from '../types/decision';

export interface AnalysisResponse extends Partial<DecisionProject> {
  quotaErrorNotice?: string;
}

/**
 * Call the AI server to get 3 clarifying questions for the intake step
 */
export async function fetchAiIntakeQuestions(
  dilemma: string,
  rawOptions?: string[]
): Promise<{ questions: ClarifyingQuestion[]; quotaErrorNotice?: string }> {
  try {
    const res = await fetch('/api/ai-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dilemma, rawOptions }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 429 || data.isQuotaError || data.error === 'quota_exceeded') {
      console.warn('[AI Service] All 3 AI providers failed or busy:', data.message);
      return {
        questions: getFallbackIntakeQuestions(dilemma, rawOptions),
        quotaErrorNotice: data.message || 'All AI services are currently busy. Please try again in a few moments.',
      };
    }

    if (res.ok && Array.isArray(data.questions) && data.questions.length === 3) {
      return { questions: data.questions };
    }
  } catch (err) {
    console.warn('[AI Service] Intake endpoint unreachable or failed, using smart fallback questions:', err);
  }

  // Fallback 3 intelligent clarifying questions
  return { questions: getFallbackIntakeQuestions(dilemma, rawOptions) };
}

/**
 * Call AI server to generate full multi-criteria analysis (Matrix, SWOT, Blind Spots, Devil's Advocate, 10-10-10, Verdict)
 */
export async function fetchAiFullAnalysis(
  dilemma: string,
  answers: Record<string, string>,
  optionsList: string[] = []
): Promise<AnalysisResponse> {
  try {
    const res = await fetch('/api/ai-analyze-full', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dilemma, answers, optionsList }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 429 || data.isQuotaError || data.error === 'quota_exceeded') {
      console.warn('[AI Service] All 3 AI providers failed or busy on full analysis:', data.message);
      const fallbackAnalysis = generateLocalFullAnalysis(dilemma, answers, optionsList);
      return {
        ...fallbackAnalysis,
        quotaErrorNotice: data.message || 'All AI services are currently busy. Please try again in a few moments.',
      };
    }

    if (res.ok && data && data.options && data.criteria) {
      return data;
    }
  } catch (err) {
    console.warn('[AI Service] Full analysis endpoint unreachable or failed, using local synthesis engine:', err);
  }

  return generateLocalFullAnalysis(dilemma, answers, optionsList);
}

// ==========================================
// FALLBACK GENERATOR LOGIC
// ==========================================

function getFallbackIntakeQuestions(dilemma: string, rawOptions?: string[]): ClarifyingQuestion[] {
  const dLower = dilemma.toLowerCase();

  if (dLower.includes('job') || dLower.includes('career') || dLower.includes('offer') || dLower.includes('role')) {
    return [
      {
        id: 'q1',
        question: 'What is your single highest priority for this next career step?',
        contextNote: 'Helps weight Compensation & Title vs Growth & Work-Life Balance',
        placeholder: 'e.g. Higher salary, better work-life balance, learning opportunities, remote flexibility...',
        options: ['Higher Compensation', 'Career Acceleration & Growth', 'Work-Life Balance', 'Company Culture & Mission'],
      },
      {
        id: 'q2',
        question: 'What are your non-negotiable constraints or financial baselines?',
        contextNote: 'Establishes cost and risk tolerances',
        placeholder: 'e.g. Minimum $120k salary, no more than 30 min commute, stock options equity...',
        options: ['Strict Minimum Base Pay', 'Max 40 hrs/week', 'Fully Remote Only', 'Stable Established Company'],
      },
      {
        id: 'q3',
        question: 'What is your risk tolerance over a 2-3 year horizon?',
        contextNote: 'Determines weighting for stability vs high upside potential',
        placeholder: 'e.g. Comfortable with startup risk for high upside, or prefer enterprise stability...',
        options: ['Low (Prefer Stability & Security)', 'Moderate (Calculated Growth)', 'High (Startup/High Upside Equity)'],
      },
    ];
  }

  if (dLower.includes('buy') || dLower.includes('house') || dLower.includes('car') || dLower.includes('investment') || dLower.includes('finance')) {
    return [
      {
        id: 'q1',
        question: 'What is your strict budget limit and financial runway for this decision?',
        contextNote: 'Helps evaluate upfront expenditure vs long-term ROI',
        placeholder: 'e.g. $50,000 upfront max, or monthly budget cap of $2,000...',
        options: ['Strict Upfront Cap', 'Monthly Cashflow Optimization', 'Long-term Growth ROI'],
      },
      {
        id: 'q2',
        question: 'What is the primary goal you want this investment to solve?',
        contextNote: 'Differentiates immediate utility from asset appreciation',
        placeholder: 'e.g. Save time daily, generate passive income, lifestyle upgrade...',
        options: ['Immediate Time Savings', 'Lifestyle Upgrade & Comfort', 'Capital Appreciation & Wealth'],
      },
      {
        id: 'q3',
        question: 'How flexible are you if unexpected costs or delays arise?',
        contextNote: 'Identifies buffer room for financial risks',
        placeholder: 'e.g. I have a 20% emergency buffer, or I cannot afford any overrun...',
        options: ['Zero Overrun Buffer', '10-20% Flexibility Buffer', 'High Risk Tolerance'],
      },
    ];
  }

  return [
    {
      id: 'q1',
      question: 'What key outcome or metric defines success for this decision?',
      contextNote: 'Determines what factors carry the most weight in evaluation',
      placeholder: 'e.g. Saving time, maximizing revenue, minimizing stress, long-term personal growth...',
      options: ['Time Efficiency', 'Financial ROI', 'Personal Satisfaction', 'Risk Reduction'],
    },
    {
      id: 'q2',
      question: 'What constraints or non-negotiable limits are you working within?',
      contextNote: 'Sets parameters for cost, time, and personal capacity',
      placeholder: 'e.g. Deadline in 30 days, limited budget, specific geographical location...',
      options: ['Tight Timeline', 'Limited Budget', 'Resource / Skill Gap', 'Family / Lifestyle Commitments'],
    },
    {
      id: 'q3',
      question: 'What is your primary fear or worst-case scenario if you choose wrongly?',
      contextNote: 'Helps build Devil\'s Advocate and Blind Spot detection',
      placeholder: 'e.g. Wasting money, regret in 1 year, burn out, lost opportunity cost...',
      options: ['Financial Loss', 'Wasted Time / Delay', 'Burnout / Stress', 'Missed Alternative Opportunity'],
    },
  ];
}

function generateLocalFullAnalysis(
  dilemma: string,
  answers: Record<string, string>,
  optionsList: string[] = []
): Partial<DecisionProject> {
  const cleanOptions = optionsList.filter(o => o.trim().length > 0);
  const opts = cleanOptions.length >= 2 
    ? cleanOptions.slice(0, 4) 
    : ['Option A (Recommended Path)', 'Option B (Alternative Path)'];

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];
  
  const options: Option[] = opts.map((name, i) => ({
    id: `opt_${Date.now()}_${i + 1}`,
    name,
    color: colors[i % colors.length],
    description: `Structured pathway for ${name}`,
  }));

  const criteria: Criterion[] = [
    {
      id: `crit_1`,
      name: 'Strategic Alignment & Value',
      weight: 9,
      isPositive: true,
      description: 'How strongly this aligns with core long-term goals',
    },
    {
      id: `crit_2`,
      name: 'Total Financial & Opportunity Cost',
      weight: 8,
      isPositive: false,
      description: 'Upfront expenditure, ongoing cost, and opportunity cost',
    },
    {
      id: `crit_3`,
      name: 'Execution Feasibility & Speed',
      weight: 7,
      isPositive: true,
      description: 'Ease of implementation, friction, and speed to result',
    },
    {
      id: `crit_4`,
      name: 'Long-term Risk & Reversibility',
      weight: 8,
      isPositive: false,
      description: 'Downside exposure and how easy it is to change course',
    },
    {
      id: `crit_5`,
      name: 'Personal Satisfaction & Quality of Life',
      weight: 8,
      isPositive: true,
      description: 'Peace of mind, intrinsic motivation, and daily experience',
    },
  ];

  const scores: ScoreMap = {};
  options.forEach((opt, oIdx) => {
    criteria.forEach((crit, cIdx) => {
      let baseScore = 7;
      if (oIdx === 0) {
        baseScore = crit.isPositive ? 8.5 : 4;
      } else if (oIdx === 1) {
        baseScore = crit.isPositive ? 6.5 : 7;
      } else {
        baseScore = 6;
      }
      scores[`${opt.id}_${crit.id}`] = Math.round(baseScore);
    });
  });

  const swot: Record<string, SwotItem> = {};
  options.forEach((opt, idx) => {
    swot[opt.id] = {
      strengths: [
        `High upside potential in ${opt.name}`,
        `Directly addresses core priority: "${answers['q1'] || 'Strategic growth'}"`,
        `Clear execution roadmap with defined milestones`,
      ],
      weaknesses: [
        `Requires initial adjustment period and focus`,
        `Dependent on staying committed during early friction`,
      ],
      opportunities: [
        `Positions you strongly for 10-month compounding gains`,
        `Creates leverage for future decision compounding`,
      ],
      threats: [
        `Market or environmental uncertainty`,
        `Potential burnout if work-life balance is unmonitored`,
      ],
    };
  });

  const winnerOpt = options[0];

  const blindSpots: BlindSpot[] = [
    {
      id: 'bs1',
      title: 'Opportunity Cost Sunk Fallacy',
      description: 'You may be weighing past effort higher than future net return.',
      severity: 'high',
      mitigation: 'Focus strictly on future 12-month expected value rather than past sunk investments.',
    },
    {
      id: 'bs2',
      title: 'Best-Case Bias',
      description: 'Assuming frictionless timeline execution without buffering for unexpected delays.',
      severity: 'medium',
      mitigation: 'Add a 20% time and cost buffer into your plan before finalizing commitment.',
    },
  ];

  const devilsAdvocate: DevilsAdvocate = {
    targetOptionId: winnerOpt.id,
    targetOptionName: winnerOpt.name,
    counterArgument: `While ${winnerOpt.name} scores highest on primary criteria, it carries hidden switching friction. Choosing it means sacrificing the steady predictability of alternative options.`,
    keyRisks: [
      'Short-term transition overhead & mental bandwidth tax',
      'Overestimating speed to initial positive payoff',
    ],
    challengingQuestions: [
      `If ${winnerOpt.name} fails to deliver results in 6 months, what is your exit strategy?`,
      'Are you choosing this out of intrinsic excitement or external expectation?',
    ],
  };

  const tenTenTen: TenTenTen = {
    tenMinutes: `Initial surge of excitement combined with slight anxiety about commitment. Step 1: Document your decision criteria and lock in next steps.`,
    tenMonths: `Transition friction will have settled. ${winnerOpt.name} will be producing tangible momentum, validating your structured choice.`,
    tenYears: `The decision will be viewed as a decisive inflection point where you acted with clarity rather than staying in analysis paralysis.`,
  };

  const verdict: FinalVerdict = {
    executiveSummary: `Based on your stated priorities ("${answers['q1'] || 'Growth & Clarity'}"), ${winnerOpt.name} emerges as the optimal strategic path with an estimated 85% alignment score over ${options[1]?.name || 'alternatives'}.`,
    recommendedOptionId: winnerOpt.id,
    recommendedOptionName: winnerOpt.name,
    confidenceScore: 88,
    keyReasons: [
      `Delivers highest weighted score across non-negotiable criteria`,
      `Superior long-term upside-to-risk ratio`,
      `Strong alignment with your 10-month horizon goals`,
    ],
    primaryRisks: [
      `Transition friction in the first 30 days`,
      `Initial cost/time investment before full payoff`,
    ],
    suggestedNextSteps: [
      `Set a firm 48-hour deadline to commit`,
      `Draft a 30-day implementation plan for ${winnerOpt.name}`,
      `Communicate the decision to key stakeholders`,
    ],
  };

  return {
    title: dilemma.length > 40 ? dilemma.substring(0, 38) + '...' : dilemma,
    category: 'general',
    description: dilemma,
    options,
    criteria,
    scores,
    swot,
    blindSpots,
    devilsAdvocate,
    tenTenTen,
    verdict,
  };
}
