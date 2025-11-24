# 📋 Submission Form Answers

## 1. Testing Instructions for Application

### Quick Start (5 Steps)

1. **Install Dependencies:**
   ```bash
   # Python backend
   pip install pandas numpy
   
   # React frontend
   cd pitgpt---toyota-gr-cup-ai-engineer
   npm install
   ```

2. **Generate Metrics:**
   ```bash
   python3 compute_metrics.py
   # Creates race_metrics.csv with metrics for 20 drivers
   ```

3. **Copy Data Files:**
   ```bash
   cd pitgpt---toyota-gr-cup-ai-engineer
   cp ../race_metrics.csv public/
   ```

4. **Start Application:**
   ```bash
   npm run dev
   # Opens at http://localhost:3000
   ```

5. **Test the Application:**
   - Click "Connect Car" button
   - Verify "TELEMETRY ONLINE" status appears
   - Check "Data Sources" panel shows real vehicle IDs (e.g., GR86-022-13)
   - Confirm telemetry chart is streaming data
   - Wait 4 seconds for AI strategy to appear

### Verification Checklist

✅ **Real Data Verification:**
- "Data Sources" panel displays actual vehicle IDs from dataset
- Shows "Real CSV (X frames)" or "Python compute_metrics.py" badges
- Source file names displayed (e.g., `R1_barber_telemetry_data.csv`)

✅ **Live Functionality:**
- Telemetry values (speed, RPM, throttle, brake) updating in real-time
- Tire wear and temperatures changing
- AI strategy recommendations updating every 4 seconds
- Driver selection changes metrics immediately

✅ **No Errors:**
- Check browser console for warnings/errors
- System gracefully falls back if API unavailable

### Expected Output

- **20 drivers** available in dropdown
- **Real-time telemetry** streaming at 10Hz (100ms intervals)
- **5 strategic metrics** computed per driver
- **AI strategy** recommendations every 4 seconds
- **Data source indicators** clearly showing real vs calculated data

---

## 2. Which Dataset Did You Use?

**Dataset: Barber Motorsports Park - Race 1 (Toyota GR Cup)**

We used the **Barber dataset** provided for the competition.

### Files Used:

1. **`barber/R1_barber_telemetry_data.csv`** (Primary)
   - Real-time telemetry: throttle, brake, steering, acceleration, RPM, gear
   - Contains millions of data points across all drivers
   - Vehicle IDs: GR86-XXX-XX format

2. **`barber/23_AnalysisEnduranceWithSections_Race 1_Anonymized.CSV`**
   - Lap times, section times (S1, S2, S3)
   - Used for: Attack window detection, lap pace trends

3. **`barber/26_Weather_Race 1_Anonymized.CSV`**
   - Weather conditions: temperature, humidity, pressure
   - Used for: Tire temperature calculations

4. **`barber/R1_barber_lap_time.csv`**
   - Lap timing data with timestamps

### Data Verification in UI:

The application displays:
- ✅ Actual vehicle IDs from dataset (visible in "Data Sources" panel)
- ✅ Source file names shown in UI
- ✅ Frame counts from real telemetry
- ✅ Python metrics computation clearly labeled

**All data sources are transparently displayed in the UI for judge verification.**

---

## 3. Open Source Software Credits

### Open Source Libraries Used:

1. **React** v19.2.0 (MIT License)
   - Core UI framework
   - Credits: Facebook/Meta
   - https://react.dev/

2. **TypeScript** v5.8.2 (Apache 2.0 License)
   - Type-safe JavaScript
   - Credits: Microsoft
   - https://www.typescriptlang.org/

3. **Vite** v6.2.0 (MIT License)
   - Build tool and dev server
   - Credits: Evan You
   - https://vitejs.dev/

4. **Recharts** v3.5.0 (MIT License)
   - Data visualization library for telemetry charts
   - Credits: Recharts Team
   - https://recharts.org/

5. **Lucide React** v0.554.0 (ISC License)
   - Icon library
   - Credits: Lucide Contributors
   - https://lucide.dev/

6. **TailwindCSS** (MIT License)
   - CSS framework (via CDN)
   - Credits: Tailwind Labs
   - https://tailwindcss.com/

7. **pandas** (BSD 3-Clause License)
   - Python data manipulation library
   - Credits: Pandas Development Team
   - https://pandas.pydata.org/

8. **numpy** (BSD 3-Clause License)
   - Python numerical computing library
   - Credits: NumPy Development Team
   - https://numpy.org/

### External Services:

9. **OpenAI API** (Commercial Service)
   - GPT-4o-mini for AI strategy recommendations
   - Provider: OpenAI
   - Note: System includes rule-based fallback if unavailable

10. **Google Fonts** (SIL Open Font License)
    - Fonts: Inter, JetBrains Mono
    - Provider: Google
    - https://fonts.google.com/

### Compliance Statement:

✅ **All open source licenses permit commercial use and modification**

✅ **Our Original Contributions:**
- Custom race strategy algorithms (5 metrics computed from telemetry)
- Real-time telemetry processing and streaming system
- AI prompt engineering for race engineering context
- Complete UI/UX design and dashboard implementation
- Python metrics computation pipeline (`compute_metrics.py`)
- Data source tracking and verification system
- Hybrid real data + calculated metrics approach

✅ **No open source hardware used**

### License Compliance:

All libraries used have permissive licenses (MIT, BSD, ISC, Apache 2.0) that:
- Allow commercial use
- Permit modification
- Require attribution (provided above)
- Are compatible with competition requirements

**Our project significantly enhances these tools with domain-specific race engineering intelligence.**

---

## Quick Reference

- **Dataset:** Barber Motorsports Park - Race 1
- **Primary Files:** `R1_barber_telemetry_data.csv`, `23_AnalysisEnduranceWithSections_Race 1_Anonymized.CSV`, `26_Weather_Race 1_Anonymized.CSV`
- **Open Source:** React, TypeScript, Vite, Recharts, pandas, numpy (all properly licensed)
- **Original Code:** All race strategy algorithms, metrics computation, and UI components are original work

---

**Ready for Submission** ✅

