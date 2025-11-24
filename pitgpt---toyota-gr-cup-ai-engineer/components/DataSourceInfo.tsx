/**
 * Data Source Info Component
 * Shows judges exactly where our data is coming from
 */

import React from 'react';
import { Database, FileText, Calculator, Cpu, CheckCircle, AlertCircle } from 'lucide-react';

interface DataSourceInfoProps {
  telemetrySource: 'real' | 'generated' | 'none';
  metricsSource: 'python' | 'calculated' | 'none';
  driverId: string;
  vehicleNumber: number;
  frameCount: number;
  realFramesAvailable: number;
}

export const DataSourceInfo: React.FC<DataSourceInfoProps> = ({
  telemetrySource,
  metricsSource,
  driverId,
  vehicleNumber,
  frameCount,
  realFramesAvailable
}) => {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'real':
      case 'python':
        return <Database size={12} className="text-green-500" />;
      case 'generated':
      case 'calculated':
        return <Calculator size={12} className="text-yellow-500" />;
      default:
        return <AlertCircle size={12} className="text-neutral-500" />;
    }
  };

  const getSourceBadge = (source: string, label: string) => {
    const isReal = source === 'real' || source === 'python';
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono ${
        isReal 
          ? 'bg-green-950/50 border border-green-700/50 text-green-400' 
          : 'bg-yellow-950/50 border border-yellow-700/50 text-yellow-400'
      }`}>
        {getSourceIcon(source)}
        <span>{label}</span>
        {isReal && <CheckCircle size={10} className="text-green-500" />}
      </div>
    );
  };

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs uppercase tracking-widest text-neutral-500 font-bold flex items-center gap-2">
          <FileText size={14} />
          Data Sources
        </h4>
        {telemetrySource === 'real' && (
          <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">
            REAL DATA
          </span>
        )}
      </div>

      <div className="space-y-2 text-xs">
        {/* Driver Info */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <span className="text-neutral-500">Driver ID:</span>
          <span className="font-mono text-neutral-300">{driverId}</span>
        </div>
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <span className="text-neutral-500">Vehicle #:</span>
          <span className="font-mono text-neutral-300">{vehicleNumber}</span>
        </div>

        {/* Telemetry Source */}
        <div className="flex items-center justify-between py-2 border-b border-neutral-800">
          <span className="text-neutral-500">Telemetry:</span>
          {getSourceBadge(
            telemetrySource,
            telemetrySource === 'real' 
              ? `Real CSV (${realFramesAvailable} frames)` 
              : telemetrySource === 'generated' 
              ? 'From Python Metrics'
              : 'Loading...'
          )}
        </div>

        {/* Metrics Source */}
        <div className="flex items-center justify-between py-2 border-b border-neutral-800">
          <span className="text-neutral-500">Strategy Metrics:</span>
          {getSourceBadge(
            metricsSource,
            metricsSource === 'python'
              ? 'Python compute_metrics.py'
              : metricsSource === 'calculated'
              ? 'Calculated from Telemetry'
              : 'Not Available'
          )}
        </div>

        {/* Data Stats */}
        <div className="pt-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Frames Streamed:</span>
            <span className="font-mono text-green-400">{frameCount}</span>
          </div>
          {telemetrySource === 'real' && (
            <div className="flex items-center justify-between text-[10px] text-green-500/80">
              <span>Source File:</span>
              <span className="font-mono">R1_barber_telemetry_data.csv</span>
            </div>
          )}
          {metricsSource === 'python' && (
            <div className="flex items-center justify-between text-[10px] text-green-500/80">
              <span>Metrics File:</span>
              <span className="font-mono">race_metrics.csv</span>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-neutral-800">
        <div className="flex items-center gap-4 text-[10px] text-neutral-600">
          <div className="flex items-center gap-1">
            <Database size={10} className="text-green-500" />
            <span>Real Data</span>
          </div>
          <div className="flex items-center gap-1">
            <Calculator size={10} className="text-yellow-500" />
            <span>Calculated</span>
          </div>
        </div>
      </div>
    </div>
  );
};

