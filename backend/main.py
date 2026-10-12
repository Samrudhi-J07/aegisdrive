import os
import sys
import json
import pandas as pd
from typing import Optional

# Ensure backend directory is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from fastapi import FastAPI, Query, HTTPException, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from data_loader import load_raw_dataset
from spark_processor import run_pyspark_pipeline
from ml_pipeline import predict_accident_severity, MODELS_DIR
from data_uploader import parse_uploaded_file, analyze_dataframe, generate_pdf_report
from chat_routes import router as chat_router
from auth_routes import router as auth_router

app = FastAPI(
    title="Road Accident Analytics & Machine Learning Platform",
    description="Production-grade Big Data & ML Backend for Road Safety Analysis",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include AI Assistant Chatbot routes
app.include_router(chat_router)
app.include_router(chat_router, prefix="/api")

# Include Authentication routes
app.include_router(auth_router)
app.include_router(auth_router, prefix="/api")

# Load global dataset cache
df_cache = load_raw_dataset()

class PredictionRequest(BaseModel):
    hour: int = 14
    is_weekend: int = 0
    lanes: int = 3
    traffic_signal: int = 1
    visibility_num: int = 2
    temperature: float = 28.0
    vehicles_involved: int = 2
    casualties: int = 1
    is_peak_hour: int = 0
    weather: str = "clear"
    road_type: str = "urban"
    traffic_density: str = "medium"
    cause: str = "distraction"

class SimulationRequest(BaseModel):
    speed_factor: float = 1.0       # 0.5 to 2.0 multiplier
    weather: str = "clear"
    visibility_num: int = 2          # 1=low, 2=medium, 3=high
    traffic_density: str = "medium" # low, medium, high
    lanes: int = 3
    is_peak_hour: int = 0
    is_weekend: int = 0
    cause: str = "distraction"

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Road Accident Big Data & ML API",
        "total_records": len(df_cache),
        "docs_url": "/docs"
    }

@app.get("/api/analytics/summary")
def get_analytics_summary():
    """Returns top executive KPI statistics."""
    total_accidents = len(df_cache)
    total_casualties = int(df_cache['casualties'].sum())
    fatal_accidents = int((df_cache['accident_severity'] == 'fatal').sum())
    major_accidents = int((df_cache['accident_severity'] == 'major').sum())
    avg_risk = float(df_cache['risk_score'].mean())
    
    top_state = df_cache.groupby('state')['accident_id'].count().idxmax()
    top_cause = df_cache.groupby('cause')['accident_id'].count().idxmax()
    
    return {
        "total_accidents": total_accidents,
        "total_casualties": total_casualties,
        "fatal_accidents": fatal_accidents,
        "major_accidents": major_accidents,
        "minor_accidents": total_accidents - (fatal_accidents + major_accidents),
        "avg_risk_score": round(avg_risk, 3),
        "highest_accident_state": top_state,
        "most_common_cause": top_cause,
        "fatal_rate_pct": round((fatal_accidents / total_accidents) * 100, 2)
    }

@app.get("/api/analytics/charts")
def get_analytics_charts():
    """Returns structured data for Recharts dashboard visualizers."""
    # 1. Hourly Trend
    hourly = df_cache.groupby('hour').agg(
        accidents=('accident_id', 'count'),
        avg_risk=('risk_score', 'mean')
    ).reset_index().sort_values('hour')
    hourly['avg_risk'] = hourly['avg_risk'].round(3)
    
    # 2. State Breakdown
    state_df = df_cache.groupby('state').agg(
        accidents=('accident_id', 'count'),
        casualties=('casualties', 'sum'),
        avg_risk=('risk_score', 'mean')
    ).reset_index().sort_values('accidents', ascending=False)
    state_df['avg_risk'] = state_df['avg_risk'].round(3)
    
    # 3. Weather vs Severity
    weather_df = df_cache.groupby(['weather', 'accident_severity']).size().unstack(fill_value=0).reset_index()
    
    # 4. Cause Distribution
    cause_df = df_cache.groupby('cause').size().reset_index(name='count').sort_values('count', ascending=False)
    
    # 5. Road Type Risk
    road_df = df_cache.groupby('road_type').agg(
        accidents=('accident_id', 'count'),
        avg_risk=('risk_score', 'mean')
    ).reset_index()
    road_df['avg_risk'] = road_df['avg_risk'].round(3)

    return {
        "hourly_trend": hourly.to_dict(orient="records"),
        "state_breakdown": state_df.to_dict(orient="records"),
        "weather_severity": weather_df.to_dict(orient="records"),
        "cause_distribution": cause_df.to_dict(orient="records"),
        "road_type_risk": road_df.to_dict(orient="records")
    }

@app.get("/api/analytics/map")
def get_map_data(
    state: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 2000
):
    """Returns geospatial coordinates with metadata for interactive map rendering."""
    df_filtered = df_cache
    if state and state.lower() != "all":
        df_filtered = df_filtered[df_filtered['state'].str.lower() == state.lower()]
    if severity and severity.lower() != "all":
        df_filtered = df_filtered[df_filtered['accident_severity'].str.lower() == severity.lower()]
        
    df_sample = df_filtered.head(limit)
    
    map_points = df_sample[[
        'accident_id', 'city', 'state', 'latitude', 'longitude',
        'accident_severity', 'cause', 'weather', 'risk_score', 'casualties', 'road_type'
    ]].to_dict(orient="records")
    
    return {
        "count": len(map_points),
        "total_available": len(df_filtered),
        "points": map_points
    }

