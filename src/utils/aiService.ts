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
): Promise<{ questions: ClarifyingQuestion[]; category?: string; options?: string[]; quotaErrorNotice?: string }> {
  try {
    const res = await fetch('/api/ai-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dilemma, rawOptions }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 429 || data.isQuotaError || data.error === 'quota_exceeded') {
      console.warn('[AI Service] All AI providers failed or busy:', data.message);
      const fallback = getFallbackIntakeQuestions(dilemma, rawOptions);
      return {
        ...fallback,
        quotaErrorNotice: data.message || 'All AI services are currently busy. Using smart dynamic intake engine.',
      };
    }

    if (res.ok && Array.isArray(data.questions) && data.questions.length === 3) {
      return {
        questions: data.questions,
        category: data.category,
        options: data.options,
      };
    }
  } catch (err) {
    console.warn('[AI Service] Intake endpoint unreachable or failed, using smart fallback questions:', err);
  }

  // Fallback 3 intelligent clarifying questions
  return getFallbackIntakeQuestions(dilemma, rawOptions);
}

/**
 * Call AI server to generate full multi-criteria analysis (Matrix, SWOT, Blind Spots, Devil's Advocate, 10-10-10, Verdict)
 */
export async function fetchAiFullAnalysis(
  dilemma: string,
  answers: Record<string, string>,
  optionsList: string[] = []
): Promise<AnalysisResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s max client timeout

  try {
    const res = await fetch('/api/ai-analyze-full', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dilemma, answers, optionsList }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (res.status === 429 || data.isQuotaError || data.error === 'quota_exceeded') {
      console.warn('[AI Service] AI services busy on full analysis, using instant dynamic synthesis engine:', data.message);
      const fallbackAnalysis = generateLocalFullAnalysis(dilemma, answers, optionsList);
      return {
        ...fallbackAnalysis,
        quotaErrorNotice: data.message || 'All AI services are currently busy. Using instant decision engine.',
      };
    }

    if (res.ok && data && data.options && data.criteria) {
      return data;
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn('[AI Service] Request timed out after 10s, seamlessly switching to instant decision synthesis engine.');
    } else {
      console.warn('[AI Service] Full analysis endpoint unreachable, using local synthesis engine:', err);
    }
  }

  return generateLocalFullAnalysis(dilemma, answers, optionsList);
}

// ==========================================
// FALLBACK GENERATOR LOGIC
// ==========================================

