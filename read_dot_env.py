import os.path
import re


def read_dot_env() -> None:
    try:
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')) as f:
            content = f.read()
    except IOError:
        return

    for line in content.splitlines():
        match = re.match(
            r'\A(?P<key>[A-Za-z_0-9]+)=(?P<value>.*)\Z',
            re.sub(r'( +)?#(.+)?', '', line),
        )
        if match:
            os.environ.setdefault(*match.groupdict().values())
