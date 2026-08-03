/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Dices, 
  RotateCw, 
  Trophy, 
  Sparkles, 
  Swords, 
  Coins, 
  RefreshCw,
  Plus,
  Trash2,
  HeartHandshake
} from 'lucide-react';
import { DecisionProject, Option } from '../../types/decision';

interface TieBreakerViewProps {
  project: DecisionProject;
  onSelectWinner?: (option: Option) => void;
}

export const TieBreakerView: React.FC<TieBreakerViewProps> = ({ project }) => {
  const [mode, setMode] = useState<'coin' | 'wheel' | 'pairwise'>('coin');

  // --- Wheel State ---
  const [wheelItems, setWheelItems] = useState<string[]>(
    project.options.map((o) => o.name)
  );
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelWinner, setWheelWinner] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef(0);

  // Sync wheel items when project changes
  useEffect(() => {
    if (project.options.length > 0) {
      setWheelItems(project.options.map((o) => o.name));
    }
  }, [project.options]);

  // Draw Spinner Wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || wheelItems.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;
    const sliceAngle = (2 * Math.PI) / wheelItems.length;

    ctx.clearRect(0, 0, width, height);

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#14b8a6', '#ea580c'];

    wheelItems.forEach((item, i) => {
      const startAngle = currentAngleRef.current + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // Text label
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(item.length > 16 ? item.substring(0, 14) + '...' : item, radius - 20, 5);
      ctx.restore();
    });

    // Center hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPIN', centerX, centerY + 4);
  }, [wheelItems]);

  // Spin Wheel Animation
  const spinWheel = () => {
    if (isSpinning || wheelItems.length < 2) return;
    setIsSpinning(true);
    setWheelWinner(null);

    const spinDuration = 4000;
    const extraRounds = 5 + Math.random() * 5;
    const totalRotation = extraRounds * 2 * Math.PI + Math.random() * 2 * Math.PI;
    const startAngle = currentAngleRef.current;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      currentAngleRef.current = startAngle + totalRotation * easeProgress;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          const centerX = width / 2;
          const centerY = height / 2;
          const radius = Math.min(centerX, centerY) - 15;
          const sliceAngle = (2 * Math.PI) / wheelItems.length;

          ctx.clearRect(0, 0, width, height);
          const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#14b8a6', '#ea580c'];

          wheelItems.forEach((item, i) => {
            const sAngle = currentAngleRef.current + i * sliceAngle;
            const eAngle = sAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, sAngle, eAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#0f172a';
            ctx.stroke();

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(sAngle + sliceAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText(item.length > 16 ? item.substring(0, 14) + '...' : item, radius - 20, 5);
            ctx.restore();
          });

          ctx.beginPath();
          ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
          ctx.fillStyle = '#0f172a';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#38bdf8';
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('SPIN', centerX, centerY + 4);
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const sliceAngle = (2 * Math.PI) / wheelItems.length;
        const normalizedAngle = (1.5 * Math.PI - (currentAngleRef.current % (2 * Math.PI)) + 4 * Math.PI) % (2 * Math.PI);
        const winnerIndex = Math.floor(normalizedAngle / sliceAngle) % wheelItems.length;
        const winnerName = wheelItems[winnerIndex];

        setWheelWinner(winnerName);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    };

    requestAnimationFrame(animate);
  };

  // --- Pairwise Matchup State ---
  const [pairwiseList, setPairwiseList] = useState<Option[]>(project.options);
  const [matchIndex, setMatchIndex] = useState(0);
  const [pairwiseWinner, setPairwiseWinner] = useState<Option | null>(null);

  const resetPairwise = () => {
    setPairwiseList([...project.options]);
    setMatchIndex(0);
    setPairwiseWinner(null);
  };

  const selectPairwiseWinner = (chosenOpt: Option) => {
    const currentOpponent = pairwiseList[matchIndex + 1];
    if (!currentOpponent) {
      setPairwiseWinner(chosenOpt);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      return;
    }

    const nextList = pairwiseList.filter((o) => o.id !== (chosenOpt.id === pairwiseList[matchIndex].id ? currentOpponent.id : pairwiseList[matchIndex].id));
    if (nextList.length === 1) {
      setPairwiseWinner(nextList[0]);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } else {
      setPairwiseList(nextList);
      setMatchIndex(0);
    }
  };

  // --- Coin Flip State ---
  const [coinResult, setCoinResult] = useState<'HEADS' | 'TAILS' | null>(null);
  const [isFlippingCoin, setIsFlippingCoin] = useState(false);
  const [showReflection, setShowReflection] = useState(false);

  const optionA = project.options[0]?.name || 'Option A';
  const optionB = project.options[1]?.name || 'Option B';

  const flipCoin = () => {
    if (isFlippingCoin) return;
    setIsFlippingCoin(true);
    setCoinResult(null);
    setShowReflection(false);

    setTimeout(() => {
      const outcome = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
      setCoinResult(outcome);
      setIsFlippingCoin(false);
      setShowReflection(true);
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Toolkit Header Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Dices className="h-5 w-5 text-indigo-400" />
            "I'm Still Stuck" Intuitive Tiebreaker
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            When logic is tied, use psychological coin flips, spinner wheels, or 1v1 matchups to reveal subconscious preference.
          </p>
        </div>

        {/* Sub-mode selector */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('coin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'coin' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="h-3.5 w-3.5" />
            Coin Flip ("I'm Still Stuck")
          </button>

          <button
            onClick={() => setMode('wheel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'wheel' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCw className="h-3.5 w-3.5" />
            Spinner Wheel
          </button>
        </div>
      </div>

      {/* MODE 1: COIN FLIP WITH REFLECTION PROMPT */}
      {mode === 'coin' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl max-w-xl mx-auto text-center space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Psychological Gut Check
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-2">
              The Coin Flip Test
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Assigning <span className="text-indigo-400 font-semibold">HEADS</span> = "{optionA}" & <span className="text-emerald-400 font-semibold">TAILS</span> = "{optionB}"
            </p>
          </div>

          <div className="py-4">
            <div
              className={`w-36 h-36 mx-auto rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-200 border-4 border-amber-300 shadow-2xl flex flex-col items-center justify-center text-slate-950 font-black text-xl transition-all duration-700 ${
                isFlippingCoin ? 'animate-bounce scale-110 rotate-180' : ''
              }`}
            >
              {isFlippingCoin ? (
                <span className="text-sm tracking-widest font-bold">FLIPPING...</span>
              ) : (
                <>
                  <span className="text-2xl">{coinResult || 'FLIP'}</span>
                  {coinResult && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 mt-0.5">
                      {coinResult === 'HEADS' ? optionA : optionB}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <button
            onClick={flipCoin}
            disabled={isFlippingCoin}
            className="w-full max-w-sm mx-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg transition-all hover:scale-[1.02]"
          >
            {isFlippingCoin ? 'Flipping Virtual Coin...' : 'Flip Virtual Coin'}
          </button>

          {/* Explicit Reflective Question Required by Specification */}
          {showReflection && (
            <div className="p-5 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-left space-y-3 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4 text-pink-400" />
                <span>The Reveal Moment</span>
              </div>

              <h4 className="text-sm font-bold text-white">
                "Were you secretly hoping for the other outcome when the coin was in mid-air?"
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed">
                This classic psychological exercise doesn't decide for you — it helps you instantly recognize your true intuitive preference. If you felt disappointed by the result, your gut is telling you to pick the other option!
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: SPINNER WHEEL */}
      {mode === 'wheel' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center relative">
            <div className="absolute top-8 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px] border-t-amber-400 drop-shadow-md" />

            <div className="relative mt-4">
              <canvas
                ref={canvasRef}
                width={320}
                height={320}
                className="max-w-full rounded-full shadow-2xl"
              />
            </div>

            <button
              onClick={spinWheel}
              disabled={isSpinning || wheelItems.length < 2}
              className={`mt-6 w-full max-w-xs py-3.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${
                isSpinning
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-purple-900/40 hover:scale-105'
              }`}
            >
              <RotateCw className={`h-4 w-4 ${isSpinning ? 'animate-spin' : ''}`} />
              {isSpinning ? 'SPINNING...' : 'SPIN THE WHEEL'}
            </button>

            {wheelWinner && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-center animate-in fade-in zoom-in duration-200 w-full max-w-xs">
                <div className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                  🎉 WHEEL HAS SPOKEN!
                </div>
                <div className="text-lg font-black text-white mt-0.5">
                  {wheelWinner}
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-sm">
                Wheel Sectors ({wheelItems.length})
              </h3>
              <button
                onClick={() => setWheelItems(project.options.map((o) => o.name))}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {wheelItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...wheelItems];
                      updated[idx] = e.target.value;
                      setWheelItems(updated);
                    }}
                    className="w-full bg-transparent text-xs text-slate-200 outline-none"
                  />
                  <button
                    onClick={() => {
                      if (wheelItems.length <= 2) return alert('Wheel needs at least 2 options.');
                      setWheelItems(wheelItems.filter((_, i) => i !== idx));
                    }}
                    className="text-slate-600 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setWheelItems([...wheelItems, `Choice ${wheelItems.length + 1}`])}
              className="w-full py-2.5 border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-400 hover:text-indigo-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Sector
            </button>
          </div>
        </div>
      )}



    </div>
  );
};
