"""
Create submission package: PDF, Word, ZIP files for hackathon submission
"""

import os
import shutil
from pathlib import Path
import zipfile

def create_zip_package():
    """Create ZIP file with all submission materials"""
    print("📦 Creating submission ZIP package...")
    
    files_to_include = [
        'README.md',
        'SUBMISSION_ANSWERS.md',
        'PitGPT_Math_Models.md',
        'PitGPT_Telemetry_Snippets.csv',
        'PitGPT_Telemetry_Charts.png',
        'compute_metrics.py',
        'race_metrics.csv',
    ]
    
    # Include React frontend (key files only)
    frontend_files = [
        'pitgpt---toyota-gr-cup-ai-engineer/App.tsx',
        'pitgpt---toyota-gr-cup-ai-engineer/package.json',
        'pitgpt---toyota-gr-cup-ai-engineer/README.md',
        'pitgpt---toyota-gr-cup-ai-engineer/components/',
        'pitgpt---toyota-gr-cup-ai-engineer/services/',
        'pitgpt---toyota-gr-cup-ai-engineer/types.ts',
    ]
    
    zip_name = 'PitGPT_Submission_Package.zip'
    
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add root files
        for file in files_to_include:
            if os.path.exists(file):
                if os.path.isdir(file):
                    for root, dirs, files in os.walk(file):
                        for f in files:
                            file_path = os.path.join(root, f)
                            zipf.write(file_path, file_path)
                else:
                    zipf.write(file, file)
                print(f"  ✓ Added: {file}")
        
        # Add frontend files
        for file in frontend_files:
            if os.path.exists(file):
                if os.path.isdir(file):
                    for root, dirs, files in os.walk(file):
                        for f in files:
                            if not f.startswith('.') and 'node_modules' not in root:
                                file_path = os.path.join(root, f)
                                zipf.write(file_path, file_path)
                else:
                    zipf.write(file, file)
                print(f"  ✓ Added: {file}")
        
        # Add deployment info
        if os.path.exists('DEPLOYMENT.md'):
            zipf.write('DEPLOYMENT.md', 'DEPLOYMENT.md')
    
    print(f"✅ Created: {zip_name}")
    file_size = os.path.getsize(zip_name) / (1024 * 1024)  # MB
    print(f"   Size: {file_size:.2f} MB")
    return zip_name

def create_word_document():
    """Create a Word-compatible document (markdown that can be converted)"""
    print("📄 Creating Word document template...")
    
    word_content = """# PitGPT - Real-Time Race Strategy Using Predictive Telemetry
## Toyota GR Cup Hackathon Submission

---

## Project Overview

**PitGPT** simulates a race engineer's decision-making process in real-time. We analyze live telemetry to provide actionable strategic insights that help drivers and teams make split-second decisions during races.

**Key Innovation:** Instead of simply displaying lap averages or predicting winners, we analyze live telemetry to provide actionable strategic insights - simulating the race engineer's brain.

---

## Technical Architecture

### Backend (Python)
- **5 Strategic Metrics** computed from raw telemetry data
- Real-time processing of Toyota GR Cup race data
- Simple, interpretable formulas (no overbuilding)

### Frontend (React + TypeScript)
- Real-time dashboard with live telemetry streaming
- AI-powered strategy recommendations (OpenAI)
- Data source verification panel for transparency

---

## The 5 Strategic Metrics

1. **Tire Stress Index (0-100)**
   - Formula: `(Brake × 0.4) + (Steering × 0.3) + (Lateral_G × 0.3)`
   - Monitors tire degradation in real-time

2. **Attack Window (0-1)**
   - Formula: `(Improving_Lap_Ratio) × (High_Throttle_Ratio)`
   - Identifies optimal overtaking opportunities

3. **Fuel Conservation Mode (0-1)**
   - Formula: `count(throttle < 30%) / total_samples`
   - Tracks fuel-saving driving patterns

4. **Overtake Risk (0-1)**
   - Formula: `min(Steering_Max / 180°, 1.0)`
   - Calculates collision risk during passes

5. **Ideal Pit Window (0-1)**
   - Formula: `(Stress_Slope × 0.5) + (Lap_Slope × 0.5)`
   - Determines optimal pit stop timing

---

## Dataset

**Toyota GR Cup - Barber Motorsports Park, Race 1**

- Real telemetry data from all drivers
- Lap times and section analysis
- Weather conditions
- All source data clearly displayed in UI

---

## Key Features

✅ **Real-time telemetry analysis** - 10Hz streaming
✅ **AI strategy recommendations** - OpenAI GPT-4o-mini
✅ **Data transparency** - Vehicle IDs and source files displayed
✅ **Production-ready** - Deployed and functional
✅ **Mathematical rigor** - Complete formulas documented

---

## Technology Stack

- **Backend:** Python 3.9+, pandas, numpy
- **Frontend:** React 19, TypeScript, Vite, TailwindCSS
- **AI:** OpenAI GPT-4o-mini (with rule-based fallback)
- **Visualization:** Recharts

---

## Submission Files

- `PitGPT_Math_Models.md` - Complete mathematical formulas
- `PitGPT_Telemetry_Snippets.csv` - Real data processing examples
- `PitGPT_Telemetry_Charts.png` - Visual proof of metrics
- `SUBMISSION_ANSWERS.md` - Testing instructions & open source credits

---

## Demo & Deployment

**Live URL:** [Your Netlify/Vercel URL]
**GitHub:** https://github.com/builde7b0b/PitGPT

---

**Built for Toyota GR Cup // Race Engineering Intelligence**
"""
    
    with open('PitGPT_Submission_Summary.txt', 'w') as f:
        f.write(word_content)
    
    print("✅ Created: PitGPT_Submission_Summary.txt")
    print("   Note: Open in Word/Google Docs for formatting")
    
    return 'PitGPT_Submission_Summary.txt'

