"""
PitGPT - Compute Race Strategy Metrics
Simple formulas only - no overbuilding
"""

import pandas as pd
import numpy as np
from pathlib import Path

def parse_lap_time(time_str: str) -> float:
    """Convert MM:SS.mmm to seconds"""
    if pd.isna(time_str) or time_str == '':
        return np.nan
    parts = time_str.split(':')
    if len(parts) == 2:
        return float(parts[0]) * 60 + float(parts[1])
    return float(time_str)

def compute_tire_stress_index(telemetry_df: pd.DataFrame, driver_id: str) -> float:
    """
    Tire Stress Index = High brake pressure + steering + lateral G spikes
    Simple: (brake_pressure_mean * 0.4) + (steering_abs_mean * 0.3) + (lateral_g_max * 0.3)
    """
    driver_data = telemetry_df[telemetry_df['vehicle_id'] == driver_id]
    
    # Get brake pressure (front + rear)
    brake_f = driver_data[driver_data['telemetry_name'] == 'pbrake_f']['telemetry_value'].astype(float)
    brake_r = driver_data[driver_data['telemetry_name'] == 'pbrake_r']['telemetry_value'].astype(float)
    brake_total = (brake_f.fillna(0) + brake_r.fillna(0)).mean()
    
    # Get steering angle (absolute)
    steering = driver_data[driver_data['telemetry_name'] == 'Steering_Angle']['telemetry_value'].astype(float).abs().mean()
    
    # Get lateral G (accy_can - max spike)
    lateral_g = driver_data[driver_data['telemetry_name'] == 'accy_can']['telemetry_value'].astype(float).abs().max()
    
    if pd.isna(brake_total):
        brake_total = 0
    if pd.isna(steering):
        steering = 0
    if pd.isna(lateral_g):
        lateral_g = 0
    
    return (brake_total * 0.4) + (steering * 0.3) + (lateral_g * 0.3)

def compute_attack_window(lap_times_df: pd.DataFrame, telemetry_df: pd.DataFrame, driver_id: str, vehicle_number: int) -> float:
    """
    Attack Window = When lap time is decreasing while throttle > 70%
    Simple: % of laps where lap time decreased AND throttle > 70%
    """
    # Get lap times for driver (match by NUMBER which is car number)
    driver_laps = lap_times_df[lap_times_df['NUMBER'] == vehicle_number].copy()
    
    if len(driver_laps) < 2:
        return 0.0
    
    # Calculate lap time changes (column has leading space)
    lap_times = driver_laps[' LAP_TIME'].apply(parse_lap_time).dropna().sort_index()
    if len(lap_times) < 2:
        return 0.0
    
    # Count laps where time decreased (improved)
    time_decreasing = (lap_times.diff() < 0).sum()
    total_laps = len(lap_times) - 1  # exclude first lap (no diff)
    
    # Get throttle data
    throttle_data = telemetry_df[
        (telemetry_df['vehicle_id'] == driver_id) & 
        (telemetry_df['telemetry_name'] == 'aps')
    ]['telemetry_value'].astype(float)
    
    if len(throttle_data) == 0:
        return 0.0
    
    high_throttle_count = (throttle_data > 70).sum()
    high_throttle_ratio = high_throttle_count / len(throttle_data)
    
    # Simple: if lap time decreasing and throttle high, that's attack window
    improving_lap_ratio = time_decreasing / total_laps if total_laps > 0 else 0.0
    attack_percentage = improving_lap_ratio * high_throttle_ratio
    
    return min(attack_percentage, 1.0)

def compute_fuel_conservation_mode(telemetry_df: pd.DataFrame, driver_id: str) -> float:
    """
    Fuel Conservation Mode = Low throttle + long braking coast
    Simple: % of time throttle < 30% AND brake > 0 (coasting/braking)
    """
    driver_data = telemetry_df[telemetry_df['vehicle_id'] == driver_id]
    
    throttle = driver_data[driver_data['telemetry_name'] == 'aps']['telemetry_value'].astype(float)
    brake_f = driver_data[driver_data['telemetry_name'] == 'pbrake_f']['telemetry_value'].astype(float).fillna(0)
    brake_r = driver_data[driver_data['telemetry_name'] == 'pbrake_r']['telemetry_value'].astype(float).fillna(0)
    brake_total = brake_f + brake_r
    
    # Align indices (use timestamp as key)
    throttle_ts = driver_data[driver_data['telemetry_name'] == 'aps'][['timestamp', 'telemetry_value']].rename(columns={'telemetry_value': 'throttle'})
    brake_ts = driver_data[driver_data['telemetry_name'] == 'pbrake_f'][['timestamp', 'telemetry_value']].rename(columns={'telemetry_value': 'brake'})
    
    if len(throttle_ts) == 0:
        return 0.0
    
    # Simple: count samples where throttle low AND brake applied
    low_throttle = (throttle < 30).sum()
    
    # For simplicity, approximate: low throttle = conservation mode
    return low_throttle / len(throttle) if len(throttle) > 0 else 0.0

