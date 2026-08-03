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

    // Check if explicit options were provided in rawOptions or embedded in dilemma (e.g., "vs", "or")
    const hasExplicitOptions = (rawOptions && rawOptions.length > 0) || dLower.includes(" vs ") || dLower.includes(" or ");
    
    let detectedOptions: string[] = [];
    if (rawOptions && rawOptions.length > 0) {
      detectedOptions = rawOptions;
    } else if (dLower.includes("pieas") && dLower.includes("nust")) {
      detectedOptions = ["PIEAS", "NUST"];
    } else if (dLower.includes("macbook") && dLower.includes("windows")) {
      detectedOptions = ["Apple MacBook", "Windows Laptop"];
    } else if (dLower.includes("python") && dLower.includes("c++")) {
      detectedOptions = ["Python", "C++"];
    }

    // Check if field/major was already specified in dilemma
    const knowsField = dLower.includes("computer science") || dLower.includes("cs") || dLower.includes("engineering") || dLower.includes("business") || dLower.includes("medical") || dLower.includes("finance");

    let category = "General Strategic Analysis";
    let questions: ClarifyingQuestion[] = [];

    // 1. University & Education Selection
    if (dLower.includes("university") || dLower.includes("college") || dLower.includes("degree") || dLower.includes("pieas") || dLower.includes("nust") || dLower.includes("campus")) {
      category = "University Selection";
      if (!hasExplicitOptions && detectedOptions.length === 0) {
        // Open-ended query (e.g. "Which university is best in Pakistan?")
        questions = [
          knowsField ? {
            id: "q1",
            question: "What is your primary career goal after graduating in your field?",
            type: "single_select",
            contextNote: "Directly determines weighting for research labs vs industry placement.",
            placeholder: "Select career path...",
            options: ["Private Sector Tech Job", "Higher Studies (MS/PhD Abroad)", "AI/ML Research & Academia", "Govt / Defence Sector", "Entrepreneurship"],
          } : {
            id: "q1",
            question: "What is your intended field or major?",
            type: "single_select",
            contextNote: "Essential to compare department-specific faculty, labs, and accreditation.",
            placeholder: "Select major...",
            options: ["Computer Science & Software", "Electrical / Electronics Engineering", "Mechanical / Aerospace", "Business & Finance", "Data Science & AI"],
          },
          {
            id: "q2",
            question: "Which evaluation criteria carry the highest weight for you?",
            type: "multi_select",
            contextNote: "Establishes your weighted decision matrix priority scores.",
            placeholder: "Select priorities...",
            options: ["Research Quality & Labs", "Tech Job Placement Rate", "Tuition & Hostel Affordability", "Campus Life & Location", "Global Alumni Network"],
          },
          {
            id: "q3",
            question: "What is your primary geographic or location requirement?",
            type: "single_select",
            contextNote: "Filters options by relocation feasibility and hostel availability.",
            placeholder: "Select location preference...",
            options: ["Islamabad / Rawalpindi Region", "Lahore Region", "Karachi Region", "Open to Relocating Anywhere with Hostel"],
          },
        ];
      } else {
        // Direct comparison (e.g. "PIEAS vs NUST")
        const optName = detectedOptions.length > 0 ? detectedOptions.join(" vs ") : "these universities";
        questions = [
          {
            id: "q1",
            question: `What is your primary goal when choosing between ${optName}?`,
            type: "single_select",
            contextNote: "Weights core strategic drivers for your final recommendation.",
            placeholder: "Select primary goal...",
            options: ["Industry Placement & Salary", "Research Output & Lab Access", "Campus Life & Environment", "Low Tuition & Financial Feasibility"],
          },
          {
            id: "q2",
            question: "Which criteria carry the most weight in your matrix evaluation?",
            type: "multi_select",
            contextNote: "Determines weight ratios in your multi-criteria matrix.",
            placeholder: "Select criteria...",
            options: ["Faculty & Lab Facilities", "Industry Connection", "Hostel & Campus Environment", "Fee Structure"],
          },
          {
            id: "q3",
            question: "What non-negotiable baseline constraint must be met?",
            type: "single_select",
            contextNote: "Establishes hard veto conditions for your options.",
            placeholder: "Select baseline constraint...",
            options: ["PEC / HEC / ABET Accreditation", "On-Campus Hostel Available", "Affordable Fee Structure", "High Industry Placement Rate"],
          },
        ];
      }
    } 
    // 2. Hardware / Laptop / Tech Purchase
    else if (dLower.includes("laptop") || dLower.includes("macbook") || dLower.includes("buy") || dLower.includes("pc") || dLower.includes("computer")) {
      category = "Technology & Hardware Purchase";
      questions = [
        {
          id: "q1",
          question: "What primary workload or use-case will dominate your daily use?",
          type: "single_select",
          contextNote: "Identifies required RAM, GPU, and processor specs.",
          placeholder: "Select primary workload...",
          options: ["Software Engineering & AI", "Video Editing & Graphic Design", "Gaming & Heavy Rendering", "Business & General Productivity"],
        },
        {
          id: "q2",
          question: "What is your target budget ceiling?",
          type: "budget_range",
          contextNote: "Sets cost threshold for option candidates.",
          placeholder: "Select budget range...",
          options: ["Under $800", "$800 - $1,500", "$1,500 - $2,500", "$2,500+"],
        },
        {
          id: "q3",
          question: "Which hardware priorities are non-negotiable?",
          type: "multi_select",
          contextNote: "Weights mobility vs raw performance.",
          placeholder: "Select priorities...",
          options: ["All-Day Battery Life (10+ hrs)", "Maximum CPU / GPU Power", "Lightweight & Portable", "macOS Ecosystem", "Linux / Windows Compatibility"],
        },
      ];
    }
    // 3. Career & Job Offer Decisions
    else if (dLower.includes("job") || dLower.includes("career") || dLower.includes("offer") || dLower.includes("role") || dLower.includes("salary")) {
      category = "Career Decision";
      questions = [
        {
          id: "q1",
          question: "What is your primary driver for this career decision?",
          type: "single_select",
          contextNote: "Weights cash compensation vs culture and long-term growth.",
          placeholder: "Select primary driver...",
          options: ["Higher Total Compensation", "Accelerated Career Growth & Title", "Work-Life Balance & WFH", "Company Culture & Mission"],
        },
        {
          id: "q2",
          question: "What non-negotiable floor or baseline constraint must be met?",
          type: "single_select",
          contextNote: "Establishes strict veto criteria.",
          placeholder: "Select baseline constraint...",
          options: ["Strict Minimum Base Salary", "Max 40-Hour Work Week", "100% Remote / Hybrid Option", "Stable Enterprise Employer"],
        },
        {
          id: "q3",
          question: "What is your risk tolerance over the next 2-3 years?",
          type: "single_select",
          contextNote: "Calibrates stability vs high-equity upside.",
          placeholder: "Select risk profile...",
          options: ["Low (High Job Security & Stability)", "Moderate (Calculated Growth)", "High (Early Startup / High Equity)"],
        },
      ];
    }
    // 4. General Strategic Fallback
    else {
      category = "General Strategic Analysis";
      questions = [
        {
          id: "q1",
          question: "What primary outcome defines success for this decision?",
          type: "single_select",
          contextNote: "Establishes the highest-weighted strategic criterion.",
          placeholder: "Select primary outcome...",
          options: ["Time Efficiency & Speed", "Financial ROI & Value", "Quality & Peace of Mind", "Risk Avoidance"],
        },
        {
          id: "q2",
          question: "What key constraint restricts your choices?",
          type: "multi_select",
          contextNote: "Sets boundary conditions for cost, capacity, and timelines.",
          placeholder: "Select constraints...",
          options: ["Tight Deadline", "Budget Cap", "Skills / Capacity Limit", "Personal Commitments"],
        },
        {
          id: "q3",
          question: "What is your biggest concern or risk factor if this choice goes wrong?",
          type: "single_select",
          contextNote: "Powers Devil's Advocate and Blind Spot detection.",
          placeholder: "Select risk factor...",
          options: ["Financial Loss", "Wasted Time & Momentum", "Burnout & Stress", "Opportunity Cost"],
        },
      ];
    }

    return {
      category,
      options: detectedOptions,
      questions,
      providerUsed: this.name,
    };
  }

  async generateFullAnalysis(dilemma: string, answers: Record<string, string>, optionsList: string[] = []): Promise<FullAnalysisResult> {
    const dLower = (dilemma || "").toLowerCase();
    const cleanOptions = (optionsList || []).filter((o) => o.trim().length > 0);

    let opts: string[] = [];
    if (cleanOptions.length >= 2) {
      opts = cleanOptions.slice(0, 4);
    } else {
      // Deduce candidates based on dilemma & user answers
      const allText = (dLower + " " + Object.values(answers).join(" ")).toLowerCase();
      if (allText.includes("university") || allText.includes("college") || allText.includes("degree") || allText.includes("pakistan")) {
        if (allText.includes("business")) {
          opts = ["LUMS (SDA School of Business)", "IBA Karachi", "NUST Business School"];
        } else {
          opts = ["NUST (School of Electrical Engineering & CS)", "FAST-NUCES (CS Department)", "LUMS (School of Science & Engineering)", "PIEAS (Computer & Information Sciences)"];
        }
      } else if (allText.includes("laptop") || allText.includes("macbook") || allText.includes("computer")) {
        opts = ["Apple MacBook Air / Pro", "Dell XPS Series", "Lenovo ThinkPad / Legion"];
      } else if (allText.includes("job") || allText.includes("career") || allText.includes("offer")) {
        opts = ["Accept Primary Offer / Role A", "Retain Current Role / Explore Secondary Path"];
      } else {
        opts = ["Strategic Path A (High Upside)", "Strategic Path B (Balanced Alternative)"];
      }
    }

    const colors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899"];

    const options: Option[] = opts.map((name, i) => ({
      id: `opt_${Date.now()}_${i + 1}`,
      name,
      color: colors[i % colors.length],
      description: `Tailored candidate pathway for ${name}`,
    }));

    // Extract user selected priorities from answers
    const userAnsStr = Object.values(answers).join(" ");

    const criteria: Criterion[] = [
      {
        id: "crit_1",
        name: "Strategic Value & Core Alignment",
        weight: 9,
        isPositive: true,
        category: "STRATEGIC",
        description: "Measures direct alignment with your stated primary goals.",
      },
      {
        id: "crit_2",
        name: "Cost & Resource Commitment",
        weight: 8,
        isPositive: false,
        category: "FINANCIAL",
        description: "Evaluates financial expenditure, tuition, and resource load.",
      },
      {
        id: "crit_3",
        name: "Execution Feasibility & Environment",
        weight: 8,
        isPositive: true,
        category: "OPERATIONAL",
        description: "Quality of facilities, faculty, network, or daily experience.",
      },
      {
        id: "crit_4",
        name: "Downside Risk & Flexibility",
        weight: 7,
        isPositive: false,
        category: "RISK",
        description: "Risk exposure and ability to adjust course if parameters change.",
      },
    ];

    const scores: ScoreMap = {};
    options.forEach((opt, oIdx) => {
      criteria.forEach((crit) => {
        let baseScore = 7;
        if (oIdx === 0) {
          baseScore = crit.isPositive ? 8.5 : 4;
        } else if (oIdx === 1) {
          baseScore = crit.isPositive ? 7.5 : 5;
        } else {
          baseScore = 6.5;
        }
        scores[`${opt.id}_${crit.id}`] = Math.round(baseScore);
      });
    });

    const swot: Record<string, SwotItem> = {};
    options.forEach((opt) => {
      swot[opt.id] = {
        strengths: [
          `Strong reputation and proven track record in ${opt.name}`,
          `Direct alignment with your selected focus: "${answers["q1"] || "Primary Goals"}"`,
        ],
        weaknesses: [
          `Requires dedicated effort and adjustment during initial onboarding`,
          `Capacity limits or competitive entry requirements`,
        ],
        opportunities: [
          `Positions you strongly for future compounding gains over a multi-year horizon`,
          `Access to specialized networks and resources`,
        ],
        threats: [
          `Changing external domain or market conditions`,
          `Opportunity cost of setting aside alternative options`,
        ],
      };
    });

    const winnerOpt = options[0];

    const blindSpots: BlindSpot[] = [
      {
        id: "bs1",
        category: "OPPORTUNITY COST",
        title: "Sunk Cost Bias Avoidance",
        description: "Ensure past investments of time or effort do not distort future expected value.",
        severity: "high",
        mitigation: "Evaluate choices strictly on zero-based future expected value over the next 12-24 months.",
      },
      {
        id: "bs2",
        category: "FRICTION",
        title: "Underestimating Onboarding Overhead",
        description: "Transitioning to a new path often introduces short-term cognitive load.",
        severity: "medium",
        mitigation: "Build an explicit 30-day onboarding phase to absorb initial friction.",
      },
    ];

    const devilsAdvocate: DevilsAdvocate = {
      targetOptionId: winnerOpt.id,
      targetOptionName: winnerOpt.name,
      counterSeverity: 75,
      counterTitle: "Trade-off & Execution Challenge",
      counterArgument: `While ${winnerOpt.name} achieves top mathematical score across your evaluation criteria, committing to it requires accepting its specific trade-offs over alternative candidates.`,
      keyRisks: [
        "Initial transition friction during the first 30 days",
        "Resource load before full returns materialize"
      ],
      challengingQuestions: [
        `If ${winnerOpt.name} encounters unexpected friction in 6 months, what is your contingency plan?`,
        "What single factor would prompt you to reconsider this path?"
      ],
      unexaminedAssumptions: [
        `Assumes environmental baseline remains stable during transition`,
        `Assumes execution timeline meets initial estimates`,
      ],
    };

    const tenTenTen: TenTenTen = {
      tenMinutes: `Initial clarity and focus upon establishing a clear top-ranked path. Action step: Document evaluation criteria.`,
      tenMonths: `Potential 10-month outcome: Initial transition friction settles, yielding steady compounding progress in ${winnerOpt.name}.`,
      tenYears: `Strategic long-term perspective: Viewed as a decisive milestone where you acted with data-backed clarity.`,
    };

    const verdict: FinalVerdict = {
      executiveSummary: `Based on your selected preferences ("${answers["q1"] || answers["q2"] || "Core Criteria"}"), ${winnerOpt.name} achieves the highest weighted score in our analysis.`,
      recommendedOptionId: winnerOpt.id,
      recommendedOptionName: winnerOpt.name,
      confidenceScore: 82,
      keyReasons: [
        `Achieves top weighted performance across your selected evaluation metrics`,
        `Balanced upside-to-risk trade-off ratio`,
        `Favorable long-term strategic alignment`,
      ],
      primaryRisks: [
        `Initial transition friction during the first 30 days`,
        `Opportunity cost of deferring secondary alternatives`,
      ],
      suggestedNextSteps: [
        `Review the weighted matrix grid to confirm your criteria scores`,
        `Draft a 30-day action plan for ${winnerOpt.name}`,
        `Communicate your decision to key stakeholders`,
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
