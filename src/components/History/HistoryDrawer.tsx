/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DecisionProject } from '../../types/decision';
import { 
  X, 
  Search, 
  Star, 
  Trash2, 
  Plus, 
  Download, 
  Sparkles, 
  Clock, 
  Briefcase, 
  Home, 
  DollarSign, 
  Compass, 
  Cpu, 
  User 
} from 'lucide-react';
import { exportProjectToJson } from '../../utils/storage';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: DecisionProject[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onClearAllProjects?: () => void;
  onToggleFavorite: (project: DecisionProject) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onClearAllProjects,
  onToggleFavorite,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  if (!isOpen) return null;

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'career': return <Briefcase className="w-3.5 h-3.5 text-indigo-400" />;
      case 'housing': return <Home className="w-3.5 h-3.5 text-emerald-400" />;
      case 'finance': return <DollarSign className="w-3.5 h-3.5 text-amber-400" />;
      case 'tech': return <Cpu className="w-3.5 h-3.5 text-cyan-400" />;
      case 'travel': return <Compass className="w-3.5 h-3.5 text-rose-400" />;
      case 'personal': return <User className="w-3.5 h-3.5 text-purple-400" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesFav = !onlyFavorites || p.isFavorite;
    return matchesSearch && matchesCategory && matchesFav;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden print:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 z-50">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100">
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Decision History</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {projects.length}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {projects.length > 0 && onClearAllProjects && (
                <button
                  onClick={() => {
                    if (confirm("Permanently delete ALL decision history? This cannot be undone.")) {
                      onClearAllProjects();
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors flex items-center gap-1"
                  title="Delete all history"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}

              <button
                onClick={() => {
                  onNewProject();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>

              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Controls & Filter */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 space-y-3">
            {/* Search bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search past decisions..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {['all', 'career', 'finance', 'housing', 'personal', 'general'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md capitalize text-xs whitespace-nowrap transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={`p-1.5 rounded-md flex items-center gap-1 transition-colors ${
                  onlyFavorites ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Filter Favorites"
              >
                <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Decision List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-xs text-slate-400">No decisions found.</p>
                <button
                  onClick={() => {
                    onNewProject();
                    onClose();
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start a new decision analysis</span>
                </button>
              </div>
            ) : (
              filteredProjects.map((p) => {
                const isActive = p.id === activeProjectId;
                const dateStr = new Date(p.updatedAt || p.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p.id);
                      onClose();
                    }}
                    className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30' 
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(p.category)}
                        <h3 className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                          {p.title}
                        </h3>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(p);
                        }}
                        className="text-slate-500 hover:text-amber-400 transition-colors p-0.5"
                      >
                        <Star className={`w-3.5 h-3.5 ${p.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {p.description || 'No description provided'}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{p.options.length} Options</span>
                        {p.verdict?.confidenceScore && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-400 font-medium">
                              {p.verdict.confidenceScore}% Confidence
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportProjectToJson(p);
                          }}
                          className="px-2 py-1 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors flex items-center gap-1 text-[10px] font-medium"
                          title="Download JSON File"
                        >
                          <Download className="w-3 h-3 text-indigo-400" />
                          <span>JSON</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Permanently delete "${p.title}" from history?`)) {
                              onDeleteProject(p.id);
                            }
                          }}
                          className="px-2 py-1 text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-md transition-colors flex items-center gap-1 text-[10px] font-medium"
                          title="Permanently Delete History Item"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 text-center">
            <button
              onClick={() => {
                onNewProject();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Clean Decision Analysis</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
