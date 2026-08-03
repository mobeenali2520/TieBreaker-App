/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Plus, 
  X, 
  Briefcase, 
  Home as HomeIcon, 
  DollarSign, 
  Cpu, 
  Layers, 
  Compass, 
  ShieldAlert, 
  Scale,
  Paperclip,
  FileText,
  FileSpreadsheet,
  FileImage,
  File as FileIcon,
  Trash2
} from 'lucide-react';

import { useAppStore } from '../../store/useAppStore';

interface AttachedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  content?: string;
}

interface CleanSlateHomeProps {
  onStartIntake: (dilemma: string, options: string[]) => void;
}

export const CleanSlateHome: React.FC<CleanSlateHomeProps> = ({
  onStartIntake,
}) => {
  const { setShowTemplatesModal } = useAppStore();
  const onOpenTemplates = () => setShowTemplatesModal(true);

  const [dilemma, setDilemma] = useState('');
  const [candidateOptions, setCandidateOptions] = useState<string[]>(['', '']);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickPrompts = [
    {
      title: 'Career Move',
      query: 'Should I accept a new high-pay startup offer or stay at my stable corporate position?',
      options: ['Accept Startup Offer', 'Stay at Corporate Role'],
      icon: Briefcase,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Housing Dilemma',
      query: 'Should I buy a house in the suburbs or continue renting a downtown apartment?',
      options: ['Buy Suburban House', 'Rent Downtown Apartment'],
      icon: HomeIcon,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Tech Architecture',
      query: 'Build a custom backend infrastructure or adopt an all-in-one managed SaaS stack?',
      options: ['Build Custom In-House', 'Adopt Managed SaaS'],
      icon: Cpu,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Business Strategy',
      query: 'Focus on expanding into new international markets vs doubling down on core product retention?',
      options: ['Expand International Markets', 'Double Down Core Product'],
      icon: DollarSign,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Relocation',
      query: 'Move to a high cost-of-living tech hub or stay remote in my current hometown?',
      options: ['Relocate to Tech Hub', 'Stay Remote in Hometown'],
      icon: Compass,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
  ];

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...candidateOptions];
    updated[index] = val;
    setCandidateOptions(updated);
  };

  const addOptionField = () => {
    if (candidateOptions.length < 5) {
      setCandidateOptions([...candidateOptions, '']);
    }
  };

  const removeOptionField = (index: number) => {
    if (candidateOptions.length > 2) {
      setCandidateOptions(candidateOptions.filter((_, i) => i !== index));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFilesAdded = async (filesList: File[]) => {
    const newFiles: AttachedFile[] = [];
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      let content = '';

      if (
        file.type.startsWith('text/') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.txt')
      ) {
        try {
          content = await file.text();
        } catch {
          content = '';
        }
      }

      newFiles.push({
        id: `att_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || 'file',
        content: content ? content.slice(0, 1500) : undefined,
      });
    }
    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeAttachedFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dilemma.trim()) return;

    const validOpts = candidateOptions.filter((o) => o.trim().length > 0);

    let finalPrompt = dilemma.trim();
    if (attachedFiles.length > 0) {
      const attachmentsSummary = attachedFiles
        .map((f) => {
          if (f.content) {
            return `[File Attachment: ${f.name} (${f.size})]\nContent Snippet: ${f.content}`;
          }
          return `[File Attachment: ${f.name} (${f.size})]`;
        })
        .join('\n\n');

      finalPrompt += `\n\n=== ATTACHED CONTEXT & DOCUMENTS ===\n${attachmentsSummary}`;
    }

    onStartIntake(finalPrompt, validOpts);
  };

  const handleQuickPromptSelect = (prompt: typeof quickPrompts[0]) => {
    setDilemma(prompt.query);
    setCandidateOptions(prompt.options);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-14 px-4 flex flex-col items-center justify-center">
      
      {/* Subtle Brand Eyebrow */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-indigo-400 font-medium mb-6 shadow-xl">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
        <span>The Tiebreaker • AI Decision Engine</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-5xl font-extrabold text-white text-center tracking-tight leading-tight max-w-2xl">
        Move from analysis paralysis to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">confident decisions</span>
      </h1>

      <p className="mt-3 text-slate-400 text-sm sm:text-base text-center max-w-xl leading-relaxed">
        Structured analytical reasoning, trade-off comparison, blind spot detection, and devil's advocate testing — tailored to your non-negotiables.
      </p>

      {/* Primary Input Container (Gemini / ChatGPT Style) */}
      <form 
        onSubmit={handleSubmit}
        className="w-full mt-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl ring-1 ring-slate-800/80 hover:border-slate-700 transition-all"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="dilemma-input" className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              1. WHAT CRITICAL DECISION ARE YOU EVALUATING TODAY?
            </label>
            <textarea
              id="dilemma-input"
              rows={3}
              value={dilemma}
              onChange={(e) => setDilemma(e.target.value)}
              placeholder="e.g., Should I accept the senior staff engineering offer at a Series B startup vs staying as lead at my current enterprise company?"
              className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Option candidates (Optional) */}
          <div className="pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                2. OPTIONS TO COMPARE <span className="text-slate-400 font-normal lowercase">(optional — AI will infer if empty)</span>
              </span>
              {candidateOptions.length < 5 && (
                <button
                  type="button"
                  onClick={addOptionField}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Choice</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {candidateOptions.map((opt, idx) => (
                <div key={idx} className="relative flex items-center">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1} (e.g. ${idx === 0 ? 'Accept Offer A' : 'Stay in Role B'})`}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  {candidateOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOptionField(idx)}
                      className="absolute right-2 p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      aria-label={`Remove option ${idx + 1}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Attach Supporting Files */}
          <div className="pt-3 border-t border-slate-800/60 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-200">
                <Paperclip className="w-4 h-4 text-indigo-400" />
                <span>3. ATTACH SUPPORTING FILES OR DOCUMENTS (ANY FORMAT)</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                PDFs, Word, Spreadsheets, Images, CSVs, Offers
              </span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.length) {
                  handleFilesAdded(Array.from(e.dataTransfer.files));
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-950/40 shadow-lg shadow-indigo-950/50'
                  : 'border-indigo-500/30 hover:border-indigo-400/80 bg-slate-950/40 hover:bg-slate-950/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handleFilesAdded(Array.from(e.target.files));
                    e.target.value = '';
                  }
                }}
                className="hidden"
              />

              <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2 shadow-inner">
                <Paperclip className="w-5 h-5 text-indigo-400" />
              </div>

              <div className="text-sm font-semibold text-slate-200">
                Click or Drag to attach files for context
              </div>

              <p className="text-xs text-slate-400 mt-1">
                Supports any document, screenshot, contract, spreadsheet, or notes
              </p>
            </div>

            {/* Attached File Cards */}
            {attachedFiles.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-indigo-900/40 text-xs text-slate-200 shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-700/50 text-indigo-400 shrink-0">
                        {file.name.endsWith('.csv') || file.name.endsWith('.xlsx') ? (
                          <FileSpreadsheet className="w-4 h-4" />
                        ) : file.name.match(/\.(png|jpg|jpeg|webp|gif)$/i) ? (
                          <FileImage className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-slate-200 truncate">{file.name}</div>
                        <div className="text-[10px] text-slate-400">{file.size} • Attached</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAttachedFile(file.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg shrink-0 transition-colors"
                      title="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onOpenTemplates}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Explore Decision Templates</span>
            </button>

            <button
              type="submit"
              disabled={!dilemma.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 transition-all hover:scale-[1.02]"
            >
              <span>Begin AI Intake</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Quick Suggestion Pills */}
      <div className="w-full mt-10 space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
          Or Jumpstart With a Common Dilemma
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickPrompts.map((p, idx) => {
            const Icon = p.icon;
            return (
              <button
                key={idx}
                onClick={() => handleQuickPromptSelect(p)}
                className="text-left p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`p-1 rounded-md border ${p.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {p.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {p.query}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Analytical Guarantee Footer */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center border-t border-slate-800/60 pt-6 w-full text-xs text-slate-400">
        <div className="flex flex-col items-center gap-1">
          <Scale className="w-4 h-4 text-indigo-400 mb-0.5" />
          <span className="font-semibold text-slate-300">Weighted Matrix</span>
          <span className="text-[11px] text-slate-400">Objective scoring across priorities</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ShieldAlert className="w-4 h-4 text-amber-400 mb-0.5" />
          <span className="font-semibold text-slate-300">Devil's Advocate</span>
          <span className="text-[11px] text-slate-400">Challenges hidden confirmation bias</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Sparkles className="w-4 h-4 text-emerald-400 mb-0.5" />
          <span className="font-semibold text-slate-300">10-10-10 Framework</span>
          <span className="text-[11px] text-slate-400">10 Min, 10 Month & 10 Year perspective</span>
        </div>
      </div>

    </div>
  );
};
