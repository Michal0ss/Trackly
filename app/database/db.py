import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool

# security.py tez woloa load_dotenv(), ale robi to PO zaimportowaniu tego
# modulu - gdyby ten plik polegal na tamtym wywolaniu, DATABASE_URL zawsze
# czytalby sie z pustego env i cicho spadal na domyslna sqlite. Ladujemy
# .env sami, zeby ten modul byl niezalezny od kolejnosci importow.
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trackly.db")

SQL_ECHO = os.getenv("SQL_ECHO", "false").lower() == "true"

engine_kwargs = {"echo": SQL_ECHO}

if DATABASE_URL.startswith("postgresql"):
    # Vercel: krotko zyjace funkcje serverless gadaja z Supabase przez jego
    # wlasny connection pooler (Supavisor), wiec wlasny pool SQLAlchemy tu
    # tylko przeszkadza - wylaczamy go i dopinamy pre_ping na odswiezanie
    # martwych polaczen.
    engine_kwargs["poolclass"] = NullPool
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()