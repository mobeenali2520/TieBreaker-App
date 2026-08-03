import React, { useState } from 'react';
import { Sparkles, X, Loader2, Check, AlertCircle, HelpCircle, AlertTriangle } from 'lucide-react';
import { DecisionProject, Criterion, Option } from '../../types/decision';

import { useAppStore } from '../../store/useAppStore';

interface AiAssistantModalProps {
  onUpdateProject: (p: DecisionProject) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  onUpdateProject,
}) => {
  const { showAiModal: isOpen, setShowAiModal, activeProject: project } = useAppStore();
  const onClose = () => setShowAiModal(false);

  const [activeTab, setActiveTab] = useState<'generate' | 'analyze'>('generate');
  const [topicInput, setTopicInput] = useState(project?.title || '');
  
  if (!isOpen || !project) return null;
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<{
    suggestedOptions: string[];
    suggestedCriteria: { name: string; weight: number; isPositive: boolean; description: string }[];
    briefAdvice: string;
  } | null>(null);

  // Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<{
    winnerSummary: string;
    keyTradeoffs: string[];
    sensitivityWarning: string;
    tieBreakerQuestion: string;
  } | null>(null);

  // Handle AI Criteria & Option Generator
  const handleGenerate = async () => {
    if (!topicInput.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicInput,
          options: project.options.map((o) => o.name),
          criteria: project.criteria.map((c) => c.name),
        }),
      });

      const errJson = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429 || errJson.isQuotaError || errJson.error === 'quota_exceeded') {
          throw new Error(errJson.message || 'The daily AI quota or rate limit has been reached. Please try again in a few moments or later today.');
        }
        throw new Error(errJson.message || errJson.error || 'AI generation failed');
      }

      setAiSuggestions(errJson);
    } catch (err: any) {
      console.error('AI Suggestion Error:', err);
      setErrorMsg(err.message || 'Failed to connect to AI Assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle AI Executive Matrix Analysis
  const handleAnalyze = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matrixData: project }),
      });

      const errJson = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429 || errJson.isQuotaError || errJson.error === 'quota_exceeded') {
          throw new Error(errJson.message || 'The daily AI quota or rate limit has been reached. Please try again in a few moments or later today.');
        }
        throw new Error(errJson.message || errJson.error || 'AI Analysis failed');
      }

      setAiAnalysis(errJson);
    } catch (err: any) {
      console.error('AI Analysis Error:', err);
      setErrorMsg(err.message || 'Failed to generate AI analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply AI Suggestions to Project
  const applySuggestions = () => {
    if (!aiSuggestions) return;

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6'];
    
    // Convert suggested options
    const newOptions: Option[] = aiSuggestions.suggestedOptions.map((optName, idx) => ({
      id: `opt_ai_${Date.now()}_${idx}`,
      name: optName,
      color: colors[idx % colors.length],
    }));

    // Convert suggested criteria
    const newCriteria: Criterion[] = aiSuggestions.suggestedCriteria.map((crit, idx) => ({
      id: `crit_ai_${Date.now()}_${idx}`,
      name: crit.name,
      weight: crit.weight || 7,
      isPositive: crit.isPositive ?? true,
      description: crit.description,
    }));

    // Initialize default scores
    const newScores: Record<string, number> = {};
    newOptions.forEach((o) => {
      newCriteria.forEach((c) => {
        newScores[`${o.id}_${c.id}`] = 7;
      });
    });

    onUpdateProject({
      ...project,
      title: topicInput,
      options: newOptions,
      criteria: newCriteria,
      scores: newScores,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">AI Decision Assistant (Groq Llama 3.3)</h2>
              <p className="text-xs text-slate-400">Smart criteria generator & decision analysis synthesis</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Mode Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6">
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'generate'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Auto-Generate Matrix Setup
          </button>

          <button
            onClick={() => { setActiveTab('analyze'); if (!aiAnalysis) handleAnalyze(); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'analyze'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Executive Matrix Insight
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {errorMsg && (
            <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-amber-300">Notice</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* TAB 1: Auto-Generate Setup */}
          {activeTab === 'generate' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  What decision are you trying to make?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="e.g. Choosing between electric SUVs under $50k"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading || !topicInput.trim()}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow shrink-0 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate
                  </button>
                </div>
              </div>

              {aiSuggestions && (
                <div className="space-y-4 pt-2 border-t border-slate-800 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-700/40 text-indigo-200 text-xs">
                    <span className="font-bold">AI Strategy Advice: </span>
                    {aiSuggestions.briefAdvice}
                  </div>

                  {/* Options List */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Suggested Options ({aiSuggestions.suggestedOptions.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.suggestedOptions.map((opt, i) => (
                        <span key={i} className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200">
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Criteria List */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Suggested Evaluation Criteria ({aiSuggestions.suggestedCriteria.length})
                    </h4>
                    <div className="space-y-2">
                      {aiSuggestions.suggestedCriteria.map((crit, i) => (
                        <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-200">{crit.name}</span>
                            {crit.description && <p className="text-[11px] text-slate-400">{crit.description}</p>}
                          </div>
                          <span className="bg-indigo-900/50 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-700/50 shrink-0">
                            Weight {crit.weight}/10
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={applySuggestions}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-transform hover:scale-[1.01]"
                  >
                    <Check className="h-4 w-4" />
                    Apply Options & Criteria to Matrix
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Executive Matrix Insight */}
          {activeTab === 'analyze' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-400" />
                  <p className="text-xs">Analyzing decision matrix, weights, and trade-offs...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-600/40 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                      Winner Executive Summary
                    </span>
                    <p className="text-sm font-semibold text-white">
                      {aiAnalysis.winnerSummary}
                    </p>
                  </div>

                  {aiAnalysis.keyTradeoffs && aiAnalysis.keyTradeoffs.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Key Strategic Trade-offs
                      </span>
                      <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                        {aiAnalysis.keyTradeoffs.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiAnalysis.tieBreakerQuestion && (
                    <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/30 text-amber-200 text-xs space-y-1">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <HelpCircle className="h-4 w-4" />
                        Tie-Breaker Question Perspective
                      </span>
                      <p>{aiAnalysis.tieBreakerQuestion}</p>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleAnalyze}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow"
                >
                  Run AI Matrix Analysis
                </button>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Disclaimer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>Gemini can make mistakes. Please verify important information.</span>
        </div>
      </div>
    </div>
  );
};
