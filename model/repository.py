from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

from db.db import Base


class UpdateRequest(Base):
    __tablename__ = 'update_requests'
    id = Column(Integer, primary_key=True)
    repository_id = Column(Integer, ForeignKey('repositories.id'))


class Repository(Base):
    __tablename__ = 'repositories'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    owner_id = Column(Integer, ForeignKey('users.id'))
    source = Column(Integer)
    parent = Column(Integer)
    created_at = Column(DateTime)
    pushed_at = Column(DateTime)
    updated_at = Column(DateTime)
    stars = Column(Integer)
    forks = Column(Integer)
    issues = Column(Integer)
    watchers = Column(Integer)
    description = Column(String)
    homepage = Column(String)
    language = Column(String)
    file_count = Column(Integer)
    size = Column(Integer)
    commit_count = Column(Integer)
    contributors = Column(Integer)
    stats_updated_at = Column(DateTime)
    stats_version = Column(Integer)

    def __repr__(self):
        return "<Repository(id={0}, name='{1}')>".format(self.id, self.name)
