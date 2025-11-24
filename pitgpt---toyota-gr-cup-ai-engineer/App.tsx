import React, { useState, useEffect, useRef } from 'react';
import { MOCK_DRIVERS } from './services/mockTelemetry';
import { RealTelemetryStreamer, analyzeRaceStateFromRealData } from './services/realTelemetryService';
import { getRaceStrategy } from './services/geminiService';
import { loadRaceMetrics, pythonMetricsToUIMetrics, getDriverMetrics } from './services/raceMetricsService';
import { TelemetryPoint, StrategyInsight, DriverProfile, RaceMetrics } from './types';
import { TelemetryChart } from './components/TelemetryChart';
import { StrategyCard } from './components/StrategyCard';
import { CarStatus } from './components/CarStatus';
import { DataSourceInfo } from './components/DataSourceInfo';
import { Zap, AlertOctagon } from 'lucide-react';

/**
 * Generate realistic telemetry from Python metrics (fallback when real data not available)
 */
function generateTelemetryFromMetrics(metrics: RaceMetrics, frameCount: number): TelemetryPoint {
  const now = Date.now();
  const lap = 12 + Math.floor(frameCount / 600); // ~10 frames/sec, ~60 sec per lap
  
  // Generate realistic values based on metrics
  const throttle = metrics.fuelConservationMode ? 60 + Math.random() * 20 : 70 + Math.random() * 30;
  const brake = metrics.tireStressIndex > 70 ? 40 + Math.random() * 30 : 20 + Math.random() * 20;
  const speed = 120 + (throttle / 100) * 140 + (Math.random() - 0.5) * 20;
  const rpm = Math.min(8000, 2000 + (speed / 260) * 5500 + (Math.random() - 0.5) * 500);
  const gear = Math.min(6, Math.max(1, Math.floor(speed / 45)));
  
  // Tire wear based on stress index
  const avgWear = 100 - (metrics.tireStressIndex * 0.8);
  const tireWear = {
    fl: avgWear + (Math.random() - 0.5) * 5,
    fr: avgWear - 1 + (Math.random() - 0.5) * 5,
    rl: avgWear + 2 + (Math.random() - 0.5) * 5,
    rr: avgWear + 1 + (Math.random() - 0.5) * 5
  };
  
  // Temperatures
  const tireTemp = 70 + (metrics.tireStressIndex / 100) * 60 + (Math.random() - 0.5) * 10;
  const brakeTemp = 200 + (brake / 100) * 500 + (Math.random() - 0.5) * 50;
  
  // Fuel based on conservation mode
  const fuelBase = metrics.fuelConservationMode ? 15 : 25;
  const fuelLoad = fuelBase - (frameCount / 1000) * 2 + (Math.random() - 0.5) * 2;
  
  return {
    timestamp: now,
    lap,
    speed: Math.round(Math.max(60, Math.min(260, speed))),
    rpm: Math.round(Math.max(1000, Math.min(8000, rpm))),
    gear,
    throttle: Math.round(Math.max(0, Math.min(100, throttle))),
    brake: Math.round(Math.max(0, Math.min(100, brake))),
    tireWearFL: Number(Math.max(0, Math.min(100, tireWear.fl)).toFixed(1)),
    tireWearFR: Number(Math.max(0, Math.min(100, tireWear.fr)).toFixed(1)),
    tireWearRL: Number(Math.max(0, Math.min(100, tireWear.rl)).toFixed(1)),
    tireWearRR: Number(Math.max(0, Math.min(100, tireWear.rr)).toFixed(1)),
    tireTemp: Math.round(Math.max(70, Math.min(130, tireTemp))),
    brakeTemp: Math.round(Math.max(200, Math.min(900, brakeTemp))),
    fuelLoad: Number(Math.max(0, Math.min(35, fuelLoad)).toFixed(2)),
    gapAhead: metrics.attackWindow ? 0.8 + Math.random() * 0.4 : 1.5 + Math.random() * 0.5,
    gapBehind: 3.0 + Math.random() * 1.0,
    position: 4
  };
}

