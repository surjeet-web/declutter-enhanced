@echo off
echo Starting Declutter Enhanced...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist package.json (
    echo Error: package.json not found
    echo Please make sure you're in the correct directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start the development server
echo Starting development server...
echo.
echo The demo will open at: http://localhost:3000/demo.html
echo The extension source is at: http://localhost:3000/src/
echo.
echo Press Ctrl+C to stop the server
echo.

start http://localhost:3000/demo.html
npm run dev

pause