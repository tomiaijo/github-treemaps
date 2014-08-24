from celery.utils.log import get_task_logger
from sqlalchemy import func

from db.db import session_scope
import  git_tasks
from task_queue import queue
from model.repository import Repository, UpdateRequest
from model.user import User, Email
from model.contribution import Contribution


@queue.task
def read_queued_tasks():
    with session_scope() as session:
        q = session.query(UpdateRequest)
        for r in q:
            git_tasks.generate_repository_stats.delay(r.repository_id)
            session.delete(r)


@queue.task
def add_or_update_contribution(contribution):
    with session_scope() as session:
        q = session.query(Contribution).filter(Contribution.contributor == contribution.contributor and
                                               Contribution.repository == contribution.repository).first()
        if q is not None:
            q.additions = contribution.additions
            q.deletions = contribution.deletions
            session.add(q)
        else:
            session.add(contribution)


@queue.task
def add_or_update_user(github_id, login, gravatar_id, email=None,
                       name=None, followers=None, following=None):
    with session_scope() as session:
        ret = session.query(User).filter(User.github_id == github_id).first()
        if ret:
            ret.github_id = github_id
            ret.login = login
            ret.gravatar = gravatar_id
            if email is not None:
                ret.emails.append(email)
            ret.name = name
            ret.followers = followers
            ret.following = following
        else:
            if  email is not None:
                u = User(github_id=github_id, login=login, gravatar=gravatar_id, emails=[email],
                         name=name, followers=followers, following=following)
            else:
                u = User(github_id=github_id, login=login, gravatar=gravatar_id,
                         name=name, followers=followers, following=following)
            session.add(u)


@queue.task
# Returns user id
def find_or_create_user_by_email(email):
    with session_scope() as session:
        e = session.query(Email).filter(Email.email == email).first()
        if e is None:
            user = User(emails=[Email(email=email)])
            session.add(user)
            session.flush()
            id = user.id
        else:
            id = e.user_id

    return id


@queue.task
def add_repository(id, name):
    with session_scope() as session:
        session.add(Repository(id=id, name=name))



@queue.task
def update_repository(update):
    with session_scope() as session:
        if 'owner_id' in update['updates']:
            github_user_id = update['updates']['owner_id']
            user = session.query(User).filter(User.github_id == github_user_id).first()
            if user is not None:
                update['updates']['owner_id'] = user.id
            else:
                return
        session.query(Repository).filter(Repository.id == update['id']).update(update['updates'])


@queue.task
def get_repository(id):
    with session_scope() as session:
        repo = session.query(Repository).filter(Repository.id == id).first()
        session.expunge_all()
    assert(repo is not None)
    return repo

@queue.task
def get_last_repository_id():
    ret = None
    with session_scope() as session:
        (ret, ) = session.query(func.max(Repository.id)).first()
    return ret