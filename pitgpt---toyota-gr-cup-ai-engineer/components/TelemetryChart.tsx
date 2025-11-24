import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TelemetryPoint } from '../types';

interface TelemetryChartProps {
  data: TelemetryPoint[];
  dataSource?: 'real' | 'generated';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-900 border border-neutral-700 p-2 rounded shadow-xl text-xs font-mono">
        <p className="text-gray-400">{`Time: ${(label / 1000).toFixed(1)}s`}</p>
        <p className="text-cyan-400">{`Speed: ${payload[0].value} km/h`}</p>
        <p className="text-rose-400">{`RPM: ${payload[1].value}`}</p>
      </div>
    );
  }
  return null;
};

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ data, dataSource = 'generated' }) => {
  // Only show last 50 points to keep chart performant and "moving"
  const chartData = data.slice(-50);

  return (
    <div className="w-full h-full min-h-[250px] bg-neutral-900/50 rounded-xl border border-neutral-800 p-4 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs uppercase tracking-widest text-neutral-500 font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          Live Telemetry
        </h3>
        {dataSource === 'real' && (
          <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 font-mono">
            REAL CSV DATA
          </span>
        )}
        {dataSource === 'generated' && (
          <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30 font-mono">
            FROM METRICS
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            hide={true} 
            domain={['dataMin', 'dataMax']}
          />
          <YAxis 
            yAxisId="left" 
            domain={[0, 300]} 
            hide={true}
          />
          <YAxis 
            yAxisId="right" 
            domain={[0, 9000]} 
            hide={true} 
            orientation="right"
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="speed" 
            stroke="#22d3ee" // Cyan
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="rpm" 
            stroke="#f43f5e" // Rose
            strokeWidth={1} 
            strokeOpacity={0.5}
            dot={false} 
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Overlay Stats */}
      {chartData.length > 0 && (
        <div className="absolute top-4 right-4 flex gap-4">
           <div className="text-right">
              <span className="text-xs text-neutral-500 block">SPEED</span>
              <span className="text-2xl font-mono text-cyan-400 font-bold">
                {chartData[chartData.length - 1].speed}
              </span> 
              <span className="text-xs text-neutral-500 ml-1">KPH</span>
           </div>
           <div className="text-right">
              <span className="text-xs text-neutral-500 block">RPM</span>
              <span className="text-2xl font-mono text-rose-400 font-bold">
                {chartData[chartData.length - 1].rpm}
              </span>
           </div>
        </div>
      )}
    </div>
  );
};
