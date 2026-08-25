import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trackly.db")

SQL_ECHO = os.getenv("SQL_ECHO", "false").lower() == "true"

engine = create_engine(DATABASE_URL, echo=SQL_ECHO)
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()