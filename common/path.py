import os

def split_path(path):
    ret = []
    rest = path
    while True:
        rest, tail = os.path.split(rest)
        ret.append(tail)
        if not rest:
            break
    ret.reverse()
    return ret