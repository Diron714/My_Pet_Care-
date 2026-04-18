@echo off
echo ========================================
echo Starting Both Servers
echo ========================================
echo.
echo This will open 2 windows:
echo   1. Backend server (port 5000)
echo   2. Frontend server (port 5173)
echo.
echo Press any key to start...
pause >nul

start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Both servers are starting...
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Keep both windows open!
echo.
pause

