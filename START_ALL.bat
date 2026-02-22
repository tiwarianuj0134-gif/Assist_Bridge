@echo off
echo ========================================
echo   AssetBridge - Starting All Servers
echo ========================================
echo.
echo Starting Backend and Frontend...
echo Backend will run on: http://localhost:3000
echo Frontend will run on: http://localhost:5174
echo.
echo Press Ctrl+C to stop servers
echo ========================================
echo.

cd /d "%~dp0"
npm run dev

pause
