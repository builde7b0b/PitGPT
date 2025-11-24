"""
Pre-process large telemetry CSV into smaller JSON files per driver
This makes it fast to load in the browser
"""

import pandas as pd
import json
import os
from pathlib import Path

def parse_time_str(time_str):
    """Parse MM:SS.mmm format to seconds"""
    if pd.isna(time_str) or time_str == '':
        return None
    parts = str(time_str).split(':')
    if len(parts) == 2:
        return float(parts[0]) * 60 + float(parts[1])
    return None

def preprocess_telemetry(input_csv: str, output_dir: str):
    """Pre-process telemetry CSV into per-driver JSON files"""
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    print(f"Loading telemetry CSV: {input_csv}...")
    print("This may take a minute for large files...")
    
    # Read in chunks to handle large files
    chunk_size = 100000
    all_frames = {}
    
    for chunk_num, chunk in enumerate(pd.read_csv(input_csv, chunksize=chunk_size)):
        print(f"Processing chunk {chunk_num + 1}...")
        
        # Filter and process chunk
        for _, row in chunk.iterrows():
            vehicle_id = str(row.get('vehicle_id', '')).strip()
            if not vehicle_id or pd.isna(vehicle_id):
                continue
            
            timestamp_str = str(row.get('timestamp', ''))
            if pd.isna(timestamp_str) or timestamp_str == '':
                continue
            
            # Parse timestamp
            try:
                from dateutil import parser as date_parser
                timestamp = int(date_parser.parse(timestamp_str).timestamp() * 1000)
            except:
                continue
            
            lap = int(row.get('lap', 0)) if pd.notna(row.get('lap')) else 0
            telemetry_name = str(row.get('telemetry_name', '')).strip()
            telemetry_value = row.get('telemetry_value', 0)
            
            # Initialize driver if needed
            if vehicle_id not in all_frames:
                all_frames[vehicle_id] = {}
            
            # Group by timestamp
            timestamp_key = str(timestamp)
            if timestamp_key not in all_frames[vehicle_id]:
                all_frames[vehicle_id][timestamp_key] = {
                    'timestamp': timestamp,
                    'vehicle_id': vehicle_id,
                    'lap': lap,
                    'throttle': 0,
                    'brake_f': 0,
                    'brake_r': 0,
                    'steering': 0,
                    'accx': 0,
                    'accy': 0,
                    'gear': 0,
                    'rpm': 0
                }
            
            frame = all_frames[vehicle_id][timestamp_key]
            value = float(telemetry_value) if pd.notna(telemetry_value) else 0
            
            # Map telemetry fields
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
    
    print(f"\nProcessed {len(all_frames)} drivers")
    
    # Convert to arrays and save per driver
    for vehicle_id, frames_dict in all_frames.items():
        # Convert dict to sorted array
        frames = list(frames_dict.values())
        frames.sort(key=lambda x: x['timestamp'])
        
        # Clean vehicle_id for filename
        safe_id = vehicle_id.replace('/', '_').replace('\\', '_')
        output_file = output_path / f"{safe_id}_telemetry.json"
        
        print(f"Saving {len(frames)} frames for {vehicle_id}...")
        
        with open(output_file, 'w') as f:
            json.dump(frames, f, indent=2)
        
        print(f"✓ Saved to {output_file}")
    
    print(f"\n✅ Pre-processing complete! Saved {len(all_frames)} driver files to {output_dir}")

def preprocess_lap_times(input_csv: str, output_file: str):
    """Pre-process lap times CSV into JSON"""
    
    print(f"\nLoading lap times: {input_csv}...")
    
    df = pd.read_csv(input_csv, sep=';')
    
    lap_times_by_driver = {}
    
    for _, row in df.iterrows():
        driver_num = int(row.get('NUMBER', 0)) if pd.notna(row.get('NUMBER')) else 0
        if driver_num == 0:
            continue
        
        lap_time_str = str(row.get(' LAP_TIME', ''))
        if pd.isna(lap_time_str) or lap_time_str == '':
            continue
        
        lap_time_seconds = parse_time_str(lap_time_str)
        if lap_time_seconds is None:
            continue
        
        if driver_num not in lap_times_by_driver:
            lap_times_by_driver[driver_num] = []
        
        lap_times_by_driver[driver_num].append(lap_time_seconds)
    
    # Save to JSON
    with open(output_file, 'w') as f:
        json.dump(lap_times_by_driver, f, indent=2)
    
    print(f"✓ Saved lap times for {len(lap_times_by_driver)} drivers to {output_file}")

if __name__ == "__main__":
    # Input files
    telemetry_csv = "barber/R1_barber_telemetry_data.csv"
    lap_times_csv = "barber/23_AnalysisEnduranceWithSections_Race 1_Anonymized.CSV"
    
    # Output directories
    telemetry_output = "pitgpt---toyota-gr-cup-ai-engineer/public/barber/telemetry"
    lap_times_output = "pitgpt---toyota-gr-cup-ai-engineer/public/barber/lap_times.json"
    
    # Pre-process telemetry
    if os.path.exists(telemetry_csv):
        preprocess_telemetry(telemetry_csv, telemetry_output)
    else:
        print(f"⚠️  Telemetry CSV not found: {telemetry_csv}")
    
    # Pre-process lap times
    if os.path.exists(lap_times_csv):
        preprocess_lap_times(lap_times_csv, lap_times_output)
    else:
        print(f"⚠️  Lap times CSV not found: {lap_times_csv}")

