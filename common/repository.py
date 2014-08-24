

def update_from_github_repository(r):
    return \
        {
            'owner_id': r.owner.id,
            'source': r.source.id if r.source is not None else None,
            'parent': r.parent.id if r.parent is not None else None,
            'created_at': r.created_at,
            'pushed_at': r.pushed_at,
            'updated_at': r.updated_at,
            'stars': r.stargazers,
            'forks': r.fork_count,
            'issues': r.open_issues_count,
            'watchers': r.watchers,
            'description': r.description,
            'homepage': r.homepage,
            'language': r.language
        }