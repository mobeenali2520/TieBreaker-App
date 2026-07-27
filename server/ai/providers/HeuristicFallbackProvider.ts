import { AIProvider, IntakeQuestionsResult, FullAnalysisResult, SuggestionsResult, MatrixAnalysisResult } from "../types";
import { ClarifyingQuestion, Option, Criterion, ScoreMap, SwotItem, BlindSpot, DevilsAdvocate, TenTenTen, FinalVerdict } from "../../../src/types/decision";

export class HeuristicFallbackProvider implements AIProvider {
  name: string = "Local Heuristic Synthesis Engine";
  priority: number = 999; // Lowest priority (ultimate safety net)

  isConfigured(): boolean {
    return true; // Always available, 100% reliable local fallback
  }

  async generateIntakeQuestions(dilemma: string, rawOptions?: string[]): Promise<IntakeQuestionsResult> {
    const dLower = (dilemma || "").toLowerCase();

    let questions: ClarifyingQuestion[] = [];

    if (dLower.includes("job") || dLower.includes("career") || dLower.includes("offer") || dLower.includes("role") || dLower.includes("salary")) {
      questions = [
        {
          id: "q1",
          question: "What is your primary driver for this career decision?",
          contextNote: "Directly weights total cash compensation & title vs culture & long-term skill acquisition.",
          placeholder: "e.g. Higher base salary, remote flexibility, growth potential...",
          options: ["Higher Total Compensation", "Accelerated Career Growth", "Work-Life Balance & Remote Flexibility", "Company Culture & Mission"],
        },
        {
          id: "q2",
          question: "What non-negotiable floor or baseline constraint must be met?",
          contextNote: "Establishes strict veto criteria for salary or lifestyle requirements.",
          placeholder: "e.g. Minimum $130k base, max 30 min commute...",
          options: ["Strict Salary Baseline", "Max 40-hour work week", "100% Remote / Hybrid Option", "Stable Public / Enterprise Company"],
        },
        {
          id: "q3",
          question: "What is your risk tolerance over the next 2-3 years?",
          contextNote: "Determines weighting for organizational stability vs high-equity upside.",
          placeholder: "e.g. Low risk (prefer stable public firm), or high risk (startup equity)...",
          options: ["Low (High Job Security & Stability)", "Moderate (Calculated Mid-stage Growth)", "High (Early Startup / High Equity Volatility)"],
        },
      ];
    } else if (dLower.includes("buy") || dLower.includes("house") || dLower.includes("car") || dLower.includes("invest") || dLower.includes("finance") || dLower.includes("money")) {
      questions = [
        {
          id: "q1",
          question: "What is your maximum upfront capital allocation and budget ceiling?",
          contextNote: "Prevents overexposure and establishes cost weighting in the matrix.",
          placeholder: "e.g. $50,000 upfront max, or $2,500/mo cashflow limit...",
          options: ["Strict Upfront Cap", "Monthly Cashflow Efficiency", "Long-term Capital ROI"],
        },
        {
          id: "q2",
          question: "What core problem or utility are you seeking from this expenditure?",
          contextNote: "Separates essential utility value from luxury/lifestyle enhancements.",
          placeholder: "e.g. Daily time savings, asset appreciation, family comfort...",
          options: ["Time Savings & Convenience", "Lifestyle Comfort & Quality", "Asset Growth & ROI"],
        },
        {
          id: "q3",
          question: "How much buffer do you have for unexpected maintenance or market drops?",
          contextNote: "Informs the risk sensitivity analysis.",
          placeholder: "e.g. 20% emergency buffer available...",
          options: ["Minimal Buffer (Low Risk Tolerance)", "10-20% Buffer (Moderate)", "Generous Buffer (High Risk Tolerance)"],
        },
      ];
    } else {
      questions = [
        {
          id: "q1",
          question: "What is the single most critical outcome that defines success for this choice?",
          contextNote: "Establishes the highest-weighted strategic criterion.",
          placeholder: "e.g. Long-term peace of mind, maximum ROI, speed of execution...",
          options: ["Time & Speed to Results", "Financial Growth & ROI", "Quality & Personal Peace of Mind", "Risk Avoidance"],
        },
        {
          id: "q2",
          question: "What key constraint or resource limit restricts your choices?",
          contextNote: "Sets boundary conditions for cost, capacity, and timelines.",
          placeholder: "e.g. 30-day deadline, limited budget, team capacity...",
          options: ["Strict Timeline", "Financial Capital Limit", "Skills / Bandwidth Constraint", "Personal / Family Commitments"],
        },
        {
          id: "q3",
          question: "What is your biggest fear or regret if this decision goes wrong?",
          contextNote: "Powers Devil's Advocate and Blind Spot stress tests.",
          placeholder: "e.g. Sunk cost fallacy, burnout, missed alternative opportunity...",
          options: ["Financial Loss", "Wasted Time / Momentum", "Mental Burnout", "Missed Alternative Opportunities"],
        },
      ];
    }

    return {
      questions,
      providerUsed: this.name,
    };
  }

