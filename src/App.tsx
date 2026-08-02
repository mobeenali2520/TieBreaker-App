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
  clearAllProjects,
  getActiveProjectId,
  fetchUserProjectsFromFirestore,
  saveProjects,
  getDeletedProjectIds,
  deleteProjectFromFirestore
} from './utils/storage';
import { fetchAiIntakeQuestions, fetchAiFullAnalysis } from './utils/aiService';

import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/Auth/LoginScreen';
import { AccessRevokedScreen } from './components/Auth/AccessRevokedScreen';
import { AdminPanelModal } from './components/Admin/AdminPanelModal';

import { Header } from './components/Header';
import { HistoryDrawer } from './components/History/HistoryDrawer';
import { CleanSlateHome } from './components/Home/CleanSlateHome';
import { IntakeClarificationView } from './components/Intake/IntakeClarificationView';
import { ReportView } from './components/ReportView';

import { AiAssistantModal } from './components/AiAssistant/AiAssistantModal';
import { TemplatesModal } from './components/Templates/TemplatesModal';
import { ExportImportModal } from './components/ExportImport/ExportImportModal';
import { AlertTriangle, X, Sparkles } from 'lucide-react';

function MainAppContent() {
  const { currentUser, userProfile, loading, isRevoked } = useAuth();

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
  const [intakeCategory, setIntakeCategory] = useState<string | null>(null);
  const [intakeDetectedOptions, setIntakeDetectedOptions] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  // Modals
  const [showAiModal, setShowAiModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

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

  // Sync projects with Firestore when logged in
  useEffect(() => {
    if (!currentUser) return;

    fetchUserProjectsFromFirestore(currentUser.uid).then((remoteProjects) => {
      const deletedIds = getDeletedProjectIds();

      // Clean up remote projects that were deleted locally
      if (remoteProjects && remoteProjects.length > 0) {
        remoteProjects.forEach((rp) => {
          if (deletedIds.includes(rp.id)) {
            deleteProjectFromFirestore(rp.id);
          }
        });
      }

      const validRemote = (remoteProjects || []).filter((rp) => !deletedIds.includes(rp.id));
      const local = loadAllProjects(); // Already filters out deletedIds

      const map = new Map<string, DecisionProject>();
      local.forEach((p) => map.set(p.id, p));
      validRemote.forEach((rp) => {
        const existing = map.get(rp.id);
        if (!existing || (rp.updatedAt || 0) >= (existing.updatedAt || 0)) {
          map.set(rp.id, rp);
        }
      });

      const merged = Array.from(map.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setAllProjects(merged);
      saveProjects(merged);

      // Upload any local-only projects to Firestore
      local.forEach((p) => {
        if (!deletedIds.includes(p.id) && !validRemote.some((rp) => rp.id === p.id)) {
          saveSingleProject(p);
        }
      });
    }).catch((err) => console.warn("Firestore projects sync warning:", err));
  }, [currentUser]);

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

  // Clear All Projects
  const handleClearAllProjects = () => {
    clearAllProjects();
    setAllProjects([]);
    setActiveProject(null);
    setViewMode('home');
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
    setIntakeCategory(null);
    setIntakeDetectedOptions([]);
    setViewMode('intake');
    setIsLoadingQuestions(true);

    const result = await fetchAiIntakeQuestions(dilemma, options);
    setIntakeQuestions(result.questions);
    if (result.category) setIntakeCategory(result.category);
    if (result.options && result.options.length > 0) {
      setIntakeDetectedOptions(result.options);
      if (options.length === 0) {
        setCandidateOptions(result.options);
      }
    }

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

  // Loading state while verifying auth session
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl mb-4 shadow-lg shadow-indigo-500/10">
          <Sparkles className="h-8 w-8 text-indigo-400 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Verifying session security credentials...</p>
      </div>
    );
  }

  // Unauthenticated user -> Login Screen
  if (!currentUser) {
    return <LoginScreen />;
  }

  // Revoked access user -> Access Revoked Screen
  if (isRevoked) {
    return <AccessRevokedScreen />;
  }

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
        onOpenAdminPanel={() => setShowAdminPanel(true)}
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
            category={intakeCategory}
            detectedOptions={intakeDetectedOptions}
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
          <div className="text-[11px] text-slate-400">Gemini can make mistakes. Please verify important information.</div>
          <div>Protected with Google Authentication & Firestore Access Control</div>
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
        onClearAllProjects={handleClearAllProjects}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Admin Panel Modal */}
      <AdminPanelModal
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
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

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

