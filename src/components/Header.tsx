/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  Plus, 
  Sun, 
  Moon, 
  FolderPlus, 
  Download, 
  BookmarkCheck, 
  ChevronDown, 
  Grid, 
  BarChart3, 
  Sliders, 
  Dices,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  User,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { DecisionProject } from '../types/decision';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  project: DecisionProject | null;
  activeTab: 'summary' | 'matrix' | 'swot' | 'blindspots' | 'analytics' | 'sensitivity' | 'tiebreaker';
  setActiveTab: (tab: 'summary' | 'matrix' | 'swot' | 'blindspots' | 'analytics' | 'sensitivity' | 'tiebreaker') => void;
  onUpdateProject: (p: DecisionProject) => void;
  onOpenHistory: () => void;
  onNewDecision: () => void;
  onOpenTemplates: () => void;
  onOpenAiAssistant: () => void;
  onOpenExportImport: () => void;
  historyCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onPrintReport: () => void;
  onOpenAdminPanel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  activeTab,
  setActiveTab,
  onUpdateProject,
  onOpenHistory,
  onNewDecision,
  onOpenTemplates,
  onOpenAiAssistant,
  onOpenExportImport,
  historyCount,
  darkMode,
  onToggleDarkMode,
  onPrintReport,
  onOpenAdminPanel,
}) => {
  const { userProfile, isAdmin, logout } = useAuth();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project?.title || '');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (project && titleInput.trim() && titleInput !== project.title) {
      onUpdateProject({ ...project, title: titleInput.trim() });
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 text-white shadow-xl print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Brand & Active Decision Info */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNewDecision}
              className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 hover:opacity-90 transition-opacity"
              title="Return to Home / New Decision"
            >
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </button>

            {project ? (
              <div>
                <div className="flex items-center gap-2">
                  {isEditingTitle ? (
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      onBlur={handleTitleSubmit}
                      onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                      autoFocus
                      className="bg-slate-800 border border-indigo-500 text-white font-bold text-base sm:text-lg rounded px-2 py-0.5 outline-none"
                    />
                  ) : (
                    <h1 
                      onClick={() => { setTitleInput(project.title); setIsEditingTitle(true); }}
                      className="font-bold text-base sm:text-lg text-slate-100 hover:text-indigo-300 cursor-pointer flex items-center gap-1.5 transition-colors line-clamp-1"
                      title="Click to edit project title"
                    >
                      {project.title}
                    </h1>
                  )}

                  <span className="capitalize bg-slate-800 text-indigo-400 border border-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline-block">
                    {project.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span>{project.options.length} Options</span>
                  <span>•</span>
                  <span>{project.criteria.length} Criteria</span>
                  {project.verdict?.confidenceScore && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">
                        {project.verdict.confidenceScore}% Confidence
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h1 className="font-bold text-base sm:text-lg text-slate-100">
                  The Tiebreaker
                </h1>
                <p className="text-[11px] text-slate-400">
                  AI Multi-Criteria Decision Framework
                </p>
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* History Drawer Trigger */}
            <button
              onClick={onOpenHistory}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors relative"
              title="Open Past Decisions Drawer"
            >
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {historyCount}
                </span>
              )}
            </button>

            {/* AI Assistant Button */}
            {project && (
              <button
                onClick={onOpenAiAssistant}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Refine</span>
              </button>
            )}

            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-indigo-400" />}
            </button>

            {/* Admin Panel Button (Admins only) */}
            {isAdmin && onOpenAdminPanel && (
              <button
                onClick={onOpenAdminPanel}
                className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                title="Open Admin User Management Panel"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                <span>Admin Panel</span>
              </button>
            )}

            {/* New Decision Button */}
            <button
              onClick={onNewDecision}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-indigo-400" />
              <span>New Decision</span>
            </button>

            {/* User Profile Menu & Sign Out */}
            {userProfile && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2.5 py-1 transition-colors"
                  title="User Profile & Account Settings"
                >
                  {userProfile.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={userProfile.displayName}
                      className="h-6 w-6 rounded-full object-cover border border-slate-600"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                      {(userProfile.displayName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-200 max-w-[100px] truncate hidden sm:inline-block">
                    {userProfile.displayName}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in duration-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-2 border-b border-slate-800 mb-1">
                      <p className="text-xs font-bold text-white truncate">{userProfile.displayName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{userProfile.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] uppercase font-bold px-2 py-0.2 rounded-full">
                          Administrator
                        </span>
                      )}
                    </div>

                    {isAdmin && onOpenAdminPanel && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenAdminPanel();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-indigo-600/20 flex items-center gap-2 transition-colors"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Admin Panel</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 flex items-center gap-2 transition-colors mt-1"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* View Navigation Tabs (Only if project is active) */}
        {project && (
          <div className="flex items-center gap-1 mt-3 border-t border-slate-800 pt-2 overflow-x-auto scrollbar-none">
            
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'summary'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Executive Verdict
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              Comparison Matrix
            </button>

            <button
              onClick={() => setActiveTab('swot')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'swot'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              SWOT Quad
            </button>

            <button
              onClick={() => setActiveTab('blindspots')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'blindspots'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              Blind Spots & Devil's Advocate
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </button>

            <button
              onClick={() => setActiveTab('sensitivity')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'sensitivity'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              Sensitivity
            </button>

            <button
              onClick={() => setActiveTab('tiebreaker')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                activeTab === 'tiebreaker'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Dices className="h-3.5 w-3.5 text-purple-400" />
              Coin Flip ("I'm Still Stuck")
            </button>

          </div>
        )}
      </div>
    </header>
  );
};
