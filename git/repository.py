import pygit2

# Iter pygit2 tree, a bit like os.walk
def walk(repo, tree, path=[]):
    dirs, nondirs = [], []
    for e in tree:
        obj = repo.get(e.oid, None)
        if obj is None:
            continue
        is_tree = obj.type == pygit2.GIT_OBJ_TREE
        if is_tree and e.name != ".git":
            dirs.append(e)
        else:
            nondirs.append(e)

    yield tree, path, dirs, nondirs
    for entry in dirs:
        new_tree = repo[entry.oid]
        for x in walk(repo, new_tree, path + [entry.name]):
            yield x
