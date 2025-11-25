# 🧮 PitGPT Mathematical Models & Formulas

**Complete Mathematical Foundation for Race Strategy Metrics**

---

## Overview

PitGPT computes **5 strategic metrics** from raw telemetry data using simple, interpretable formulas. Each metric is designed to simulate a race engineer's decision-making process.

---

## 1. Tire Stress Index (TSI)

**Definition:** Quantifies tire degradation based on braking, steering, and cornering forces.

**Formula:**
```
TSI = (Brake_Total × 0.4) + (|Steering_Angle| × 0.3) + (|Lateral_G| × 0.3)
```

**Where:**
- `Brake_Total = mean(pbrake_f + pbrake_r)` - Average combined brake pressure
- `Steering_Angle` - Absolute steering angle in degrees
- `Lateral_G = max(|accy_can|)` - Maximum lateral acceleration

**Range:** 0 to ~100+ (higher = more tire wear)

**Derivation:**
- **40% weight on braking** - Primary factor in tire wear
- **30% weight on steering** - Lateral forces create heat
- **30% weight on lateral G** - Cornering forces stress tires

**Example Calculation:**
```
Brake_Total = 45.2 + 32.1 = 77.3 (average)
Steering_Angle = 12.5°
Lateral_G = 0.85 m/s²

TSI = (77.3 × 0.4) + (12.5 × 0.3) + (0.85 × 0.3)
    = 30.92 + 3.75 + 0.255
    = 34.925
```

**Usage:** Monitor tire degradation in real-time. Values > 70 indicate significant wear.

---

## 2. Attack Window (AW)

**Definition:** Percentage indicating optimal overtaking opportunities when lap times are improving with high throttle.

**Formula:**
```
AW = (Improving_Lap_Ratio) × (High_Throttle_Ratio)
```

**Where:**
- `Improving_Lap_Ratio = count(ΔLapTime < 0) / (total_laps - 1)`
  - Count of laps where time decreased (improved)
  - Excludes first lap (no baseline)
  
- `High_Throttle_Ratio = count(throttle > 70%) / total_samples`
  - Percentage of time throttle exceeds 70%

**Range:** 0.0 to 1.0 (1.0 = maximum attack potential)

**Mathematical Derivation:**
```
Let:
  L = {l₁, l₂, ..., lₙ} be lap times
  T = {t₁, t₂, ..., tₘ} be throttle samples

Improving_Lap_Ratio = (1/(n-1)) × Σ[I(Δlᵢ < 0)] for i ∈ [2, n]
                    where I is indicator function

High_Throttle_Ratio = (1/m) × Σ[I(tⱼ > 70)] for j ∈ [1, m]

AW = Improving_Lap_Ratio × High_Throttle_Ratio
```

**Example Calculation:**
```
Lap times: [105.2, 105.0, 104.8, 105.1]
Improvements: [↓, ↓, ↑] = 2 out of 3
Improving_Lap_Ratio = 2/3 = 0.667

Throttle samples: 1000 total, 650 > 70%
High_Throttle_Ratio = 650/1000 = 0.65

AW = 0.667 × 0.65 = 0.434 (43.4% attack window)
```

**Usage:** Identify when driver is gaining time and driving aggressively - optimal for overtaking attempts.

---

## 3. Fuel Conservation Mode (FCM)

**Definition:** Percentage of race time spent in fuel-saving mode (low throttle + braking/coasting).

**Formula:**
```
FCM = count(throttle < 30%) / total_samples
```

**Where:**
- `throttle < 30%` - Low throttle indicates fuel conservation
- Represents percentage of telemetry samples in conservation mode

**Range:** 0.0 to 1.0 (1.0 = 100% conservation mode)

**Mathematical Model:**
```
FCM = (1/n) × Σ[I(tᵢ < 30)] for i ∈ [1, n]

where:
  n = total telemetry samples
  tᵢ = throttle value at sample i
  I(condition) = indicator function (1 if true, 0 if false)
```

**Example Calculation:**
```
Total throttle samples: 10,000
Samples with throttle < 30%: 2,940

FCM = 2,940 / 10,000 = 0.294 (29.4% fuel conservation)
```

**Usage:** Track fuel efficiency patterns. Higher values indicate more fuel-efficient driving strategy.

---

## 4. Overtake Risk (OR)

**Definition:** Normalized risk score based on steering angle (proxy for aggressive maneuvers).

**Formula:**
```
OR = min(|Steering_Angle_max| / 180°, 1.0)
```

**Where:**
- `Steering_Angle_max` - Maximum absolute steering angle observed
- Normalized by maximum steering angle (180°)

**Range:** 0.0 to 1.0 (1.0 = maximum risk/aggression)

**Mathematical Model:**
```
OR = min(max(|θᵢ|) / θₘₐₓ, 1.0)

where:
  θᵢ = steering angle at sample i
  θₘₐₓ = 180° (maximum steering angle)
```

