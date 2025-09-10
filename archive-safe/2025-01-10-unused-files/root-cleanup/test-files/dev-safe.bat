@echo off
echo Checking for existing Node processes...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Killing existing Node processes...
    taskkill /F /IM node.exe >NUL 2>&1
    timeout /t 2 >NUL
)

echo Starting clean development server...
npm run dev