@app.get("/api/bigdata/benchmark")
def run_spark_benchmark():
    """Triggers PySpark Big Data analysis job and measures execution time & throughput."""
    result = run_pyspark_pipeline()
    return result

@app.get("/api/ml/metrics")
def get_ml_metrics():
    """Returns machine learning model accuracy, confusion matrix, and feature importances."""
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            return json.load(f)
    else:
        # Fallback if training not yet completed
        return {
            "status": "training_in_progress",
            "message": "ML training is initializing. Please retry in a few seconds."
        }

@app.post("/api/predict/severity")
def predict_severity(payload: PredictionRequest):
    """Predicts accident severity & risk score for single sample."""
    try:
        res = predict_accident_severity(payload.dict())
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/simulation/what-if")
def simulate_scenario(payload: SimulationRequest):
    """Simulates risk level changes based on dynamic what-if parameter sliders."""
    # Base prediction
    base_sample = {
        "hour": 18 if payload.is_peak_hour else 12,
        "is_weekend": payload.is_weekend,
        "lanes": payload.lanes,
        "traffic_signal": 1,
        "visibility_num": payload.visibility_num,
        "temperature": 25.0,
        "vehicles_involved": int(2 * payload.speed_factor),
        "casualties": 1,
        "is_peak_hour": payload.is_peak_hour,
        "weather": payload.weather,
        "road_type": "highway" if payload.speed_factor > 1.3 else "urban",
        "traffic_density": payload.traffic_density,
        "cause": payload.cause
    }
    
    pred = predict_accident_severity(base_sample)
    
    # Speed risk factor calculation
    base_risk = pred["predicted_risk_score"]
    adjusted_risk = base_risk * payload.speed_factor
    
    # Weather multiplier
    if payload.weather in ['fog', 'rain', 'heavy rain']:
        adjusted_risk *= 1.25
    if payload.visibility_num == 1:
        adjusted_risk *= 1.3
        
    adjusted_risk = round(max(0.05, min(0.99, adjusted_risk)), 4)
    delta_pct = round(((adjusted_risk - base_risk) / max(base_risk, 0.01)) * 100, 1)
    
    recommendations = []
    if adjusted_risk > 0.7:
        recommendations.append("Deploy automated speed enforcement cameras in high-speed zones.")
        recommendations.append("Activate fog/visibility warnings on smart digital gantries.")
    if payload.weather in ['fog', 'rain']:
        recommendations.append("Reduce speed limit by 20 km/h during adverse weather conditions.")
    if payload.is_peak_hour:
        recommendations.append("Implement traffic signal synchronization & peak-hour signal control.")
        
    if not recommendations:
        recommendations.append("Standard road safety parameters maintained. Continue routine surveillance.")

    return {
        "baseline_risk_score": base_risk,
        "simulated_risk_score": adjusted_risk,
        "risk_delta_pct": delta_pct,
        "simulated_severity": "fatal" if adjusted_risk > 0.75 else ("major" if adjusted_risk > 0.45 else "minor"),
        "severity_probabilities": pred["probabilities"],
        "recommendations": recommendations
    }

# In-memory storage for latest upload analysis
latest_upload_cache = {}

@app.post("/api/upload/analyze")
async def upload_and_analyze_dataset(file: UploadFile = File(...)):
    """Uploads CSV, XLSX, XLS, JSON, or PDF file, parses data, runs auto-EDA analytics, and generates chart specs."""
    try:
        content = await file.read()
        df_uploaded = parse_uploaded_file(content, file.filename)
        analysis_result = analyze_dataframe(df_uploaded)
        analysis_result["filename_analyzed"] = file.filename
        
        global latest_upload_cache
        latest_upload_cache = analysis_result
        return analysis_result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file '{file.filename}': {str(e)}")

@app.post("/api/upload/export-pdf")
def export_dataset_pdf():
    """Generates and downloads a ReportLab PDF analysis report for the uploaded dataset."""
    global latest_upload_cache
    if not latest_upload_cache:
        raise HTTPException(status_code=404, detail="No dataset uploaded yet. Please upload a dataset first.")
        
    try:
        filename = latest_upload_cache.get("filename_analyzed", "Uploaded_Dataset.pdf")
        pdf_bytes = generate_pdf_report(latest_upload_cache, filename)
        
        headers = {
            'Content-Disposition': f'attachment; filename="AegisDrive_Report_{filename}.pdf"'
        }
        return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF report generation failed: {str(e)}")

@app.get("/api/upload/sample/{sample_name}")
def load_sample_dataset(sample_name: str):
    """Loads a pre-built sample dataset (CSV, XLSX, PDF) and returns full analysis."""
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    sample_map = {
        "indian_roads.csv": "indian_roads_dataset.csv",
        "sample_data.xlsx": "sample_small.xlsx",
        "report.pdf": "sample_report.pdf"
    }
    
    target_file = sample_map.get(sample_name, sample_name)
    file_path = os.path.join(data_dir, target_file)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Sample file '{sample_name}' not found")
        
    try:
        with open(file_path, "rb") as f:
            content = f.read()
        df_uploaded = parse_uploaded_file(content, target_file)
        analysis_result = analyze_dataframe(df_uploaded)
        analysis_result["filename_analyzed"] = sample_name
        
        global latest_upload_cache
        latest_upload_cache = analysis_result
        return analysis_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process sample '{sample_name}': {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
