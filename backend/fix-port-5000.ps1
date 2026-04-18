# Fix Port 5000 - Kill process using the port
Write-Host "Finding process using port 5000..." -ForegroundColor Yellow

$connection = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

if ($connection) {
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    if ($process) {
        Write-Host "Found process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Red
        Write-Host "Killing process..." -ForegroundColor Yellow
        Stop-Process -Id $processId -Force
        Write-Host "✅ Process killed! Port 5000 is now free." -ForegroundColor Green
    } else {
        Write-Host "⚠️  Process not found, but port may still be in use" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Port 5000 is already free!" -ForegroundColor Green
}

Write-Host "`nYou can now start the server with: npm run dev" -ForegroundColor Cyan

