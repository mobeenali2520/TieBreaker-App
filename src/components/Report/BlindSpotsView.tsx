import React from 'react';
import { DecisionProject } from '../../types/decision';
import { ShieldAlert, Flame, EyeOff, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface BlindSpotsViewProps {
  project: DecisionProject;
}

export const BlindSpotsView: React.FC<BlindSpotsViewProps> = ({ project }) => {
  const blindSpots = project.blindSpots || [
    {
      id: 'bs1',
      category: 'OPPORTUNITY COST',
      title: 'Illiquidity Discount on Startup Equity',
      description: 'Option grants often sound substantial on paper, but liquidation preferences or dilution in Series C/D can diminish actual payout by 50% or prolong exit horizon to 7+ years.',
      severity: 'high' as const,
      mitigation: 'Request cap table summary, anti-dilution clauses, and vesting acceleration terms upon acquisition.',
    },
    {
      id: 'bs2',
      category: 'CONFIRMATION BIAS',
      title: 'Enterprise Status Quo Comfort Bias',
      description: 'Staying at the enterprise feels safe, but remaining in a slow-growth environment during an AI transformation cycle carries invisible skill atrophy risk.',
      severity: 'medium' as const,
      mitigation: 'Commit to leading an internal AI task force if staying at enterprise.',
    },
    {
      id: 'bs3',
      category: 'EXECUTION FRICTION',
      title: 'Unbudgeted Transition & Onboarding Overhead',
      description: 'Overestimating immediate productivity speed without buffering 2-3 months for relationship building, tooling onboarding, and workflow adaptation.',
      severity: 'medium' as const,
      mitigation: 'Negotiate a 90-day onboarding milestone agreement with explicit priority guardrails.',
    },
  ];

  const targetOptionName = project.options[0]?.name || 'Join AI Startup (VP Product)';

  const devilsAdvocate = {
    targetOptionId: project.devilsAdvocate?.targetOptionId || project.options[0]?.id || '',
    targetOptionName: project.devilsAdvocate?.targetOptionName || targetOptionName,
    counterSeverity: project.devilsAdvocate?.counterSeverity ?? 78,
    counterTitle: project.devilsAdvocate?.counterTitle || 'Startup Execution Burnout & Dilution Risk',
    counterArgument: project.devilsAdvocate?.counterArgument || `Joining right now trades guaranteed enterprise cash & stability for high equity volatility in a crowded market. If the startup pivots or misses ARR targets, you risk high stress without financial payout.`,
    unexaminedAssumptions: project.devilsAdvocate?.unexaminedAssumptions || [
      'Assumes startup product-market fit is durable',
      'Assumes CEO leadership style is psychologically supportive',
      'Assumes funding runway extends beyond 18 months',
    ],
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'high':
        return (
          <span className="bg-rose-950/80 text-rose-300 border border-rose-600/50 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            High Severity
          </span>
        );
      case 'medium':
        return (
          <span className="bg-amber-950/80 text-amber-300 border border-amber-600/50 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Medium Severity
          </span>
        );
      default:
        return (
          <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-600/50 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Low Severity
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      
      {/* 1. DEVIL'S ADVOCATE STRESS TEST (EXACT MATCH TO IMAGE 5) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="text-[11px] font-extrabold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>DEVIL'S ADVOCATE STRESS TEST</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-white">
              Challenge to: "{devilsAdvocate.targetOptionName}"
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-rose-950/60 border border-rose-800/60 px-3.5 py-1.5 rounded-2xl">
            <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">
              COUNTER SEVERITY
            </span>
            <span className="text-base font-black text-rose-400">
              {devilsAdvocate.counterSeverity || 78} / 100
            </span>
          </div>
        </div>

        {/* Primary Counter-Argument Box (Red Highlight Container) */}
        <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-5 space-y-2">
          <div className="font-bold text-rose-300 text-sm">
            {devilsAdvocate.counterTitle || 'Startup Execution Burnout & Dilution Risk'}
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
            {devilsAdvocate.counterArgument}
          </p>
        </div>

        {/* Unexamined Assumptions Under Stress */}
        <div className="space-y-3 pt-2">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            UNEXAMINED ASSUMPTIONS UNDER STRESS:
          </div>

          <div className="space-y-2">
            {(devilsAdvocate.unexaminedAssumptions || []).map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3 text-xs text-slate-300 shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center shrink-0">
                  <Info className="w-3 h-3" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 2. BLIND SPOTS CARDS GRID (EXACT MATCH TO IMAGE 4) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <EyeOff className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Detected Blind Spots & Risk Mitigations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {blindSpots.map((bs) => (
            <div
              key={bs.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header Pills */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-indigo-300 bg-indigo-950/80 border border-indigo-700/50 px-2.5 py-0.5 rounded-full uppercase">
                    {bs.category || 'OPPORTUNITY COST'}
                  </span>
                  {getSeverityBadge(bs.severity)}
                </div>

                {/* Title */}
                <h3 className="font-serif font-bold text-base text-white leading-snug">
                  {bs.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {bs.description}
                </p>
              </div>

              {/* Actionable Mitigation Strategy Box (Bottom Box) */}
              <div className="mt-4 bg-slate-950/80 border border-indigo-900/40 rounded-2xl p-4 space-y-1">
                <div className="text-[11px] font-bold text-indigo-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Actionable Mitigation Strategy:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium pl-5">
                  {bs.mitigation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
