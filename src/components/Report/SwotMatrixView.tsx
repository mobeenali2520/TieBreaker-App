import React, { useState } from 'react';
import { DecisionProject, SwotItem } from '../../types/decision';
import { 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ShieldAlert, 
  Plus, 
  Trash2,
  X,
  ChevronDown
} from 'lucide-react';

interface SwotMatrixViewProps {
  project: DecisionProject;
  onUpdateProject: (p: DecisionProject) => void;
}

interface StructuredSwotCard {
  id: string;
  title: string;
  impact: number; // e.g. 85, 95
  description: string;
}

export const SwotMatrixView: React.FC<SwotMatrixViewProps> = ({
  project,
  onUpdateProject,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    project.options[0]?.id || ''
  );

  const [showAddModal, setShowAddModal] = useState<
    'strengths' | 'weaknesses' | 'opportunities' | 'threats' | null
  >(null);
  
  // Accordion state for mobile
  const [expandedQuadrant, setExpandedQuadrant] = useState<
    'strengths' | 'weaknesses' | 'opportunities' | 'threats' | null
  >('strengths');

  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemImpact, setNewItemImpact] = useState(85);

  const activeOption = project.options.find((o) => o.id === selectedOptionId) || project.options[0];
  const swotMap = project.swot || {};

  // Raw swot string array fallback converter to structured cards
  const activeSwotRaw: SwotItem = (activeOption && swotMap[activeOption.id]) || {
    strengths: [
      `Strategic Purpose & Alignment: Clear potential upside and core objective alignment identified for ${activeOption?.name || 'this choice'}.`,
      `Core Competitive Upside: Leverages key competencies to maximize strategic momentum.`,
    ],
    weaknesses: [
      `Resource & Bandwidth Demand: Requires short-term capital, operational focus, and execution bandwidth.`,
      `Transition Friction: Initial ramp-up phase requires organizational or personal adaptation.`,
    ],
    opportunities: [
      `Trajectory Acceleration: Unlocks compounding growth, new leverage, and expanded capability horizons.`,
      `Risk Diversification: Positions user to adapt gracefully to future shifts in environment.`,
    ],
    threats: [
      `External Environment Shifts: Macro uncertainty, timeline delays, or external market volatility.`,
      `Opportunity Cost: Committing to this route defers secondary competing priorities.`,
    ],
  };

  const parseSwotString = (raw: any, defaultImpact: number): StructuredSwotCard => {
    if (typeof raw === 'object' && raw !== null) {
      return {
        id: raw.id || `swot_${Math.random().toString(36).substring(2, 7)}`,
        title: raw.title || raw.name || 'Strategic Factor',
        impact: raw.impact || defaultImpact,
        description: raw.description || raw.text || 'Strategic factor evaluated for this decision option.',
      };
    }
    const strVal = String(raw || '');
    const parts = strVal.split(':');
    if (parts.length >= 2) {
      return {
        id: `swot_${Math.random().toString(36).substring(2, 7)}`,
        title: parts[0].trim(),
        impact: defaultImpact,
        description: parts.slice(1).join(':').trim(),
      };
    }
    return {
      id: `swot_${Math.random().toString(36).substring(2, 7)}`,
      title: strVal,
      impact: defaultImpact,
      description: 'Strategic factor evaluated for this decision option.',
    };
  };

  // Convert raw string arrays into structured card objects
  const getStructuredSection = (
    key: 'strengths' | 'weaknesses' | 'opportunities' | 'threats',
    defaultImpact: number
  ): StructuredSwotCard[] => {
    const list = activeSwotRaw[key] || [];
    return list.map((item) => parseSwotString(item, defaultImpact));
  };

  const strengthsList = getStructuredSection('strengths', 95);
  const weaknessesList = getStructuredSection('weaknesses', 80);
  const opportunitiesList = getStructuredSection('opportunities', 90);
  const threatsList = getStructuredSection('threats', 75);

  const updateSwotSection = (
    key: 'strengths' | 'weaknesses' | 'opportunities' | 'threats',
    formattedStrings: string[]
  ) => {
    if (!activeOption) return;
    const updatedSwot = {
      ...swotMap,
      [activeOption.id]: {
        ...activeSwotRaw,
        [key]: formattedStrings,
      },
    };
    onUpdateProject({ ...project, swot: updatedSwot });
  };

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddModal || !newItemTitle.trim()) return;

    const formatted = `${newItemTitle.trim()}: ${newItemDesc.trim() || 'Key factor analysis'}`;
    const currentList = activeSwotRaw[showAddModal] || [];
    updateSwotSection(showAddModal, [...currentList, formatted]);

    setNewItemTitle('');
    setNewItemDesc('');
    setNewItemImpact(85);
    setShowAddModal(null);
  };

  const handleRemoveItem = (
    key: 'strengths' | 'weaknesses' | 'opportunities' | 'threats',
    idx: number
  ) => {
    const currentList = activeSwotRaw[key] || [];
    updateSwotSection(
      key,
      currentList.filter((_, i) => i !== idx)
    );
  };

  if (!activeOption) {
    return <div className="text-slate-400 text-xs">No options configured for SWOT analysis.</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Header & Option Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                SWOT Insight Matrix
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Internal Strengths & Weaknesses vs External Opportunities & Threats
              </p>
            </div>
          </div>
        </div>

        {/* Option Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {project.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedOptionId(opt.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                opt.id === activeOption.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {opt.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4 QUADRANTS GRID (EXACT MATCH TO IMAGE 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* QUADRANT 1: STRENGTHS (GREEN / EMERALD) */}
        <div className="bg-slate-950/80 border-2 border-emerald-500/40 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl">
          <div 
            className="flex items-center justify-between border-b border-emerald-500/20 pb-3 cursor-pointer md:cursor-auto"
            onClick={() => window.innerWidth < 768 && setExpandedQuadrant(expandedQuadrant === 'strengths' ? null : 'strengths')}
          >
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-serif font-bold text-base text-emerald-400">
                Strengths ({strengthsList.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setShowAddModal('strengths'); }}
                className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-colors"
                title="Add strength"
              >
                <Plus className="w-4 h-4" />
              </button>
              <ChevronDown className={`w-5 h-5 text-emerald-500/70 md:hidden transition-transform duration-300 ${expandedQuadrant === 'strengths' ? 'rotate-180' : ''}`} />
            </div>
          </div>

          <div className={`space-y-3 pt-4 ${expandedQuadrant === 'strengths' ? 'block' : 'hidden md:block'}`}>
            {strengthsList.map((card, idx) => (
              <div
                key={card.id}
                className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 space-y-2 relative group hover:border-emerald-500/60 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-100 text-sm">{card.title}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-extrabold tracking-wider text-emerald-300 bg-emerald-900/60 border border-emerald-600/40 px-2 py-0.5 rounded-full uppercase">
                      impact: {card.impact}
                    </span>
                    <button
                      onClick={() => handleRemoveItem('strengths', idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* QUADRANT 2: WEAKNESSES (AMBER / GOLD) */}
        <div className="bg-slate-950/80 border-2 border-amber-500/40 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl">
          <div 
            className="flex items-center justify-between border-b border-amber-500/20 pb-3 cursor-pointer md:cursor-auto"
            onClick={() => window.innerWidth < 768 && setExpandedQuadrant(expandedQuadrant === 'weaknesses' ? null : 'weaknesses')}
          >
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-serif font-bold text-base text-amber-400">
                Weaknesses ({weaknessesList.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setShowAddModal('weaknesses'); }}
                className="p-1.5 text-amber-400 hover:bg-amber-500/20 rounded-xl transition-colors"
                title="Add weakness"
              >
                <Plus className="w-4 h-4" />
              </button>
              <ChevronDown className={`w-5 h-5 text-amber-500/70 md:hidden transition-transform duration-300 ${expandedQuadrant === 'weaknesses' ? 'rotate-180' : ''}`} />
            </div>
          </div>

          <div className={`space-y-3 pt-4 ${expandedQuadrant === 'weaknesses' ? 'block' : 'hidden md:block'}`}>
            {weaknessesList.map((card, idx) => (
              <div
                key={card.id}
                className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 space-y-2 relative group hover:border-amber-500/60 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-100 text-sm">{card.title}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-extrabold tracking-wider text-amber-300 bg-amber-900/60 border border-amber-600/40 px-2 py-0.5 rounded-full uppercase">
                      impact: {card.impact}
                    </span>
                    <button
                      onClick={() => handleRemoveItem('weaknesses', idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* QUADRANT 3: OPPORTUNITIES (INDIGO / BLUE) */}
        <div className="bg-slate-950/80 border-2 border-indigo-500/40 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl">
          <div 
            className="flex items-center justify-between border-b border-indigo-500/20 pb-3 cursor-pointer md:cursor-auto"
            onClick={() => window.innerWidth < 768 && setExpandedQuadrant(expandedQuadrant === 'opportunities' ? null : 'opportunities')}
          >
            <div className="flex items-center gap-2 text-indigo-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-serif font-bold text-base text-indigo-400">
                Opportunities ({opportunitiesList.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setShowAddModal('opportunities'); }}
                className="p-1.5 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-colors"
                title="Add opportunity"
              >
                <Plus className="w-4 h-4" />
              </button>
              <ChevronDown className={`w-5 h-5 text-indigo-500/70 md:hidden transition-transform duration-300 ${expandedQuadrant === 'opportunities' ? 'rotate-180' : ''}`} />
            </div>
          </div>

          <div className={`space-y-3 pt-4 ${expandedQuadrant === 'opportunities' ? 'block' : 'hidden md:block'}`}>
            {opportunitiesList.map((card, idx) => (
              <div
                key={card.id}
                className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-4 space-y-2 relative group hover:border-indigo-500/60 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-100 text-sm">{card.title}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-extrabold tracking-wider text-indigo-300 bg-indigo-900/60 border border-indigo-600/40 px-2 py-0.5 rounded-full uppercase">
                      impact: {card.impact}
                    </span>
                    <button
                      onClick={() => handleRemoveItem('opportunities', idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* QUADRANT 4: THREATS (ROSE / RED) */}
        <div className="bg-slate-950/80 border-2 border-rose-500/40 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl">
          <div 
            className="flex items-center justify-between border-b border-rose-500/20 pb-3 cursor-pointer md:cursor-auto"
            onClick={() => window.innerWidth < 768 && setExpandedQuadrant(expandedQuadrant === 'threats' ? null : 'threats')}
          >
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-serif font-bold text-base text-rose-400">
                Threats ({threatsList.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setShowAddModal('threats'); }}
                className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors"
                title="Add threat"
              >
                <Plus className="w-4 h-4" />
              </button>
              <ChevronDown className={`w-5 h-5 text-rose-500/70 md:hidden transition-transform duration-300 ${expandedQuadrant === 'threats' ? 'rotate-180' : ''}`} />
            </div>
          </div>

          <div className={`space-y-3 pt-4 ${expandedQuadrant === 'threats' ? 'block' : 'hidden md:block'}`}>
            {threatsList.map((card, idx) => (
              <div
                key={card.id}
                className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4 space-y-2 relative group hover:border-rose-500/60 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-100 text-sm">{card.title}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-extrabold tracking-wider text-rose-300 bg-rose-900/60 border border-rose-600/40 px-2 py-0.5 rounded-full uppercase">
                      impact: {card.impact}
                    </span>
                    <button
                      onClick={() => handleRemoveItem('threats', idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-lg capitalize flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Add {showAddModal} Item
              </h3>
              <button onClick={() => setShowAddModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Title / Headline *
                </label>
                <input
                  type="text"
                  required
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="e.g. Trajectory Acceleration"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="e.g. Unlocks compounding growth and expanded horizons."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Impact Rating ({newItemImpact})
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={newItemImpact}
                  onChange={(e) => setNewItemImpact(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="pt-3 flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
