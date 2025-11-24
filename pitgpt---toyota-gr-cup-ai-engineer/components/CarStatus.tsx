import React from 'react';
import { TelemetryPoint } from '../types';

interface CarStatusProps {
  data: TelemetryPoint;
}

const Tire = ({ wear, temp, label }: { wear: number, temp: number, label: string }) => {
  // Color based on wear
  let wearColor = 'bg-green-500';
  if (wear < 60) wearColor = 'bg-yellow-500';
  if (wear < 40) wearColor = 'bg-orange-500';
  if (wear < 20) wearColor = 'bg-red-600 animate-pulse';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-12 rounded border-2 border-neutral-700 relative overflow-hidden bg-neutral-800`}>
         <div 
            className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${wearColor}`}
            style={{ height: `${wear}%` }}
         />
      </div>
      <span className="text-[10px] font-bold text-neutral-500">{label}</span>
      <span className="text-[10px] font-mono text-neutral-300">{wear}%</span>
      <span className={`text-[10px] font-mono ${temp > 110 ? 'text-red-500' : 'text-neutral-500'}`}>{temp}°C</span>
    </div>
  );
};

export const CarStatus: React.FC<CarStatusProps> = ({ data }) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
      <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-4 font-bold">Car Status</h3>
      
      {/* Tires Layout */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 max-w-[120px] mx-auto mb-6">
         <Tire wear={data.tireWearFL} temp={data.tireTemp} label="FL" />
         <Tire wear={data.tireWearFR} temp={data.tireTemp + 5} label="FR" />
         <Tire wear={data.tireWearRL} temp={data.tireTemp - 2} label="RL" />
         <Tire wear={data.tireWearRR} temp={data.tireTemp - 3} label="RR" />
      </div>

      {/* Other Vitals */}
      <div className="space-y-3">
         <div>
            <div className="flex justify-between text-xs mb-1">
               <span className="text-neutral-500">FUEL LOAD</span>
               <span className="font-mono">{data.fuelLoad.toFixed(1)} kg</span>
            </div>
            <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
               <div className="h-full bg-cyan-600 w-full" style={{ width: `${(data.fuelLoad / 40) * 100}%`}}></div>
            </div>
         </div>
         <div>
            <div className="flex justify-between text-xs mb-1">
               <span className="text-neutral-500">BRAKE TEMP</span>
               <span className={`font-mono ${data.brakeTemp > 800 ? 'text-red-500 blink' : 'text-neutral-300'}`}>{data.brakeTemp}°C</span>
            </div>
            <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-colors duration-300 ${data.brakeTemp > 800 ? 'bg-red-500' : 'bg-orange-400'}`} 
                 style={{ width: `${Math.min(100, (data.brakeTemp / 1000) * 100)}%`}}
               ></div>
            </div>
         </div>
      </div>
    </div>
  );
};
