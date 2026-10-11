#!/bin/bash
echo "==================================================="
echo "  AegisDrive AI - Road Accident Analysis Platform"
echo "==================================================="

# Start Backend
cd backend
pip install -r requirements.txt
python ml_pipeline.py
python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start Frontend
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo "Backend running on PID $BACKEND_PID (http://localhost:8000)"
echo "Frontend running on PID $FRONTEND_PID (http://localhost:5173)"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
