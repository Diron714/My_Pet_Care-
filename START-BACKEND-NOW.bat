@echo off
echo ========================================
echo Starting Backend Server
echo ========================================
echo.
cd backend
echo Current directory: %CD%
echo.
echo Starting server...
echo.
npm run dev
pause

