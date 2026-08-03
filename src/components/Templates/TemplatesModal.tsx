import React from 'react';
import { BookmarkCheck, X, Briefcase, Home, Code, Palmtree, ArrowRight } from 'lucide-react';
import { PRESET_TEMPLATES } from '../../data/templates';
import { DecisionProject, Option, Criterion } from '../../types/decision';

import { useAppStore } from '../../store/useAppStore';

interface TemplatesModalProps {
  onSelectTemplate: (project: DecisionProject) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  onSelectTemplate,
}) => {
  const { showTemplatesModal: isOpen, setShowTemplatesModal } = useAppStore();
  const onClose = () => setShowTemplatesModal(false);

  if (!isOpen) return null;

  const handleApplyTemplate = (template: typeof PRESET_TEMPLATES[0]) => {
    const options: Option[] = template.options.map((opt, i) => ({
      ...opt,
      id: `opt_tpl_${Date.now()}_${i}`,
    }));

    const criteria: Criterion[] = template.criteria.map((crit, i) => ({
      ...crit,
      id: `crit_tpl_${Date.now()}_${i}`,
    }));

    const scores: Record<string, number> = {};
    if (template.defaultScores) {
      options.forEach((opt, optIdx) => {
        criteria.forEach((crit, critIdx) => {
          const key = `${opt.id}_${crit.id}`;
          const tplKey = `opt${optIdx}_crit${critIdx}`;
          scores[key] = template.defaultScores?.[tplKey] ?? 7;
        });
      });
    }

    const newProject: DecisionProject = {
      id: `proj_${Date.now()}`,
      title: template.title,
      description: template.description,
      category: template.category,
      options,
      criteria,
      scores,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onSelectTemplate(newProject);
    onClose();
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase': return <Briefcase className="h-5 w-5 text-indigo-400" />;
      case 'Home': return <Home className="h-5 w-5 text-emerald-400" />;
      case 'Code': return <Code className="h-5 w-5 text-purple-400" />;
      case 'Palmtree': return <Palmtree className="h-5 w-5 text-amber-400" />;
      default: return <BookmarkCheck className="h-5 w-5 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <BookmarkCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Preset Decision Templates</h2>
              <p className="text-xs text-slate-400">Jumpstart your comparison with pre-configured criteria</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRESET_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => handleApplyTemplate(tpl)}
                className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 group-hover:bg-slate-800">
                    {getIcon(tpl.icon)}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {tpl.options.length} options
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                    {tpl.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {tpl.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-semibold">
                  <span>Load Template</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