def create_html_for_pdf():
    """Create HTML that can be converted to PDF"""
    print("📑 Creating HTML document for PDF conversion...")
    
    html_content = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PitGPT - Hackathon Submission</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
        h1 { color: #dc2626; border-bottom: 3px solid #dc2626; padding-bottom: 10px; }
        h2 { color: #1f2937; margin-top: 30px; }
        h3 { color: #4b5563; }
        .header { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .metric { background: #f9fafb; padding: 15px; margin: 10px 0; border-left: 4px solid #dc2626; }
        .code { background: #1f2937; color: #10b981; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
        .highlight { background: #fef3c7; padding: 2px 4px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #dc2626; color: white; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-style: italic; color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏆 PitGPT - Real-Time Race Strategy Using Predictive Telemetry</h1>
        <p><strong>Toyota GR Cup Hackathon Submission</strong></p>
        <p>Category: 🔹 Real-Time Analytics</p>
    </div>

    <h2>Executive Summary</h2>
    <p>PitGPT simulates a <span class="highlight">race engineer's decision-making process</span> in real-time. We analyze live telemetry data to provide actionable strategic insights that help drivers and teams make split-second decisions during races.</p>

    <h2>Innovation & Differentiators</h2>
    <ul>
        <li>✅ Real-time telemetry analysis (not just dashboards)</li>
        <li>✅ Strategic insights (not just lap averages)</li>
        <li>✅ AI-powered recommendations (not just predictions)</li>
        <li>✅ Complete data transparency for judge verification</li>
        <li>✅ Production-ready deployment</li>
    </ul>

    <h2>Technical Architecture</h2>
    
    <h3>Backend (Python)</h3>
    <p>Computes 5 strategic metrics from raw telemetry:</p>
    <ul>
        <li>Tire Stress Index</li>
        <li>Attack Window Detection</li>
        <li>Fuel Conservation Mode</li>
        <li>Overtake Risk Assessment</li>
        <li>Ideal Pit Window Optimization</li>
    </ul>

    <h3>Frontend (React + TypeScript)</h3>
    <p>Real-time dashboard with:</p>
    <ul>
        <li>Live telemetry streaming (10Hz)</li>
        <li>AI strategy recommendations (OpenAI)</li>
        <li>Data source verification panel</li>
        <li>Visual charts and metrics display</li>
    </ul>

    <h2>The 5 Strategic Metrics</h2>
    
    <div class="metric">
        <h3>1. Tire Stress Index (0-100)</h3>
        <p><strong>Formula:</strong> <span class="code">(Brake × 0.4) + (Steering × 0.3) + (Lateral_G × 0.3)</span></p>
        <p>Monitors tire degradation based on braking, steering, and cornering forces.</p>
    </div>

    <div class="metric">
        <h3>2. Attack Window (0-1)</h3>
        <p><strong>Formula:</strong> <span class="code">(Improving_Lap_Ratio) × (High_Throttle_Ratio)</span></p>
        <p>Identifies optimal overtaking opportunities when lap times are improving with high throttle.</p>
    </div>

    <div class="metric">
        <h3>3. Fuel Conservation Mode (0-1)</h3>
        <p><strong>Formula:</strong> <span class="code">count(throttle < 30%) / total_samples</span></p>
        <p>Tracks percentage of time spent in fuel-saving mode.</p>
    </div>

    <div class="metric">
        <h3>4. Overtake Risk (0-1)</h3>
        <p><strong>Formula:</strong> <span class="code">min(Steering_Max / 180°, 1.0)</span></p>
        <p>Calculates collision risk during passes based on steering angle.</p>
    </div>

    <div class="metric">
        <h3>5. Ideal Pit Window (0-1)</h3>
        <p><strong>Formula:</strong> <span class="code">(Stress_Slope × 0.5) + (Lap_Slope × 0.5)</span></p>
        <p>Determines optimal pit stop timing based on increasing tire stress and degrading lap times.</p>
    </div>

    <h2>Dataset & Data Verification</h2>
    <p><strong>Dataset:</strong> Toyota GR Cup - Barber Motorsports Park, Race 1</p>
    <ul>
        <li>Real telemetry data from all drivers</li>
        <li>Lap times and section analysis</li>
        <li>Weather conditions</li>
    </ul>
    <p>The UI displays actual vehicle IDs (e.g., GR86-022-13) and source file names, proving all data comes from the provided dataset.</p>

    <h2>Key Features</h2>
    <table>
        <tr>
            <th>Feature</th>
            <th>Description</th>
        </tr>
        <tr>
            <td>Real-time Analytics</td>
            <td>10Hz telemetry streaming with live metric updates</td>
        </tr>
        <tr>
            <td>AI Strategy Engine</td>
            <td>OpenAI GPT-4o-mini with rule-based fallback</td>
        </tr>
        <tr>
            <td>Data Transparency</td>
            <td>Vehicle IDs, source files, and frame counts displayed</td>
        </tr>
        <tr>
            <td>Production Ready</td>
            <td>Deployed and functional with error handling</td>
        </tr>
        <tr>
            <td>Mathematical Rigor</td>
            <td>Complete formulas documented in PitGPT_Math_Models.md</td>
        </tr>
    </table>

    <h2>Technology Stack</h2>
    <ul>
        <li><strong>Backend:</strong> Python 3.9+, pandas, numpy</li>
        <li><strong>Frontend:</strong> React 19, TypeScript, Vite, TailwindCSS</li>
        <li><strong>AI:</strong> OpenAI GPT-4o-mini</li>
        <li><strong>Visualization:</strong> Recharts</li>
    </ul>

    <h2>Submission Materials</h2>
    <ul>
        <li><code>PitGPT_Math_Models.md</code> - Complete mathematical formulas and derivations</li>
        <li><code>PitGPT_Telemetry_Snippets.csv</code> - Real data processing examples</li>
        <li><code>PitGPT_Telemetry_Charts.png</code> - Visual proof of metrics calculations</li>
        <li><code>SUBMISSION_ANSWERS.md</code> - Testing instructions, dataset info, open source credits</li>
    </ul>

    <h2>Deployment</h2>
    <p><strong>GitHub:</strong> https://github.com/builde7b0b/PitGPT</p>
    <p><strong>Live Demo:</strong> [Netlify/Vercel URL]</p>
    <p>Ready for deployment on Netlify, Vercel, or any static hosting platform.</p>

    <div class="footer">
        <p><strong>Built for Toyota GR Cup // Race Engineering Intelligence</strong></p>
        <p>Real-Time Strategic Analysis | Predictive Telemetry | AI-Powered Insights</p>
    </div>
</body>
</html>
"""
    
    with open('PitGPT_Submission.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print("✅ Created: PitGPT_Submission.html")
    print("   Convert to PDF: Open in browser → Print → Save as PDF")
    return 'PitGPT_Submission.html'

if __name__ == "__main__":
    print("🚀 Creating submission package files...\n")
    
    zip_file = create_zip_package()
    print()
    
    word_file = create_word_document()
    print()
    
    html_file = create_html_for_pdf()
    print()
    
    print("✅ All submission files created!")
    print("\n📋 Files created:")
    print(f"  1. {zip_file} - Complete submission package")
    print(f"  2. {word_file} - Word document template (open in Word/Google Docs)")
    print(f"  3. {html_file} - HTML document (convert to PDF via browser)")
    print("\n💡 To create PDF:")
    print("   - Open PitGPT_Submission.html in Chrome/Firefox")
    print("   - Press Ctrl+P (Cmd+P on Mac)")
    print("   - Choose 'Save as PDF'")
    print("   - Or use: wkhtmltopdf, puppeteer, or online converter")