**Enhanced Formula (Future):**
```
OR = (Steering_Norm × 0.5) + (1 / (Speed_Gap + 1) × 0.5)

where Speed_Gap would come from position data
```

**Example Calculation:**
```
Maximum steering angle observed: 142.8°
OR = min(142.8 / 180, 1.0) = min(0.793, 1.0) = 0.793
```

**Usage:** Quantify driver aggressiveness and overtaking attempts. Higher values indicate more risky passing maneuvers.

---

## 5. Ideal Pit Window (IPW)

**Definition:** Combined metric indicating when pit stop is needed based on increasing tire stress and degrading lap times.

**Formula:**
```
IPW = (Normalized_Stress_Slope × 0.5) + (Normalized_Lap_Slope × 0.5)
```

**Where:**
```
Normalized_Stress_Slope = min(tire_stress_slope / 100, 1.0) if slope > 0 else 0

Normalized_Lap_Slope = min(lap_time_slope / 10.0, 1.0) if slope > 0 else 0
```

**Derivations:**
```
Tire Stress Slope:
  Split brake pressure data into two halves
  stress_slope = (mean(second_half) - mean(first_half)) / mid_point
  Normalize: divide by 100 (typical pressure range)

Lap Time Slope:
  lap_time_slope = (lₙ - l₁) / (n - 1) for last 5 laps
  Normalize: divide by 10 seconds (significant time loss threshold)
```

**Range:** 0.0 to 1.0 (1.0 = pit stop immediately needed)

**Mathematical Model:**
```
Let L = [lₙ₋₄, lₙ₋₃, lₙ₋₂, lₙ₋₁, lₙ] be last 5 lap times
Let B = [b₁, b₂, ..., bₘ] be brake pressure samples (last 100)

Lap_Time_Slope = (lₙ - lₙ₋₄) / 4

Tire_Stress_Slope = (mean(B[m/2:m]) - mean(B[0:m/2])) / (m/2)

Normalized_Stress_Slope = min(max(0, Tire_Stress_Slope / 100), 1.0)
Normalized_Lap_Slope = min(max(0, Lap_Time_Slope / 10), 1.0)

IPW = 0.5 × Normalized_Stress_Slope + 0.5 × Normalized_Lap_Slope
```

**Example Calculation:**
```
Last 5 lap times: [104.8, 105.1, 105.3, 105.6, 105.9]
Lap_Time_Slope = (105.9 - 104.8) / 4 = 0.275 seconds/lap
Normalized_Lap_Slope = min(0.275 / 10, 1.0) = 0.0275

Brake pressure trend: first half avg = 40, second half avg = 45
Tire_Stress_Slope = (45 - 40) / 50 = 0.1
Normalized_Stress_Slope = min(0.1 / 100, 1.0) = 0.001

IPW = (0.001 × 0.5) + (0.0275 × 0.5) = 0.01425
```

**Usage:** Determine optimal pit stop timing. Values > 0.5 suggest pit window approaching.

---

## Formula Summary Table

| Metric | Formula | Weight Factors | Range |
|--------|---------|----------------|-------|
| **Tire Stress Index** | `(Brake × 0.4) + (Steering × 0.3) + (Lateral_G × 0.3)` | 40/30/30 | 0-100+ |
| **Attack Window** | `(ΔLap_Improving / Total) × (Throttle>70% / Total)` | Equal | 0-1.0 |
| **Fuel Conservation** | `Count(Throttle<30%) / Total_Samples` | N/A | 0-1.0 |
| **Overtake Risk** | `min(Steering_Max / 180°, 1.0)` | N/A | 0-1.0 |
| **Ideal Pit Window** | `(Stress_Slope_Norm × 0.5) + (Lap_Slope_Norm × 0.5)` | 50/50 | 0-1.0 |

---

## Design Philosophy

### Why These Formulas?

1. **Simplicity** - Easy to understand and verify
2. **Interpretability** - Each component has clear physical meaning
3. **Robustness** - Work with incomplete or noisy data
4. **Performance** - Fast computation for real-time use
5. **Weighted Accuracy** - Factors weighted by racing engineering principles

### Mathematical Principles

- **Weighted Averages** - Combine multiple signals with domain knowledge
- **Normalization** - All outputs in comparable ranges (0-1 or 0-100)
- **Slope Detection** - Trend analysis for time-series predictions
- **Ratio Metrics** - Percentage-based for intuitive interpretation

---

## Validation & Calibration

These formulas are calibrated using:
- Toyota GR Cup race data
- Real telemetry from Barber Motorsports Park
- 20 drivers' data across multiple race conditions

**Sample Results:**
- Driver GR86-022-13: TSI=8.772, AW=0.352, FCM=0.294, OR=0.793, IPW=0.005
- Driver GR86-047-21: TSI=9.125, AW=0.372, FCM=0.309, OR=1.0, IPW=0.004

---

**Built for Toyota GR Cup // Race Engineering Intelligence**

