@echo off
echo ===================================================
echo   AegisDrive AI - Road Accident Analysis Backend
echo ===================================================
cd /d "%~dp0backend"
echo Installing python dependencies...
pip install -r requirements.txt
echo Training ML models if needed...
python ml_pipeline.py
echo Starting FastAPI Backend Server on http://localhost:8000 ...
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
