import os
import re
import socket
from urllib.parse import quote_plus, unquote_plus
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from config import ROOT_DIR

def sanitize_db_url(url: str) -> str:
    """Normalizes and safely percent-encodes password in PostgreSQL connection strings."""
    if not url:
        return url
    # Strip surrounding quotes if present
    url = url.strip('"').strip("'")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+psycopg://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)

    pattern = r"^(postgresql\+psycopg://)([^:]+):(.+)@([^@/:]+)(:\d+)?(/.*)?$"
    match = re.match(pattern, url)
    if match:
        scheme, user, raw_pass, host, port, path = match.groups()
        encoded_pass = quote_plus(unquote_plus(raw_pass))
        port = port or ""
        path = path or ""
        return f"{scheme}{user}:{encoded_pass}@{host}{port}{path}"
    return url

def resolve_hostaddr(url: str) -> str | None:
    """
    Resolves the hostname in the DATABASE_URL to an IP address.
    This bypasses psycopg's internal DNS resolver which may fail on
    networks that only return IPv6 AAAA records (e.g. college/university networks).
    Returns the resolved IP address string, or None if resolution fails.
    """
    pattern = r"@([^@/:]+)"
    match = re.search(pattern, url)
    if not match:
        return None
    hostname = match.group(1)
    try:
        # getaddrinfo returns both IPv4 and IPv6 addresses
        infos = socket.getaddrinfo(hostname, 5432, socket.AF_UNSPEC, socket.SOCK_STREAM)
        if infos:
            addr = infos[0][4][0]
            print(f"[DB] Resolved {hostname} -> {addr}")
            return addr
    except socket.gaierror as e:
        print(f"[DB] DNS resolution failed for {hostname}: {e}")
    return None

raw_db_url = os.getenv("DATABASE_URL", "").strip()
DATABASE_URL = sanitize_db_url(raw_db_url)

engine = None
SessionLocal = None
Base = declarative_base()

# Check for unconfigured placeholder in DATABASE_URL
is_placeholder = any(token in DATABASE_URL for token in ["[YOUR-PROJECT-REF]", "[YOUR-PASSWORD]", "your_project_ref"])

if is_placeholder:
    print("\n[Notice] DATABASE_URL contains placeholder '[YOUR-PROJECT-REF]'.")
    print("         Backend will operate in fallback mode using local outputs/ records.")
    print("         To connect to Supabase, update DATABASE_URL in .env with your real project ID.\n")
elif DATABASE_URL:
    try:
        connect_args = {"connect_timeout": 10}
        hostaddr = resolve_hostaddr(DATABASE_URL)
        if hostaddr:
            connect_args["hostaddr"] = hostaddr

        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            connect_args=connect_args,
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    except Exception as e:
        print(f"[Warning] Failed to initialize database engine with DATABASE_URL: {e}")

def get_db():
    """Dependency for obtaining a SQLAlchemy session."""
    if not SessionLocal:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes pgvector extension and creates all tables."""
    if not engine:
        return False
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
        Base.metadata.create_all(bind=engine)
        return True
    except Exception as e:
        print(f"[Error] Failed to auto-initialize tables in PostgreSQL: {e}")
        return False