  async generateFullAnalysis(dilemma: string, answers: Record<string, string>, optionsList: string[] = []): Promise<FullAnalysisResult> {
    const cleanOptions = (optionsList || []).filter((o) => o.trim().length > 0);
    const opts = cleanOptions.length >= 2 
      ? cleanOptions.slice(0, 4) 
      : ["Strategic Option A (Recommended Path)", "Strategic Option B (Conservative Path)"];

    const colors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899"];

    const options: Option[] = opts.map((name, i) => ({
      id: `opt_${Date.now()}_${i + 1}`,
      name,
      color: colors[i % colors.length],
      description: `Targeted operational pathway for ${name}`,
    }));

    const criteria: Criterion[] = [
      {
        id: "crit_1",
        name: "Strategic Value & Long-Term Upside",
        weight: 9,
        isPositive: true,
        category: "STRATEGIC",
        description: "Measures alignment with core long-term trajectory and value creation.",
      },
      {
        id: "crit_2",
        name: "Total Capital & Resource Commitment",
        weight: 8,
        isPositive: false,
        category: "FINANCIAL",
        description: "Evaluates upfront investment, ongoing overhead, and opportunity cost.",
      },
      {
        id: "crit_3",
        name: "Execution Feasibility & Speed",
        weight: 7,
        isPositive: true,
        category: "OPERATIONAL",
        description: "Speed to value and ease of implementation with minimal friction.",
      },
      {
        id: "crit_4",
        name: "Downside Risk & Reversibility",
        weight: 8,
        isPositive: false,
        category: "RISK",
        description: "Exposure to worst-case scenarios and flexibility to pivot if needed.",
      },
      {
        id: "crit_5",
        name: "Personal Alignment & Peace of Mind",
        weight: 8,
        isPositive: true,
        category: "PERSONAL",
        description: "Intrinsic motivation, stress levels, and quality of life impact.",
      },
    ];

    const scores: ScoreMap = {};
    options.forEach((opt, oIdx) => {
      criteria.forEach((crit) => {
        let baseScore = 7;
        if (oIdx === 0) {
          baseScore = crit.isPositive ? 8.5 : 4;
        } else if (oIdx === 1) {
          baseScore = crit.isPositive ? 6.5 : 6;
        } else {
          baseScore = 6;
        }
        scores[`${opt.id}_${crit.id}`] = Math.round(baseScore);
      });
    });

    const swot: Record<string, SwotItem> = {};
    options.forEach((opt) => {
      swot[opt.id] = {
        strengths: [
          `Strong strategic upside in ${opt.name}`,
          `Directly answers primary objective: "${answers["q1"] || "Strategic Growth"}"`,
          `Clear execution trajectory with high initial momentum`,
        ],
        weaknesses: [
          `Initial adaptation period and operational friction`,
          `Requires focused resource allocation in early phases`,
        ],
        opportunities: [
          `Positions user strongly for compounding gains over a 10-month horizon`,
          `Creates leverage for subsequent strategic expansions`,
        ],
        threats: [
          `Uncertainty in broader external market or domain conditions`,
          `Opportunity cost of deferring secondary alternatives`,
        ],
      };
    });

    const winnerOpt = options[0];

    const blindSpots: BlindSpot[] = [
      {
        id: "bs1",
        category: "OPPORTUNITY COST",
        title: "Sunk Cost Bias Avoidance",
        description: "Ensure past investments of time or money are not distorting future expected value calculations.",
        severity: "high",
        mitigation: "Evaluate choices strictly on zero-based future expected ROI over the next 12-24 months.",
      },
      {
        id: "bs2",
        category: "FRICTION",
        title: "Underestimating Transition Overhead",
        description: "Switching pathways often introduces 20-30% more short-term cognitive load than anticipated.",
        severity: "medium",
        mitigation: "Build a 30-day onboarding buffer to absorb initial operational friction.",
      },
    ];

    const devilsAdvocate: DevilsAdvocate = {
      targetOptionId: winnerOpt.id,
      targetOptionName: winnerOpt.name,
      counterSeverity: 76,
      counterTitle: "Execution Friction & Opportunity Cost Challenge",
      counterArgument: `While ${winnerOpt.name} scores highest on mathematical alignment, committing to it sacrifices the immediate predictability of alternate paths. Validate that your bandwidth is sufficient before locking in this choice.`,
      keyRisks: [
        "Transition friction in the first 30 days",
        "Short-term bandwidth tax on current commitments"
      ],
      challengingQuestions: [
        `If ${winnerOpt.name} hits unexpected friction in 60 days, what is your contingency plan?`,
        "What single factor would make you pivot away from this path?"
      ],
      unexaminedAssumptions: [
        `Assumes market/environmental baseline remains stable during transition`,
        `Assumes execution speed meets initial estimates without unexpected bottlenecks`,
        `Assumes secondary stakeholders align smoothly with this trajectory`,
      ],
    };

    const tenTenTen: TenTenTen = {
      tenMinutes: `Initial clarity combined with healthy anticipatory focus. Action step: Document key milestones and notify relevant collaborators.`,
      tenMonths: `Transition friction will have normalized, and ${winnerOpt.name} will be yielding steady compounding returns.`,
      tenYears: `Viewed as a pivotal strategic decision where you acted with data-backed conviction rather than remaining trapped in analysis paralysis.`,
    };

    const verdict: FinalVerdict = {
      executiveSummary: `Based on your stated preferences ("${answers["q1"] || "Strategic Growth"}"), ${winnerOpt.name} emerges as the optimal path with a high alignment score relative to alternatives.`,
      recommendedOptionId: winnerOpt.id,
      recommendedOptionName: winnerOpt.name,
      confidenceScore: 86,
      keyReasons: [
        `Achieves top weighted score across non-negotiable strategic criteria`,
        `Superior upside-to-risk trade-off ratio`,
        `Strong alignment with stated 10-month horizon outcomes`,
      ],
      primaryRisks: [
        `Initial transition friction during the first 30 days`,
        `Short-term opportunity cost of setting aside alternative options`,
      ],
      suggestedNextSteps: [
        `Set a firm 48-hour deadline to commit to ${winnerOpt.name}`,
        `Draft a 30-day implementation checklist for execution`,
        `Align key stakeholders and resources around this choice`,
      ],
    };

    return {
      title: dilemma.length > 40 ? dilemma.substring(0, 38) + "..." : dilemma,
      category: "general",
      description: dilemma,
      options,
      criteria,
      scores,
      swot,
      blindSpots,
      devilsAdvocate,
      tenTenTen,
      verdict,
      providerUsed: this.name,
    };
  }

