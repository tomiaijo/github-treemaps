from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

from db.db import Base
from model.repository import Repository
from model.user import User


class Contribution(Base):
    __tablename__ = 'contributions'
    id = Column(Integer, primary_key=True)
    contributor = Column(Integer, ForeignKey('users.id'))
    repository = Column(Integer, ForeignKey('repositories.id'))
    additions = Column(Integer)
    deletions = Column(Integer)

    def __repr__(self):
        return "<Contribution(id={0})>".format(self.id)
