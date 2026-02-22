@echo off
echo ========================================
echo   AssetBridge - Starting Frontend Only
echo ========================================
echo.
echo Starting Frontend Server...
echo Frontend will run on: http://localhost:5174
echo.
echo Press Ctrl+C to stop server
echo ========================================
echo.

cd /d "%~dp0"
npm run client

pause
