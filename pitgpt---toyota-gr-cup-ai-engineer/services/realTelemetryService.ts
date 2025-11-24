/**
 * Real Telemetry Service - Loads and streams real telemetry data from CSV
 * Replaces mockTelemetry.ts with actual Toyota GR Cup data
 */

import { TelemetryPoint, RaceMetrics } from '../types';

interface RawTelemetryRecord {
  vehicle_id: string;
  lap: number;
  timestamp: string;
  telemetry_name: string;
  telemetry_value: number | string;
}

interface ParsedTelemetryFrame {
  timestamp: number;
  vehicle_id: string;
  lap: number;
  throttle: number;
  brake_f: number;
  brake_r: number;
  steering: number;
  accx: number;
  accy: number;
  gear: number;
  rpm: number;
  speed?: number; // Calculated
}

// Cache for loaded telemetry data
let telemetryCache: Map<string, ParsedTelemetryFrame[]> = new Map();
let lapTimesCache: Map<string, number[]> = new Map();
let weatherData: { temp: number; humidity: number; trackTemp?: number } | null = null;

/**
 * Load weather data once
 */
async function loadWeatherData(): Promise<void> {
  if (weatherData) return;

  try {
    const response = await fetch('/barber/26_Weather_Race 1_Anonymized.CSV');
    if (response.ok) {
      const text = await response.text();
      const lines = text.split('\n').slice(1).filter(l => l.trim());
      if (lines.length > 0) {
        const firstLine = lines[0].split(';');
        weatherData = {
          temp: parseFloat(firstLine[2]) || 30,
          humidity: parseFloat(firstLine[4]) || 55,
          trackTemp: parseFloat(firstLine[3]) || undefined
        };
      }
    }
  } catch (error) {
    console.warn('Could not load weather data, using defaults:', error);
    weatherData = { temp: 30, humidity: 55 };
  }
}

/**
 * Load pre-processed telemetry JSON for a specific driver
 */
async function loadTelemetryForDriver(vehicleId: string): Promise<ParsedTelemetryFrame[]> {
  if (telemetryCache.has(vehicleId)) {
    return telemetryCache.get(vehicleId)!;
  }

  try {
    // Load from pre-processed JSON file
    const safeId = vehicleId.replace('/', '_').replace('\\', '_');
    const response = await fetch(`/barber/telemetry/${safeId}_telemetry.json`);
    
    if (!response.ok) {
      console.warn(`Telemetry file not found for ${vehicleId} (${response.status}). This is OK - will use calculated values.`);
      return [];
    }

    // Check if response is actually JSON (not HTML error page)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      if (text.trim().startsWith('<!DOCTYPE')) {
        console.warn(`Got HTML response instead of JSON for ${vehicleId}. File may not exist yet.`);
        return [];
      }
    }

    const frames: ParsedTelemetryFrame[] = await response.json();
    
    if (!Array.isArray(frames) || frames.length === 0) {
      console.warn(`Empty or invalid telemetry data for ${vehicleId}`);
      return [];
    }
    
    // Calculate speed if not present
    const framesWithSpeed = frames.map(f => ({
      ...f,
      speed: f.speed || calculateSpeedFromAccel(f.accx)
    }));

    console.log(`✓ Loaded ${framesWithSpeed.length} telemetry frames for ${vehicleId}`);
    telemetryCache.set(vehicleId, framesWithSpeed);
    return framesWithSpeed;
  } catch (error) {
    console.warn(`Could not load telemetry for ${vehicleId}:`, error);
    return [];
  }
}

/**
 * Calculate approximate speed from acceleration (if not available)
 */
function calculateSpeedFromAccel(accx: number): number {
  // Rough estimate: positive accel = accelerating
  // This is a fallback - real speed should come from telemetry if available
  return Math.max(80, Math.min(260, 120 + (accx * 50)));
}

/**
 * Load lap times for a driver from pre-processed JSON
 */
async function loadLapTimes(vehicleNumber: number): Promise<number[]> {
  const cacheKey = vehicleNumber.toString();
  if (lapTimesCache.has(cacheKey)) {
    return lapTimesCache.get(cacheKey)!;
  }

  try {
    const response = await fetch('/barber/lap_times.json');
    if (!response.ok) {
      console.warn(`Lap times file not found (${response.status}). This is OK.`);
      return [];
    }

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      if (text.trim().startsWith('<!DOCTYPE')) {
        console.warn('Got HTML response instead of JSON for lap times. File may not exist yet.');
        return [];
      }
    }

    const allLapTimes: Record<string, number[]> = await response.json();
    const lapTimes = allLapTimes[vehicleNumber.toString()] || [];

    if (lapTimes.length > 0) {
      console.log(`✓ Loaded ${lapTimes.length} lap times for driver ${vehicleNumber}`);
    }

    lapTimesCache.set(cacheKey, lapTimes);
    return lapTimes;
  } catch (error) {
    console.warn('Could not load lap times:', error);
    return [];
  }
}

