/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ClarifyingQuestion } from '../../types/decision';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, HelpCircle, AlertTriangle, X } from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';

interface IntakeClarificationViewProps {
  onSubmitAnswers: (answers: Record<string, string>) => void;
}

export const IntakeClarificationView: React.FC<IntakeClarificationViewProps> = ({
  onSubmitAnswers,
}) => {
  const { 
    currentDilemma: dilemma, 
    intakeQuestions: questions, 
    intakeCategory: category, 
    intakeDetectedOptions: detectedOptions, 
    isLoadingQuestions, 
    isGeneratingAnalysis, 
    quotaNotice,
    setViewMode 
  } = useAppStore();
  const onBackToHome = () => setViewMode('home');

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [dismissNotice, setDismissNotice] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  useEffect(() => {
    if (!isGeneratingAnalysis) {
      setAnalysisStep(0);
      return;
    }
    const interval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 700);
    return () => clearInterval(interval);
  }, [isGeneratingAnalysis]);

  const handleTextChange = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSingleSelect = (qId: string, optionText: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: optionText }));
  };

  const handleMultiSelectToggle = (qId: string, optionText: string) => {
    setAnswers((prev) => {
      const current = prev[qId] || '';
      const selected = current ? current.split(', ').map((s) => s.trim()).filter(Boolean) : [];
      if (selected.includes(optionText)) {
        const updated = selected.filter((item) => item !== optionText);
        return { ...prev, [qId]: updated.join(', ') };
      } else {
        const updated = [...selected, optionText];
        return { ...prev, [qId]: updated.join(', ') };
      }
    });
  };

  const isFormComplete = questions.every((q) => (answers[q.id] || '').trim().length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitAnswers(answers);
  };

  if (isLoadingQuestions) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6 animate-pulse">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs font-semibold">AI Intake Engine Processing (Google Search Grounding)...</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Synthesizing 3 Clarifying Questions</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
          Tailoring intake questions to identify your constraints, budget, timeline, and risk tolerance for: "{dilemma}"
        </p>

        {/* Skeleton loaders */}
        <div className="mt-8 space-y-4 text-left">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-4 rounded-xl bg-slate-900 border border-slate-800 animate-pulse space-y-2">
              <div className="h-4 bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-800/60 rounded w-1/2"></div>
              <div className="h-9 bg-slate-950 rounded w-full mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isGeneratingAnalysis) {
    const steps = [
      "Analyzing user intake preferences & constraints",
      "Evaluating options across weighted strategic criteria",
      "Generating SWOT quadrants & Blindspot risks",
      "Finalizing multi-criteria decision verdict",
    ];

    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6 animate-spin">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Synthesizing Decision Analysis</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
          Computing multi-criteria matrix, SWOT analysis, blindspot warnings, and executive verdict...
        </p>

        <div className="mt-8 max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs text-left shadow-2xl backdrop-blur-sm">
          <div className="space-y-2.5">
            {steps.map((stepText, idx) => {
              const isDone = analysisStep > idx;
              const isCurrent = analysisStep === idx;
              return (
                <div key={idx} className="flex items-center gap-2.5 transition-all duration-300">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                  )}
                  <span
                    className={
                      isDone
                        ? "text-slate-300 line-through decoration-slate-600"
                        : isCurrent
                        ? "text-indigo-300 font-semibold"
                        : "text-slate-500"
                    }
                  >
                    {stepText}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, (analysisStep + 1) * 25)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 space-y-6">
      
      {/* Quota Alert Notice */}
      {quotaNotice && !dismissNotice && (
        <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs flex items-start justify-between gap-3 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block text-xs uppercase tracking-wider">
                Daily AI Quota Reached
              </span>
              <span className="text-slate-200 leading-relaxed">
                {quotaNotice}
              </span>
            </div>
          </div>
          <button
            onClick={() => setDismissNotice(true)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-amber-900/40 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const autofilled: Record<string, string> = {};
              questions.forEach((q) => {
                if (q.options && q.options.length > 0) {
                  autofilled[q.id] = q.options[0];
                } else {
                  autofilled[q.id] = "High priority on performance, long-term stability, and minimal risk.";
                }
              });
              setAnswers(autofilled);
            }}
            className="text-[11px] text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 px-2.5 py-1 rounded-lg border border-indigo-700/50 flex items-center gap-1 transition-all"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Auto-Fill Defaults</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step 1 of 2 • Context Intake</span>
          </div>
        </div>
      </div>

      {/* Header Card with Category & Options Badges */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {category && (
            <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span>🎯 Category:</span>
              <span className="text-white">{category}</span>
            </span>
          )}
          {detectedOptions && detectedOptions.length > 0 && (
            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span>⚖️ Comparing:</span>
              <span className="text-white">{detectedOptions.join(' vs ')}</span>
            </span>
          )}
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Evaluating Dilemma</span>
          <h2 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug">
            "{dilemma}"
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Answer these 3 personalized, domain-adaptive questions so the AI can weigh your values, constraints, and risk tolerance accurately.
          </p>
        </div>
      </div>

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => {
          const val = answers[q.id] || '';
          const qType = q.type || (q.options && q.options.length > 0 ? 'single_select' : 'text_input');

          return (
            <div 
              key={q.id || idx}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 hover:border-slate-700/80 transition-all shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-100">
                      {q.question}
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                      {qType.replace('_', ' ')}
                    </span>
                  </div>
                  {q.contextNote && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>{q.contextNote}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* RENDER COMPONENT BY QUESTION TYPE */}

              {/* 1. SINGLE SELECT */}
              {qType === 'single_select' && q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = val === opt;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSingleSelect(q.id, opt)}
                        className={`text-left text-xs p-3 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600/90 text-white border-indigo-400 shadow-md ring-1 ring-indigo-400'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white hover:bg-slate-900/80'
                        }`}
                      >
                        <span className="font-medium">{opt}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. MULTI SELECT */}
              {qType === 'multi_select' && q.options && q.options.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] text-slate-400 italic">Select one or more options that apply:</p>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt, optIdx) => {
                      const selectedList = val ? val.split(', ').map((s) => s.trim()) : [];
                      const isSelected = selectedList.includes(opt);
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleMultiSelectToggle(q.id, opt)}
                          className={`text-xs px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-400 shadow-md font-semibold'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-white text-purple-700 font-bold border-white' : 'border-slate-600'
                          }`}>
                            {isSelected ? '✓' : ''}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. DROPDOWN */}
              {qType === 'dropdown' && q.options && q.options.length > 0 && (
                <div className="pt-1">
                  <select
                    value={val}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">-- Select Choice --</option>
                    {q.options.map((opt, optIdx) => (
                      <option key={optIdx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 4. SLIDER */}
              {qType === 'slider' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Rating Score:</span>
                    <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                      {val || (q.min ?? 1)} / {q.max ?? 10}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={q.min ?? 1}
                    max={q.max ?? 10}
                    step={q.step ?? 1}
                    value={val ? Number(val) : (q.min ?? 1)}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>{q.options?.[0] || '1 (Low Priority)'}</span>
                    <span>{q.options?.[1] || '5 (Moderate)'}</span>
                    <span>{q.options?.[2] || `${q.max ?? 10} (Critical Priority)`}</span>
                  </div>
                </div>
              )}

              {/* 5. BUDGET RANGE */}
              {qType === 'budget_range' && (
                <div className="space-y-2 pt-1">
                  {q.options && q.options.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = val === opt;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSingleSelect(q.id, opt)}
                            className={`text-xs px-3 py-2 rounded-xl border transition-all font-medium ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            💰 {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 6. PRIORITY RANKING */}
              {qType === 'priority_ranking' && q.options && q.options.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] text-slate-400 italic">Select your top ranking preference:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = val === opt;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSingleSelect(q.id, opt)}
                          className={`text-left text-xs p-3 rounded-xl border transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-semibold'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              #{optIdx + 1}
                            </span>
                            <span>{opt}</span>
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Answer / Additional Notes Input */}
              {qType !== 'slider' && (
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  placeholder={q.placeholder || 'Type or customize your preference...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              )}
            </div>
          );
        })}

        {/* Submit */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Gemini can make mistakes. Please verify important information.</span>
          </p>
          <button
            type="submit"
            disabled={!isFormComplete}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/20 transition-all hover:scale-[1.02]"
          >
            <span>Generate Decision Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
