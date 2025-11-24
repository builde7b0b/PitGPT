# 🏆 PitGPT — Real-Time Race Strategy Using Predictive Telemetry

**One-Sentence Pitch:**

PitGPT uses real telemetry data + AI to recommend optimal pit strategy, overtaking risk windows, tire stress alerts, and safe-vs-aggressive driving profiles — LIVE from Toyota GR Cup data.

**Category:** 🔹 Real-Time Analytics

---

## 💡 Project Overview

PitGPT simulates a **race engineer's decision-making process** in real-time. Rather than simply displaying lap averages or predicting winners, we analyze live telemetry to provide actionable strategic insights that help drivers and teams make split-second decisions during races.

### Key Differentiators

- **Real-time telemetry analysis** from Toyota GR Cup race data
- **5 strategic metrics** computed from raw sensor data
- **AI-powered strategy recommendations** using OpenAI
- **Transparent data sources** - judges can verify all data comes from the Barber dataset
- **Production-ready dashboard** with live streaming telemetry

---

## 🏗️ Architecture

### Backend (Python)
- **`compute_metrics.py`** - Computes 5 key race strategy metrics from telemetry data:
  1. **Tire Stress Index** - High brake pressure + steering + lateral G spikes
  2. **Attack Window** - When lap time is decreasing while throttle > 70%
  3. **Fuel Conservation Mode** - Low throttle + long braking coast
  4. **Overtake Risk** - High steering + low speed gap
  5. **Ideal Pit Window** - Tire Stress ↑ & Lap Time ↑ combined slope

### Frontend (React + TypeScript)
- **Real-time dashboard** displaying telemetry and AI-generated strategy recommendations
- **Live metrics** synced from Python backend via CSV
- **OpenAI integration** for intelligent strategy insights (with rule-based fallback)
- **Data source verification** - clearly shows where all data originates

---

## 📊 Dataset

**Toyota GR Cup - Barber Motorsports Park, Race 1**

We used the **Barber dataset** provided for the competition:

- `barber/R1_barber_telemetry_data.csv` - Real-time telemetry (throttle, brake, steering, acceleration, RPM, gear)
- `barber/23_AnalysisEnduranceWithSections_Race 1_Anonymized.CSV` - Lap times and section analysis
- `barber/26_Weather_Race 1_Anonymized.CSV` - Weather conditions
- `barber/R1_barber_lap_time.csv` - Lap timing data

**Data Verification:** The UI displays actual vehicle IDs (e.g., GR86-022-13) and source file names, proving all data comes from the provided dataset.

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- OpenAI API Key (optional - system works with rule-based fallback)

### Installation & Setup

#### 1. Compute Metrics (Python Backend)

```bash
# Install Python dependencies
pip install pandas numpy

# Run metric computation
python3 compute_metrics.py
```

This generates `race_metrics.csv` with computed metrics for all drivers (approximately 20 drivers).

#### 2. Start UI (React Frontend)

```bash
cd pitgpt---toyota-gr-cup-ai-engineer

# Install dependencies
npm install

# Copy metrics to public directory
cp ../race_metrics.csv public/

# (Optional) Create .env file for OpenAI API
echo "OPENAI_API_KEY=your_key_here" > .env

# Start development server
npm run dev
```

The application will open at `http://localhost:3000`

### Usage

1. **Select a driver** from the dropdown menu
2. **Click "Connect Car"** to start telemetry streaming
3. **Monitor real-time data:**
   - Live telemetry chart (speed, RPM)
   - Car status panel (tire wear, temperatures, fuel)
   - Strategic metrics (5 computed values)
   - AI strategy recommendations
4. **Verify data sources** in the "Data Sources" panel:
   - Shows actual vehicle IDs from dataset
   - Displays source file names
   - Indicates Python metrics vs. calculated metrics

### Testing

**Verification Checklist:**
- ✅ "TELEMETRY ONLINE" status appears when started
- ✅ "Data Sources" panel shows real vehicle IDs (e.g., GR86-022-13)
- ✅ Telemetry chart streams data in real-time
- ✅ AI strategy recommendations appear within 4 seconds
- ✅ Source files displayed (e.g., `R1_barber_telemetry_data.csv`)

---

## 🎯 Key Features

### Real-Time Strategic Metrics

1. **Tire Stress Index (0-100)**
   - Monitors tire degradation in real-time
   - Based on brake pressure, steering angle, and lateral G-forces
   - Higher values indicate increased tire wear

2. **Attack Window (0-1)**
   - Identifies optimal overtaking opportunities
   - Detects when lap time is decreasing while throttle > 70%
   - Higher values indicate more aggressive driving windows

3. **Fuel Conservation Mode (0-1)**
   - Tracks fuel-saving driving patterns
   - Based on low throttle + long braking coast periods
   - Higher values indicate more fuel-efficient driving

4. **Overtake Risk (0-1)**
   - Calculates collision risk during passes
   - Based on steering angle and speed gap to other cars
   - Higher values indicate higher risk but necessary opportunities