/**
 * Calculate tire wear from brake pressure, steering, and lateral G over time
 */
function calculateTireWear(
  initialWear: number,
  brakeTotal: number,
  steering: number,
  lateralG: number,
  deltaTime: number
): number {
  const wearRate = (
    (brakeTotal / 100) * 0.02 + // Brake pressure contribution
    (steering / 180) * 0.015 + // Steering angle contribution
    (lateralG / 2) * 0.01 // Lateral G contribution
  ) * deltaTime;

  return Math.max(0, initialWear - wearRate);
}

/**
 * Calculate tire temperature from stress and ambient
 */
function calculateTireTemp(
  brakePressure: number,
  lateralG: number,
  speed: number,
  ambientTemp: number
): number {
  const baseTemp = ambientTemp + 20; // Track temp usually 20°C above ambient
  const brakeHeat = (brakePressure / 100) * 15;
  const corneringHeat = lateralG * 5;
  const speedHeat = (speed / 260) * 10;

  return Math.min(130, Math.max(70, baseTemp + brakeHeat + corneringHeat + speedHeat));
}

/**
 * Calculate brake temperature from usage
 */
function calculateBrakeTemp(
  currentTemp: number,
  brakePressure: number,
  speed: number,
  deltaTime: number
): number {
  const cooling = (currentTemp - 200) * 0.02 * deltaTime; // Cool towards 200°C
  const heating = (brakePressure / 100) * (speed / 100) * 50 * deltaTime;

  return Math.min(900, Math.max(200, currentTemp - cooling + heating));
}

/**
 * Stream real telemetry data frame by frame
 */
export class RealTelemetryStreamer {
  private frames: ParsedTelemetryFrame[] = [];
  private currentIndex = 0;
  private vehicleId: string;
  private vehicleNumber: number;
  private lastFrameTime = 0;
  private currentTireWear = { fl: 95, fr: 93, rl: 96, rr: 94 };
  private currentBrakeTemp = 250;
  private currentFuel = 35.0;
  private lapTimes: number[] = [];
  private isInitialized = false;

  constructor(vehicleId: string, vehicleNumber: number) {
    this.vehicleId = vehicleId;
    this.vehicleNumber = vehicleNumber;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await loadWeatherData();
    this.frames = await loadTelemetryForDriver(this.vehicleId);
    this.lapTimes = await loadLapTimes(this.vehicleNumber);
    this.isInitialized = true;

    if (this.frames.length === 0) {
      console.warn(`No telemetry data found for ${this.vehicleId} - will generate from metrics`);
    } else {
      console.log(`✓ Initialized telemetry streamer: ${this.frames.length} frames available`);
    }
  }

