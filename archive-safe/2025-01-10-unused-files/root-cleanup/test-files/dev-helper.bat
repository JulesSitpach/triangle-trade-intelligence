@echo off
echo ========================================
echo Triangle Intelligence Dev Helper
echo ========================================
echo.
echo This script helps manage Node.js processes
echo and prevents accumulation of zombie processes
echo.
echo Options:
echo [1] Clean all Node processes and start fresh
echo [2] Kill process on port 3000 only
echo [3] Check running Node processes
echo [4] Start development server (with cleanup)
echo [5] Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo Killing all Node.js processes...
    taskkill /F /IM node.exe 2>nul
    if %errorlevel%==0 (
        echo Successfully cleaned up Node processes.
    ) else (
        echo No Node processes were running.
    )
    echo.
    echo Starting fresh development server...
    npm run dev
) else if "%choice%"=="2" (
    echo.
    echo Killing process on port 3000...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
        taskkill /F /PID %%a 2>nul
        if %errorlevel%==0 (
            echo Killed process on port 3000
        )
    )
    echo Done.
) else if "%choice%"=="3" (
    echo.
    echo Checking Node.js processes...
    echo.
    wmic process where "name='node.exe'" get ProcessId,CommandLine
    echo.
    echo Checking port 3000...
    netstat -aon | findstr :3000
    echo.
    pause
) else if "%choice%"=="4" (
    echo.
    echo Cleaning up and starting dev server...
    npm run dev:fresh
) else if "%choice%"=="5" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice. Please run the script again.
)