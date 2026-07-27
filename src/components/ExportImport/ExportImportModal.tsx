import React, { useRef } from 'react';
import { 
  Download, 
  Upload, 
  Printer, 
  X, 
  FileJson, 
  FileSpreadsheet, 
  FileText, 
  FileDown, 
  CheckCircle2, 
  Sparkles,
  Table,
  SlidersHorizontal
} from 'lucide-react';
import { DecisionProject } from '../../types/decision';
import { exportProjectToJson } from '../../utils/storage';
import { exportProjectToCsv, exportProjectToPdf } from '../../utils/exportUtils';
import { calculateOptionResults } from '../../utils/decisionEngine';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: DecisionProject;
  onImportProject: (p: DecisionProject) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  project,
  onImportProject,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const results = calculateOptionResults(project);
  const winner = results[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.title && Array.isArray(parsed.options) && Array.isArray(parsed.criteria)) {
          onImportProject(parsed as DecisionProject);
          onClose();
        } else {
          alert('Invalid decision file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-inner">
              <Download className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-white">Export & Share Analysis</h2>
                <span className="text-[10px] font-semibold tracking-wider text-indigo-300 bg-indigo-950/80 border border-indigo-700/50 px-2 py-0.5 rounded-full uppercase">
                  Data Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Download structured evaluation spreadsheets, print PDF executive briefings, or back up JSON state
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Format Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. EXPORT CSV SPREADSHEET */}
            <button
              onClick={() => exportProjectToCsv(project)}
              className="p-5 rounded-2xl bg-slate-950/70 border border-emerald-900/40 hover:border-emerald-500/80 text-left space-y-3 group transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-emerald-950/30 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
              
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                  <span className="text-[11px] font-black tracking-widest text-emerald-200 uppercase">
                    CSV SPREADSHEET
                  </span>
                </div>
                <div className="h-8 w-8 rounded-xl bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 group-hover:border-emerald-400 transition-all shadow-sm">
                  <FileDown className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="font-bold text-white text-base group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span>Export CSV (.csv)</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Raw numerical grid formatted for Microsoft Excel, Google Sheets, or custom data pipelines.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-emerald-400/90 font-medium">
                <span className="flex items-center gap-1">
                  <Table className="h-3.5 w-3.5 text-emerald-500" />
                  Includes Matrix + SWOT + Blindspots
                </span>
                <span className="text-emerald-300 font-semibold underline underline-offset-2">Download .csv</span>
              </div>
            </button>

            {/* 2. EXPORT PDF REPORT */}
            <button
              onClick={() => exportProjectToPdf(project)}
              className="p-5 rounded-2xl bg-slate-950/70 border border-rose-900/40 hover:border-rose-500/80 text-left space-y-3 group transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-rose-950/30 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/10 transition-all" />

              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-700/60 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-rose-400" />
                  <span className="text-[11px] font-black tracking-widest text-rose-200 uppercase">
                    PDF DOCUMENT
                  </span>
                </div>
                <div className="h-8 w-8 rounded-xl bg-rose-950/50 text-rose-400 border border-rose-800/40 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-slate-950 group-hover:border-rose-400 transition-all shadow-sm">
                  <FileDown className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="font-bold text-white text-base group-hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  <span>Download PDF Report</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Executive multi-page report with visual winner badge, color-coded evaluation table & risk analysis.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-rose-400/90 font-medium">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-rose-400" />
                  Print-Ready Executive Brief
                </span>
                <span className="text-rose-300 font-semibold underline underline-offset-2">Download .pdf</span>
              </div>
            </button>

            {/* 3. EXPORT JSON BACKUP */}
            <button
              onClick={() => exportProjectToJson(project)}
              className="p-5 rounded-2xl bg-slate-950/70 border border-purple-900/40 hover:border-purple-500/80 text-left space-y-3 group transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-purple-950/30"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-700/60 flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-purple-400" />
                  <span className="text-[11px] font-black tracking-widest text-purple-200 uppercase">
                    JSON BACKUP
                  </span>
                </div>
                <div className="h-8 w-8 rounded-xl bg-purple-950/50 text-purple-400 border border-purple-800/40 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-slate-950 group-hover:border-purple-400 transition-all shadow-sm">
                  <FileDown className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="font-bold text-white text-base group-hover:text-purple-300 transition-colors">
                  Export Raw JSON
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Complete project state export to store locally or migrate between devices.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-purple-400/90 font-medium">
                <span className="flex items-center gap-1">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-purple-400" />
                  Full Decision State
                </span>
                <span className="text-purple-300 font-semibold underline underline-offset-2">Download .json</span>
              </div>
            </button>

            {/* 4. IMPORT JSON FILE */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-5 rounded-2xl bg-slate-950/70 border border-teal-900/40 hover:border-teal-500/80 text-left space-y-3 group transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-teal-950/30 relative"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-teal-950/80 text-teal-400 border border-teal-700/60 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-teal-400" />
                  <span className="text-[11px] font-black tracking-widest text-teal-200 uppercase">
                    RESTORE / IMPORT
                  </span>
                </div>
                <div className="h-8 w-8 rounded-xl bg-teal-950/50 text-teal-400 border border-teal-800/40 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-slate-950 group-hover:border-teal-400 transition-all shadow-sm">
                  <Upload className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="font-bold text-white text-base group-hover:text-teal-300 transition-colors">
                  Import JSON File
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Upload a previously saved .json decision file to restore scores, criteria and analysis.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-teal-400/90 font-medium">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                  Instant Local Restore
                </span>
                <span className="text-teal-300 font-semibold underline underline-offset-2">Select File...</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </button>
          </div>

          {/* Decision Summary Card Preview */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Active Project Summary
              </span>
              <button
                onClick={handlePrintReport}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 bg-indigo-950/50 hover:bg-indigo-900/50 border border-indigo-700/40 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                Browser Print View
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Topic</span>
                <div className="font-bold text-white text-sm truncate">{project.title}</div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Leading Winner</span>
                <div className="font-bold text-emerald-400 text-sm truncate">
                  {winner ? `${winner.option.name} (${winner.normalizedPercentage}% Match)` : 'No options yet'}
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Options ({project.options.length})</span>
                <div className="text-slate-300 truncate">
                  {project.options.map((o) => o.name).join(', ') || 'None'}
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Criteria ({project.criteria.length})</span>
                <div className="text-slate-300 truncate">
                  {project.criteria.map((c) => c.name).join(', ') || 'None'}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