  /**
   * Get next telemetry frame (simulating real-time streaming)
   * Falls back to generating from metrics if no real data available
   */
  getNextFrame(): TelemetryPoint | null {
    if (!this.isInitialized) {
      return null;
    }

    // If we have real frames, use them
    if (this.frames.length > 0) {

    if (this.currentIndex >= this.frames.length) {
      // Loop back to beginning for continuous streaming
      this.currentIndex = 0;
    }

    const frame = this.frames[this.currentIndex];
    const now = Date.now();
    const deltaTime = this.lastFrameTime > 0 ? (now - this.lastFrameTime) / 1000 : 0.1;
    this.lastFrameTime = now;

    // Calculate missing fields from available data
    const brakeTotal = frame.brake_f + frame.brake_r;
    const speed = frame.speed || calculateSpeedFromAccel(frame.accx);
    
    // Tire wear calculation
    this.currentTireWear.fl = calculateTireWear(
      this.currentTireWear.fl,
      brakeTotal,
      frame.steering,
      frame.accy,
      deltaTime
    );
    this.currentTireWear.fr = calculateTireWear(
      this.currentTireWear.fr,
      brakeTotal,
      frame.steering * 1.2, // Right side wears more
      frame.accy,
      deltaTime
    );
    this.currentTireWear.rl = calculateTireWear(
      this.currentTireWear.rl,
      brakeTotal * 0.8,
      frame.steering,
      frame.accy,
      deltaTime
    );
    this.currentTireWear.rr = calculateTireWear(
      this.currentTireWear.rr,
      brakeTotal * 0.9,
      frame.steering,
      frame.accy,
      deltaTime
    );

    // Tire temperature
    const tireTemp = calculateTireTemp(
      brakeTotal,
      frame.accy,
      speed,
      weatherData?.temp || 30
    );

    // Brake temperature
    this.currentBrakeTemp = calculateBrakeTemp(
      this.currentBrakeTemp,
      brakeTotal,
      speed,
      deltaTime
    );

    // Fuel consumption (simplified)
    const fuelRate = (frame.throttle / 100) * 0.008 * deltaTime;
    this.currentFuel = Math.max(0, this.currentFuel - fuelRate);

    // Calculate gap/position (not available in dataset - use estimates)
    // For demo purposes, we'll simulate small variations
    const gapAhead = 1.5 + Math.sin(now / 8000) * 0.3;
    const gapBehind = 3.2 + Math.cos(now / 10000) * 0.4;
    const position = 4; // Not in dataset

    const telemetryPoint: TelemetryPoint = {
      timestamp: frame.timestamp || now,
      lap: frame.lap,
      speed: Math.round(speed),
      rpm: frame.rpm,
      gear: frame.gear,
      throttle: Math.round(frame.throttle),
      brake: Math.round(brakeTotal / 2), // Combined brake as percentage
      tireWearFL: Number(this.currentTireWear.fl.toFixed(1)),
      tireWearFR: Number(this.currentTireWear.fr.toFixed(1)),
      tireWearRL: Number(this.currentTireWear.rl.toFixed(1)),
      tireWearRR: Number(this.currentTireWear.rr.toFixed(1)),
      tireTemp: Math.round(tireTemp),
      brakeTemp: Math.round(this.currentBrakeTemp),
      fuelLoad: Number(this.currentFuel.toFixed(2)),
      gapAhead, // Estimated
      gapBehind, // Estimated
      position // Not in dataset
    };

    this.currentIndex++;
    return telemetryPoint;
    } else {
      // Fallback: No real data available, return null
      // App.tsx will handle gracefully
      return null;
    }
  }

  /**
   * Reset stream to beginning
   */
  reset(): void {
    this.currentIndex = 0;
    this.lastFrameTime = 0;
    this.currentTireWear = { fl: 95, fr: 93, rl: 96, rr: 94 };
    this.currentBrakeTemp = 250;
    this.currentFuel = 35.0;
  }

  /**
   * Get total number of frames available
   */
  getFrameCount(): number {
    return this.frames.length;
  }
}

/**
 * Compute race metrics from real telemetry window
 * Uses same logic as Python backend for consistency
 */
export function analyzeRaceStateFromRealData(
  telemetryWindow: TelemetryPoint[],
  lapTimes: number[]
): RaceMetrics {
  if (telemetryWindow.length === 0) {
    return {
      tireStressIndex: 0,
      overtakeRiskScore: 0,
      attackWindow: false,
      fuelConservationMode: false,
      weatherRisk: weatherData ? Math.min(100, weatherData.humidity) : 0,
      lapPaceTrend: 0,
      brakeStress: 0
    };
  }

  const latest = telemetryWindow[telemetryWindow.length - 1];

  // 1. Tire Stress Index (match Python calculation)
  const avgWear = (latest.tireWearFL + latest.tireWearFR + latest.tireWearRL + latest.tireWearRR) / 4;
  const tempStress = Math.max(0, (latest.tireTemp - 100) * 2);
  const tireStressIndex = Math.min(100, (100 - avgWear) + tempStress);

  // 2. Overtake Risk Score (simplified - gap data is estimated)
  const overtakeRiskScore = latest.gapAhead < 0.5 ? 85 : latest.gapAhead < 1.0 ? 50 : 10;

  // 3. Attack Window
  const attackWindow = latest.gapAhead < 1.2 && latest.gapAhead > 0.2;

  // 4. Fuel Conservation Mode
  const fuelConservationMode = latest.fuelLoad < 5.0;

  // 5. Weather Risk
  const weatherRisk = weatherData ? Math.min(100, weatherData.humidity) : 0;

  // 6. Lap Pace Trend (from actual lap times if available)
  let lapPaceTrend = 0;
  if (lapTimes.length >= 3) {
    const recent = lapTimes.slice(-3);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previous = lapTimes.slice(-5, -3);
    if (previous.length > 0) {
      const avgPrevious = previous.reduce((a, b) => a + b, 0) / previous.length;
      lapPaceTrend = avgRecent - avgPrevious; // Positive = slower
    }
  }

  // 7. Brake Stress (from brake temp)
  const brakeStress = latest.brakeTemp / 10;

  return {
    tireStressIndex: Math.floor(tireStressIndex),
    overtakeRiskScore,
    attackWindow,
    fuelConservationMode,
    weatherRisk,
    lapPaceTrend: Number(lapPaceTrend.toFixed(2)),
    brakeStress: Math.floor(brakeStress)
  };
}