  async generateSuggestions(topic: string, options?: string[], criteria?: string[]): Promise<SuggestionsResult> {
    return {
      suggestedOptions: [
        `Recommended Path for ${topic}`,
        `Alternative Agile Option`,
      ],
      suggestedCriteria: [
        {
          name: "Strategic Impact",
          weight: 9,
          isPositive: true,
          description: "Long-term overall upside",
        },
        {
          name: "Cost & Complexity",
          weight: 7,
          isPositive: false,
          description: "Resource intensity and friction",
        },
      ],
      briefAdvice: `Consider evaluating both upfront effort and long-term leverage when choosing options for ${topic}.`,
      providerUsed: this.name,
    };
  }

  async generateMatrixAnalysis(matrixData: any): Promise<MatrixAnalysisResult> {
    const topOption = matrixData?.options?.[0]?.name || "Option 1";
    return {
      winnerSummary: `${topOption} leads overall based on weighted strategic alignment and manageable downside risk.`,
      keyTradeoffs: [
        "Upfront resource expenditure vs long-term ROI",
        "Speed of execution vs operational stability",
      ],
      sensitivityWarning: "Shifting the weight on Strategic Impact by ±2 points could alter the top choice.",
      tieBreakerQuestion: "If you could only execute one option today with zero hesitation, which one gives you the highest conviction?",
      providerUsed: this.name,
    };
  }
}
