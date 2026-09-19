import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from sqlalchemy import create_engine, text

# Connect using the resolved IPv6 address directly with hostaddr parameter
# This bypasses DNS resolution entirely
url = "postgresql+psycopg://postgres:ReeltoReal%40123@db.jfkuuxqhckrzyyjvchwk.supabase.co:5432/postgres"

print("Testing direct IPv6 connection to Supabase PostgreSQL...")
print("Using hostaddr=2406:da18:1248:be02::62a2 to bypass DNS\n")

try:
    engine = create_engine(
        url,
        pool_pre_ping=True,
        connect_args={
            "hostaddr": "2406:da18:1248:be02::62a2",
            "connect_timeout": 10,
        }
    )
    with engine.connect() as conn:
        res = conn.execute(text("SELECT version();")).fetchone()
        print(f"[1/4] CONNECTED! Server: {res[0][:80]}...")

        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()
        ext = conn.execute(text("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';")).fetchone()
        if ext:
            print(f"[2/4] pgvector extension active (v{ext[1]})")
        else:
            print("[2/4] pgvector NOT found - please enable it in Supabase Dashboard -> Database -> Extensions")
            sys.exit(1)

        dist = conn.execute(text("SELECT '[1,2,3]'::vector <=> '[1,2,4]'::vector AS distance;")).scalar()
        print(f"[3/4] Vector cosine distance test: {dist:.6f}")

        # Check if tables exist
        tables = conn.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
        )).fetchall()
        table_names = [t[0] for t in tables]
        print(f"[4/4] Existing tables in public schema: {table_names}")

        print("\n" + "=" * 60)
        print("ALL CHECKS PASSED! Supabase PostgreSQL + pgvector is READY!")
        print("=" * 60)

except Exception as e:
    print(f"FAILED: {e}")
    sys.exit(1)
