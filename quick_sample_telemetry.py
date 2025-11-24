"""
QUICK: Sample telemetry data for just a few drivers
Much faster than processing entire dataset
"""

import pandas as pd
import json
from pathlib import Path

# Only process these drivers (faster)
SAMPLE_DRIVERS = ['GR86-022-13', 'GR86-060-2', 'GR86-047-21', 'GR86-065-5']
SAMPLE_SIZE = 5000  # Only first 5000 rows per driver

def quick_sample_telemetry(input_csv: str, output_dir: str):
    """Quickly sample telemetry for demo drivers only"""
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    print(f"Quick sampling telemetry for {len(SAMPLE_DRIVERS)} drivers...")
    
    # Read only first chunk to find our drivers
    chunk_size = 50000
    frames_by_driver = {driver: {} for driver in SAMPLE_DRIVERS}
    rows_processed = 0
    
    for chunk in pd.read_csv(input_csv, chunksize=chunk_size):
        for _, row in chunk.iterrows():
            rows_processed += 1
            if rows_processed > SAMPLE_SIZE * len(SAMPLE_DRIVERS):
                break
            
            vehicle_id = str(row.get('vehicle_id', '')).strip()
            if vehicle_id not in SAMPLE_DRIVERS:
                continue
            
            timestamp_str = str(row.get('timestamp', ''))
            if pd.isna(timestamp_str) or timestamp_str == '':
                continue
            
            try:
                from dateutil import parser as date_parser
                timestamp = int(date_parser.parse(timestamp_str).timestamp() * 1000)
            except:
                continue
            
            lap = int(row.get('lap', 0)) if pd.notna(row.get('lap')) else 0
            telemetry_name = str(row.get('telemetry_name', '')).strip()
            telemetry_value = row.get('telemetry_value', 0)
            
            timestamp_key = str(timestamp)
            if timestamp_key not in frames_by_driver[vehicle_id]:
                frames_by_driver[vehicle_id][timestamp_key] = {
                    'timestamp': timestamp,
                    'vehicle_id': vehicle_id,
                    'lap': lap,
                    'throttle': 0, 'brake_f': 0, 'brake_r': 0,
                    'steering': 0, 'accx': 0, 'accy': 0, 'gear': 0, 'rpm': 0
                }
            
            frame = frames_by_driver[vehicle_id][timestamp_key]
            value = float(telemetry_value) if pd.notna(telemetry_value) else 0
            
            if telemetry_name == 'aps':
                frame['throttle'] = min(100, max(0, value))
            elif telemetry_name == 'pbrake_f':
                frame['brake_f'] = value
            elif telemetry_name == 'pbrake_r':
                frame['brake_r'] = value
            elif telemetry_name == 'Steering_Angle':
                frame['steering'] = abs(value)
            elif telemetry_name == 'accx_can':
                frame['accx'] = value
            elif telemetry_name == 'accy_can':
                frame['accy'] = abs(value)
            elif telemetry_name == 'gear':
                frame['gear'] = int(value) if pd.notna(value) else 0
            elif telemetry_name == 'nmot':
                frame['rpm'] = int(value) if pd.notna(value) else 0
        
        if rows_processed > SAMPLE_SIZE * len(SAMPLE_DRIVERS):
            break
    
    # Save files
    for vehicle_id, frames_dict in frames_by_driver.items():
        frames = list(frames_dict.values())
        frames.sort(key=lambda x: x['timestamp'])
        
        safe_id = vehicle_id.replace('/', '_').replace('\\', '_')
        output_file = output_path / f"{safe_id}_telemetry.json"
        
        print(f"Saving {len(frames)} frames for {vehicle_id}...")
        with open(output_file, 'w') as f:
            json.dump(frames[:2000], f)  # Limit to 2000 frames
        print(f"✓ {output_file}")

def quick_lap_times(input_csv: str, output_file: str):
    """Quick lap times extraction"""
    print(f"\nLoading lap times...")
    df = pd.read_csv(input_csv, sep=';', nrows=500)
    
    lap_times_by_driver = {}
    for _, row in df.iterrows():
        driver_num = int(row.get('NUMBER', 0)) if pd.notna(row.get('NUMBER')) else 0
        if driver_num == 0:
            continue
        
        lap_time_str = str(row.get(' LAP_TIME', ''))
        if pd.isna(lap_time_str) or lap_time_str == '':
            continue
        
        time_parts = lap_time_str.split(':')
        if len(time_parts) == 2:
            minutes = int(time_parts[0])
            seconds = float(time_parts[1])
            total_seconds = minutes * 60 + seconds
            
            if driver_num not in lap_times_by_driver:
                lap_times_by_driver[driver_num] = []
            lap_times_by_driver[driver_num].append(total_seconds)
    
    with open(output_file, 'w') as f:
        json.dump(lap_times_by_driver, f)
    print(f"✓ {output_file}")

if __name__ == "__main__":
    telemetry_output = "pitgpt---toyota-gr-cup-ai-engineer/public/barber/telemetry"
    quick_sample_telemetry("barber/R1_barber_telemetry_data.csv", telemetry_output)
    quick_lap_times("barber/23_AnalysisEnduranceWithSections_Race 1_Anonymized.CSV", 
                    "pitgpt---toyota-gr-cup-ai-engineer/public/barber/lap_times.json")
    print("\n✅ Quick sampling complete!")

