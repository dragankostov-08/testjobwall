#!/usr/bin/env python3
"""
JobWall Quick Setup Script
Automated setup for local development with Supabase
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(cmd, description=""):
    """Run a shell command with error handling."""
    if description:
        print(f"\n>> {description}")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"[FAIL] {result.stderr}")
            return False
        if result.stdout:
            print(result.stdout.strip())
        return True
    except Exception as e:
        print(f"[FAIL] {str(e)}")
        return False

def main():
    print("\n" + "="*60)
    print("JobWall - Supabase + Python Scraper Setup")
    print("="*60)

    # Check Python version
    print("\n[INFO] Checking Python version...")
    if sys.version_info < (3, 12):
        print("[FAIL] Python 3.12+ required")
        sys.exit(1)
    print(f"[OK] Python {sys.version.split()[0]}")

    # Check Node.js
    print("\n[INFO] Checking Node.js...")
    if not run_command("node --version", ""):
        print("[WARN] Node.js not found (optional, needed for frontend)")
    else:
        print("[OK] Node.js is installed")

    # Check if we're in scraper directory or need to navigate
    if not Path("core").exists() or not Path("scrapers").exists():
        # Try navigating to scraper directory
        scraper_dir = Path("scraper")
        if scraper_dir.exists():
            os.chdir(scraper_dir)
        else:
            print("\n[FAIL] Not in scraper directory and scraper/ not found")
            print("   Run from: cd scraper && python quick_setup.py")
            sys.exit(1)

    # Create venv
    print("\n[SETUP] Setting up Python environment...")
    if not run_command("python -m venv venv", "Creating virtual environment"):
        sys.exit(1)

    # Determine activation command
    if sys.platform == "win32":
        venv_activate = "venv\\Scripts\\activate.bat"
        activate_cmd = f"{venv_activate} && "
    else:
        venv_activate = "source venv/bin/activate"
        activate_cmd = f". venv/bin/activate && "

    # Install dependencies
    print("\n[INSTALL] Installing Python dependencies...")
    if not run_command(f"{activate_cmd}pip install -q -r requirements.txt", ""):
        print("[WARN] Some dependencies may have failed to install")

    # Create .env if doesn't exist
    if not Path(".env").exists():
        print("\n[CONFIG] Creating .env file...")
        if not run_command("cp .env.example .env", ""):
            run_command("copy .env.example .env", "")

        print("\n[CONFIG] Supabase Configuration")
        print("-" * 40)
        print("Get your connection string:")
        print("1. Go to https://supabase.com/dashboard")
        print("2. Select your project")
        print("3. Settings > Database > Connection Pooler")
        print("4. Copy the URI")
        print()

        db_url = input("Paste DATABASE_URL: ").strip()
        if not db_url:
            print("[FAIL] No database URL provided")
            sys.exit(1)

        # Update .env
        with open(".env", "r") as f:
            content = f.read()

        content = content.replace(
            "DATABASE_URL=",
            f"DATABASE_URL={db_url}\n# Old:"
        )

        with open(".env", "w") as f:
            f.write(content)

        print("[OK] .env configured")

    # Test database connection
    print("\n[TEST] Testing database connection...")
    test_cmd = f"{activate_cmd}python -c \"from core.database import db_manager; db_manager.get_session_sync().close(); print('[OK] Connected!')\""
    if not run_command(test_cmd, ""):
        print("[FAIL] Database connection failed")
        print("   Check DATABASE_URL in scraper/.env")
        sys.exit(1)

    # Setup complete
    print("\n" + "="*60)
    print("[DONE] Setup Complete!")
    print("="*60)

    print("\n[NEXT] Next steps:")
    print("\n1. Set up Supabase database schema:")
    print("   - Go to https://supabase.com/dashboard")
    print("   - SQL Editor > New Query")
    print("   - Copy content from ../schema.sql")
    print("   - Run it")

    print("\n2. Configure frontend (.env.local):")
    print("   - Copy .env.local.example to .env.local")
    print("   - Add Supabase URL and anon key")

    print("\n3. Start the scraper:")
    if sys.platform == "win32":
        print("   - set SCRAPER_MODE=server & python main.py")
    else:
        print("   - SCRAPER_MODE=server python main.py")

    print("\n4. Start the frontend (in another terminal):")
    print("   - npm run dev")

    print("\n5. Visit:")
    print("   - Frontend: http://localhost:3000")
    print("   - Scraper API: http://localhost:8000/health")

    print("\n[DOCS] Full documentation: ../SETUP_GUIDE.md")
    print()

if __name__ == "__main__":
    main()
