@echo off
echo ================================
echo Triangle Intelligence - Stable Dev
echo ================================

REM Check if .next exists and protect it
if not exist ".next" (
    echo Creating .next directory...
    mkdir .next
    mkdir .next\cache
)

REM Set readonly permission on trace file to prevent deletion
if exist ".next\trace" (
    echo Protecting .next\trace from deletion...
    attrib +R ".next\trace"
)

REM Kill only Node processes on port 3000 (safe)
echo Cleaning port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    if not "%%a"=="0" (
        taskkill /F /PID %%a 2>nul
    )
)

REM Wait for port to be free
timeout /t 2 /nobreak >nul

echo Starting development server...
npm run dev

pause