5. **Ideal Pit Window (0-1)**
   - Determines optimal pit stop timing
   - Combined slope of Tire Stress ↑ & Lap Time ↑
   - Higher values indicate pit stop needed soon

### AI Strategy Engine

- **OpenAI GPT-4o-mini** for intelligent strategy recommendations
- **Rule-based fallback** if API unavailable (always works)
- **Driver style analysis** (Aggressive/Balanced/Conservative)
- **Context-aware recommendations** based on current race state
- **Risk alerts** and pit strategy suggestions

---

## 📁 Project Structure

```
PitGPT/
├── barber/                          # Race data files (Toyota GR Cup dataset)
│   ├── R1_barber_telemetry_data.csv
│   ├── R1_barber_lap_time.csv
│   └── *.CSV                        # Additional analysis files
├── compute_metrics.py               # Python backend - metric computation
├── race_metrics.csv                 # Generated metrics (output)
├── pitgpt---toyota-gr-cup-ai-engineer/  # React frontend
│   ├── App.tsx                      # Main application component
│   ├── components/                  # UI components
│   │   ├── CarStatus.tsx
│   │   ├── DataSourceInfo.tsx      # Data source verification panel
│   │   ├── StrategyCard.tsx
│   │   └── TelemetryChart.tsx
│   ├── services/
│   │   ├── raceMetricsService.ts   # Python metrics sync
│   │   ├── openaiService.ts        # AI strategy recommendations
│   │   └── realTelemetryService.ts # Real telemetry streaming
│   └── public/
│       └── race_metrics.csv        # Metrics served to UI
└── README.md                        # This file
```

---

## 🔧 Technology Stack

**Backend:**
- Python 3.9+
- pandas, numpy

**Frontend:**
- React 19
- TypeScript
- Vite
- TailwindCSS
- Recharts (data visualization)

**AI Integration:**
- OpenAI GPT-4o-mini (with rule-based fallback)

---

## 📝 How It Works

### Data Pipeline

1. **Raw Telemetry** → Python script processes CSV files
2. **Metric Computation** → 5 strategic metrics calculated per driver
3. **Metrics Output** → `race_metrics.csv` generated
4. **UI Dashboard** → React app loads metrics and displays real-time
5. **AI Analysis** → OpenAI analyzes metrics + telemetry → Strategy recommendations
6. **Live Updates** → Dashboard updates every 100ms with new telemetry

### Data Source Verification

The UI includes a **"Data Sources" panel** that clearly shows:
- Vehicle IDs from the dataset (e.g., GR86-022-13)
- Source file names (`R1_barber_telemetry_data.csv`)
- Frame counts from real telemetry
- Whether metrics come from Python computation or live calculation

This transparency allows judges to verify that all data originates from the provided Toyota GR Cup dataset.

---

## 🧪 Testing Instructions

### Step-by-Step Testing

1. **Generate Metrics:**
   ```bash
   python3 compute_metrics.py
   # Should create race_metrics.csv with ~20 drivers
   ```

2. **Start Application:**
   ```bash
   cd pitgpt---toyota-gr-cup-ai-engineer
   npm install
   cp ../race_metrics.csv public/
   npm run dev
   ```

3. **Verify Functionality:**
   - Select a driver from dropdown
   - Click "Connect Car" button
   - Verify "TELEMETRY ONLINE" status
   - Check Data Sources panel shows real vehicle IDs
   - Confirm telemetry chart is streaming
   - Wait 4 seconds for AI strategy to appear

### Expected Output

- ✅ 20 drivers available in dropdown
- ✅ Real-time telemetry streaming at 10Hz
- ✅ 5 strategic metrics displayed
- ✅ AI strategy recommendations updating
- ✅ Data source indicators showing real vs calculated data

---

## 🔍 Open Source Credits

This project uses the following open source libraries:

- **React** v19.2.0 (MIT License) - UI framework
- **TypeScript** v5.8.2 (Apache 2.0) - Type-safe JavaScript
- **Vite** v6.2.0 (MIT) - Build tool
- **Recharts** v3.5.0 (MIT) - Data visualization
- **Lucide React** v0.554.0 (ISC) - Icons
- **TailwindCSS** (MIT) - CSS framework
- **pandas** (BSD 3-Clause) - Python data processing
- **numpy** (BSD 3-Clause) - Python numerical computing

All licenses permit commercial use. See `SUBMISSION_ANSWERS.md` for complete open source credits and license compliance details.

**Original Contributions:** All race strategy algorithms, metrics computation, UI components, and data processing pipelines are original work.

---

## 📄 License

MIT License

---

## 🏁 Built for Toyota GR Cup

**Race Engineering Intelligence // Real-Time Strategic Analysis**

---

## 📋 Additional Documentation

- **`SUBMISSION_ANSWERS.md`** - Complete submission documentation including:
  - Detailed testing instructions
  - Dataset information (Barber Motorsports Park)
  - Open source credits and license compliance
  - All submission form answers

For questions about implementation or data sources, refer to the "Data Sources" panel in the UI or review the source code.
