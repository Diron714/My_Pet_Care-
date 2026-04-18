@echo off
echo ========================================
echo Starting Frontend Server
echo ========================================
echo.
cd frontend
echo Current directory: %CD%
echo.
echo Starting server...
echo.
npm run dev
pause

