import datetime
import json
import os
import shutil

from celery.utils.log import get_task_logger
from sqlalchemy import func
import pygit2

import db_tasks
from git.diff import diff_commit
from git.hash import abbr_hash
from git.repository import walk
from task_queue import queue
from model.contribution import Contribution
from model.repository import Repository
from model.user import User
from settings import CLONE_DIRECTORY, RAMDISK_DIRECTORY


@queue.task
def clone_repository(id):
    r = db_tasks.get_repository(id)
    clone_url = get_github_clone_url(r.name)
    clone_target = CLONE_DIRECTORY + r.name
    if os.path.exists(clone_target):
        fetch_remote(clone_target)
    else:
        clone_remote(clone_url, clone_target)


def fetch_remote(path):
    r = pygit2.Repository(path)
    r.remotes[0].fetch()


def clone_remote(clone_url, clone_target):
    pygit2.clone_repository(clone_url, clone_target, bare=True)


def get_github_clone_url(repo_name):
    return 'https://github.com/{0}.git'.format(repo_name)


@queue.task(time_limit=60*10)
def generate_repository_stats(repository_id, repository_path):
    repo = db_tasks.get_repository(repository_id)
    version = 1 if repo.stats_version is None else repo.stats_version + 1;
    repository_name = repo.name

    if repository_path is not None and os.path.exists(repository_path):
        fetch_remote(repository_path)
    else:
        clone_repository(repository_id)
        repository_path = CLONE_DIRECTORY + repository_name

    repo = pygit2.Repository(repository_path)
    create_stats(repo, repository_name, repository_id, repository_path, version)

def copy_path(from_path, to_path):
    shutil.copytree(from_path, to_path)


def create_stats(repo, repo_name, repo_id, repository_path, version):
    last = repo[repo.head.target]
    commits = {}
    users = {}
    for commit in repo.walk(last.id, pygit2.GIT_SORT_TIME):
        # Skip merge commits
        if len(commit.parents) > 1:
            continue
        msg = commit.message
        hash = commit.hex
        author = u'{0} <{1}>'.format(commit.author.name, commit.author.email)
        diff = diff_commit(repo, commit)
        diff.find_similar()
        files = {}
        additions = 0
        deletions = 0
        for d in diff:
            add = d.additions
            dels = d.deletions
            additions += add
            deletions += dels
            files[d.new_file_path] = {'status': d.status, 'additions': add, 'deletions': dels}
            # Merge old stats to new file
            if d.status == 'C' or d.status == 'R':
                files[d.new_file_path]['old_file_path'] = d.old_file_path

        author_id = db_tasks.find_or_create_user_by_email(commit.author.email)
        commits[hash] = {'author': author,
                         'author_id': author_id,
                         'time': commit.author.time, 'files': files}
        users.setdefault(author_id, {})
        users[author_id][hash] = {'additions': additions, 'deletions': deletions}

    json_f = {}
    file_count = 0
    size = 0
    for root, path, dirs, files in walk(repo, last.tree):
        for f in files:
            blob = repo[f.id]
            branch = json_f
            for p in path:
                branch = branch.setdefault(p, {})
                branch = branch.setdefault('files', {})
            branch[str(f.name)] = {'size': blob.size}
            file_count += 1
            size += blob.size
    last_updated_at = datetime.datetime.now()
    repo = {'name': repo_name, 'contributors': len(users), 'commit_count': len(commits),
            'file_count': file_count, 'size': size, 'files': json_f,
            'last_updated_at': last_updated_at.isoformat()}
    if not os.path.exists(repository_path):
        os.makedirs(repository_path)
    with open(os.path.join(repository_path, '{0}-{1}-commits.json'.format(version, repo_id)), 'w') as f:
        f.write(json.dumps({'last_updated_at': last_updated_at.isoformat(), 'commits': commits }))
    with open(os.path.join(repository_path, '{0}-{1}-files.json'.format(version, repo_id)), 'w') as f:
        f.write(json.dumps(repo))

    persist_user_statistics(repo_id, users)
    persist_repository_statistics(repo_id, file_count, len(users),
                                  len(commits), size, last_updated_at, version)


def persist_user_statistics(repo_id, users):
    for model_user_id, commits in users.iteritems():
        a = 0
        d = 0
        for hash, changes in commits.iteritems():
            a += changes['additions']
            d += changes['deletions']
        c = Contribution(contributor=model_user_id, repository=repo_id,
                         additions=a, deletions=d)
        db_tasks.add_or_update_contribution(c)

def persist_repository_statistics(repo_id, file_count, contributors, commit_count, size, stats_updated_at, version):
    update = {
        'id': repo_id,
        'updates':
            {
                'file_count': file_count,
                'size': size,
                'commit_count': commit_count,
                'contributors': contributors,
                'stats_updated_at': stats_updated_at,
                'stats_version': version
            }}
    db_tasks.update_repository(update)