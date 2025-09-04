# These are SQLAlchemy tools for working with Postgres (or any SQL database).
# create_engine → connects Python to Postgres.
# sessionmaker → lets us create a session (like a pipe) to talk to the DB.
# declarative_base → is the base class for defining tables (models).

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Postgres connection string (update port if needed)
DATABASE_URL = "postgresql://paras:pass123@localhost:5435/uberdb"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