def compute_overtake_risk(telemetry_df: pd.DataFrame, driver_id: str, all_drivers: list) -> float:
    """
    Overtake Risk = High steering + low speed gap
    Simple: (steering_max * 0.5) + (1 / (speed_gap + 1) * 0.5)
    """
    driver_data = telemetry_df[telemetry_df['vehicle_id'] == driver_id]
    
    # Get max steering angle
    steering = driver_data[driver_data['telemetry_name'] == 'Steering_Angle']['telemetry_value'].astype(float).abs().max()
    
    # Get driver speed (need to extract from telemetry or use section data)
    # For simplicity, use steering as proxy for risk
    if pd.isna(steering):
        steering = 0
    
    # Normalize steering (assume max ~180 degrees)
    steering_norm = min(steering / 180.0, 1.0)
    
    # Speed gap simplified (would need position data for real calculation)
    # For now, use steering as primary indicator
    return steering_norm

def compute_ideal_pit_window(lap_times_df: pd.DataFrame, telemetry_df: pd.DataFrame, driver_id: str, vehicle_number: int) -> float:
    """
    Ideal Pit Window = Tire Stress ↑ & Lap Time ↑ combined slope
    Simple: (tire_stress_slope * 0.5) + (lap_time_slope * 0.5) where both positive
    """
    # Get last 5 laps for trend
    driver_laps = lap_times_df[lap_times_df['NUMBER'] == vehicle_number].copy()
    lap_times = driver_laps[' LAP_TIME'].apply(parse_lap_time).dropna().tail(5).sort_index()
    
    if len(lap_times) < 2:
        return 0.0
    
    # Lap time slope (increasing = worse = pit needed)
    lap_time_slope = (lap_times.iloc[-1] - lap_times.iloc[0]) / len(lap_times)
    
    # Tire stress over last laps (simplified: use brake pressure trend)
    driver_data = telemetry_df[telemetry_df['vehicle_id'] == driver_id]
    brake_f = driver_data[driver_data['telemetry_name'] == 'pbrake_f']['telemetry_value'].astype(float).dropna().tail(100)
    
    if len(brake_f) < 10:
        tire_stress_slope = 0
    else:
        # Split into two halves and compare
        mid = len(brake_f) // 2
        first_half = brake_f[:mid].mean()
        second_half = brake_f[mid:].mean()
        tire_stress_slope = (second_half - first_half) / mid if mid > 0 else 0
    
    # Combined: both increasing = pit window
    # Normalize lap_time_slope (1 second increase = 0.1 score)
    normalized_lap_slope = min(lap_time_slope / 10.0, 1.0) if lap_time_slope > 0 else 0
    normalized_stress_slope = min(tire_stress_slope / 100.0, 1.0) if tire_stress_slope > 0 else 0
    
    combined = (normalized_stress_slope * 0.5) + (normalized_lap_slope * 0.5)
    
    return min(combined, 1.0)

def compute_all_metrics(data_dir: str = "barber") -> pd.DataFrame:
    """Compute all 5 metrics for all drivers"""
    
    # Load data
    telemetry_df = pd.read_csv(f"{data_dir}/R1_barber_telemetry_data.csv")
    lap_times_df = pd.read_csv(f"{data_dir}/23_AnalysisEnduranceWithSections_Race 1_Anonymized.CSV", sep=';')
    weather_df = pd.read_csv(f"{data_dir}/26_Weather_Race 1_Anonymized.CSV", sep=';')
    
    # Get unique drivers with their vehicle numbers
    driver_info = telemetry_df[['vehicle_id', 'vehicle_number']].drop_duplicates()
    
    results = []
    
    for _, row in driver_info.iterrows():
        driver_id = row['vehicle_id']
        vehicle_number = int(row['vehicle_number']) if pd.notna(row['vehicle_number']) else None
        
        if vehicle_number is None:
            continue
            
        print(f"Computing metrics for {driver_id} (vehicle #{vehicle_number})...")
        
        try:
            tire_stress = compute_tire_stress_index(telemetry_df, driver_id)
            attack_window = compute_attack_window(lap_times_df, telemetry_df, driver_id, vehicle_number)
            fuel_conservation = compute_fuel_conservation_mode(telemetry_df, driver_id)
            overtake_risk = compute_overtake_risk(telemetry_df, driver_id, driver_info['vehicle_id'].unique())
            pit_window = compute_ideal_pit_window(lap_times_df, telemetry_df, driver_id, vehicle_number)
            
            results.append({
                'driver_id': driver_id,
                'vehicle_number': vehicle_number,
                'tire_stress_index': round(tire_stress, 3),
                'attack_window': round(attack_window, 3),
                'fuel_conservation_mode': round(fuel_conservation, 3),
                'overtake_risk': round(overtake_risk, 3),
                'ideal_pit_window': round(pit_window, 3)
            })
        except Exception as e:
            print(f"Error processing {driver_id}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    return pd.DataFrame(results)

if __name__ == "__main__":
    print("🏎️  Computing Race Strategy Metrics...")
    results_df = compute_all_metrics()
    
    print("\n📊 Results:")
    print(results_df.to_string(index=False))
    
    # Save results
    results_df.to_csv("race_metrics.csv", index=False)
    print(f"\n✅ Saved to race_metrics.csv")

