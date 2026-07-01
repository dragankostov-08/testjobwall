@echo off
REM JobWall Scraper - Supabase Setup Script (Windows)
REM This script helps you set up the scraper with Supabase

setlocal enabledelayedexpansion

echo.
echo 🚀 JobWall Scraper - Supabase Setup
echo ====================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.12+
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo ✓ Python %PYTHON_VERSION% found
echo.

REM Create venv if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
    echo ✓ Virtual environment created
) else (
    echo ✓ Virtual environment exists
)

REM Activate venv
echo.
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements
echo.
echo 📥 Installing dependencies...
pip install -q -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Check .env
if not exist ".env" (
    echo ⚙️  Creating .env file...
    copy .env.example .env
    
    echo.
    echo 📋 Supabase Connection Setup
    echo ============================
    echo.
    echo Get your Supabase connection string:
    echo 1. Go to https://supabase.com/dashboard
    echo 2. Select your project
    echo 3. Go to Settings ^→ Database ^→ Connection Pooler
    echo 4. Copy the URI connection string
    echo.
    set /p DB_URL="Paste your Supabase DATABASE_URL: "
    
    if "!DB_URL!"=="" (
        echo ❌ No database URL provided
        pause
        exit /b 1
    )
    
    REM Update .env using PowerShell
    powershell -Command "(Get-Content .env) -replace 'DATABASE_URL=.*', 'DATABASE_URL=!DB_URL!' | Set-Content .env"
    
    echo ✓ Database URL configured in .env
) else (
    echo ✓ .env file exists
)

REM Test connection
echo.
echo 🔗 Testing database connection...
python -c "from core.database import db_manager; db_manager.get_session_sync().close(); print('✓ Database connected!')"
if errorlevel 1 (
    echo ❌ Database connection failed
    echo Check your DATABASE_URL in .env
    pause
    exit /b 1
)

echo.
echo ✅ Setup Complete!
echo.
echo Next steps:
echo 1. Run database schema in Supabase SQL Editor:
echo    - Go to https://supabase.com/dashboard
echo    - Select your project ^→ SQL Editor ^→ New Query
echo    - Copy schema from ..\schema.sql and run it
echo.
echo 2. Start the scraper:
echo    set SCRAPER_MODE=server ^& python main.py
echo.
echo 3. Visit: http://localhost:8000/health
echo.
pause
