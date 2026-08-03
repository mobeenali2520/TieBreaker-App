import React from 'react';
import { DecisionProject } from '../../types/decision';
import { ExecutiveSummaryView } from './ExecutiveSummaryView';
import { MatrixView } from '../DecisionMatrix/MatrixView';
import { SwotMatrixView } from './SwotMatrixView';
import { BlindSpotsView } from './BlindSpotsView';
import { AnalyticsView } from '../Analytics/AnalyticsView';
import { SensitivityView } from '../Sensitivity/SensitivityView';
import { TieBreakerView } from '../TieBreaker/TieBreakerView';
import { AlertTriangle, X } from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';

export interface ReportViewProps {
  onUpdateProject: (p: DecisionProject) => void;
  onPrintReport: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  onUpdateProject,
  onPrintReport,
}) => {
  const { 
    activeProject, 
    activeTab, 
    setActiveTab, 
    setShowAiModal,
    quotaNotice,
    setQuotaNotice 
  } = useAppStore();
  const onOpenAiAssistant = () => setShowAiModal(true);
  const onDismissQuotaNotice = () => setQuotaNotice(null);
  
  if (!activeProject) return null;
  const project = activeProject;
  return (
    <div className="space-y-6">
      {/* Quota / AI Provider Error Notice */}
      {quotaNotice && (
        <div className="bg-amber-950/80 border border-amber-600/50 text-amber-200 text-xs px-4 py-3 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Service Notification:</strong> {quotaNotice} Local synthesis engine was used so your workflow remains uninterrupted.
            </span>
          </div>
          {onDismissQuotaNotice && (
            <button onClick={onDismissQuotaNotice} className="p-1 hover:text-white shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* View Tabs */}
      {activeTab === 'summary' && (
        <ExecutiveSummaryView
          project={project}
          onNavigateTab={setActiveTab}
          onPrint={onPrintReport}
        />
      )}

      {activeTab === 'matrix' && (
        <MatrixView
          project={project}
          onUpdateProject={onUpdateProject}
          onNavigateToTieBreaker={() => setActiveTab('tiebreaker')}
          onOpenAiAssistant={onOpenAiAssistant}
        />
      )}

      {activeTab === 'swot' && (
        <SwotMatrixView
          project={project}
          onUpdateProject={onUpdateProject}
        />
      )}

      {activeTab === 'blindspots' && (
        <BlindSpotsView project={project} />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsView project={project} />
      )}

      {activeTab === 'sensitivity' && (
        <SensitivityView
          project={project}
          onUpdateProject={onUpdateProject}
        />
      )}

      {activeTab === 'tiebreaker' && (
        <TieBreakerView project={project} />
      )}
    </div>
  );
};
