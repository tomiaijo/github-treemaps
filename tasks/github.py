import re
import time

from celery.utils.log import get_task_logger
from github3.repos.repo import Repository as GitHubRepository
from github3 import login
import requests

from common.datetime import to_HTTP_date
from common.repository import update_from_github_repository
from task_queue import queue
from settings import GITHUB_TOKEN
from tasks.db_tasks import add_repository, add_or_update_user, update_repository, get_last_repository_id, get_repository


@queue.task
def match_email_to_github_user(email):
    g = login(token=GITHUB_TOKEN)
    q = g.search_users('{0} in:email'.format(email))
    for u in q:
        user = u.refresh()
        add_or_update_user(user.id, user.login, user.gravatar, email,
                           user.to_json().get('name', None),
                           user.to_json().get('followers', None),
                           user.to_json().get('following', None))

@queue.task
def update_github_repositories():
    last_id = get_last_repository_id()
    update_repositories(last_id)


@queue.task
def scrape_repository(id):
    repo = get_repository(id)

    if repo.updated_at:
        headers = {'If-Modified-Since': to_HTTP_date(repo.updated_at)}
    else:
        headers = {}
    url = 'https://api.github.com/repos/{0}?access_token={1}'.format(repo.name, GITHUB_TOKEN)
    req = requests.get(url, headers=headers)
    if req.status_code == 304:
        return
    r = GitHubRepository(req.json())
    owner = r.owner
    add_or_update_user(owner.id, owner.login, owner.gravatar_id)
    update = \
        {
            'id': r.id,
            'updates': update_from_github_repository(r)
        }
    update_repository(update)


def parse_link(header):
    ret = {}
    links = header['link'].split(', ')
    r = re.compile(r'<(.*)>; rel="([a-z]*)"')
    for l in links:
        m = r.match(l)
        url = m.group(1)
        rel = m.group(2)
        ret[rel] = url

    return ret


def update_repositories(since=None):
    count = 0
    if since is None:
        url = 'https://api.github.com/repositories?per_page=100&access_token=' + GITHUB_TOKEN
    else:
        url = 'https://api.github.com/repositories?per_page=100&access_token={0}&since={1}'.format(GITHUB_TOKEN, since)

    etag = None
    headers = None
    while True:
        if etag:
            r = requests.get(url, headers={'etag': etag})
        else:
            r = requests.get(url)
        if r.status_code == requests.codes.ok:
            etag = r.headers['etag']
            for repo in r.json():
                count += 1
                repository_name = repo['full_name']
                repository_id = repo['id']
                add_repository(repository_id, repository_name)
            links = parse_link(r.headers)
            url = links.get('next', None)
            if url is None:
                # All done
                return
        else:
            rate_limit_remaining = r.headers['X-RateLimit-Remaining']
            if rate_limit_remaining == 0:
                time.sleep(60)