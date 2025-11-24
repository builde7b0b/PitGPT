/**
 * OpenAI Backup Service for Race Strategy
 * Fallback when Gemini API fails
 */

import { TelemetryPoint, StrategyInsight, RaceMetrics } from '../types';

// Access OpenAI API key from environment
const getOpenAIKey = (): string => {
  // Vite uses import.meta.env for client-side
  if (typeof window !== 'undefined' && (import.meta as any).env?.VITE_OPENAI_API_KEY) {
    return (import.meta as any).env.VITE_OPENAI_API_KEY;
  }
  // Fallback for Node.js/server-side
  if (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  return '';
};

const OPENAI_API_KEY = getOpenAIKey();
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generate race strategy using OpenAI GPT-4 with structured prompt engineering
 */
export const getRaceStrategyOpenAI = async (
  metrics: RaceMetrics,
  latestTelemetry: TelemetryPoint,
  driverName: string
): Promise<StrategyInsight | null> => {
  if (!OPENAI_API_KEY) {
    console.warn("OpenAI API Key missing - backup unavailable");
    return null;
  }

  // Optimized prompt engineering for OpenAI
  const systemPrompt = `You are a professional Toyota Racing Development race engineer for the GR Cup series.
Your role is to analyze real-time telemetry data and provide concise, actionable strategy recommendations.
You must respond ONLY with valid JSON matching the exact schema required.
Be decisive and race-focused in your recommendations.`;

  const userPrompt = `Analyze the current race state and provide strategy recommendations:

DRIVER: ${driverName}
CURRENT LAP: ${latestTelemetry.lap}
POSITION: P${latestTelemetry.position}

METRICS:
- Tire Stress Index: ${metrics.tireStressIndex}/100 ${metrics.tireStressIndex > 70 ? '(HIGH - Risk of tire degradation)' : '(Normal)'}
- Overtake Risk Score: ${metrics.overtakeRiskScore}/100 ${metrics.overtakeRiskScore > 50 ? '(MODERATE-HIGH - Passing opportunity)' : '(Low risk)'}
- Attack Window: ${metrics.attackWindow ? 'OPEN - Driver can push' : 'CLOSED - Maintain pace'}
- Fuel Conservation Mode: ${metrics.fuelConservationMode ? 'ACTIVE - Saving fuel' : 'NORMAL'}
- Weather Risk: ${metrics.weatherRisk}/100
- Lap Pace Trend: ${metrics.lapPaceTrend > 0 ? '+' : ''}${metrics.lapPaceTrend}s ${metrics.lapPaceTrend > 0.5 ? '(SLOWING - Consider pit)' : '(Maintaining pace)'}
- Brake Stress: ${metrics.brakeStress} bar

RACE ENGINEER INSTRUCTIONS:
1. DRIVING STYLE: Choose EXACTLY ONE - "Aggressive", "Balanced", or "Conservative"
   - Aggressive: When Attack Window is OPEN and Tire Stress < 70
   - Balanced: Default recommendation for most situations
   - Conservative: When Tire Stress > 70, Fuel Conservation active, or high risk conditions

2. RISK ALERT SUMMARY: One sentence identifying the PRIMARY concern (tire wear, fuel, pace, or opportunity)

3. SUGGESTED ACTION THIS LAP: Specific, actionable instruction (e.g., "Push through Turns 3-5, lift through Turn 7 to save tires")

4. PIT STRATEGY: 
   - If Lap Pace Trend > 0.5s for 3+ laps: Recommend pit window
   - If Tire Stress > 80: Suggest tire management or early pit
   - Otherwise: "Stay out - pace is stable"

Respond with ONLY valid JSON in this exact format:
{
  "driverStyle": "Aggressive|Balanced|Conservative",
  "riskAlertSummary": "Brief risk assessment",
  "suggestedAction": "Specific action for this lap",
  "pitStrategy": "Pit recommendation"
}`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast and cost-effective
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7, // Balanced creativity vs consistency
        max_tokens: 300,
        response_format: { type: 'json_object' }, // Ensure JSON output
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('OpenAI: No content in response');
      return null;
    }

    // Parse JSON response
    const parsed = JSON.parse(content);

    // Validate and map to StrategyInsight
    const strategy: StrategyInsight = {
      driverStyle: ['Aggressive', 'Balanced', 'Conservative'].includes(parsed.driverStyle)
        ? parsed.driverStyle as 'Aggressive' | 'Balanced' | 'Conservative'
        : 'Balanced',
      riskAlertSummary: parsed.riskAlertSummary || 'Monitoring race conditions',
      suggestedAction: parsed.suggestedAction || 'Maintain current pace',
      pitStrategy: parsed.pitStrategy || 'Stay out - monitoring',
    };

    return strategy;

  } catch (error) {
    console.error('OpenAI Strategy Error:', error);
    return null;
  }
};

/**
 * Fallback strategy when both AI services fail
 */
export const getFallbackStrategy = (
  metrics: RaceMetrics,
  latestTelemetry: TelemetryPoint
): StrategyInsight => {
  // Simple rule-based fallback
  let driverStyle: 'Aggressive' | 'Balanced' | 'Conservative' = 'Balanced';
  
  if (metrics.attackWindow && metrics.tireStressIndex < 70) {
    driverStyle = 'Aggressive';
  } else if (metrics.tireStressIndex > 70 || metrics.fuelConservationMode) {
    driverStyle = 'Conservative';
  }

  const riskSummary = metrics.tireStressIndex > 70
    ? `High tire stress (${metrics.tireStressIndex}) - manage tire wear`
    : metrics.overtakeRiskScore > 50
    ? `Overtake opportunity ahead - gap closing`
    : 'Conditions stable - maintain pace';

  const action = metrics.attackWindow
    ? `Push through high-speed sections, attack Turn 3`
    : 'Maintain consistent pace, save tires';

  const pitStrategy = metrics.lapPaceTrend > 0.5
    ? 'Monitor pace trend - prepare for pit window in 2-3 laps'
    : 'Stay out - pace is stable';

  return {
    driverStyle,
    riskAlertSummary: riskSummary,
    suggestedAction: action,
    pitStrategy,
  };
};

