import os
from contextlib import contextmanager
from typing import Iterator

from sqlmodel import SQLModel, create_engine, Session


DB_URL = os.getenv("DATABASE_URL", "sqlite:///./demo.db")
engine = create_engine(DB_URL, echo=False)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


@contextmanager
def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session

