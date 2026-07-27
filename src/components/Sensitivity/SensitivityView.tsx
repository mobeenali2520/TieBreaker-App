import React, { useState } from 'react';
import { Sliders, AlertTriangle, ArrowRightLeft, Sparkles, CheckCircle, Info } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { DecisionProject } from '../../types/decision';
import { calculateSensitivityAnalysis } from '../../utils/decisionEngine';

interface SensitivityViewProps {
  project: DecisionProject;
  onUpdateProject: (p: DecisionProject) => void;
}

export const SensitivityView: React.FC<SensitivityViewProps> = ({
  project,
  onUpdateProject,
}) => {
  const [selectedCritId, setSelectedCritId] = useState<string>(
    project.criteria[0]?.id || ''
  );

  const selectedCriterion = project.criteria.find((c) => c.id === selectedCritId);

  if (!selectedCriterion || project.criteria.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        Add criteria in the Decision Matrix grid to run sensitivity analysis.
      </div>
    );
  }

  const sensitivityData = calculateSensitivityAnalysis(project, selectedCriterion.id);

  // Transform points for Recharts LineChart
  const chartPoints = sensitivityData.points.map((pt) => {
    const row: Record<string, any> = { weight: `Weight ${pt.weight}` };
    project.options.forEach((opt) => {
      row[opt.name] = pt.optionScores[opt.id];
    });
    return row;
  });

  const handleApplyWeight = (newWeight: number) => {
    const updatedCriteria = project.criteria.map((c) => (c.id === selectedCritId ? { ...c, weight: newWeight } : c));
    onUpdateProject({ ...project, criteria: updatedCriteria });
  };

  return (
    <div className="space-y-6">
      {/* Sensitivity Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-indigo-400" />
              "What-If" Sensitivity Analysis Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Simulate how shifting a single criterion's importance weight (1 to 10) affects option rankings and identifies decision crossover points.
            </p>
          </div>

          {/* Criterion Dropdown Selector */}
          <div className="shrink-0">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Select Criterion to Test
            </label>
            <select
              value={selectedCritId}
              onChange={(e) => setSelectedCritId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-sm rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
            >
              {project.criteria.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Current weight: {c.weight})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Crossover Rank Alert Box */}
        {sensitivityData.rankChanges.length > 0 ? (
          <div className="bg-amber-950/50 border border-amber-600/40 rounded-xl p-4 text-amber-200 text-xs sm:text-sm flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">Crossover Shift Detected: </span>
              {sensitivityData.rankChanges.map((rc, idx) => (
                <span key={idx} className="block mt-0.5">
                  • At weight <strong>{rc.weightThreshold}</strong>, leadership flips to <strong>{rc.newLeaderName}</strong>!
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border border-emerald-600/30 rounded-xl p-3 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Robust Decision: The current winner holds top spot regardless of how this criterion's weight shifts.</span>
          </div>
        )}
      </div>

      {/* Interactive Weight Slider Test Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-200 text-sm">
              Live Weight Slider: {selectedCriterion.name}
            </h3>
            <p className="text-xs text-slate-400">
              Current project weight is <strong>{selectedCriterion.weight}</strong>. Slide to test variations:
            </p>
          </div>

          <button
            onClick={() => handleApplyWeight(selectedCriterion.weight)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow transition-colors"
          >
            Save Weight ({selectedCriterion.weight})
          </button>
        </div>

        <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400">Low (1)</span>
          <input
            type="range"
            min="1"
            max="10"
            value={selectedCriterion.weight}
            onChange={(e) => handleApplyWeight(Number(e.target.value))}
            className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-400">High (10)</span>
          <span className="text-lg font-black text-indigo-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
            {selectedCriterion.weight}
          </span>
        </div>
      </div>

      {/* Recharts Sensitivity Trend Line Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-indigo-400" />
            Score Trajectory vs Weight (1 - 10)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Normalized score percentage trajectory for each option across all weight levels.
          </p>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartPoints} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="weight" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                formatter={(val: any) => [`${val}%`, 'Score']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#e2e8f0' }} />
              {project.options.map((opt) => (
                <Line
                  key={opt.id}
                  type="monotone"
                  dataKey={opt.name}
                  stroke={opt.color}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
