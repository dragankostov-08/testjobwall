#!/bin/bash
# JobWall Scraper - Supabase Setup Script
# This script helps you set up the scraper with Supabase

set -e

echo "🚀 JobWall Scraper - Supabase Setup"
echo "===================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.12+"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✓ Python $PYTHON_VERSION found"

# Create venv
if [ ! -d "venv" ]; then
    echo ""
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate venv
echo ""
echo "🔧 Activating virtual environment..."
source venv/bin/activate || . venv/Scripts/activate 2>/dev/null

# Install requirements
echo ""
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt
echo "✓ Dependencies installed"

# Check .env
if [ ! -f ".env" ]; then
    echo ""
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    
    echo ""
    echo "📋 Supabase Connection Setup"
    echo "============================"
    echo ""
    echo "Get your Supabase connection string:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings → Database → Connection Pooler"
    echo "4. Copy the URI connection string"
    echo ""
    read -p "Paste your Supabase DATABASE_URL: " DB_URL
    
    if [ -z "$DB_URL" ]; then
        echo "❌ No database URL provided"
        exit 1
    fi
    
    # Update .env
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=$DB_URL|" .env
    rm -f .env.bak
    
    echo "✓ Database URL configured in .env"
fi

# Test connection
echo ""
echo "🔗 Testing database connection..."
python3 -c "from core.database import db_manager; db_manager.get_session_sync().close(); print('✓ Database connected!')" || {
    echo "❌ Database connection failed"
    echo "Check your DATABASE_URL in .env"
    exit 1
}

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Run database schema in Supabase SQL Editor:"
echo "   - Go to https://supabase.com/dashboard"
echo "   - Select your project → SQL Editor → New Query"
echo "   - Copy schema from ../schema.sql and run it"
echo ""
echo "2. Start the scraper:"
echo "   SCRAPER_MODE=server python main.py"
echo ""
echo "3. Visit: http://localhost:8000/health"
echo ""
