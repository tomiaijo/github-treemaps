from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from settings import DB_URL


engine = create_engine(DB_URL, pool_size=34, max_overflow=0, pool_timeout=60)
Base = declarative_base()
Session = sessionmaker(bind=engine)


@contextmanager
def session_scope():
    """Provides a transactional scope around a series of operations."""
    session = Session()
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()