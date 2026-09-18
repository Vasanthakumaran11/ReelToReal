import sys
import os
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from config import ROOT_DIR
from database import DATABASE_URL, engine, init_db, is_placeholder
from sqlalchemy import text

def verify_database():
    print("=" * 60)
    print("ReelToReal Database & pgvector Verification")
    print("=" * 60)

    if not DATABASE_URL:
        print("[Status] ❌ No DATABASE_URL found in .env.")
        print("         Please add your Supabase connection string to .env.")
        return False

    # Mask password for secure display
    masked_url = DATABASE_URL
    if "@" in DATABASE_URL and "://" in DATABASE_URL:
        prefix, rest = DATABASE_URL.split("://", 1)
        if "@" in rest:
            user_pass, host_part = rest.split("@", 1)
            user = user_pass.split(":")[0] if ":" in user_pass else user_pass
            masked_url = f"{prefix}://{user}:****@{host_part}"
    print(f"[Config] Connection target: {masked_url}")

    if is_placeholder:
        print("\n[Status] ⚠️  Placeholder detected: '[YOUR-PROJECT-REF]'.")
        print("         To connect to your live Supabase PostgreSQL instance:")
        print("         1. Log in to https://supabase.com/dashboard")
        print("         2. Open your project -> Project Settings -> Database")
        print("         3. Copy the 'Connection string' (URI format)")
        print("         4. Replace '[YOUR-PROJECT-REF]' in .env with your Reference ID (e.g. 'abcdefghijklmno')")
        print("\n[Status] ℹ️  In the meantime, FastAPI works in fallback mode using local outputs/*.json.")
        return False

    print("\n[1/4] Testing PostgreSQL TCP & authentication connection...")
    try:
        with engine.connect() as conn:
            res = conn.execute(text("SELECT version();")).fetchone()
            print(f"      ✅ Connected! Server: {res[0][:60]}...")
    except Exception as e:
        print(f"      ❌ Connection failed: {e}")
        return False

    print("\n[2/4] Verifying pgvector extension...")
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
            ext = conn.execute(text("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';")).fetchone()
            if ext:
                print(f"      ✅ pgvector extension is active (v{ext[1]})!")
            else:
                print("      ⚠️ pgvector extension was not found. Please enable it in Supabase Database -> Extensions.")
                return False
    except Exception as e:
        print(f"      ❌ pgvector check failed: {e}")
        return False

    print("\n[3/4] Initializing database tables (reels, plans)...")
    try:
        success = init_db()
        if success:
            print("      ✅ Tables 'reels' and 'plans' successfully created or verified!")
        else:
            print("      ❌ init_db returned False.")
            return False
    except Exception as e:
        print(f"      ❌ Table initialization failed: {e}")
        return False

    print("\n[4/4] Testing vector math & cosine similarity (<=>)...")
    try:
        with engine.connect() as conn:
            test_sql = text("SELECT '[1,2,3]'::vector <=> '[1,2,4]'::vector AS distance;")
            distance = conn.execute(test_sql).scalar()
            print(f"      ✅ Cosine distance calculation succeeded (distance: {distance:.4f})!")
    except Exception as e:
        print(f"      ❌ Vector math failed: {e}")
        return False

    print("\n" + "=" * 60)
    print("🎉 All database & pgvector checks PASSED perfectly!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    verify_database()
