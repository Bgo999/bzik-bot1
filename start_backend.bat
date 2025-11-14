@echo off
REM Quick startup script for Bzik backend
REM Run this from the project root directory

cd /d "%~dp0"

echo.
echo ========================================
echo BZIK BACKEND STARTUP
echo ========================================
echo.

REM Check if port 5000 is already in use
for /f "tokens=5" %%a in ('netstat -ano ^| find "5000" ^| find "LISTENING"') do (
    echo Port 5000 is already in use (PID: %%a)
    echo Kill it? (Y/N)
    set /p choice=
    if /i "%choice%"=="Y" (
        taskkill /PID %%a /F
        echo Killed process %%a
    )
)

echo.
echo Starting Flask backend...
echo.

REM Run Python with the correct path
"C:\Users\User\AppData\Local\Programs\Python\Python314\python.exe" app.py

pause
