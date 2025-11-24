export interface TelemetryPoint {
  timestamp: number;
  lap: number;
  speed: number; // km/h
  rpm: number;
  gear: number;
  throttle: number; // 0-100
  brake: number; // 0-100
  tireWearFL: number; // % remaining
  tireWearFR: number;
  tireWearRL: number;
  tireWearRR: number;
  tireTemp: number; // Celsius
  brakeTemp: number; // Celsius
  fuelLoad: number; // kg
  gapAhead: number; // seconds
  gapBehind: number; // seconds
  position: number;
}

export interface RaceMetrics {
  tireStressIndex: number; // 0-100
  overtakeRiskScore: number; // 0-100
  attackWindow: boolean;
  fuelConservationMode: boolean;
  weatherRisk: number; // 0-100
  lapPaceTrend: number; // seconds (positive = slower)
  brakeStress: number; // bar (simulated)
}

export interface StrategyInsight {
  driverStyle: 'Aggressive' | 'Balanced' | 'Conservative';
  riskAlertSummary: string;
  suggestedAction: string;
  pitStrategy: string;
}

export interface DriverProfile {
  id: string;
  name: string;
  number: string;
  team: string;
}