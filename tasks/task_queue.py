from datetime import timedelta

from celery import Celery
from settings import BROKER

queue = Celery('github_scraper', broker=BROKER)


queue.conf.update(
    CELERYBEAT_SCHEDULE = {
        'update_github_repositories': {
            'task': 'tasks.github.update_github_repositories',
            'schedule': timedelta(seconds=600)
        },
        'read_queued_tasks': {
            'task': 'tasks.db_tasks.read_queued_tasks',
            'schedule': timedelta(seconds=60)
        }
    },
    CELERY_IMPORTS = ['tasks.db_tasks', 'tasks.github', 'tasks.git_tasks'],
    CELERY_ROUTES = {'tasks.git_tasks.generate_repository_stats': {'queue': 'git'}},
    CELERY_ACKS_LATE = True

)