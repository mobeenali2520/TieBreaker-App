/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ClarifyingQuestion } from '../../types/decision';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, HelpCircle, AlertTriangle, X } from 'lucide-react';

interface IntakeClarificationViewProps {
  dilemma: string;
  questions: ClarifyingQuestion[];
  isLoadingQuestions: boolean;
  isGeneratingAnalysis: boolean;
  quotaNotice?: string | null;
  onSubmitAnswers: (answers: Record<string, string>) => void;
  onBackToHome: () => void;
}

export const IntakeClarificationView: React.FC<IntakeClarificationViewProps> = ({
  dilemma,
  questions,
  isLoadingQuestions,
  isGeneratingAnalysis,
  quotaNotice,
  onSubmitAnswers,
  onBackToHome,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [dismissNotice, setDismissNotice] = useState(false);

  const handleTextChange = (qId: string, val: string) => {
    setAnswers({ ...answers, [qId]: val });
  };

  const handlePillSelect = (qId: string, optionText: string) => {
    const current = answers[qId] || '';
    if (current.includes(optionText)) {
      setAnswers({ ...answers, [qId]: current.replace(optionText, '').trim() });
    } else {
      setAnswers({ ...answers, [qId]: current ? `${current}, ${optionText}` : optionText });
    }
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
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-6 animate-spin">
          <Sparkles className="w-5 h-5" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Constructing Decision Framework</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
          Building weighted multi-criteria matrix, SWOT quadrants, blind spot detector, 10-10-10 horizon, and devil's advocate report...
        </p>

        <div className="mt-8 max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs text-left">
          <div className="flex items-center gap-2 text-indigo-400 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Clarification Intake Validated</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-400 font-medium">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>Calculating Weighted Trade-offs & Confidence Score...</span>
          </div>
          <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-3/4 animate-pulse"></div>
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

        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 1 of 2 • Context Intake</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Evaluating Dilemma</span>
        <h2 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug">
          "{dilemma}"
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Answer these 3 tailored questions so the AI can weigh your values, constraints, and risk tolerance accurately.
        </p>
      </div>

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => {
          const val = answers[q.id] || '';

          return (
            <div 
              key={q.id || idx}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3 hover:border-slate-700/80 transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    {q.question}
                  </h3>
                  {q.contextNote && (
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      <span>{q.contextNote}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Select Option Pills if available */}
              {q.options && q.options.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = val.includes(opt);
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handlePillSelect(q.id, opt)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Custom Answer Input */}
              <input
                type="text"
                value={val}
                onChange={(e) => handleTextChange(q.id, e.target.value)}
                placeholder={q.placeholder || 'Type your preference or details...'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
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
