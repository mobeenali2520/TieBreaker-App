/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DecisionProject, ClarifyingQuestion } from './types/decision';
import { 
  loadAllProjects, 
  saveSingleProject, 
  deleteProject,
  getActiveProjectId
} from './utils/storage';
import { fetchAiIntakeQuestions, fetchAiFullAnalysis } from './utils/aiService';

import { Header } from './components/Header';
import { HistoryDrawer } from './components/History/HistoryDrawer';
import { CleanSlateHome } from './components/Home/CleanSlateHome';
import { IntakeClarificationView } from './components/Intake/IntakeClarificationView';
import { ReportView } from './components/ReportView';

import { AiAssistantModal } from './components/AiAssistant/AiAssistantModal';
import { TemplatesModal } from './components/Templates/TemplatesModal';
import { ExportImportModal } from './components/ExportImport/ExportImportModal';
import { AlertTriangle, X } from 'lucide-react';

export default function App() {
  // App navigation state
  const [viewMode, setViewMode] = useState<'home' | 'intake' | 'report'>('home');
  const [activeTab, setActiveTab] = useState<'summary' | 'matrix' | 'swot' | 'blindspots' | 'analytics' | 'sensitivity' | 'tiebreaker'>('summary');
  const [darkMode, setDarkMode] = useState(true);

  // History & Storage
  const [allProjects, setAllProjects] = useState<DecisionProject[]>([]);
  const [activeProject, setActiveProject] = useState<DecisionProject | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Intake State
  const [currentDilemma, setCurrentDilemma] = useState('');
  const [candidateOptions, setCandidateOptions] = useState<string[]>([]);
  const [intakeQuestions, setIntakeQuestions] = useState<ClarifyingQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  // Modals
  const [showAiModal, setShowAiModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Initial Load from local storage
  useEffect(() => {
    const loaded = loadAllProjects();
    setAllProjects(loaded);
    const activeId = getActiveProjectId();
    if (activeId && loaded.length > 0) {
      const active = loaded.find((p) => p.id === activeId);
      if (active) {
        setActiveProject(active);
        setViewMode('report');
      }
    }
  }, []);

  // Sync dark mode class on document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Save Project Handler
  const handleUpdateProject = (updated: DecisionProject) => {
    setActiveProject(updated);
    const newAllList = saveSingleProject(updated);
    setAllProjects(newAllList);
  };

  // Toggle Favorite
  const handleToggleFavorite = (project: DecisionProject) => {
    const updated = { ...project, isFavorite: !project.isFavorite };
    handleUpdateProject(updated);
  };

  // Delete Project
  const handleDeleteProject = (id: string) => {
    const updatedList = deleteProject(id);
    setAllProjects(updatedList);
    if (activeProject?.id === id) {
      setActiveProject(null);
      setViewMode('home');
    }
  };

  // Switch Active Project from History
  const handleSelectProject = (projId: string) => {
    const target = allProjects.find((p) => p.id === projId);
    if (target) {
      setActiveProject(target);
      setViewMode('report');
      setActiveTab('summary');
    }
  };

  // 1. Start Intake Workflow from Home Screen
  const handleStartIntake = async (dilemma: string, options: string[]) => {
    setCurrentDilemma(dilemma);
    setCandidateOptions(options);
    setViewMode('intake');
    setIsLoadingQuestions(true);

    const result = await fetchAiIntakeQuestions(dilemma, options);
    setIntakeQuestions(result.questions);
    if (result.quotaErrorNotice) {
      setQuotaNotice(result.quotaErrorNotice);
    } else {
      setQuotaNotice(null);
    }
    setIsLoadingQuestions(false);
  };

  // 2. Submit Intake Answers & Generate Deep Analysis
  const handleSubmitIntakeAnswers = async (answers: Record<string, string>) => {
    setIsGeneratingAnalysis(true);

    const analysisData = await fetchAiFullAnalysis(currentDilemma, answers, candidateOptions);
    if (analysisData.quotaErrorNotice) {
      setQuotaNotice(analysisData.quotaErrorNotice);
    }

    const newProject: DecisionProject = {
      id: `proj_${Date.now()}`,
      title: analysisData.title || currentDilemma,
      description: currentDilemma,
      category: analysisData.category || 'general',
      options: analysisData.options || [],
      criteria: analysisData.criteria || [],
      scores: analysisData.scores || {},
      intakeQuestions: intakeQuestions.map((q) => ({ ...q, answer: answers[q.id] })),
      swot: analysisData.swot,
      blindSpots: analysisData.blindSpots,
      devilsAdvocate: analysisData.devilsAdvocate,
      tenTenTen: analysisData.tenTenTen,
      verdict: analysisData.verdict,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setIsGeneratingAnalysis(false);
    handleUpdateProject(newProject);
    setViewMode('report');
    setActiveTab('summary');
  };

  // New Decision CTA (resets view to clean slate home)
  const handleNewDecision = () => {
    setActiveProject(null);
    setCurrentDilemma('');
    setCandidateOptions([]);
    setQuotaNotice(null);
    setViewMode('home');
  };

  // Print Handler
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200`}>
      
      {/* Header Bar */}
      <Header
        project={activeProject}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onUpdateProject={handleUpdateProject}
        onOpenHistory={() => setShowHistoryDrawer(true)}
        onNewDecision={handleNewDecision}
        onOpenTemplates={() => setShowTemplatesModal(true)}
        onOpenAiAssistant={() => setShowAiModal(true)}
        onOpenExportImport={() => setShowExportModal(true)}
        historyCount={allProjects.length}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onPrintReport={handlePrintReport}
      />

      {/* Quota Banner Notice for Report Mode */}
      {viewMode === 'report' && quotaNotice && (
        <div className="bg-amber-950/80 border-b border-amber-600/40 text-amber-200 text-xs px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>Daily AI Quota Reached:</strong> {quotaNotice} Generated using our local synthesis engine so your workflow is uninterrupted.</span>
          </div>
          <button onClick={() => setQuotaNotice(null)} className="p-1 hover:text-white shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: Clean Slate Home Screen */}
        {viewMode === 'home' && (
          <CleanSlateHome
            onStartIntake={handleStartIntake}
            onOpenTemplates={() => setShowTemplatesModal(true)}
          />
        )}

        {/* VIEW 2: AI Intake Clarification (Step 1) */}
        {viewMode === 'intake' && (
          <IntakeClarificationView
            dilemma={currentDilemma}
            questions={intakeQuestions}
            isLoadingQuestions={isLoadingQuestions}
            isGeneratingAnalysis={isGeneratingAnalysis}
            quotaNotice={quotaNotice}
            onSubmitAnswers={handleSubmitIntakeAnswers}
            onBackToHome={() => setViewMode('home')}
          />
        )}

        {/* VIEW 3: Active Decision Report Workspace */}
        {viewMode === 'report' && activeProject && (
          <ReportView
            project={activeProject}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onUpdateProject={handleUpdateProject}
            onOpenAiAssistant={() => setShowAiModal(true)}
            onPrintReport={handlePrintReport}
            quotaNotice={quotaNotice}
            onDismissQuotaNotice={() => setQuotaNotice(null)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>The Tiebreaker • Executive Decision Framework & Analysis</div>
          <div>All decision data saved locally in your browser</div>
        </div>
      </footer>

      {/* History Slide-Out Drawer */}
      <HistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        projects={allProjects}
        activeProjectId={activeProject?.id || null}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewDecision}
        onDeleteProject={handleDeleteProject}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Modals */}
      {activeProject && (
        <>
          <AiAssistantModal
            isOpen={showAiModal}
            onClose={() => setShowAiModal(false)}
            project={activeProject}
            onUpdateProject={handleUpdateProject}
          />

          <ExportImportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            project={activeProject}
            onImportProject={(imported) => {
              handleUpdateProject(imported);
              setViewMode('report');
            }}
          />
        </>
      )}

      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={(templateProj) => {
          handleUpdateProject(templateProj);
          setViewMode('report');
        }}
      />

    </div>
  );
}
