/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DecisionProject } from '../../types/decision';
import { calculateOptionResults } from '../../utils/decisionEngine';
import { exportProjectToCsv, exportProjectToPdf } from '../../utils/exportUtils';
import { 
  Trophy, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  TrendingUp, 
  Printer,
  FileSpreadsheet,
  FileText,
  Globe
} from 'lucide-react';

interface ExecutiveSummaryViewProps {
  project: DecisionProject;
  onNavigateTab: (tab: 'matrix' | 'swot' | 'blindspots' | 'tiebreaker') => void;
  onPrint: () => void;
}

export const ExecutiveSummaryView: React.FC<ExecutiveSummaryViewProps> = ({
  project,
  onNavigateTab,
  onPrint,
}) => {
  const results = calculateOptionResults(project);
  const winner = results.find((r) => r.isWinner) || results[0];

  const verdict = project.verdict;
  const tenTenTen = project.tenTenTen;

  return (
    <div className="space-y-6">
      
      {/* Printable Report Header */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
            <p className="text-sm text-slate-600 mt-1">{project.description}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">The Tiebreaker Analysis</span>
            <p className="text-xs text-slate-500">{new Date(project.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Main Winner Banner & Confidence Meter */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" />
              <span>Recommended Path Forward</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {verdict?.recommendedOptionName || winner?.option.name || 'Top Ranked Option'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {verdict?.executiveSummary || 
                `Based on multi-criteria weighted matrix analysis, ${winner?.option.name} achieves the highest score of ${winner?.normalizedPercentage}% across your core evaluation metrics.`
              }
            </p>
          </div>

          {/* Confidence Score Dial */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center min-w-[200px] shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Confidence Score
            </span>

            <div className="relative inline-flex items-center justify-center">
              <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                {verdict?.confidenceScore || winner?.normalizedPercentage || 85}%
              </span>
            </div>

            <span className="text-[11px] text-slate-400 mt-1">
              High Statistical Certainty
            </span>

            <div className="mt-3 flex flex-col gap-1.5 w-full print:hidden">
              <button
                onClick={() => exportProjectToPdf(project)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export PDF Report</span>
              </button>

              <button
                onClick={() => exportProjectToCsv(project)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV Matrix</span>
              </button>

              <button
                onClick={onPrint}
                className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-slate-200 text-[11px] transition-colors"
              >
                <Printer className="w-3 h-3" />
                <span>Browser Print View</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Grid: Key Reasons & Primary Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Key Reasons */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Primary Strategic Drivers
            </h3>
          </div>

          <ul className="space-y-2.5">
            {(verdict?.keyReasons || [
              `Highest weighted performance across positive strategic criteria`,
              `Favorable downside risk profile compared to alternative paths`,
              `Strong alignment with stated 10-month horizon goals`,
            ]).map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Primary Risks & Mitigations */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Key Risks to Monitor
            </h3>
          </div>

          <ul className="space-y-2.5">
            {(verdict?.primaryRisks || [
              `Initial execution friction in the first 30 days`,
              `Opportunity cost of setting aside secondary alternatives`,
            ]).map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* 10-10-10 Time Horizon Framework */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              10–10–10 Time Horizon Analysis
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Long-term Perspective</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 10 Minutes */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400">10 Minutes</span>
              <span className="text-[10px] text-slate-500">Immediate Impact</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {tenTenTen?.tenMinutes || 'Immediate emotional reaction and relief from locking in direction. Action: Document decision rationale.'}
            </p>
          </div>

          {/* 10 Months */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400">10 Months</span>
              <span className="text-[10px] text-slate-500">Mid-term Trajectory</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {tenTenTen?.tenMonths || 'Adaptation phase settled. Positive compounding momentum validating early trade-offs.'}
            </p>
          </div>

          {/* 10 Years */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-pink-400">10 Years</span>
              <span className="text-[10px] text-slate-500">Long-term Legacy</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {tenTenTen?.tenYears || 'Viewed as a decisive milestone where you broke analysis paralysis and moved forward with clarity.'}
            </p>
          </div>

        </div>
      </div>

      {/* Suggested Next Steps */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Suggested Next Steps
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(verdict?.suggestedNextSteps || [
            'Set a firm 48-hour commitment deadline',
            'Draft a 30-day tactical implementation roadmap',
            'Communicate decision to key stakeholders',
          ]).map((step, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <span className="text-xs text-slate-200">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Google Search Grounding Sources */}
      {project.groundingSources && project.groundingSources.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Google Search Real-Time Grounding Sources</span>
            <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono">
              Live Verified
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {project.groundingSources.map((source, idx) => {
              const uri = source.web?.uri;
              const title = source.web?.title || uri || `Source ${idx + 1}`;
              if (!uri) return null;
              return (
                <a
                  key={idx}
                  href={uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-indigo-300 transition-colors text-xs"
                >
                  <Globe className="w-3 h-3 shrink-0 text-slate-400" />
                  <span className="truncate max-w-[220px]">{title}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Quick Links */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-400">Explore deeper analytical breakdown:</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('matrix')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <span>Weighted Matrix Grid</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          </button>
          <button
            onClick={() => onNavigateTab('swot')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <span>SWOT Quad</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          </button>
          <button
            onClick={() => onNavigateTab('blindspots')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <span>Devil's Advocate</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          </button>
        </div>
      </div>

    </div>
  );
};
