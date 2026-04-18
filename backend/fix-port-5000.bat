@echo off
echo Finding process using port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
)
echo Port 5000 is now free!
echo You can now start the server with: npm run dev
pause

