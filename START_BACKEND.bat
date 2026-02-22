@echo off
echo ========================================
echo   AssetBridge - Starting Backend Only
echo ========================================
echo.
echo Starting Backend Server...
echo Backend will run on: http://localhost:3000
echo.
echo Press Ctrl+C to stop server
echo ========================================
echo.

cd /d "%~dp0\backend"
npm run dev

pause
