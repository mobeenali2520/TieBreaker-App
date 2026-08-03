import { create } from 'zustand';
import { DecisionProject, ClarifyingQuestion } from '../types/decision';

interface AppState {
  viewMode: 'home' | 'intake' | 'report';
  setViewMode: (mode: 'home' | 'intake' | 'report') => void;

  activeTab: 'summary' | 'matrix' | 'swot' | 'blindspots' | 'analytics' | 'sensitivity' | 'tiebreaker';
  setActiveTab: (tab: 'summary' | 'matrix' | 'swot' | 'blindspots' | 'analytics' | 'sensitivity' | 'tiebreaker') => void;

  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;

  allProjects: DecisionProject[];
  setAllProjects: (projects: DecisionProject[]) => void;

  activeProject: DecisionProject | null;
  setActiveProject: (project: DecisionProject | null) => void;

  showHistoryDrawer: boolean;
  setShowHistoryDrawer: (show: boolean) => void;

  currentDilemma: string;
  setCurrentDilemma: (dilemma: string) => void;

  candidateOptions: string[];
  setCandidateOptions: (options: string[]) => void;

  intakeQuestions: ClarifyingQuestion[];
  setIntakeQuestions: (questions: ClarifyingQuestion[]) => void;

  intakeCategory: string | null;
  setIntakeCategory: (category: string | null) => void;

  intakeDetectedOptions: string[];
  setIntakeDetectedOptions: (options: string[]) => void;

  isLoadingQuestions: boolean;
  setIsLoadingQuestions: (loading: boolean) => void;

  isGeneratingAnalysis: boolean;
  setIsGeneratingAnalysis: (generating: boolean) => void;

  quotaNotice: string | null;
  setQuotaNotice: (notice: string | null) => void;

  showAiModal: boolean;
  setShowAiModal: (show: boolean) => void;

  showTemplatesModal: boolean;
  setShowTemplatesModal: (show: boolean) => void;

  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;

  showAdminPanel: boolean;
  setShowAdminPanel: (show: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  viewMode: 'home',
  setViewMode: (mode) => set({ viewMode: mode }),

  activeTab: 'summary',
  setActiveTab: (tab) => set({ activeTab: tab }),

  darkMode: true,
  setDarkMode: (dark) => set({ darkMode: dark }),

  allProjects: [],
  setAllProjects: (projects) => set({ allProjects: projects }),

  activeProject: null,
  setActiveProject: (project) => set({ activeProject: project }),

  showHistoryDrawer: false,
  setShowHistoryDrawer: (show) => set({ showHistoryDrawer: show }),

  currentDilemma: '',
  setCurrentDilemma: (dilemma) => set({ currentDilemma: dilemma }),

  candidateOptions: [],
  setCandidateOptions: (options) => set({ candidateOptions: options }),

  intakeQuestions: [],
  setIntakeQuestions: (questions) => set({ intakeQuestions: questions }),

  intakeCategory: null,
  setIntakeCategory: (category) => set({ intakeCategory: category }),

  intakeDetectedOptions: [],
  setIntakeDetectedOptions: (options) => set({ intakeDetectedOptions: options }),

  isLoadingQuestions: false,
  setIsLoadingQuestions: (loading) => set({ isLoadingQuestions: loading }),

  isGeneratingAnalysis: false,
  setIsGeneratingAnalysis: (generating) => set({ isGeneratingAnalysis: generating }),

  quotaNotice: null,
  setQuotaNotice: (notice) => set({ quotaNotice: notice }),

  showAiModal: false,
  setShowAiModal: (show) => set({ showAiModal: show }),

  showTemplatesModal: false,
  setShowTemplatesModal: (show) => set({ showTemplatesModal: show }),

  showExportModal: false,
  setShowExportModal: (show) => set({ showExportModal: show }),

  showAdminPanel: false,
  setShowAdminPanel: (show) => set({ showAdminPanel: show }),
}));