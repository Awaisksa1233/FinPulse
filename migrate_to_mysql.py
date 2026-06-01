import os
from sqlalchemy import create_engine, MetaData, Table
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

# Define source (SQLite) and target (MySQL)
# We assume the sqlite database is the local finpulse.db file
SQLITE_URI = 'sqlite:///finpulse.db'

# Get the MySQL URL from environment variables.
# Note: Ensure you have set DATABASE_URL in your .env file on PythonAnywhere.
# Format: mysql+pymysql://username:password@username.mysql.pythonanywhere-services.com/username$dbname
MYSQL_URI = os.getenv('DATABASE_URL')

if not MYSQL_URI or not MYSQL_URI.startswith('mysql'):
    print("❌ ERROR: DATABASE_URL is not set or is not a MySQL URI in the .env file.")
    print("Please set it to something like: mysql+pymysql://user:pass@host/dbname")
    exit(1)

print(f"Source: {SQLITE_URI}")
print(f"Target: {MYSQL_URI}")
print("Starting migration...")

# Create engines
source_engine = create_engine(SQLITE_URI)
target_engine = create_engine(MYSQL_URI)

# Reflect source metadata
source_metadata = MetaData()
source_metadata.reflect(bind=source_engine)

# To migrate data properly, we should ensure the target has the same tables.
# The easiest way is to import our Flask models and let SQLAlchemy create them.
print("Initializing target tables from models...")
try:
    from app import app
    from models import db
    with app.app_context():
        # Temporarily force the app to use the MySQL database for this context
        app.config['SQLALCHEMY_DATABASE_URI'] = MYSQL_URI
        # Create all tables on the target MySQL database
        db.create_all()
except Exception as e:
    print(f"Error creating target tables: {e}")
    exit(1)

# Reflect target metadata (now that tables exist)
target_metadata = MetaData()
target_metadata.reflect(bind=target_engine)

# Tables to migrate in dependency order (parents first)
tables_to_migrate = [
    'users',
    'telegram_users',
    'accounts',
    'budgets',
    'loans',
    'transactions',
    'chat_messages',
    'recurring_transactions'
]

# Create session for target
TargetSession = sessionmaker(bind=target_engine)
session = TargetSession()

try:
    with source_engine.connect() as source_conn:
        for table_name in tables_to_migrate:
            if table_name not in source_metadata.tables:
                print(f"⚠️ Table {table_name} not found in SQLite. Skipping.")
                continue
                
            print(f"\nMigrating table: {table_name}...")
            source_table = source_metadata.tables[table_name]
            target_table = target_metadata.tables[table_name]
            
            # Clear target table just in case (optional, but good for fresh migrate)
            session.execute(target_table.delete())
            
            # Read from source
            records = source_conn.execute(source_table.select()).fetchall()
            
            if not records:
                print(f"  No records found in {table_name}.")
                continue
                
            # Convert records to dictionary format for bulk insert
            # Be careful with columns. Make sure they match.
            insert_data = []
            for row in records:
                # SQLAlchemy 2.0 row to dict mapping
                row_dict = dict(row._mapping)
                insert_data.append(row_dict)
                
            # Insert into target
            # We use core execute to avoid ORM overhead and issues
            with target_engine.begin() as target_conn:
                target_conn.execute(target_table.insert(), insert_data)
                
            print(f"  ✅ Successfully migrated {len(records)} records for {table_name}.")

    print("\n🎉 Migration completed successfully!")
except Exception as e:
    print(f"\n❌ Error during migration: {e}")
    session.rollback()
finally:
    session.close()