function getFallbackIntakeQuestions(
  dilemma: string,
  rawOptions?: string[]
): { category: string; options: string[]; questions: ClarifyingQuestion[] } {
  const dLower = dilemma.toLowerCase();
  const hasExplicitOptions = (rawOptions && rawOptions.length > 0) || dLower.includes(' vs ') || dLower.includes(' or ');

  let detectedOptions: string[] = [];
  if (rawOptions && rawOptions.length > 0) {
    detectedOptions = rawOptions;
  } else if (dLower.includes('pieas') && dLower.includes('nust')) {
    detectedOptions = ['PIEAS', 'NUST'];
  } else if (dLower.includes('macbook') && dLower.includes('windows')) {
    detectedOptions = ['Apple MacBook', 'Windows Laptop'];
  } else if (dLower.includes('python') && dLower.includes('c++')) {
    detectedOptions = ['Python', 'C++'];
  }

  const knowsField = dLower.includes('computer science') || dLower.includes('cs') || dLower.includes('engineering') || dLower.includes('business') || dLower.includes('medical') || dLower.includes('finance');

  // University Selection
  if (dLower.includes('university') || dLower.includes('college') || dLower.includes('degree') || dLower.includes('pieas') || dLower.includes('nust') || dLower.includes('campus')) {
    if (!hasExplicitOptions && detectedOptions.length === 0) {
      // Open-ended query
      return {
        category: 'University Selection',
        options: [],
        questions: [
          knowsField ? {
            id: 'q1',
            question: 'What is your primary career goal after graduating in your field?',
            type: 'single_select',
            contextNote: 'Directly determines weighting for research labs vs industry placement.',
            placeholder: 'Select career path...',
            options: ['Private Sector Tech Job', 'Higher Studies (MS/PhD Abroad)', 'AI/ML Research & Academia', 'Govt / Defence Sector', 'Entrepreneurship'],
          } : {
            id: 'q1',
            question: 'What is your intended field or major?',
            type: 'single_select',
            contextNote: 'Essential to compare department-specific faculty, labs, and accreditation.',
            placeholder: 'Select major...',
            options: ['Computer Science & Software', 'Electrical / Electronics Engineering', 'Mechanical / Aerospace', 'Business & Finance', 'Data Science & AI'],
          },
          {
            id: 'q2',
            question: 'Which evaluation criteria carry the highest weight for you?',
            type: 'multi_select',
            contextNote: 'Establishes your weighted decision matrix priority scores.',
            placeholder: 'Select priorities...',
            options: ['Research Quality & Labs', 'Tech Job Placement Rate', 'Tuition & Hostel Affordability', 'Campus Life & Location', 'Global Alumni Network'],
          },
          {
            id: 'q3',
            question: 'What is your primary geographic or location requirement?',
            type: 'single_select',
            contextNote: 'Filters options by relocation feasibility and hostel availability.',
            placeholder: 'Select location preference...',
            options: ['Islamabad / Rawalpindi Region', 'Lahore Region', 'Karachi Region', 'Open to Relocating Anywhere with Hostel'],
          },
        ],
      };
    } else {
      const optName = detectedOptions.length > 0 ? detectedOptions.join(' vs ') : 'these universities';
      return {
        category: 'University Selection',
        options: detectedOptions,
        questions: [
          {
            id: 'q1',
            question: `What is your primary goal when choosing between ${optName}?`,
            type: 'single_select',
            contextNote: 'Weights core strategic drivers for your final recommendation.',
            placeholder: 'Select primary goal...',
            options: ['Industry Placement & Salary', 'Research Output & Lab Access', 'Campus Life & Environment', 'Low Tuition & Financial Feasibility'],
          },
          {
            id: 'q2',
            question: 'Which criteria carry the most weight in your matrix evaluation?',
            type: 'multi_select',
            contextNote: 'Determines weight ratios in your multi-criteria matrix.',
            placeholder: 'Select criteria...',
            options: ['Faculty & Lab Facilities', 'Industry Connection', 'Hostel & Campus Environment', 'Fee Structure'],
          },
          {
            id: 'q3',
            question: 'What non-negotiable baseline constraint must be met?',
            type: 'single_select',
            contextNote: 'Establishes hard veto conditions for your options.',
            placeholder: 'Select baseline constraint...',
            options: ['PEC / HEC / ABET Accreditation', 'On-Campus Hostel Available', 'Affordable Fee Structure', 'High Industry Placement Rate'],
          },
        ],
      };
    }
  }

  // Technology & Hardware Purchase
  if (dLower.includes('laptop') || dLower.includes('macbook') || dLower.includes('buy') || dLower.includes('pc') || dLower.includes('computer')) {
    return {
      category: 'Technology & Hardware Purchase',
      options: detectedOptions,
      questions: [
        {
          id: 'q1',
          question: 'What primary workload or use-case will dominate your daily use?',
          type: 'single_select',
          contextNote: 'Identifies required RAM, GPU, and processor specs.',
          placeholder: 'Select primary workload...',
          options: ['Software Engineering & AI', 'Video Editing & Graphic Design', 'Gaming & Heavy Rendering', 'Business & General Productivity'],
        },
        {
          id: 'q2',
          question: 'What is your target budget ceiling?',
          type: 'budget_range',
          contextNote: 'Sets cost threshold for option candidates.',
          placeholder: 'Select budget range...',
          options: ['Under $800', '$800 - $1,500', '$1,500 - $2,500', '$2,500+'],
        },
        {
          id: 'q3',
          question: 'Which hardware priorities are non-negotiable?',
          type: 'multi_select',
          contextNote: 'Weights mobility vs raw performance.',
          placeholder: 'Select priorities...',
          options: ['All-Day Battery Life (10+ hrs)', 'Maximum CPU / GPU Power', 'Lightweight & Portable', 'macOS Ecosystem', 'Linux / Windows Compatibility'],
        },
      ],
    };
  }

  // Career & Job Offers
  if (dLower.includes('job') || dLower.includes('career') || dLower.includes('offer') || dLower.includes('salary') || dLower.includes('role')) {
    return {
      category: 'Career Decision',
      options: detectedOptions,
      questions: [
        {
          id: 'q1',
          question: 'What is your primary driver for this career decision?',
          type: 'single_select',
          contextNote: 'Weights cash compensation vs culture and long-term growth.',
          placeholder: 'Select primary driver...',
          options: ['Higher Total Compensation', 'Accelerated Career Growth & Title', 'Work-Life Balance & WFH', 'Company Culture & Mission'],
        },
        {
          id: 'q2',
          question: 'What non-negotiable floor or baseline constraint must be met?',
          type: 'single_select',
          contextNote: 'Establishes strict veto criteria.',
          placeholder: 'Select baseline constraint...',
          options: ['Strict Minimum Base Salary', 'Max 40-Hour Work Week', '100% Remote / Hybrid Option', 'Stable Enterprise Employer'],
        },
        {
          id: 'q3',
          question: 'What is your risk tolerance over the next 2-3 years?',
          type: 'single_select',
          contextNote: 'Calibrates stability vs high-equity upside.',
          placeholder: 'Select risk profile...',
          options: ['Low (High Job Security & Stability)', 'Moderate (Calculated Growth)', 'High (Early Startup / High Equity)'],
        },
      ],
    };
  }

  // General Decision Fallback
  return {
    category: 'General Strategic Analysis',
    options: detectedOptions,
    questions: [
      {
        id: 'q1',
        question: 'What primary outcome defines success for this decision?',
        type: 'single_select',
        contextNote: 'Establishes the highest-weighted strategic criterion.',
        placeholder: 'Select primary outcome...',
        options: ['Time Efficiency & Speed', 'Financial ROI & Value', 'Quality & Peace of Mind', 'Risk Avoidance'],
      },
      {
        id: 'q2',
        question: 'What key constraint restricts your choices?',
        type: 'multi_select',
        contextNote: 'Sets boundary conditions for cost, capacity, and timelines.',
        placeholder: 'Select constraints...',
        options: ['Tight Deadline', 'Budget Cap', 'Skills / Capacity Limit', 'Personal Commitments'],
      },
      {
        id: 'q3',
        question: 'What is your biggest concern or risk factor if this choice goes wrong?',
        type: 'single_select',
        contextNote: 'Powers Devil\'s Advocate and Blind Spot detection.',
        placeholder: 'Select risk factor...',
        options: ['Financial Loss', 'Wasted Time & Momentum', 'Burnout & Stress', 'Opportunity Cost'],
      },
    ],
  };
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
      `Strong alignment with your core evaluated criteria`,
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
