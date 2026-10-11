# AegisDrive AI — Road Accident Analysis Platform

An enterprise-grade Full-Stack Road Safety & Accident Analysis Platform powered by **Apache PySpark (Big Data Engine)**, **XGBoost & PyTorch (Machine Learning)**, **FastAPI (Asynchronous Backend)**, and a **Cyberpunk Glassmorphism React SPA**.

---

## Key Features

- **Big Data Processing (PySpark & Vectorized Engine)**: Aggregates 20,000+ accident records, city/state risk metrics, and windowed hourly accident trends in sub-second benchmark speeds.
- **Machine Learning Suite**:
  - **XGBoost Multi-Class Classifier**: Predicts accident severity (`fatal`, `major`, `minor`) with ~55%+ multi-class accuracy, weighted F1 metrics, and feature importances.
  - **Random Forest Risk Score Regressor**: Quantifies hotspot risk scores (0.0 to 1.0).
- **Interactive Geospatial Hotspot Map**: Powered by Leaflet & React-Leaflet with custom markers, popup metadata, state filters, and severity tags across India.
- **Interactive What-If Safety Policy Simulator**: Dynamic scenario controls (speed limit multiplier, weather, visibility, peak hour flags) with real-time AI safety policy recommendations.
- **Modern $50k SaaS Glassmorphism UI**: Dark mode UI featuring glowing accent borders, interactive Recharts visualizations, micro-interactions, and real-time inference forms.

---

## Directory Structure

```
road_accident_analysis/
├── backend/
│   ├── data/
│   │   └── indian_roads_dataset.csv     # 20,000+ dataset records
│   ├── models/                           # Trained ML artifacts (.pkl, .json)
│   ├── data_loader.py                    # Data cleaning & Parquet cache engine
│   ├── spark_processor.py                # PySpark ETL & performance benchmark
│   ├── ml_pipeline.py                    # ML model training & evaluation
│   ├── main.py                           # FastAPI REST API endpoints
│   ├── test_api.py                       # Automated API verification suite
│   └── requirements.txt                  # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx            # Executive KPIs & Recharts trends
│   │   │   ├── GeospatialMap.jsx        # Leaflet interactive map
│   │   │   ├── PredictiveStudio.jsx     # Real-time ML severity calculator
│   │   │   ├── WhatIfSimulator.jsx      # Policy simulation workspace
│   │   │   ├── BigDataAnalytics.jsx     # PySpark benchmark & state table
│   │   │   └── ModelEvaluation.jsx      # Confusion matrix & feature importance
│   │   ├── App.jsx                      # Master navigation container
│   │   ├── index.css                    # Tailwind CSS glassmorphism styles
│   │   └── main.jsx                     # React DOM entry point
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── run_backend.bat                       # Windows backend launcher
├── run_frontend.bat                      # Windows frontend launcher
├── run_all.sh                            # Mac/Linux launcher script
└── README.md                             # Documentation
```

---

## Quick Start (Run locally in VS Code)

### Prerequisites
- **Python 3.10+** (with pip)
- **Node.js 18+** (with npm)

---

### Running on Windows (VS Code PowerShell / CMD)

#### Terminal 1 — Backend (FastAPI)
```powershell
cd backend
pip install -r requirements.txt
python ml_pipeline.py
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Terminal 2 — Frontend (React / Vite)
```powershell
$env:Path += ";C:\Program Files\nodejs"
cd frontend
npm install
npm run dev
```

Open browser at: **`http://localhost:5173`**

---

### Running on Mac / Linux

```bash
chmod +x run_all.sh
./run_all.sh
```

---

## API Sitemap & Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `GET /api/analytics/summary` | `GET` | Returns top KPI metrics (total accidents, casualties, fatal rate). |
| `GET /api/analytics/charts` | `GET` | Structured hourly trends, weather vs severity, state breakdown. |
| `GET /api/analytics/map` | `GET` | Lat/Long coordinates with metadata for Leaflet map markers. |
| `GET /api/bigdata/benchmark` | `GET` | Executes PySpark ETL job & returns throughput metrics. |
| `GET /api/ml/metrics` | `GET` | Confusion matrix, F1-scores, and feature importances. |
| `POST /api/predict/severity` | `POST` | Infers accident severity probabilities & risk score. |
| `POST /api/simulation/what-if` | `POST` | Dynamic scenario risk score simulator. |
