# Quick startup script for Bzik backend
# Usage: .\start_backend.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BZIK BACKEND STARTUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if port 5000 is already in use
$portProcess = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($portProcess) {
    Write-Host "Port 5000 is already in use" -ForegroundColor Yellow
    $proc = Get-Process -Id $portProcess -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Process: $($proc.Name) (PID: $($proc.Id))" -ForegroundColor Yellow
        $kill = Read-Host "Kill it and start fresh? (Y/N)"
        if ($kill -eq "Y" -or $kill -eq "y") {
            Stop-Process -Id $portProcess -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
            Write-Host "Killed the previous process" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "Starting Flask backend on http://localhost:5000..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Run Python
& "C:\Users\User\AppData\Local\Programs\Python\Python314\python.exe" app.py

# If we get here, Flask exited
Write-Host ""
Write-Host "Backend stopped" -ForegroundColor Yellow
pause
