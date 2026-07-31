import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend, 
  Cell
} from 'recharts';
import { Trophy, Award, TrendingUp, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { DecisionProject, OptionResult } from '../../types/decision';
import { calculateOptionResults } from '../../utils/decisionEngine';

interface AnalyticsViewProps {
  project: DecisionProject;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ project }) => {
  const results: OptionResult[] = useMemo(() => calculateOptionResults(project), [project]);

  // 1. Overall Comparison Data
  const scoreComparisonData = useMemo(() => {
    return results.map((r) => ({
      name: r.option.name,
      score: r.normalizedPercentage,
      color: r.option.color,
      rank: r.rank,
    }));
  }, [results]);

  // 2. Radar Chart Data (Options mapped against Criteria)
  const radarData = useMemo(() => {
    return project.criteria.map((crit) => {
      const row: Record<string, any> = { criterion: crit.name };
      project.options.forEach((opt) => {
        const key = `${opt.id}_${crit.id}`;
        const score = project.scores[key] ?? 5;
        row[opt.name] = score;
      });
      return row;
    });
  }, [project.criteria, project.options, project.scores]);

  // 3. Stacked Contribution Bar Chart Data
  const stackedData = useMemo(() => {
    return results.map((r) => {
      const row: Record<string, any> = { name: r.option.name };
      r.criterionContributions.forEach((contrib) => {
        row[contrib.criterionName] = Math.round(contrib.weightedContribution * 10) / 10;
      });
      return row;
    });
  }, [results]);

  if (results.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        No options to analyze. Add options in the Decision Matrix grid.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {results.slice(0, 3).map((r) => (
          <div
            key={r.option.id}
            className={`rounded-2xl p-5 border shadow-xl relative overflow-hidden transition-all ${
              r.rank === 1
                ? 'bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border-indigo-500/50 text-white'
                : 'bg-slate-900/80 border-slate-800 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: r.option.color }}
                />
                <span className="font-bold text-sm truncate max-w-[160px]" title={r.option.name}>
                  {r.option.name}
                </span>
              </div>

              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                r.rank === 1
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : r.rank === 2
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                Rank #{r.rank} {r.rank === 1 && '🏆'}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">
                {r.normalizedPercentage}%
              </span>
              <span className="text-xs text-slate-400">weighted match score</span>
            </div>

            {/* Strengths / Weaknesses summary */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  Top Pro: {r.topStrengths[0]?.criterionName || 'None'} ({r.topStrengths[0]?.score}/10)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  Trade-off: {r.topWeaknesses[0]?.criterionName || 'None'} ({r.topWeaknesses[0]?.score}/10)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Total Weighted Score Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <Trophy className="h-5 w-5 text-indigo-400" />
              Overall Weighted Match %
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Normalized score percentage across all weighted criteria.
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreComparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} unit="%" />
                <YAxis dataKey="name" type="category" stroke="#e2e8f0" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: any) => [`${value}% Match`, 'Score']}
                />
                <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={24}>
                  {scoreComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Radar Multi-Criteria Spider Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Multi-Attribute Balance Radar
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct comparison of raw option ratings across all criteria dimensions.
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="criterion" stroke="#cbd5e1" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                {project.options.map((opt) => (
                  <Radar
                    key={opt.id}
                    name={opt.name}
                    dataKey={opt.name}
                    stroke={opt.color}
                    fill={opt.color}
                    fillOpacity={0.25}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SWOT / Pros & Cons Detailed Cards */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-200 text-base">
          Detailed Option Strengths & Trade-offs
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((r) => (
            <div key={r.option.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: r.option.color }} />
                  <span className="font-bold text-white text-base">{r.option.name}</span>
                </div>
                <span className="text-xs text-slate-400 font-bold bg-slate-800 px-2.5 py-1 rounded-lg">
                  {r.normalizedPercentage}%
                </span>
              </div>

              {/* Contributions list */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Criteria Score Contributions
                </div>

                {r.criterionContributions.map((c) => (
                  <div key={c.criterionId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{c.criterionName}</span>
                      <span className="text-slate-400 font-bold">
                        {c.score}/10 <span className="text-[10px] text-slate-500">(wt {c.weight})</span>
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(c.score / 10) * 100}%`,
                          backgroundColor: r.option.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
