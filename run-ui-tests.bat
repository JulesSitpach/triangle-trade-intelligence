@echo off
echo.
echo ================================
echo  Triangle Intelligence UI Tests
echo ================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Check if npm dependencies are installed
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Install Puppeteer if not present
echo 📦 Ensuring Puppeteer is installed...
call npm list puppeteer >nul 2>&1
if errorlevel 1 (
    echo 📥 Installing Puppeteer...
    call npm install puppeteer --save-dev
    if errorlevel 1 (
        echo ❌ Failed to install Puppeteer
        pause
        exit /b 1
    )
)

echo ✅ Dependencies ready

REM Create test directories
if not exist "tests\puppeteer\screenshots" (
    mkdir "tests\puppeteer\screenshots"
)
if not exist "tests\puppeteer\reports" (
    mkdir "tests\puppeteer\reports"
)

echo 📁 Test directories ready

REM Run the comprehensive UI test suite
echo.
echo 🚀 Starting comprehensive UI tests...
echo.

call node tests\puppeteer\run-tests.js

if errorlevel 1 (
    echo.
    echo ❌ Tests failed. Check the reports for details.
    echo 📊 Reports are available in tests\puppeteer\reports\
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ All tests passed successfully!
    echo 📊 Reports are available in tests\puppeteer\reports\
    echo 📸 Screenshots are available in tests\puppeteer\screenshots\
    echo.
)

echo.
echo Test execution completed.
pause