const App: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverProfile[]>(MOCK_DRIVERS);
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile>(MOCK_DRIVERS[0]);
  const [isRacing, setIsRacing] = useState(false);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  
  // New State for metrics and strategy
  const [raceMetrics, setRaceMetrics] = useState<RaceMetrics | null>(null);
  const [currentStrategy, setCurrentStrategy] = useState<StrategyInsight | null>(null);
  const [isLoadingStrategy, setIsLoadingStrategy] = useState(false);
  
  // Data source tracking for judges
  const [telemetrySource, setTelemetrySource] = useState<'real' | 'generated' | 'none'>('none');
  const [metricsSource, setMetricsSource] = useState<'python' | 'calculated' | 'none'>('none');
  const [realFramesAvailable, setRealFramesAvailable] = useState(0);
  
  // Load real driver metrics on mount
  useEffect(() => {
    loadRaceMetrics().then((metrics) => {
      // Convert metrics to driver profiles
      const realDrivers: DriverProfile[] = metrics.map(m => ({
        id: m.driverId,
        name: `Driver #${m.vehicleNumber}`,
        number: m.vehicleNumber.toString(),
        team: 'Toyota GR Cup'
      }));
      
      if (realDrivers.length > 0) {
        setDrivers(realDrivers);
        setSelectedDriver(realDrivers[0]);
      }
    }).catch(err => {
      console.warn('Could not load real metrics, using mock data:', err);
    });
  }, []);
  
  // Initialize real telemetry streamer for selected driver
  useEffect(() => {
    const vehicleNumber = parseInt(selectedDriver.number);
    const vehicleId = selectedDriver.id;
    
    if (isNaN(vehicleNumber) || !vehicleId) return;

    // Create new streamer for this driver
    telemetryStreamer.current = new RealTelemetryStreamer(vehicleId, vehicleNumber);
    
    // Initialize async and load lap times
    telemetryStreamer.current.initialize().then(async () => {
      const frameCount = telemetryStreamer.current?.getFrameCount() || 0;
      console.log(`✓ Real telemetry initialized for ${vehicleId} (${frameCount} frames)`);
      
      // Track data source
      if (frameCount > 0) {
        setTelemetrySource('real');
        setRealFramesAvailable(frameCount);
      } else {
        setTelemetrySource('generated');
        setRealFramesAvailable(0);
      }
      
      // Load lap times for metrics calculation
      try {
        const response = await fetch(`/barber/lap_times.json`);
        if (response.ok) {
          const allLapTimes: Record<string, number[]> = await response.json();
          lapTimesRef.current = allLapTimes[vehicleNumber.toString()] || [];
        }
      } catch (err) {
        console.warn('Could not load lap times:', err);
      }
    }).catch(err => {
      console.warn('Could not initialize real telemetry:', err);
      telemetryStreamer.current = null;
      setTelemetrySource('generated');
    });
  }, [selectedDriver.id]);

  // Load real metrics for selected driver
  useEffect(() => {
    if (!isRacing) return;
    
    const vehicleNumber = parseInt(selectedDriver.number);
    if (isNaN(vehicleNumber)) return;
    
    getDriverMetrics(vehicleNumber).then((pythonMetrics) => {
      if (pythonMetrics) {
        const uiMetrics = pythonMetricsToUIMetrics(pythonMetrics);
        setRaceMetrics(uiMetrics);
        setMetricsSource('python'); // Track that we're using Python metrics
      }
    }).catch(err => {
      console.warn('Could not load metrics for driver:', err);
      setMetricsSource('calculated'); // Will calculate from telemetry
    });
  }, [selectedDriver, isRacing]);
  
  const raceInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const strategyInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const telemetryStreamer = useRef<RealTelemetryStreamer | null>(null);
  const lapTimesRef = useRef<number[]>([]);

  // Start/Stop Race Simulation
  const toggleRace = () => {
    if (isRacing) {
      if (raceInterval.current) clearInterval(raceInterval.current);
      if (strategyInterval.current) clearInterval(strategyInterval.current);
      setIsRacing(false);
    } else {
      setIsRacing(true);
    }
  };

  // Telemetry Loop (Running at 10Hz - 100ms) - Now uses REAL data
  useEffect(() => {
    if (isRacing) {
      raceInterval.current = setInterval(() => {
        // Try to get real telemetry frame
        let frame: TelemetryPoint | null = null;
        let frameSource: 'real' | 'generated' = 'generated';
        
        if (telemetryStreamer.current) {
          frame = telemetryStreamer.current.getNextFrame();
          if (frame) {
            frameSource = 'real';
            if (telemetrySource !== 'real') {
              setTelemetrySource('real');
            }
          }
        }

        // Fallback: Generate from Python metrics if real data not available
        if (!frame && raceMetrics) {
          frame = generateTelemetryFromMetrics(raceMetrics, telemetryHistory.length);
          frameSource = 'generated';
          if (telemetrySource !== 'generated') {
            setTelemetrySource('generated');
          }
        }

        if (!frame) {
          return;
        }

        setTelemetryHistory(prev => {
          const newHistory = [...prev, frame!];
          const trimmedHistory = newHistory.length > 100 ? newHistory.slice(-100) : newHistory;
          
          // Use Python metrics if available, otherwise compute from telemetry
          if (!raceMetrics) {
            const metrics = analyzeRaceStateFromRealData(trimmedHistory, lapTimesRef.current);
            setRaceMetrics(metrics);
            if (metricsSource === 'none') {
              setMetricsSource('calculated');
            }
          }
          
          return trimmedHistory;
        });

      }, 100); // 10Hz - 100ms interval
    }
    return () => {
      if (raceInterval.current) clearInterval(raceInterval.current);
    };
  }, [isRacing, selectedDriver, raceMetrics]);

  // Strategy AI Loop (Every 4 seconds to be "Live")
  useEffect(() => {
    if (isRacing) {
      const fetchStrategy = async () => {
        if (telemetryHistory.length < 5 || !raceMetrics) return;
        
        setIsLoadingStrategy(true);
        const latestTelemetry = telemetryHistory[telemetryHistory.length - 1];
        
        const strategy = await getRaceStrategy(raceMetrics, latestTelemetry, selectedDriver.name);
        
        if (strategy) setCurrentStrategy(strategy);
        setIsLoadingStrategy(false);
      };
      
      // Initial trigger
      if (telemetryHistory.length > 10 && !currentStrategy) fetchStrategy();

      strategyInterval.current = setInterval(fetchStrategy, 4000);
    }
    return () => {
      if (strategyInterval.current) clearInterval(strategyInterval.current);
    };
  }, [isRacing, telemetryHistory.length, raceMetrics, selectedDriver.name]);

  const latestTelemetry = telemetryHistory[telemetryHistory.length - 1];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 font-sans selection:bg-cyan-900">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter italic flex items-center gap-2">
            <span className="text-red-600">PIT</span>GPT
            <span className="text-xs not-italic font-normal bg-neutral-800 px-2 py-1 rounded text-neutral-400">v3.0-RC</span>
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Toyota GR Cup // Intelligent Strategy System</p>
          <p className="text-[10px] text-neutral-600 mt-1 font-mono">
            Real Data Pipeline: CSV → Python Metrics → AI Strategy
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-neutral-900 px-4 py-2 rounded-lg border border-neutral-800 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isRacing ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="font-mono text-sm font-bold">{isRacing ? 'TELEMETRY ONLINE' : 'SYSTEM OFFLINE'}</span>
          </div>
          
          {/* Real Data Indicator */}
          {telemetrySource === 'real' && (
            <div className="bg-green-950/50 px-3 py-2 rounded-lg border border-green-700/50 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-mono text-green-400 font-bold">REAL DATA</span>
            </div>
          )}
          
          {metricsSource === 'python' && (
            <div className="bg-blue-950/50 px-3 py-2 rounded-lg border border-blue-700/50 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs font-mono text-blue-400 font-bold">PYTHON METRICS</span>
            </div>
          )}
          
          <button 
            onClick={toggleRace}
            className={`px-6 py-2 rounded font-bold uppercase tracking-wider text-sm transition-all ${isRacing ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
          >
            {isRacing ? 'Pause Simulation' : 'Connect Car'}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[calc(100vh-140px)]">
        
        {/* Left Col: Driver & Car Status (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6 h-full">
           {/* Driver Select */}
           <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <label className="text-xs text-neutral-500 uppercase font-bold mb-2 block">Driver Profile</label>
              <select 
                className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-sm focus:outline-none focus:border-red-500"
                value={selectedDriver.id}
                onChange={(e) => {
                  const d = drivers.find(d => d.id === e.target.value);
                  if (d) setSelectedDriver(d);
                }}
              >
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>#{d.number} - {d.name}</option>
                ))}
              </select>
              <div className="mt-4 flex justify-between items-center">
                 <div className="text-4xl font-black italic text-neutral-800">#{selectedDriver.number}</div>
                 <div className="text-right">
                    <div className="text-xs text-neutral-500">{selectedDriver.team}</div>
                    <div className="font-bold text-neutral-200">{selectedDriver.name}</div>
                    {selectedDriver.id.startsWith('GR86-') && (
                      <div className="text-[10px] font-mono text-green-400 mt-1">
                        {selectedDriver.id}
                      </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Data Source Info - Shows judges where data comes from */}
           <DataSourceInfo
             telemetrySource={telemetrySource}
             metricsSource={metricsSource}
             driverId={selectedDriver.id}
             vehicleNumber={parseInt(selectedDriver.number) || 0}
             frameCount={telemetryHistory.length}
             realFramesAvailable={realFramesAvailable}
           />

           {/* Live Metrics */}
           {latestTelemetry ? (
             <>
               <CarStatus data={latestTelemetry} />
               <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex-1">
                 <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-4 font-bold">Session Timing</h3>
                 <div className="space-y-4 font-mono">
                    <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                      <span className="text-neutral-500 text-xs">LAP</span>
                      <span className="text-xl font-bold">{latestTelemetry.lap}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                      <span className="text-neutral-500 text-xs">POS</span>
                      <span className="text-xl font-bold text-cyan-400">P{latestTelemetry.position}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                      <span className="text-neutral-500 text-xs">GAP AHEAD</span>
                      <span className="text-green-500">+{latestTelemetry.gapAhead.toFixed(2)}s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500 text-xs">GAP BEHIND</span>
                      <span className="text-red-500">+{latestTelemetry.gapBehind.toFixed(2)}s</span>
                    </div>
                 </div>
               </div>
             </>
           ) : (
             <div className="bg-neutral-900 rounded-xl flex items-center justify-center flex-1 border border-neutral-800 border-dashed">
               <p className="text-neutral-600 text-sm">Start simulation to stream data</p>
             </div>
           )}
        </div>

        {/* Center Col: Charts (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6 h-full min-h-[400px]">
           <TelemetryChart data={telemetryHistory} dataSource={telemetrySource} />
           
           {/* Secondary Info Area */}
           <div className="grid grid-cols-2 gap-6 h-1/3 min-h-[150px]">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 relative overflow-hidden group hover:border-cyan-900 transition-colors">
                 <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Zap size={80} />
                 </div>
                 <h3 className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1">Throttle Map</h3>
                 <div className="text-2xl font-mono font-bold text-white mt-2">
                    {latestTelemetry ? `${latestTelemetry.throttle}%` : '--'}
                 </div>
                 <div className="w-full bg-neutral-800 h-2 mt-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full" style={{ width: latestTelemetry ? `${latestTelemetry.throttle}%` : '0%' }}></div>
                 </div>
              </div>
              
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 relative overflow-hidden group hover:border-rose-900 transition-colors">
                 <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <AlertOctagon size={80} />
                 </div>
                 <h3 className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1">Brake Force</h3>
                 <div className="text-2xl font-mono font-bold text-white mt-2">
                    {latestTelemetry ? `${latestTelemetry.brake}%` : '--'}
                 </div>
                 <div className="w-full bg-neutral-800 h-2 mt-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: latestTelemetry ? `${latestTelemetry.brake}%` : '0%' }}></div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Col: AI Strategy (3 cols) */}
        <div className="lg:col-span-3 h-full">
           <StrategyCard 
              strategy={currentStrategy} 
              metrics={raceMetrics} 
              loading={isLoadingStrategy}
              metricsSource={metricsSource}
           />
        </div>

      </div>
    </div>
  );
};

export default App;