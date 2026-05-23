#!/usr/bin/env python3
"""
PythonAnywhere Database Setup Script
Run this script in PythonAnywhere console to create/update database tables.

Usage:
    1. Open a Bash console on PythonAnywhere
    2. Navigate to your project: cd ~/mysite
    3. Run: python setup_db.py
"""

import os
import sys

# Add the project directory to the path
project_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_dir)

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv(os.path.join(project_dir, '.env'))

print("=" * 50)
print("FinPulse Database Setup Script")
print("=" * 50)

try:
    from app import app, db
    from models import User, Account, Transaction, Loan, ChatMessage, TelegramUser

    with app.app_context():
        print("\n[1/3] Creating database tables...")
        db.create_all()
        print("      [OK] All tables created successfully!")

        # Show existing tables
        print("\n[2/3] Checking tables...")
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"      Found {len(tables)} tables: {', '.join(tables)}")

        # Show record counts
        print("\n[3/3] Record counts:")
        print(f"      - Users: {User.query.count()}")
        print(f"      - Accounts: {Account.query.count()}")
        print(f"      - Transactions: {Transaction.query.count()}")
        print(f"      - Loans: {Loan.query.count()}")
        print(f"      - Chat Messages: {ChatMessage.query.count()}")
        print(f"      - Telegram Users: {TelegramUser.query.count()}")

    print("\n" + "=" * 50)
    print("Database setup complete!")
    print("=" * 50)

except Exception as e:
    print(f"\n[ERROR] {e}")
    print("\nTroubleshooting:")
    print("  1. Make sure you're in the correct directory")
    print("  2. Check that all dependencies are installed: pip install -r requirements.txt")
    print("  3. Verify your .env file exists and has correct settings")
    sys.exit(1)
