import React, { useState } from 'react';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles,
  X,
  SlidersHorizontal,
  BarChart2,
  Sliders,
  CheckCircle2,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { DecisionProject, Option, Criterion, OptionResult } from '../../types/decision';
import { calculateOptionResults } from '../../utils/decisionEngine';
import { OPTION_COLORS } from '../../utils/colors';
import { exportProjectToCsv, exportProjectToPdf } from '../../utils/exportUtils';

interface MatrixViewProps {
  project: DecisionProject;
  onUpdateProject: (p: DecisionProject) => void;
  onNavigateToTieBreaker: () => void;
  onOpenAiAssistant: () => void;
}

// Category helper tags for criteria
const CATEGORY_TAGS = ['FINANCIAL', 'STRATEGIC', 'PERSONAL', 'OPERATIONAL', 'RISK', 'TIMELINE'];

export const MatrixView: React.FC<MatrixViewProps> = ({
  project,
  onUpdateProject,
  onNavigateToTieBreaker,
  onOpenAiAssistant,
}) => {
  const [showAddOption, setShowAddOption] = useState(false);
  const [showAddCriterion, setShowAddCriterion] = useState(false);
  const [showAdjustWeightsModal, setShowAdjustWeightsModal] = useState(false);

  // New option form state
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionDesc, setNewOptionDesc] = useState('');
  const [newOptionColor, setNewOptionColor] = useState(OPTION_COLORS[0].value);

  // New criterion form state
  const [newCritName, setNewCritName] = useState('');
  const [newCritWeight, setNewCritWeight] = useState(7);
  const [newCritIsPositive, setNewCritIsPositive] = useState(true);
  const [newCritDesc, setNewCritDesc] = useState('');
  const [newCritCategory, setNewCritCategory] = useState('STRATEGIC');

  // Active cell score edit popover
  const [activeCellKey, setActiveCellKey] = useState<string | null>(null);

  const results: OptionResult[] = calculateOptionResults(project);
  const winner = results[0];

  // Helper to get score badge style based on 0-100 score
  const getScoreBadgeClass = (scoreOutOf100: number) => {
    if (scoreOutOf100 >= 80) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold';
    } else if (scoreOutOf100 >= 60) {
      return 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold';
    } else {
      return 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold';
    }
  };

  // Add new Option
  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptionName.trim()) return;

    const optId = `opt_${Date.now()}`;
    const newOption: Option = {
      id: optId,
      name: newOptionName.trim(),
      description: newOptionDesc.trim() || undefined,
      color: newOptionColor,
    };

    const updatedScores = { ...project.scores };
    project.criteria.forEach((crit) => {
      updatedScores[`${optId}_${crit.id}`] = 7;
    });

    onUpdateProject({
      ...project,
      options: [...project.options, newOption],
      scores: updatedScores,
    });

    setNewOptionName('');
    setNewOptionDesc('');
    setShowAddOption(false);
  };

  // Add new Criterion
  const handleAddCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCritName.trim()) return;

    const critId = `crit_${Date.now()}`;
    const newCriterion: Criterion = {
      id: critId,
      name: newCritName.trim(),
      weight: newCritWeight,
      isPositive: newCritIsPositive,
      description: newCritDesc.trim() || undefined,
      category: newCritCategory,
    };

    const updatedScores = { ...project.scores };
    project.options.forEach((opt) => {
      updatedScores[`${opt.id}_${critId}`] = 7;
    });

    onUpdateProject({
      ...project,
      criteria: [...project.criteria, newCriterion],
      scores: updatedScores,
    });

    setNewCritName('');
    setNewCritDesc('');
    setNewCritWeight(7);
    setShowAddCriterion(false);
  };

  // Remove Option
  const handleRemoveOption = (optId: string) => {
    if (project.options.length <= 1) {
      alert('Decision matrix must have at least 1 option.');
      return;
    }
    const filteredOpts = project.options.filter((o) => o.id !== optId);
    const updatedScores = { ...project.scores };
    Object.keys(updatedScores).forEach((k) => {
      if (k.startsWith(`${optId}_`)) {
        delete updatedScores[k];
      }
    });

    onUpdateProject({
      ...project,
      options: filteredOpts,
      scores: updatedScores,
    });
  };

  // Remove Criterion
  const handleRemoveCriterion = (critId: string) => {
    if (project.criteria.length <= 1) {
      alert('Decision matrix must have at least 1 criterion.');
      return;
    }
    const filteredCrits = project.criteria.filter((c) => c.id !== critId);
    const updatedScores = { ...project.scores };
    Object.keys(updatedScores).forEach((k) => {
      if (k.endsWith(`_${critId}`)) {
        delete updatedScores[k];
      }
    });

    onUpdateProject({
      ...project,
      criteria: filteredCrits,
      scores: updatedScores,
    });
  };

  // Weight change
  const handleCriterionWeightChange = (critId: string, weight: number) => {
    const updatedCrits = project.criteria.map((c) => (c.id === critId ? { ...c, weight } : c));
    onUpdateProject({ ...project, criteria: updatedCrits });
  };

  // Score change
  const handleScoreChange = (optId: string, critId: string, score: number) => {
    const key = `${optId}_${critId}`;
    onUpdateProject({
      ...project,
      scores: { ...project.scores, [key]: score },
    });
  };

  // Get qualitative description for a criterion & option score
  const getRationaleText = (optName: string, crit: Criterion, score10: number) => {
    if (score10 >= 8) {
      return `Strong performance on ${crit.name.toLowerCase()} for ${optName}. High strategic alignment and minimal friction.`;
    } else if (score10 >= 5) {
      return `Moderate score for ${optName}. Acceptable baseline with some trade-offs to monitor.`;
    } else {
      return `Lower evaluation on ${crit.name.toLowerCase()}. Requires mitigation or extra bandwidth.`;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. WEIGHTED SCORE TOTALS CARD (IMAGE 2 MATCH) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Weighted Score Totals</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluated across active factor weights
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdjustWeightsModal(true)}
              className="bg-indigo-950 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Adjust Weights</span>
            </button>
          </div>
        </div>

        {/* Options Score Progress Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {results.map((res) => {
            const isLeader = winner && res.option.id === winner.option.id;
            return (
              <div
                key={res.option.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isLeader
                    ? 'bg-gradient-to-b from-indigo-950/60 to-slate-950 border-indigo-500/60 ring-1 ring-indigo-500/30'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-sm text-slate-100 truncate pr-2" title={res.option.name}>
                    {res.option.name}
                  </div>
                  {isLeader && (
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-400 px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider">
                      Top Choice
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">
                    {res.normalizedPercentage}%
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Weighted Score</span>
                </div>

                {/* Score bar visualizer */}
                <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${res.normalizedPercentage}%`,
                      backgroundColor: res.option.color || '#6366f1',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. DIMENSIONAL SCORE VISUALIZER (IMAGE 2 BAR CHART MATCH) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Dimensional Score Visualizer
              </h3>
              <p className="text-xs text-slate-400">
                Side-by-side factor evaluation (0 - 100)
              </p>
            </div>
          </div>
        </div>

        {/* Side-by-side Criteria Bar Visualizer */}
        <div className="pt-2 space-y-5">
          {project.criteria.map((crit) => (
            <div key={crit.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">{crit.name}</span>
                <span className="text-[11px] text-slate-400">Weight: {crit.weight}/10</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {project.options.map((opt) => {
                  const scoreKey = `${opt.id}_${crit.id}`;
                  const score10 = project.scores[scoreKey] ?? 5;
                  const score100 = score10 * 10;

                  return (
                    <div key={opt.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-semibold truncate pr-1" title={opt.name}>
                          {opt.name}
                        </span>
                        <span className="font-bold text-indigo-300 shrink-0">{score100} / 100</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${score100}%`,
                            backgroundColor: opt.color || '#6366f1',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. DIMENSION COMPARISON TABLE (IMAGE 2 DETAILED TABLE MATCH) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-5 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Factor & Dimension Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Detailed scores and qualitative rationale per dimension
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddCriterion(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Dimension</span>
            </button>

            <button
              onClick={() => setShowAddOption(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Choice</span>
            </button>
          </div>
        </div>

        {/* Detailed Matrix Table */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="p-4 w-64 min-w-[240px] border-r border-slate-800">
                  DIMENSION
                </th>
                {project.options.map((opt) => (
                  <th key={opt.id} className="p-4 border-r border-slate-800/80 min-w-[220px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white text-xs uppercase tracking-wider truncate" title={opt.name}>
                        {opt.name}
                      </span>
                      <button
                        onClick={() => handleRemoveOption(opt.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        title="Delete option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 text-xs">
              {project.criteria.map((crit) => (
                <tr key={crit.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Left Column: Dimension Name & Category */}
                  <td className="p-4 bg-slate-900/90 border-r border-slate-800 align-top space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-100 text-sm">{crit.name}</div>
                        <span className="inline-block text-[9px] font-bold tracking-wider text-indigo-300 uppercase bg-indigo-950/80 border border-indigo-700/50 px-2 py-0.5 rounded mt-1">
                          {crit.category || 'STRATEGIC'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveCriterion(crit.id)}
                        className="p-1 text-slate-600 hover:text-rose-400 transition-colors"
                        title="Delete dimension"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {crit.description && (
                      <p className="text-[11px] text-slate-400 leading-tight">{crit.description}</p>
                    )}
                  </td>

                  {/* Option Columns with Pill Score & Explanation */}
                  {project.options.map((opt) => {
                    const scoreKey = `${opt.id}_${crit.id}`;
                    const currentScore10 = project.scores[scoreKey] ?? 5;
                    const score100 = currentScore10 * 10;
                    const isPopActive = activeCellKey === scoreKey;

                    return (
                      <td key={opt.id} className="p-4 border-r border-slate-800/60 align-top relative">
                        <div className="flex flex-col items-center space-y-2">
                          
                          {/* Score Pill Badge (Image 2 style e.g. 65 / 100) */}
                          <button
                            onClick={() => setActiveCellKey(isPopActive ? null : scoreKey)}
                            className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm transition-transform hover:scale-105 flex items-center gap-1 ${getScoreBadgeClass(score100)}`}
                            title="Click to change score"
                          >
                            <span>{score100} / 100</span>
                          </button>

                          {/* Qualitative Description Paragraph */}
                          <p className="text-[11px] text-slate-300 text-center leading-relaxed">
                            {getRationaleText(opt.name, crit, currentScore10)}
                          </p>

                          {/* Quick Score Selector Popover */}
                          {isPopActive && (
                            <div className="absolute top-12 z-30 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-3 w-48 text-left animate-in fade-in zoom-in duration-100">
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
                                <span className="text-xs font-bold text-slate-200">Set Score (1-10)</span>
                                <button onClick={() => setActiveCellKey(null)} className="text-slate-400 hover:text-white">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-5 gap-1.5">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                  <button
                                    key={num}
                                    onClick={() => {
                                      handleScoreChange(opt.id, crit.id, num);
                                      setActiveCellKey(null);
                                    }}
                                    className={`h-8 rounded-lg text-xs font-bold transition-all ${
                                      currentScore10 === num
                                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                    }`}
                                  >
                                    {num}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUST WEIGHTS MODAL */}
      {showAdjustWeightsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                Adjust Factor Importance Weights
              </h3>
              <button onClick={() => setShowAdjustWeightsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {project.criteria.map((crit) => (
                <div key={crit.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{crit.name}</span>
                    <span className="font-extrabold text-indigo-400 text-sm">{crit.weight} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={crit.weight}
                    onChange={(e) => handleCriterionWeightChange(crit.id, Number(e.target.value))}
                    className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => setShowAdjustWeightsModal(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow"
              >
                Save Weights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD OPTION MODAL */}
      {showAddOption && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-400" />
                Add New Choice / Option
              </h3>
              <button onClick={() => setShowAddOption(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddOption} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Option Name *
                </label>
                <input
                  type="text"
                  required
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  placeholder="e.g. Join AI Startup (VP Product)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newOptionDesc}
                  onChange={(e) => setNewOptionDesc(e.target.value)}
                  placeholder="e.g. Fast-paced product role with equity upside"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {OPTION_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setNewOptionColor(c.value)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        newOptionColor === c.value ? 'scale-110 border-white ring-2 ring-indigo-500' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddOption(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
                >
                  Add Option
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CRITERION MODAL */}
      {showAddCriterion && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-400" />
                Add Dimension / Factor
              </h3>
              <button onClick={() => setShowAddCriterion(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCriterion} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Dimension Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCritName}
                  onChange={(e) => setNewCritName(e.target.value)}
                  placeholder="e.g. Long-term Career Acceleration"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Category Tag
                </label>
                <select
                  value={newCritCategory}
                  onChange={(e) => setNewCritCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {CATEGORY_TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Importance Weight (1 - 10)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newCritWeight}
                    onChange={(e) => setNewCritWeight(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg"
                  />
                  <span className="font-bold text-indigo-400 text-base shrink-0 w-6">
                    {newCritWeight}
                  </span>
                </div>
              </div>

              <div className="pt-3 flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddCriterion(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
                >
                  Add Dimension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
