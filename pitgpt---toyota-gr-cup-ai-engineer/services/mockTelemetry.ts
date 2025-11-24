import { TelemetryPoint, RaceMetrics } from '../types';

// Simulation state
let currentLap = 12;
let distanceTraveled = 0;
const TRACK_LENGTH = 4500; // meters
let lastTimestamp = Date.now();

// Initial state
let currentFuel = 35.0;
let currentTireWear = { fl: 92, fr: 90, rl: 94, rr: 93 };
let currentTemps = { tire: 90, brake: 450 };

// Track mock pace for trend calculation
const lapTimes = [105.2, 105.4, 105.1, 105.8]; 

export const generateTelemetryFrame = (driverId: string): TelemetryPoint => {
  const now = Date.now();
  const delta = (now - lastTimestamp) / 1000; // seconds
  lastTimestamp = now;

  // Simulate position on track (0 to 1)
  distanceTraveled += 60 * delta; // Rough speed baseline
  if (distanceTraveled > TRACK_LENGTH) {
    distanceTraveled = 0;
    currentLap++;
    // Simulate a lap time variation
    lapTimes.push(105 + (Math.random() * 2 - 1));
    if (lapTimes.length > 5) lapTimes.shift();
  }
  const trackPos = distanceTraveled / TRACK_LENGTH;

  // Use sine waves to simulate corners and straights
  // Speed dips at corners (approx every 20% of track)
  const trackComplexity = Math.sin(trackPos * Math.PI * 10) + Math.cos(trackPos * Math.PI * 4);
  
  // Physics approximation
  const targetSpeed = 160 + (trackComplexity * 80); // 80km/h to 240km/h range
  const speed = Math.max(60, Math.min(260, targetSpeed + (Math.random() * 5)));
  
  const rpm = Math.min(8000, (speed / 260) * 7500 + 1000 + (Math.random() * 200));
  const gear = Math.min(6, Math.max(1, Math.floor(speed / 45)));
  
  // Inputs
  const isCornering = trackComplexity < -0.5;
  const throttle = isCornering ? Math.random() * 30 : 100;
  const brake = isCornering ? 60 + Math.random() * 40 : 0;

  // Degradation logic
  currentFuel -= 0.005 * delta;
  
  // Tires wear faster in corners
  const wearRate = isCornering ? 0.05 : 0.01;
  currentTireWear.fl -= wearRate * delta * (1 + Math.random() * 0.1);
  currentTireWear.fr -= wearRate * delta * (1.2 + Math.random() * 0.1); // Right side load usually higher on clockwise
  currentTireWear.rl -= wearRate * delta * 0.8;
  currentTireWear.rr -= wearRate * delta * 0.9;

  // Temperatures
  const tempChange = isCornering ? 5 : -2;
  currentTemps.tire = Math.max(70, Math.min(130, currentTemps.tire + tempChange * delta));
  currentTemps.brake = Math.max(200, Math.min(900, currentTemps.brake + (brake > 0 ? 50 : -20) * delta));

  return {
    timestamp: now,
    lap: currentLap,
    speed: Math.floor(speed),
    rpm: Math.floor(rpm),
    gear,
    throttle: Math.floor(throttle),
    brake: Math.floor(brake),
    tireWearFL: Number(currentTireWear.fl.toFixed(1)),
    tireWearFR: Number(currentTireWear.fr.toFixed(1)),
    tireWearRL: Number(currentTireWear.rl.toFixed(1)),
    tireWearRR: Number(currentTireWear.rr.toFixed(1)),
    tireTemp: Math.floor(currentTemps.tire),
    brakeTemp: Math.floor(currentTemps.brake),
    fuelLoad: Number(currentFuel.toFixed(2)),
    gapAhead: 1.2 + (Math.sin(now / 5000) * 0.5), // Fluctuating gap
    gapBehind: 3.5 + (Math.cos(now / 6000) * 0.2),
    position: 4
  };
};

// Mimics the Python script logic to generate derived metrics
export const analyzeRaceState = (telemetryWindow: TelemetryPoint[]): RaceMetrics => {
  if (telemetryWindow.length === 0) {
    return {
      tireStressIndex: 0,
      overtakeRiskScore: 0,
      attackWindow: false,
      fuelConservationMode: false,
      weatherRisk: 0,
      lapPaceTrend: 0,
      brakeStress: 0
    };
  }

  const latest = telemetryWindow[telemetryWindow.length - 1];

  // 1. Calculate Tire Stress Index (0-100) based on temp and wear rate
  const avgWear = (latest.tireWearFL + latest.tireWearFR + latest.tireWearRL + latest.tireWearRR) / 4;
  const tempStress = Math.max(0, (latest.tireTemp - 100) * 2); // Penalty for overheating
  const tireStressIndex = Math.min(100, (100 - avgWear) + tempStress);

  // 2. Overtake Risk Score (0-100)
  // Higher gap = lower risk of collision, but harder to pass. 
  // We want Risk of ATTEMPTING overtake. Closer gap = higher risk but necessary.
  const overtakeRiskScore = latest.gapAhead < 0.5 ? 85 : latest.gapAhead < 1.0 ? 50 : 10;

  // 3. Attack Window
  const attackWindow = latest.gapAhead < 1.2 && latest.gapAhead > 0.2;

  // 4. Fuel Conservation
  const fuelConservationMode = latest.fuelLoad < 5.0; // Low fuel

  // 5. Weather Risk (Simulated static for now)
  const weatherRisk = 12; 

  // 6. Lap Pace Trend
  // Compare last known lap times (simulated via array above)
  const recentAvg = lapTimes.length > 0 ? lapTimes.reduce((a,b)=>a+b,0)/lapTimes.length : 0;
  const lapPaceTrend = 0.2; // +0.2s slower (simulation)

  // 7. Brake Stress
  const brakeStress = latest.brakeTemp / 10; // Convert temp to approx bar pressure stress representation

  return {
    tireStressIndex: Math.floor(tireStressIndex),
    overtakeRiskScore,
    attackWindow,
    fuelConservationMode,
    weatherRisk,
    lapPaceTrend,
    brakeStress: Math.floor(brakeStress)
  };
};

export const MOCK_DRIVERS = [
  { id: 'd1', name: 'J. Edwards', number: '23', team: 'TechSport Racing' },
  { id: 'd2', name: 'S. McAleer', number: '18', team: 'Copeland Motorsports' },
  { id: 'd3', name: 'G. Boccanfuso', number: '66', team: 'Smooge Racing' }
];