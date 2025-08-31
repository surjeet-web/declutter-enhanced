@echo off
echo.
echo ========================================
echo   Declutter Enhanced - Quick Start
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "src\index.html" (
    echo Error: src\index.html not found
    echo Please make sure you're in the project root directory
    pause
    exit /b 1
)

echo Starting Declutter Enhanced demo...
echo.
echo Opening demo in your default browser...
echo Demo URL: file://%CD%\demo.html
echo.

REM Open the demo file directly in browser
start "" "%CD%\demo.html"

echo.
echo Demo opened! You can now:
echo - Explore the AI-powered dashboard
echo - Try the template system
echo - View analytics and project health
echo - Test different themes and settings
echo.
echo For development server with live reload:
echo Run: npm install ^&^& npm run dev
echo.
pause