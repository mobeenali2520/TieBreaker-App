import { Criterion, DecisionProject, OptionResult, SensitivityAnalysisResult } from '../types/decision';

export function calculateOptionResults(project: DecisionProject): OptionResult[] {
  if (!project) return [];
  const options = project.options || [];
  const criteria = project.criteria || [];
  const scores = project.scores || {};

  if (options.length === 0) return [];
  if (criteria.length === 0) {
    return options.map((option, idx) => ({
      option,
      rawScore: 0,
      maxPossibleRawScore: 0,
      normalizedPercentage: 0,
      rank: idx + 1,
      isWinner: idx === 0,
      isTie: false,
      criterionContributions: [],
      topStrengths: [],
      topWeaknesses: [],
    }));
  }

  // Calculate maximum total weighted score possible
  const totalWeight = criteria.reduce((sum, c) => sum + Math.max(1, c.weight), 0);
  const maxPossibleRawScore = criteria.reduce((sum, c) => sum + Math.max(1, c.weight) * 10, 0);

  const results: OptionResult[] = options.map((option) => {
    let rawScore = 0;

    const criterionContributions = criteria.map((criterion) => {
      const key = `${option.id}_${criterion.id}`;
      const userRating = scores[key] ?? 5; // default rating 5

      // If positive criterion: score is as rated (1 to 10)
      // If negative criterion (cost/risk): inverted score so lower cost/risk gives higher satisfaction
      const effectiveScore = criterion.isPositive ? userRating : 11 - userRating;
      const weight = Math.max(1, criterion.weight);
      const weightedContribution = weight * effectiveScore;
      const maxContribution = weight * 10;
      const percentageOfTotal = maxPossibleRawScore > 0 ? (weightedContribution / maxPossibleRawScore) * 100 : 0;

      rawScore += weightedContribution;

      return {
        criterionId: criterion.id,
        criterionName: criterion.name,
        weight,
        score: userRating,
        weightedContribution,
        maxContribution,
        percentageOfTotal,
      };
    });

    const normalizedPercentage = maxPossibleRawScore > 0 ? Math.round((rawScore / maxPossibleRawScore) * 1000) / 10 : 0;

    // Identify top strengths & weaknesses
    const sortedByScore = [...criterionContributions].sort((a, b) => b.score - a.score);
    const topStrengths = sortedByScore.slice(0, 2).map((c) => ({ criterionName: c.criterionName, score: c.score }));
    const topWeaknesses = sortedByScore.slice(-2).reverse().map((c) => ({ criterionName: c.criterionName, score: c.score }));

    return {
      option,
      rawScore,
      maxPossibleRawScore,
      normalizedPercentage,
      rank: 1, // calculated below
      isWinner: false,
      isTie: false,
      criterionContributions,
      topStrengths,
      topWeaknesses,
    };
  });

  // Sort by rawScore descending
  results.sort((a, b) => b.rawScore - a.rawScore);

  // Assign ranks & tie detection
  const topScore = results[0]?.normalizedPercentage ?? 0;
  const secondScore = results[1]?.normalizedPercentage ?? 0;
  
  // Tie condition: gap between 1st and 2nd <= 2.5 percentage points
  const isTopTie = results.length > 1 && Math.abs(topScore - secondScore) <= 2.5;

  results.forEach((res, index) => {
    res.rank = index + 1;
    res.isWinner = index === 0;
    if (isTopTie && (index === 0 || Math.abs(topScore - res.normalizedPercentage) <= 2.5)) {
      res.isTie = true;
    }
  });

  return results;
}

/**
 * Calculates sensitivity of all options when changing a single criterion's weight from 1 to 10
 */
export function calculateSensitivityAnalysis(
  project: DecisionProject,
  targetCriterionId: string
): SensitivityAnalysisResult {
  const criteria = project?.criteria || [];
  const targetCriterion = criteria.find((c) => c.id === targetCriterionId);
  const criterionName = targetCriterion ? targetCriterion.name : 'Criterion';

  const points = [];
  const rankChanges: SensitivityAnalysisResult['rankChanges'] = [];
  let previousLeaderId = '';

  for (let weight = 1; weight <= 10; weight++) {
    // Clone project with modified target criterion weight
    const modifiedCriteria = criteria.map((c) => (c.id === targetCriterionId ? { ...c, weight } : c));
    const modifiedProject: DecisionProject = { ...project, criteria: modifiedCriteria };

    const results = calculateOptionResults(modifiedProject);
    const optionScores: Record<string, number> = {};

    results.forEach((r) => {
      optionScores[r.option.id] = r.normalizedPercentage;
    });

    const currentLeader = results[0];
    if (weight > 1 && currentLeader && currentLeader.option.id !== previousLeaderId) {
      rankChanges.push({
        weightThreshold: weight,
        newLeaderId: currentLeader.option.id,
        newLeaderName: currentLeader.option.name,
      });
    }
    if (currentLeader) {
      previousLeaderId = currentLeader.option.id;
    }

    points.push({ weight, optionScores });
  }

  return {
    criterionId: targetCriterionId,
    criterionName,
    points,
    rankChanges,
  };
}
