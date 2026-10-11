@echo off
echo ===================================================
echo   AegisDrive AI - React Dashboard Frontend
echo ===================================================
set PATH=%PATH%;C:\Program Files\nodejs
cd /d "%~dp0frontend"
echo Installing npm packages...
call npm install
echo Starting Vite Development Server on http://localhost:5173 ...
call npm run dev
pause
