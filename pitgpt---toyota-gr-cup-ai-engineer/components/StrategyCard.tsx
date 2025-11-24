import React from 'react';
import { StrategyInsight, RaceMetrics } from '../types';
import { AlertTriangle, Flag, Zap, Activity } from 'lucide-react';

interface StrategyCardProps {
  strategy: StrategyInsight | null;
  metrics: RaceMetrics | null;
  loading: boolean;
  metricsSource?: 'python' | 'calculated';
}

export const StrategyCard: React.FC<StrategyCardProps> = ({ strategy, metrics, loading, metricsSource = 'calculated' }) => {
  if (!strategy || !metrics) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-neutral-500 text-sm font-mono">Simulating Race Engineer...</p>
        </div>
      </div>
    );
  }

  // Helper to colorize the style
  const getStyleColor = (style: string) => {
    switch(style) {
      case 'Aggressive': return 'text-red-500 border-red-500/50 bg-red-950/30';
      case 'Conservative': return 'text-green-500 border-green-500/50 bg-green-950/30';
      default: return 'text-yellow-500 border-yellow-500/50 bg-yellow-950/30';
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* 1. Driver Style Recommendation */}
      <div className={`p-4 rounded-xl border ${getStyleColor(strategy.driverStyle)} transition-colors`}>
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 flex items-center gap-2">
            <Zap size={14} /> Driving Style
          </h3>
          <div className="flex items-center gap-2">
            {metricsSource === 'python' && (
              <span className="text-[10px] bg-green-950/50 border border-green-700/50 px-2 py-0.5 rounded text-green-400 font-mono">
                PYTHON
              </span>
            )}
            <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-white font-mono">
              LIVE CALL
            </span>
          </div>
        </div>
        <div className="text-2xl font-black italic uppercase tracking-tighter">
          {strategy.driverStyle}
        </div>
      </div>

      <div className="grid grid-rows-3 gap-4 flex-1">
        {/* 2. Suggested Action This Lap */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-center">
          <h4 className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
             <Flag size={14} className="text-cyan-400"/> Action This Lap
          </h4>
          <p className="text-sm text-neutral-200 font-medium leading-relaxed">
            "{strategy.suggestedAction}"
          </p>
        </div>

        {/* 3. Risk Alert Summary */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden">
           {/* Background pulse if high risk */}
           {metrics.tireStressIndex > 80 && (
             <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none"></div>
           )}
           <h4 className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
             <AlertTriangle size={14} className="text-orange-400"/> Risk Summary
           </h4>
           <div className="flex items-start gap-3">
             <div className="flex-1">
               <p className="text-sm text-neutral-300">
                 {strategy.riskAlertSummary}
               </p>
             </div>
             <div className="text-center min-w-[50px]">
                <div className="text-xs text-neutral-600 mb-1">STRESS</div>
                <div className={`text-lg font-mono font-bold ${metrics.tireStressIndex > 70 ? 'text-red-500' : 'text-green-500'}`}>
                   {metrics.tireStressIndex}
                </div>
             </div>
           </div>
        </div>

        {/* 4. Pit Strategy */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-center">
           <h4 className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
             <Activity size={14} className="text-purple-400"/> Pit Strategy
           </h4>
           <p className="text-sm text-neutral-300 italic border-l-2 border-purple-500/50 pl-3">
             {strategy.pitStrategy}
           </p>
           {/* Metric indicators */}
           <div className="mt-2 flex gap-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${metrics.fuelConservationMode ? 'border-yellow-500 text-yellow-500' : 'border-neutral-700 text-neutral-600'}`}>
                FUEL SAVE: {metrics.fuelConservationMode ? 'ON' : 'OFF'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${metrics.lapPaceTrend > 0 ? 'border-red-800 text-red-500' : 'border-green-800 text-green-500'}`}>
                PACE: {metrics.lapPaceTrend > 0 ? '+' : ''}{metrics.lapPaceTrend}s
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};