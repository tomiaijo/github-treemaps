from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, backref

from db.db import Base


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    github_id = Column(Integer, unique=True)
    login = Column(String)
    gravatar = Column(String(32))
    emails = relationship('Email', order_by='Email.id', backref='user')
    repositories = relationship('Repository', order_by='Repository.id', backref='owner')
    name = Column(String)
    followers = Column(Integer)
    following = Column(Integer)
    def __repr__(self):
        return "<User(id={0}, login='{1}')>".format(self.id, self.login)


class Email(Base):
    __tablename__ = 'emails'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    email = Column(String)
