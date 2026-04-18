@echo off
echo ========================================
echo My Pet Care+ - Presentation Startup
echo ========================================
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo Servers Starting...
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Test Users:
echo   Customer: customer@test.com / TestPass123!
echo   Doctor:   doctor@test.com / TestPass123!
echo   Admin:    admin@test.com / TestPass123!
echo.
echo Press any key to exit...
pause >nul

