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

@app.get("/api/analytics/export-pdf")
def export_dashboard_pdf():
    """Generates an executive PDF report of the main road accident dashboard."""
    import io
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle', parent=styles['Title'],
        fontName='Helvetica-Bold', fontSize=22, textColor=colors.HexColor('#0f172a'), alignment=0, spaceAfter=8
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle', parent=styles['Normal'],
        fontName='Helvetica', fontSize=10, textColor=colors.HexColor('#64748b'), spaceAfter=15
    )
    heading_style = ParagraphStyle(
        'Heading2', parent=styles['Heading2'],
        fontName='Helvetica-Bold', fontSize=13, textColor=colors.HexColor('#1e293b'), spaceBefore=12, spaceAfter=6
    )

    story.append(Paragraph("AegisDrive AI — Executive Road Safety Analytics Report", title_style))
    story.append(Paragraph(f"Dataset Scope: <b>20,000+ Indian Road Accidents</b> | Generated: <b>Real-Time</b>", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#06b6d4'), spaceAfter=15))

    # Summary KPI Table
    total_acc = len(df_cache)
    total_cas = int(df_cache['casualties'].sum())
    fatal_acc = int((df_cache['accident_severity'] == 'fatal').sum())
    avg_risk = float(df_cache['risk_score'].mean())
    top_state = df_cache.groupby('state')['accident_id'].count().idxmax()
    top_cause = df_cache.groupby('cause')['accident_id'].count().idxmax()

    kpi_data = [
        ["Total Accidents", "Total Casualties", "Fatal Accidents", "Avg Risk Score"],
        [f"{total_acc:,}", f"{total_cas:,}", f"{fatal_acc:,}", f"{avg_risk:.3f} / 1.0"]
    ]
    t_kpi = Table(kpi_data, colWidths=[130, 130, 130, 130])
    t_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6)
    ]))
    story.append(t_kpi)
    story.append(Spacer(1, 15))

    # Top States Table
    story.append(Paragraph("Top 5 High-Risk States by Accident Volume", heading_style))
    state_top = df_cache.groupby('state').agg(
        accidents=('accident_id', 'count'),
        fatalities=('accident_severity', lambda s: (s == 'fatal').sum()),
        avg_risk=('risk_score', 'mean')
    ).reset_index().sort_values('accidents', ascending=False).head(5)

    state_data = [["State", "Accidents", "Fatal Crashes", "Avg Risk Score"]]
    for _, row in state_top.iterrows():
        state_data.append([row['state'], f"{row['accidents']:,}", f"{row['fatalities']:,}", f"{row['avg_risk']:.3f}"])

    t_state = Table(state_data, colWidths=[160, 120, 120, 120])
    t_state.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f1f5f9')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5)
    ]))
    story.append(t_state)
    story.append(Spacer(1, 15))

    # Key Contributing Factors Table
    story.append(Paragraph("Top Accident Contributing Causes", heading_style))
    cause_top = df_cache.groupby('cause').size().reset_index(name='count').sort_values('count', ascending=False).head(5)
    cause_data = [["Accident Cause / Factor", "Incident Count", "% of Total"]]
    for _, row in cause_top.iterrows():
        pct = (row['count'] / total_acc) * 100
        cause_data.append([str(row['cause']).capitalize(), f"{row['count']:,}", f"{pct:.1f}%"])

    t_cause = Table(cause_data, colWidths=[240, 140, 140])
    t_cause.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0891b2')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f1f5f9')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5)
    ]))
    story.append(t_cause)

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    headers = {'Content-Disposition': 'attachment; filename="AegisDrive_Executive_Report.pdf"'}
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)

@app.get("/api/analytics/export-excel")
def export_dashboard_excel():
    """Exports key summary metrics, hourly trends, and state summaries to an Excel workbook."""
    import io
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Sheet 1: Executive KPI
        kpi_df = pd.DataFrame([{
            "Total Accidents": len(df_cache),
            "Total Casualties": int(df_cache['casualties'].sum()),
            "Fatal Accidents": int((df_cache['accident_severity'] == 'fatal').sum()),
            "Average Risk Score": round(float(df_cache['risk_score'].mean()), 3),
            "Top Accident State": df_cache.groupby('state')['accident_id'].count().idxmax(),
            "Most Common Cause": df_cache.groupby('cause')['accident_id'].count().idxmax()
        }])
        kpi_df.to_excel(writer, sheet_name="Executive Summary", index=False)

        # Sheet 2: State Breakdown
        state_df = df_cache.groupby('state').agg(
            Accidents=('accident_id', 'count'),
            Casualties=('casualties', 'sum'),
            Fatal_Accidents=('accident_severity', lambda s: (s == 'fatal').sum()),
            Avg_Risk_Score=('risk_score', 'mean')
        ).reset_index().sort_values('Accidents', ascending=False)
        state_df.to_excel(writer, sheet_name="State Breakdown", index=False)

        # Sheet 3: Causes Breakdown
        cause_df = df_cache.groupby('cause').size().reset_index(name='Incident Count').sort_values('Incident Count', ascending=False)
        cause_df.to_excel(writer, sheet_name="Accident Causes", index=False)

    output.seek(0)
    headers = {'Content-Disposition': 'attachment; filename="AegisDrive_Analytics_Data.xlsx"'}
    return Response(content=output.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)

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
