import { TelemetryPoint, StrategyInsight, RaceMetrics } from '../types';
import { getRaceStrategyOpenAI, getFallbackStrategy } from './openaiService';

// Gemini removed due to quota limits - using OpenAI only

/**
 * Primary strategy function - OpenAI only (Gemini removed due to quota limits)
 * Falls back to rule-based strategy if OpenAI fails
 */
export const getRaceStrategy = async (
  metrics: RaceMetrics,
  latestTelemetry: TelemetryPoint,
  driverName: string
): Promise<StrategyInsight | null> => {
  // Try OpenAI first
  try {
    const openaiResult = await getRaceStrategyOpenAI(metrics, latestTelemetry, driverName);
    if (openaiResult) {
      console.log('✓ Strategy from OpenAI');
      return openaiResult;
    }
  } catch (error) {
    console.warn('OpenAI failed, using rule-based fallback:', error);
  }

  // Fallback: rule-based strategy (always works)
  console.log('✓ Strategy from rule-based fallback');
  return getFallbackStrategy(metrics, latestTelemetry);
};